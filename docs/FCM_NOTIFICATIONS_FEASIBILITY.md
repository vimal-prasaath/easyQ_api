## FCM Notifications — Feasibility, Gaps, and Implementation Plan

### Scope
Design and orchestrate push notifications (via FCM) for appointment workflows:
- 2-hour reminders to all patients
- ETA-based batched arrivals by slots (5 per batch)
- Doctor temporary delay broadcast with reschedule CTA
- Release next batch when first of current batch checks in
- Auto-advance on no-show after 10 minutes

Assumption: User and hospital geolocation are available. Google Maps API key is available.

---

### Current State (Repository)
- Appointments
  - `appointmentDate` (Date) and `appointmentTime` (HH:mm), status, check-in flags (`isCheckedIn`, `checkInTime`).
  - Missing: per-slot `sequenceNumber`/`tokenNumber`, batch status fields.
- Doctors
  - `workingHours.timeSlots` present.
  - Missing: temporary delay fields (e.g., `delayMinutes`, `occupiedUntil`).
- Hospitals
  - Proper GeoJSON `location` with `coordinates` ([lng, lat]).
- Users
  - Only string `location`. Missing: GeoJSON `geoLocation` for routing/ETA.
- FCM Tokens
  - Managed via `FCMToken` (active tokens per user). Fan-out feasible.
- Scheduler
  - Exists but queries wrong fields and uses 30m window; token lookup by `patientId` instead of `userId`.

---

### Feasibility by Scenario
- 1) 2-hour reminders
  - Feasible now with scheduler fixes: compute appointment DateTime from `appointmentDate` + `appointmentTime`, select T−2h ± window, fetch user tokens by `userId`, send.
- 2) ETA-based batched notifications (5 per batch)
  - Feasible with: user GeoJSON location, Google Directions API, and per-slot batching fields.
- 3) Doctor temporary delay broadcast + reschedule CTA
  - Feasible with: doctor delay fields, recalculated ETAs, and client/app deep link to reschedule.
- 4) Release 2nd batch after first patient checks in
  - Feasible: hook on `Appointment.isCheckedIn` transition to trigger next batch.
- 5) No-show after 10 minutes → advance batch
  - Feasible: scheduled sweep or per-appointment timer to mark no-show and release next batch.

---

### Loopholes / Gaps to Address
- Time math and timezones
  - Need consistent hospital-local timezone handling when combining date + time.
- Slot/batch state
  - No explicit token/sequence ordering per slot; no `batchNumber`/`batchStatus` for orchestration.
- User geolocation
  - Only a string field exists; must store device/home lat/lng with consent.
- Doctor delay modeling
  - No field for operational delay/blackout; cannot compute impact scope without it.
- Check-in eventing
  - No event trigger to release next batch on first check-in; needs lightweight domain event or service call.
- No-show policy anchor
  - Reference time must be explicit: scheduled arrival vs slot start vs appointment time.
- Scheduler correctness
  - Current code queries non-existent `time` and uses `patientId` for token lookup.
- Token hygiene
  - Handle invalid/expired FCM tokens and deactivate on errors.

---

### Data Model Additions (Minimal)
- Appointment
  - `tokenNumber: Number` — ordering within the doctor-slot window (1-based)
  - `batchNumber: Number` — computed grouping (e.g., floor((tokenNumber-1)/batchSize)+1)
  - `batchStatus: String` — enum [`pending`, `sent`, `arrived`, `no_show`]
  - `suggestedArrivalAt: Date` — UTC, derived from ETA and buffers
- Doctor
  - `delayMinutes: Number` or `occupiedUntil: Date`
  - Audit: `delayUpdatedAt: Date`, `delayUpdatedBy: String`
- User
  - `geoLocation: { type: Point, coordinates: [lng, lat] }` (2dsphere index)

---

### Services and Orchestration
- ETA Service
  - Integrate Google Directions API using `User.geoLocation` → `Hospital.location`.
  - Cache hospital coords; optionally cache short-lived ETAs per patient/doctor/date/time.
