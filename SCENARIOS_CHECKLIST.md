# Easy Q scenarios — implementation checklist

This checklist maps **product scenarios** (see `The Easy Q Scenarios`) to the **current `easyQ_api` codebase**. Update this file when behavior changes.

Legend: **Working** = implemented end-to-end · **Partial** = exists but incomplete vs scenario · **Not working** = not implemented or only manual/policy.

---

## Coverage tables (emoji + one line)

### Working

| Status | Scenario | One-line description |
|:------:|----------|------------------------|
| ✅ | Token / slot / display | Assigns `slotNumber`, `tokenNumber`, `tokenDisplay` from doctor hours + queue order. |
| ✅ | Daily & per-slot limits | Enforces `maxAppointment` and slot capacity via limiter + token service. |
| ✅ | Appointment CRUD / lists | Create, update, delete, fetch by patient, doctor, hospital via `/api/appoitment/*`. |
| ✅ | Batch metadata | Stores `batchNumber` (every 5 tokens) and `batchStatus` for orchestration. |
| ✅ | ETA “Time to leave” | Cron every 2 min; FCM when drive ETA + buffer says depart (needs address + hospital coords). |
| ✅ | No-show cron | Cron every 5 min; marks no-show and tries advancing batch. |
| ✅ | Check-in APIs | Orchestrator check-in + advance-to-next-batch hooks exposed via API layer. |
| ✅ | Check-in / checkout fields | Schema supports check-in status, times, scanned-by, etc. |
| ✅ | Doctor delay | Saves delays on doctor; sends FCM “Appointment Delay Update”. |
| ✅ | Adjusted time API | Clients can compute delayed clock time via `POST /api/doctor/adjusted-time`. |
| ✅ | Follow-up bookings | Create/list follow-ups under `/api/follow-up` with parent link in schema. |
| ✅ | Booking & payment pushes | Booking confirmation FCM; `process` endpoint completes payment + status. |
| ✅ | Cancel / reschedule fields | `cancellationReason` and `rescheduledFrom` exist on appointments. |

### Partial

| Status | Scenario | One-line description |
|:------:|----------|------------------------|
| ⚠️ | Hard calendar blocks (e.g. surgery) | Only generic `workingHours` slots — no typed non-bookable blocks or auto-reshuffle. |
| ⚠️ | Uniform slot duration (e.g. 20 min) | Token math uses fixed 120 min reference — not configurable minutes-per-patient stagger. |
| ⚠️ | Doctor late shifts everyone | Delay + FCM + adjusted-time API exist, but DB times & ETA cron don’t apply adjustment automatically. |
| ⚠️ | Batch-based staggered leave | Batch number stored; leave-by still uses one `appointmentTime` per row, not token × minutes. |
| ⚠️ | Short “sorry” delay message | Doctor-delay body exists; no separate tiny apology template for small aggregate delays. |
| ⚠️ | Route authorization | Policy routes registered but `authenticate`/policy often commented out — verify gateway or re-enable. |

### Not working

| Status | Scenario | One-line description |
|:------:|----------|------------------------|
| ❌ | Walk-in next token | No dedicated walk-in flow; only normal booking assigns next token. |
| ❌ | Cancel → nearby patients race | No geo-notify + first-confirm wins for freed slots. |
| ❌ | Early arrival rules | No API enforcement — queue discipline is operational only. |
| ❌ | Late arrival soft / hard | No automated 10/15 min reorder or queue-insert rules. |
| ❌ | Emergency nurse push | No dedicated nurse-triggered emergency queue API in reviewed paths. |
| ❌ | ER / expected emergency | No ward-specific flow wired in API. |
| ❌ | Overrun consult | No handler when a consultation runs past its slot. |
| ❌ | Follow-up Yes/No → book | No interactive notification handshake — only create/list follow-ups. |
| ❌ | Follow-up analytics | No average follow-up duration / doctor hint aggregates. |
| ❌ | Mandatory booking location | `patientAddress` optional — ETA can be skipped if missing. |
| ❌ | Book on behalf | No explicit proxy-booking user/model flow. |
| ❌ | Notification fallback | No SMS/email backup when FCM fails or is unavailable. |

---

## Quick reference — related files

| Area | Location |
|------|----------|
| Token assignment | `src/services/tokenAssignmentService.js` |
| Create appointment | `src/services/appointmentService.js`, `src/controller/appointment.js` |
| Batch / ETA / no-show | `src/services/batchOrchestrator.js`, `src/config/batchScheduler.js` |
| Doctor delay | `src/services/doctorDelayService.js`, `src/routes/doctorDelay/index.js` |
| Follow-up | `src/routes/followUpAppointment/index.js`, `src/services/followUpAppointmentService.js` |
| Route table | `src/config/protectedRouterConfig.js`, `src/app.js` |

---

*Last reviewed against codebase discussion — regenerate sections when major features ship.*
