# EasyQ API - Complete Endpoints Documentation

## Overview
This document provides a comprehensive list of all API endpoints in the EasyQ system, organized by functional category.

**Total Endpoints: 150+**

---

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [User Management](#user-management)
3. [Admin Management](#admin-management)
4. [Super Admin](#super-admin)
5. [Hospital Management](#hospital-management)
6. [Doctor Management](#doctor-management)
7. [Nurse Management](#nurse-management)
8. [Appointment Management](#appointment-management)
9. [Follow-up Appointments](#follow-up-appointments)
10. [Patient Notes](#patient-notes)
11. [Reviews & Ratings](#reviews--ratings)
12. [Favorites](#favorites)
13. [Search](#search)
14. [QR Code Generation](#qr-code-generation)
15. [Help Center (Q&A)](#help-center-qa)
16. [File Upload](#file-upload)
17. [FCM Token Management](#fcm-token-management)
18. [Notification Orchestrator](#notification-orchestrator)
19. [Doctor Delay Management](#doctor-delay-management)
20. [Token Management](#token-management)
21. [User Address Management](#user-address-management)
22. [User Documents](#user-documents)
23. [Suggestions](#suggestions)
24. [System & Health](#system--health)

---

## Authentication & Authorization

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signup` | User registration/signup |
| POST | `/api/login` | User login with phone number |
| POST | `/api/login/resetPassword` | Reset user password |
| GET | `/auth/google` | Google OAuth authentication |
| GET | `/auth/google/callback` | Google OAuth callback handler |

---

## User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user` | Get all users (admin only) |
| GET | `/api/user/admins` | Get all inactive users |
| PUT | `/api/user/:userId` | Update user profile |
| PUT | `/api/user/:userId/activate` | Activate user account |
| PUT | `/api/user/reset-password` | Reset user password |
| GET | `/api/user/getUser` | Get user details by ID |
| DELETE | `/api/user/delete/:userId` | Delete user account |
| GET | `/api/user/:userId/appointments` | Get user appointments history |

---

## Admin Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/signup` | Admin registration |
| POST | `/api/admin/login` | Admin login |
| PUT | `/api/admin/user/activate/:userId` | Activate user account (public) |
| PUT | `/api/admin/onboarding` | Update admin onboarding information |
| PUT | `/api/admin/hospital-documents` | Upload hospital documents |
| PUT | `/api/admin/owner-documents` | Upload owner documents |
| GET | `/api/admin/:adminId` | Get admin details |
| POST | `/api/admin/dashboard` | Get admin dashboard data |
| POST | `/api/admin/today-stats` | Get today's statistics |
| PUT | `/api/admin/owner-info` | Update owner information |
| PUT | `/api/admin/hospital/basic-info` | Update hospital basic information |
| PUT | `/api/admin/hospital/complete-info` | Update hospital complete information |
| DELETE | `/api/admin/:adminId` | Delete admin account |
| PUT | `/api/admin/hospital-logo-url` | Update hospital logo URL |
| PUT | `/api/admin/hospital-images-url` | Update hospital images URLs |
| PUT | `/api/admin/hospital-documents-url` | Update hospital documents URLs |
| PUT | `/api/admin/owner-documents-url` | Update owner documents URLs |

---

## Super Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/super-admin/auth/signup` | Super admin registration |
| POST | `/api/super-admin/auth/login` | Super admin login |
| GET | `/api/super-admin/admins` | Get all admins (filter by status) |
| PUT | `/api/super-admin/admins/:adminId/hold` | Put admin on hold |
| PUT | `/api/super-admin/admins/:adminId/approve` | Approve admin account |
| PUT | `/api/super-admin/admins/:adminId/reject` | Reject admin account |
| GET | `/api/super-admin/users` | Get all users with pagination |
| GET | `/api/super-admin/users/:userId/appointments` | Get user appointment history |
| GET | `/api/super-admin/hospitals/:hospitalId/appointments` | Get all appointments by hospital |
| GET | `/api/super-admin/hospitals/:hospitalId/documents` | Get all documents by hospital |
| GET | `/api/super-admin/hospitals/:hospitalId/followups` | Get all followups by hospital |
| GET | `/api/super-admin/appointments/followups` | Get follow-up appointments list |
| GET | `/api/super-admin/appointments/checkins` | Get check-in appointments list |
| GET | `/api/super-admin/appointments/checkouts` | Get check-out appointments list |
| GET | `/api/super-admin/appointments/not-arrived` | Get not arrived appointments list |
| POST | `/api/super-admin/notifications/send` | Send notification to all patients |
| GET | `/api/super-admin/notifications` | Get all notifications history |

---

## Hospital Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/hospital/basicDetails` | Create hospital basic details |
| POST | `/api/hospital/facilities` | Add hospital facilities |
| POST | `/api/hospital/review` | Create hospital review |
| DELETE | `/api/hospital/:hospitalId` | Delete hospital |
| GET | `/api/hospital/:userId/:hospitalId` | Get hospital details |
| POST | `/api/hospital/location` | Get hospitals by location |
| GET | `/api/hospital` | Get all hospital details |
| GET | `/api/hospital/public` | Get all hospitals (public) |
| PUT | `/api/hospital/details/:hospitalId` | Update hospital basic details |
| PUT | `/api/hospital/facilities/:hospitalId` | Update hospital facilities |
| PUT | `/api/hospital/review/:hospitalId` | Update hospital review comment |
| GET | `/api/hospital/admin/activate` | Get all inactive hospitals |
| POST | `/api/hospital/admin/activate` | Activate hospital |
| POST | `/api/hospital/:hospitalId/facilities` | Add facilities to hospital |
| PUT | `/api/hospital/:hospitalId/facilities` | Update hospital facilities |

---

## Doctor Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/doctor/add` | Create new doctor |
| POST | `/api/doctor/get` | Get doctor details |
| PUT | `/api/doctor/update` | Update doctor information |
| DELETE | `/api/doctor/delete` | Delete doctor |
| GET | `/api/doctor/all/:hospitalId` | Get all doctors in hospital |
| PUT | `/api/doctor/upload-image` | Upload doctor profile image |
| PUT | `/api/doctor/update-image-url` | Update doctor image URL |
| POST | `/api/doctor/available-time-slots` | Get available time slots for doctor |
| POST | `/api/doctor/meet` | Meet doctor (search functionality) |

---

## Doctor Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/doctor/signup` | Doctor registration |
| POST | `/api/doctor/login` | Doctor login |
| GET | `/api/doctor/profile` | Get doctor profile (authenticated) |

---

## Nurse Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/nurse/add` | Create new nurse |
| POST | `/api/nurse/get` | Get nurse details |
| PUT | `/api/nurse/update` | Update nurse information |
| DELETE | `/api/nurse/delete` | Delete nurse |
| GET | `/api/nurse/all/:hospitalId` | Get all nurses in hospital |
| PUT | `/api/nurse/upload-image` | Upload nurse profile image |
| PUT | `/api/nurse/update-image-url` | Update nurse image URL |

---

## Nurse Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/nurse/signup` | Nurse registration |
| POST | `/api/nurse/login` | Nurse login |
| GET | `/api/nurse/profile` | Get nurse profile (authenticated) |

---

## Appointment Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/appoitment` | Create new appointment |
| POST | `/api/appoitment/check` | Safe create appointment (validation) |
| POST | `/api/appoitment/process` | Process appointment payment |
| PUT | `/api/appoitment/:appointmentId` | Update appointment |
| DELETE | `/api/appoitment/:appointmentId` | Delete appointment |
| GET | `/api/appoitment/:appointmentId` | Get appointment by ID |
| GET | `/api/appoitment/doctor/:doctorId` | Get appointments by doctor |
| GET | `/api/appoitment/hospital/:hospitalId` | Get appointments by hospital |
| GET | `/api/appoitment/userId/:patientId` | Get appointments by patient |
| POST | `/api/appoitment/:appointmentId/documents/upload` | Upload appointment documents |
| GET | `/api/appoitment/:appointmentId/documents` | Get appointment documents |
| DELETE | `/api/appoitment/:appointmentId/documents` | Delete appointment document |
| POST | `/api/appointsummary` | Get appointments summary |

---

## Follow-up Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/follow-up` | Create follow-up appointment |
| GET | `/api/follow-up/patient/:patientId` | Get follow-up appointments by patient |
| GET | `/api/follow-up/doctor/:doctorId` | Get follow-up appointments by doctor |
| GET | `/api/follow-up/hospital/:hospitalId` | Get follow-up appointments by hospital |
| GET | `/api/follow-up/creator/:createdBy/:createdById` | Get follow-up appointments by creator |

---

## Patient Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/patient-notes` | Create patient note |
| GET | `/api/patient-notes/doctor/:doctorId` | Get patient notes by doctor |
| GET | `/api/patient-notes/patient/:patientId` | Get patient notes by patient |
| PUT | `/api/patient-notes/:noteId` | Update patient note |
| DELETE | `/api/patient-notes/:noteId` | Delete patient note |

---

## Reviews & Ratings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/review` | Create doctor review |
| GET | `/api/review/doctor/:doctorId` | Get reviews by doctor |
| GET | `/api/review/doctor/:doctorId/summary` | Get doctor rating summary |
| PUT | `/api/review/patient/:patientId/doctor/:doctorId` | Update patient review |
| PUT | `/api/review/:reviewId` | Update review |
| DELETE | `/api/review/:reviewId` | Delete review |
| PATCH | `/api/review/:reviewId/moderate` | Moderate review |
| PATCH | `/api/review/bulk/moderate` | Bulk moderate reviews |
| GET | `/api/review/admin/suspicious` | Get suspicious reviews |

---

## Favorites

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/favourite/addfav` | Add hospital to favorites |
| GET | `/api/favourite/:userId/:hospitalId` | Check if hospital is favorite |
| GET | `/api/favourite/:userId` | Get all favorites by user |

---

## Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Search hospitals |

---

## QR Code Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/qrgenerator` | Generate QR code |
| GET | `/api/qrgenerator/getdetails` | Get QR code details |

---

## Help Center (Q&A)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/qa` | Create Q&A entry |
| GET | `/api/qa` | Get all Q&A entries |
| PUT | `/api/qa/:id` | Update Q&A entry |
| DELETE | `/api/qa/:id` | Delete Q&A entry |

---

## File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/uploadfile` | Upload file |
| POST | `/api/getfile` | Get all files |
| POST | `/api/file/download` | Download file |
| DELETE | `/api/file/delete` | Delete file |

---

## FCM Token Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fcm/token` | Save or update FCM token |
| GET | `/api/fcm/user/:userId/tokens` | Get all FCM tokens for user |
| PUT | `/api/fcm/token/:tokenId/deactivate` | Deactivate FCM token |
| POST | `/api/fcm/test` | Send test notification |
| POST | `/api/fcm/test-appointment-booking` | Send test appointment booking notification |
| POST | `/api/fcm/test-distance` | Test distance calculation |

---

## Notification Orchestrator

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orchestrator/eta` | Calculate ETA/distance between locations |
| POST | `/api/orchestrator/places/autocomplete` | Google Places autocomplete |
| POST | `/api/orchestrator/place-reviews` | Get place reviews |
| POST | `/api/orchestrator/notifications/2hour-reminder` | Send manual 2-hour reminder |
| POST | `/api/orchestrator/notifications/location-based` | Send location-based notification |
| POST | `/api/orchestrator/notifications/appointment-navigation` | Send appointment navigation notification |
| POST | `/api/orchestrator/notifications/doctor-delay` | Send doctor delay notification |
| POST | `/api/orchestrator/batch/process-eta` | Process ETA batches |
| POST | `/api/orchestrator/batch/detect-noshow` | Detect no-show appointments |
| POST | `/api/orchestrator/batch/checkin` | Handle check-in batch |
| POST | `/api/orchestrator/batch/advance` | Advance to next batch |

---

## Doctor Delay Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/doctor/delay` | Set doctor delay |
| GET | `/api/doctor/delay/:doctorId` | Get active delays for doctor |
| DELETE | `/api/doctor/delay/:doctorId` | Clear delays for doctor |
| POST | `/api/doctor/reset-availability` | Reset all doctor availability |
| POST | `/api/doctor/adjusted-time` | Get adjusted appointment time considering delays |
| GET | `/api/doctor/delays/hospital/:hospitalId` | Get doctors with delays by hospital |
| POST | `/api/doctor/delays/cleanup` | Manually cleanup expired delays |

---

## Token Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/token/migrate` | Migrate appointments to add token numbers |
| GET | `/api/token/stats/:doctorId` | Get token statistics for doctor |

---

## User Address Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/address` | Add new address to user |
| GET | `/api/user/address/:userId` | Get all user addresses |
| PUT | `/api/user/address/:userId/:addressId` | Update user address |
| DELETE | `/api/user/address/:userId/:addressId` | Delete user address |

---

## User Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/documents/:userId` | Get user documents grouped by appointment |

---

## Suggestions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/getSuggestion` | Get similar appointment suggestions |

---

## Common Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Common signup for doctors/nurses |
| POST | `/api/auth/login` | Common login for doctors/nurses |

---

## System & Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/api-docs` | Swagger API documentation |

---

## Summary Statistics

- **Total Endpoints**: ~150+
- **Authentication Endpoints**: 7
- **User Management**: 8
- **Admin Management**: 15
- **Super Admin**: 16
- **Hospital Management**: 13
- **Doctor Management**: 9
- **Nurse Management**: 7
- **Appointment Management**: 12
- **Follow-up Appointments**: 5
- **Patient Notes**: 5
- **Reviews & Ratings**: 9
- **Favorites**: 3
- **Search**: 1
- **QR Code**: 2
- **Help Center**: 4
- **File Upload**: 4
- **FCM Token**: 6
- **Notification Orchestrator**: 10
- **Doctor Delay**: 7
- **Token Management**: 2
- **User Address**: 4
- **User Documents**: 1
- **Suggestions**: 1
- **System**: 2

---

## Notes

- Most endpoints require authentication via JWT tokens
- Rate limiting is applied to various endpoints
- File upload endpoints use multipart/form-data
- Some endpoints are public (no authentication required)
- Protected routes use role-based access control (RBAC)
- OAuth routes are available for Google authentication
- Swagger documentation is available at `/api-docs`

---

**Last Updated**: Generated from codebase analysis
**API Base URL**: Configured via environment variables