- Notification Service
  - Fan-out to `FCMToken.findActiveTokensByUserId(userId)`.
  - Deactivate tokens upon `messaging/invalid-argument` or `messaging/registration-token-not-registered` errors.
- Batch Orchestrator
  - Determine `sequenceNumber` at booking; compute `batchNumber`.
  - For each slot, send to first 5; upon first check-in, send next 5; on no-show after 10 minutes, advance to fill.
- Check-in Hook
  - On `isCheckedIn` → true, trigger next-batch emission for same doctor/slot.
- No-show Sweep
  - Periodic job evaluates pending/sent within batch where grace time exceeded; mark `no_show` and advance batch.

---

### Scheduler Corrections (Immediate Wins)
- Compute appointment DateTime: combine `appointmentDate` + `appointmentTime` in hospital-local timezone.
- Query window for T−2h reminders instead of 30m.
- Replace token lookup by `userId` and fetch all active tokens.
- Idempotency: mark `reminderSent` to avoid duplicates.

---

### Finalized Field Names and Enums

Appointment (additions)
```json
{
  "tokenNumber": "Number",
  "batchNumber": "Number",
  "batchStatus": "String: one of ['pending','sent','arrived','no_show']",
  "suggestedArrivalAt": "Date (UTC)",
  "reminderSent": "Boolean (already present)",
  "isCheckedIn": "Boolean (already present)",
  "checkInTime": "Date (already present)"
}
```

Doctor (additions)
```json
{
  "delayMinutes": "Number (>=0)",
  "occupiedUntil": "Date (UTC)",
  "delayUpdatedAt": "Date",
  "delayUpdatedBy": "String (admin/doctor id)"
}
```

User (additions)
```json
{
  "geoLocation": {
    "type": "Point",
    "coordinates": ["Number: lng", "Number: lat"]
  }
}
```

Config
```json
{
  "batchSize": 5,
  "timezone": "Asia/Kolkata",
  "quietHoursStart": "23:00",
  "quietHoursEnd": "05:00"
}
```

---

### Google Maps Integration Plan
- API: Directions API (Driving) with traffic where available.
- Inputs: `origin` = user `geoLocation`, `destination` = hospital `location`.
- Output: `duration_in_traffic` (fallback to `duration`).
- Lead Time: Notification when `now >= (appointmentDateTime - (ETA + 5 minutes))`.
- Resilience: Backoff and caching; enforce rate limiting.

---

### Notification Payloads (Examples)
- 2-hour Reminder
  - Title: "Upcoming Appointment"
  - Body: "Your appointment with {doctorName} at {hospitalName} starts in 2 hours."
  - Data: `{ appointmentId, doctorId, hospitalId, deeplink: "app://appointment/{id}" }`
- Start Now (ETA-based)
  - Title: "It’s time to start"
  - Body: "Leave now to reach {hospitalName} in ~{eta}+5 min."
  - Data: `{ appointmentId, recommendedDepartureAt, slotId, batchNumber }`
- Delay Update
  - Title: "Delay Update"
  - Body: "Doctor delayed by {x} min. You may reschedule."
  - Data: `{ appointmentId, delayMinutes, deeplink: "app://reschedule/{id}" }`

---

### Deep Link Parameters (Proposed)
- Appointment details deeplink: `app://appointment/{appointmentId}`
  - Params: `appointmentId`, optional `doctorId`, `hospitalId`
- Reschedule deeplink: `app://reschedule/{appointmentId}`
  - Params: `appointmentId`, `doctorId`, `hospitalId`, optional `preferredDate`, `preferredTime`

These can be carried in `data` of FCM and resolved in-app.

---

### Defaults and Policy Decisions
- Batch Size: 5
- Ordering: by `sequenceNumber` assigned at booking
- Timezone: hospital-local timezone for all computations
- No-show Rule: 10 minutes after suggested arrival time or appointment start (choose one, default: scheduled appointment time)
- Multi-device: notify all active tokens (latest 3 retained by model)

---

### Risks and Mitigations
- Inaccurate ETA due to traffic: refresh periodically; add buffer (+5m already).
- Push delivery variance: send slightly earlier; include deeplinks and reminders if missed.
- Token churn/invalid tokens: clean up on error; cap active tokens per user.
- Daylight saving/timezone drift: always compute in hospital-local TZ; store UTC.

