## Admin Portal – Functional Spec (Formatted)

---

## 1. Account Module

### 1.1 New Account (6-step onboarding)
- Owner Info
  - Fields: name, email, mobile, proof (Aadhar/PAN/Driving License/Voter ID)
  - Task summary: Capture owner identity for KYC and account ownership.
- Basic Info
  - Fields: hospitalName, hospitalType (Hospital/Clinic/Consultant), registrationNumber, yearEstablished (optional)
  - Task summary: Create foundational hospital record.
- Address Info
  - Fields: address, state, city, pincode, googleMapLink
  - Task summary: Capture address and coordinates (may autofill via 3rd-party on client).
- Contact Details
  - Fields: officePhone, alternativePhone, emailAddress
  - Task summary: Provide contact information for support and patients.
- Document Upload
  - Fields: registrationCertificate, accreditation (optional), logo (1), hospitalImages (3)
  - Task summary: Upload and associate documents to the hospital profile.
- Operation Details
  - Fields: workingDays (multi-select), startTime, endTime, openAlways (toggles time fields), maxTokenPerDay, unlimitedToken
  - Task summary: Configure operating hours and token policy.

Outcome: After all steps, click Create Account. Account remains pending until super admin verification.

### 1.2 Awaiting Super Admin Verification
- UX: Show an “awaiting confirmation” screen until approved.
- Task summary: Poll/refresh verification status and restrict access to admin-only modules until verified.

### 1.3 Login (Existing Account)
- Screen: email, password
- Task summary: Authenticate, obtain token, and route to dashboard.

---

## 2. Dashboard Module (Post Login)

### 2.1 Header
- Notifications
  - Task: Show live list of appointments/updates via sockets or polling.
- Scanner
  - Task: Scan QR and mark patient as checked-in for the appointment.
- Profile
  - Sections and tasks:
    - Owner Info: read-only snapshot from onboarding.
    - Hospital Details (Basic/Address/Contact): view and edit.
    - Hospital Documents: show all uploaded docs; only logo and 3 images are editable; others read-only.
    - Set Token: edit operational settings.
- Settings
  - Delete Account: permanently remove account and data per policy.
  - Dark Mode: client-side preference.
  - Logout: client-side token purge.

### 2.2 Patients Summary
- Data via polling (or sockets) to show:
  - Token Issued: count and list; clicking shows patient + doctor details.
  - Checked-in: count and list of checked-in users.

### 2.3 Quick Actions
- Availability
  - Task: Manage temporary doctor unavailability (Meeting/Surgery/Break) and list current unavailability.
- User Logs
  - Task: List patients with doctor mapping, follow-up scheduled flag, and check-in/out timestamps.
- Documents
  - Task: List all documents grouped by patient; clicking shows documents for selected patient. Support uploads.
- Doctors List
  - Add Doctor
    - Basic Details: fullName, gender, dob, email, mobile, phone
    - Professional Details: specialization, degree, yearsOfExperience, registrationNumber, doctorType (Full-time/Visiting/Consultant)
    - Availability: workingDays (multi-select), startTime, endTime
    - Task summary: Create and configure doctor profile and working hours.
  - List/Search Doctors
    - Task: Card view with filters (Category/Specialization, Availability by day/time-of-day).
  - Doctor Details
    - Task: View full profile; edit or delete as permitted.

### 2.4 Today’s Logs
- Task: Show today’s check-in/checkout logs; “View all” navigates to full User Logs.

---

## 3. Open Questions and Guidance

- How to handle checkout functionality?
  - Guidance: Use appointment status update to `checked-out` and persist `checkoutTime`.
- Socket needed for live communication or polling?
  - Guidance: Prefer sockets for real-time notifications; provide polling fallback.
- Upload docs – how should it work?
  - Guidance: Upload files and associate via metadata (`scope: hospital|patient|appointment`, `entityId`, `tags`).
- How to do follow-up for a patient?
  - Guidance: Store `followUpDate` in patient-notes; surface reminders in logs/notifications.
- Group documents by appointment?
  - Guidance: Yes; support grouping by `appointmentId` while also allowing patient-level grouping.

---

## 4. APIs (TBD – to be designed)

All endpoints and methods are placeholders and subject to change. Final paths, methods, request/response schemas will be defined during API design.

### 4.1 Account (5)
| API Name | Endpoint (TBD) | Method (TBD) | Purpose |
|---|---|---|---|
| Sign Up | `/api/signup` | POST | Create a new admin user account. |
| Login | `/api/login` | POST | Authenticate user and issue token. |
| Verification Status | `/api/user/:userId/status` | GET | Check if account is verified by super admin. |
| Activate User (Admin) | `/api/user/:userId/activate` | PUT | Super admin approves account. |
| Delete Account | `/api/user/:userId` | DELETE | Remove user account and associated resources (per policy). |

