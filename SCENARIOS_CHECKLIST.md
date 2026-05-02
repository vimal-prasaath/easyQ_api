# Easy Q — what the product does today (business view)

This page says **what works**, **what works partly**, and **what we don’t have yet** in the backend. Short summaries anyone on the team can read—no engineering jargon in the main tables.

**How to read the icons**

| Icon | Meaning |
|:----:|---------|
| ✅ | **Done** — the system supports this in normal operation. |
| ⚠️ | **Partly there** — something exists, but it doesn’t fully match how we want the clinic to run. |
| ❌ | **Not built** — staff or apps must handle this manually, or we need new work. |

---

## ✅ Working today

What patients and clinics **can rely on** from the current backend.

| Icon | Topic | In plain English |
|:----:|-------|------------------|
| ✅ | Queue numbers | Each booking gets a clear place in line (which part of the day, token number, and a label like “S1T003”) based on the doctor’s schedule. |
| ✅ | Full waiting room | The system can stop new bookings when the doctor hits their daily limit or a slot is full. |
| ✅ | Book, change, cancel, view | Patients and staff can create appointments, update them, cancel them, and pull lists by patient, doctor, or hospital. |
| ✅ | Groups of five (“batches”) | The system remembers small groups of five for workflow and notifications—not the same as “five minutes apart.” |
| ✅ | “Time to leave” for driving | If we know where the patient is leaving from and where the hospital is, the system can send a **leave now** push so they arrive on time (runs on a short timer in the background). |
| ✅ | No-shows | A background job looks for people who didn’t show and can move the queue forward. |
| ✅ | Check-in | APIs exist so front desk or kiosk can mark someone as arrived and move the queue. |
| ✅ | Check-in / checkout tracking | The database can record arrived, scanned, checkout-style status for reporting and flows. |
| ✅ | Doctor running late | Staff can record a delay; patients get a push that the doctor is late (minutes + reason). |
| ✅ | “What time is my visit really?” | Apps can ask the server for an **adjusted clock time** after delays—useful to show on screen. |
| ✅ | Follow-up visits | Follow-up appointments can be created and listed (linked to the original visit). |
| ✅ | Booking & payment messages | After booking, a confirmation-style push can go out; payments can be marked completed when the payment step finishes. |
| ✅ | Why cancelled / rescheduled | We can store a cancellation reason and link to a previous booking when something is rescheduled. |

---

## ⚠️ Partly there (gap vs ideal clinic flow)

| Icon | Topic | In plain English |
|:----:|-------|------------------|
| ⚠️ | Protected time (e.g. surgery block) | Doctors have **open hours**, but we don’t yet model **untouchable blocks** (like “surgery 1–2, never book”) or auto-move everyone around them. |
| ⚠️ | Same length for every visit (e.g. 20 minutes) | Visit length doesn’t drive a **per-patient stagger** in the product math the way the sheet describes; rules are simpler behind the scenes. |
| ⚠️ | Doctor late → everyone’s visit shifts | We **tell** patients and can **calculate** a new time for apps, but stored appointment times and the **leave-home reminder** don’t automatically shift for everyone unless we build more or apps handle it. |
| ⚠️ | Different “leave home” time per person in the same window | Batches of five are stored, but **everyone in one time window might still share one clock time**—so “leave now” may match the window, not token 1 vs token 8 separately. |
| ⚠️ | Short “sorry we’re running late” note | There’s a delay message, but not a separate tiny apology for small slips (e.g. “8 minutes behind”). |
| ⚠️ | Locked-down API security | Some protection layers are **not fully enforced inside this service**—confirm whether another layer (gateway, app) handles login, or tighten later. |

---

## ❌ Not built yet (business expectation vs reality)

| Icon | Topic | In plain English |
|:----:|-------|------------------|
| ❌ | Walk-in gets next number | No special **walk-in** path; walk-ins behave like another booking unless staff fake it in the app. |
| ❌ | Cancel → ping nearby patients → first to say yes | No **nearest patients get offered the slot** flow. |
| ❌ | Rules for arriving too early | Nothing automated—front desk policy only. |
| ❌ | Late arrival rules (e.g. 10 min vs 15 min) | No automatic **where you stand in line** rules for late arrivals. |
| ❌ | Nurse taps “emergency” and queue reacts | No dedicated **emergency bump** product flow in what we reviewed. |
| ❌ | Emergency room–specific workflow | Not wired as its own flow. |
| ❌ | Running long past the booked slot | No automatic **overrun** handling when one patient takes longer than planned. |
| ❌ | Follow-up text: Yes / No then book | No **tap Yes to book** notification dance—only creating/listing follow-ups. |
| ❌ | Stats on follow-ups for doctors | No built-in **average follow-up time** or hints dashboard. |
| ❌ | Must save location when booking | Location can be missing—then **drive-time reminders** may not fire. |
| ❌ | Someone books for another person | No clear **proxy booking** product built into the API. |
| ❌ | If push fails, text or email | No automatic **SMS/email backup** when phone notifications fail. |

---

## For engineers (where things live in code)

If you need file paths and technical names, use this table—optional for business readers.

| Area | Code location |
|------|----------------|
| Queue / tokens | `src/services/tokenAssignmentService.js` |
| Creating appointments | `src/services/appointmentService.js`, `src/controller/appointment.js` |
| Leave-home ETA, no-show jobs | `src/services/batchOrchestrator.js`, `src/config/batchScheduler.js` |
| Doctor delays | `src/services/doctorDelayService.js`, `src/routes/doctorDelay/index.js` |
| Follow-ups | `src/routes/followUpAppointment/index.js`, `src/services/followUpAppointmentService.js` |
| Route list | `src/config/protectedRouterConfig.js`, `src/app.js` |

---

*Update this document when major features ship.*