---

### Implementation Checklist
- [ ] Fix scheduler: 2-hour reminder window; correct fields; idempotency via `reminderSent`.
- [ ] Add `User.geoLocation` (Point) with 2dsphere; update API to capture it.
- [ ] Add appointment batching fields: `sequenceNumber`, `batchNumber`, `batchStatus`, optional `suggestedArrivalAt`.
- [ ] Add doctor delay fields: `delayMinutes` or `occupiedUntil` and audit fields.
- [ ] Build ETA adapter using Google Directions API and caching.
- [ ] Implement batch orchestrator: initial send, on check-in, on no-show.
- [ ] Harden FCM service: fan-out, error handling, token deactivation.
- [ ] Define notification payload schema and app deeplinks for reschedule.

---

### Notes for App Client
- Provide user consented `geoLocation` updates (background or on-demand) before ETA windows.
- Handle deeplinks for appointment detail and reschedule.
- Show live ETA and delay banners; reflect `batchStatus`.

---

### Scheduler and Orchestration Pseudocode (No Code)

2-hour Reminder (runs every minute)
```pseudo
nowIST = now().tz('Asia/Kolkata')
targetWindowStartIST = nowIST + 2h
targetWindowEndIST = targetWindowStartIST + 1m
for appt in Appointments where apptDateTimeIST in [start,end] and reminderSent=false and status='Scheduled':
  if withinQuietHours(nowIST):
    enqueue at quietHoursEnd
  else:
    sendReminder(appt.patientId)
    mark appt.reminderSent = true
```

Batch Assignment (on booking)
```pseudo
slot = resolveDoctorSlot(doctorId, appointmentDate, time)
tokenNumber = nextSequenceForSlot(slot)
batchNumber = floor((tokenNumber-1)/batchSize) + 1
save on appointment
```

ETA-based Trigger (periodic)
```pseudo
for appt where batchStatus in ['pending','sent'] and status='Scheduled':
  eta = directions(user.geoLocation -> hospital.location)
  eta = max(eta, 5m)
  suggestedArrivalAt = apptDateTime - (eta + 5m)
  if now >= suggestedArrivalAt and batch is currently open to send:
    sendBatch(appt.doctorId, appt.slot, currentBatchNumber)
    mark those appts batchStatus='sent'
```

Check-in Trigger
```pseudo
on appointment.isCheckedIn change to true:
  if appointment.batch is currentBatch:
    open next batch
    sendBatch(doctorId, slot, currentBatch+1) if time >= their suggestedArrivalAt
```

No-show Sweep (periodic)
```pseudo
for appt where batchStatus='sent' and not isCheckedIn:
  if now > suggestedArrivalAt + 10m:
    mark appt.batchStatus='no_show'
    maybe open next batch if not yet opened
```

Doctor Delay Update
```pseudo
on delay set/updated (delayMinutes or occupiedUntil):
  impacted = upcoming appointments today for doctor
  recompute suggestedArrivalAt for impacted
  send delay notifications with reschedule deeplink
```

---

### Feasibility Without User Geolocation
- Scenario 1 (2-hour reminder): High confidence — fully supported.
- Scenario 3 (delay updates): High confidence — fully supported; ETA recalculation becomes a simple time shift.
- Scenario 4 (next batch on check-in): High confidence — supported by check-in fields.
- Scenario 5 (no-show after 10 minutes): High confidence — can use scheduled appointment time as anchor if `suggestedArrivalAt` is absent.
- Scenario 2 (ETA-based batching): Medium confidence if user geolocation is ignored — fallback to a fixed lead time policy (e.g., send batch N at appointmentTime minus configurable minutes). This loses travel-aware accuracy but preserves deterministic batching.

Conclusion: With the current `User`, `Appointment`, `Doctor`, and `Hospital` models (plus the minimal additions above) we can implement all scenarios. If user geolocation is ignored, everything except ETA precision in Scenario 2 remains robust; Scenario 2 will work with a configurable fixed lead time.