### 4.2 Hospital (5)
| API Name | Endpoint (TBD) | Method (TBD) | Purpose |
|---|---|---|---|
| Create Hospital | `/api/hospital` | POST | Create hospital with basic/address/contact/ops details. |
| Update Hospital | `/api/hospital/:hospitalId` | PUT | Update hospital details, including token policy. |
| Get Hospital Details | `/api/hospital/:hospitalId` | GET | Fetch hospital details for profile. |
| Add Facilities | `/api/hospital/:hospitalId/facilities` | POST | Add facilities/labs. |
| Update Facilities | `/api/hospital/:hospitalId/facilities` | PUT | Update facilities/labs. |

### 4.3 QR (2)
| API Name | Endpoint (TBD) | Method (TBD) | Purpose |
|---|---|---|---|
| Generate QR | `/api/qrcode` | POST | Generate QR for appointment check-in. |
| Resolve QR | `/api/qrcode/details` | GET | Resolve QR to user/appointment details. |

### 4.4 Appointments (5)
| API Name | Endpoint (TBD) | Method (TBD) | Purpose |
|---|---|---|---|
| Create Appointment | `/api/appointments` | POST | Create an appointment. |
| Update Appointment (Check-in/out) | `/api/appointments/:appointmentId` | PUT | Update status and timestamps. |
| Get Appointment | `/api/appointments/:appointmentId` | GET | Fetch appointment by ID. |
| List by Doctor | `/api/appointments/doctor/:doctorId` | GET | List doctor’s appointments. |
| List by Hospital | `/api/appointments/hospital/:hospitalId` | GET | List hospital’s appointments. |

### 4.5 Dashboard (1)
| API Name | Endpoint (TBD) | Method (TBD) | Purpose |
|---|---|---|---|
| Appointment Summary | `/api/appointments/hospital/:hospitalId/summary` | GET | Aggregated counts (issued, checked-in, etc.). |

### 4.6 Notifications (2)
| API Name | Endpoint (TBD) | Method (TBD) | Purpose |
|---|---|---|---|
| Poll Notifications | `/api/notifications` | GET | Pull changes since cursor/time. |
| Realtime Notifications | `ws://…/notifications` | WS | Push updates to dashboard. |

### 4.7 Doctors (5)
| API Name | Endpoint (TBD) | Method (TBD) | Purpose |
|---|---|---|---|
| Add Doctor | `/api/doctors` | POST | Create doctor profile. |
| Get/Update/Delete Doctor | `/api/doctors/:doctorId` | GET/PUT/DELETE | Doctor details management. |
| List Doctors (by Hospital) | `/api/doctors/hospital/:hospitalId` | GET | List/search/filter doctors. |
| Temporary Availability (Add) | `/api/doctors/:doctorId/availability` | POST | Add unavailability (reason/time). |
| Temporary Availability (List) | `/api/doctors/:doctorId/availability` | GET | List active/upcoming unavailability. |

### 4.8 Patient Notes (4)
| API Name | Endpoint (TBD) | Method (TBD) | Purpose |
|---|---|---|---|
| Create Note/Prescription | `/api/patient-notes` | POST | Create clinical notes/prescriptions. |
| Notes by Patient | `/api/patient-notes/patient/:patientId` | GET | Fetch patient’s notes. |
| Notes by Doctor | `/api/patient-notes/doctor/:doctorId` | GET | Fetch doctor-authored notes. |
| Update/Delete Note | `/api/patient-notes/:noteId` | PUT/DELETE | Manage notes lifecycle. |

### 4.9 Documents (5)
| API Name | Endpoint (TBD) | Method (TBD) | Purpose |
|---|---|---|---|
| Upload File | `/api/files` | POST | Upload a document (logo/images/certs/etc.). |
| List Files | `/api/files` | GET | List files for current scope. |
| Download/Delete File | `/api/files/download` | GET/DELETE | File operations. |
| Patient Documents | `/api/patients/:patientId/documents` | GET | List documents linked to a patient. |
| Appointment Documents | `/api/appointments/:appointmentId/documents` | GET | List documents linked to an appointment. |

### 4.10 Logs (2)
| API Name | Endpoint (TBD) | Method (TBD) | Purpose |
|---|---|---|---|
| Today’s Logs | `/api/logs/today` | GET | Today’s check-in/checkout activity. |
| All Logs | `/api/logs` | GET | Historical logs with follow-up flag. |

Notes
- All API designs are open and pending; exact contracts will be finalized during API design and aligned with frontend needs.


