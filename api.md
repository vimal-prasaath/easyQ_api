# API Documentation

## Table of Contents
- [Authentication](#authentication)
- [User Profile](#user-profile)
- [Appointments](#appointments)
- [Dashboard](#dashboard)
- [Hospital Features](#hospital-features)

---

## Authentication

### Login
**Status:** ✅ Available  
**Integration:** ❌ Not Done

### Logout
**Status:** ✅ Available  
**Implementation:** Clear local storage and navigate to login screen

---

## User Profile

### Get User Details
**Status:** ✅ Available

**Endpoint:** `GET /api/user/getdetails`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
    "userId": "P0001"
}
```

**Response:**
```json
{
    "success": true,
    "message": "User details retrieved successfully",
    "data": {
        "user": {
            "profileUpadate": false,
            "name": "vijay N",
            "gender": "male",
            "dateOfBirth": "2003-08-23T00:00:00.000Z",
            "role": "doctor",
            "email": "nidigan@gmail.com",
            "mobileNumber": "9876543200",
            "location": "Bangalore",
            "isActive": true,
            "emailVerified": false,
            "createdAt": "2025-07-21T09:15:06.546Z",
            "updatedAt": "2025-07-26T18:41:48.330Z",
            "userId": "P0003"
        }
    },
    "timestamp": "2025-07-26T18:41:48.600Z"
}
```

### Update User Details
**Status:** ✅ Available

**Endpoint:** `PUT /api/user/{userId}`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
    "name": "vijay N",
    "gender": "Male",
    "dateOfBirth": "08/23/2003",
    "email": "nidigan@gmail.com",
    "mobileNumber": "77887878",
    "password": "vi"
}
```

**Response:**
```json
{
    "success": true,
    "message": "User updated successfully",
    "data": {
        "user": {
            "profileUpadate": false,
            "name": "vijay N",
            "gender": "male",
            "dateOfBirth": "2003-08-23T00:00:00.000Z",
            "role": "doctor",
            "email": "nidigan@gmail.com",
            "mobileNumber": "9876543200",
            "location": "Bangalore",
            "isActive": true,
            "emailVerified": false,
            "createdAt": "2025-07-21T09:15:06.546Z",
            "updatedAt": "2025-07-26T18:41:48.330Z",
            "userId": "P0003"
        }
    },
    "timestamp": "2025-07-26T18:41:48.600Z"
}
```

### Delete Account
**Status:** ✅ Available

**Endpoint:** `DELETE /api/user/delete/{userId}`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "message": "User and related data deleted successfully",
    "data": {
        "deletedUserId": "A0001"
    },
    "timestamp": "2025-07-26T18:56:32.844Z"
}
```

---

## Appointments

### Get User Appointments
**Status:** ✅ Available

**Endpoint:** `GET /api/appoitment/userId/{userId}`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "message": "Patient appointments retrieved successfully",
    "data": [
        {
            "patientId": "P0003",
            "doctorId": "2729",
            "hospitalId": "4806",
            "hospitalName": "Test Hospital",
            "doctorName": "Dr. Priya Sharma",
            "appointmentDate": "2025-08-23T18:30:00.000Z",
            "appointmentTime": "10:30",
            "reasonForAppointment": "Routine checkup and consultation for ongoing cough.",
            "appointmentType": "In-person Visit",
            "status": "Scheduled",
            "bookingSource": "Online Portal",
            "bookedByID": "USER_ID_FOR_BOOKING",
            "confirmationSent": false,
            "reminderSent": false,
            "patientNotes": "Patient prefers morning appointments. Allergic to penicillin.",
            "doctorNotes": "",
            "reportUrls": [
                "https://example.com/reports/patientX_report1.pdf",
                "https://example.com/reports/patientX_report2.png"
            ],
            "meetingPlatform": "Google Meet",
            "paymentStatus": "Pending",
            "paymentAmount": 500,
            "currency": "INR",
            "cancellationReason": null,
            "rescheduledFrom": {
                "originalAppointmentId": "ORIGINAL_APPOINTMENT_ID_STRING",
                "originalDate": "2025-06-15T00:00:00.000Z",
                "originalTime": "09:00 AM",
                "_id": "68851af2169b1b1d742be09b"
            },
            "statusHistory": [
                {
                    "status": "Scheduled",
                    "timestamp": "2025-06-16T10:00:00.000Z",
                    "changedBy": "USER_ID_FOR_BOOKING",
                    "_id": "68851af2169b1b1d742be09c"
                }
            ],
            "appointmentId": "29351",
            "createdAt": "2025-07-26T18:14:10.119Z",
            "updatedAt": "2025-07-26T18:14:10.126Z"
        }
    ],
    "timestamp": "2025-07-26T18:44:01.529Z"
}
```

---

## Dashboard

### Main Dashboard
**Status:** ✅ Available  
**Integration:** ✅ Done

### Search Hospitals
**Status:** ❌ Not Available  
**Notes:** Need to implement - list hospitals as user types, send city from frontend with search text

### All Treatments
**Status:** ✅ Available  
**Notes:** Filter hospitals based on existing dashboard API

---

## Hospital Features

### Hospital Details
**Status:** ✅ Available  
**Integration:** ✅ Done

### Filter Doctors
**Status:** ✅ Available  
**Implementation:** Frontend filter

---

## Missing APIs

### Followup
**Status:** ❌ Not Available  
**Notes:** Need to develop

### Documents
**Status:** ❌ Not Available  
**Notes:** Need to fetch all docs for a user

### Favourites
**Status:** ❌ Not Available  
**Notes:** Need to create this API

### Support/About/Terms/Privacy
**Status:** ❌ Not Available  
**Notes:** Need to create this API

---

## API Base URL
```
https://api2-cd3vrfxtha-uc.a.run.app
```

## Authentication
All API calls require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Response Format
All APIs follow a consistent response format:
```json
{
    "success": boolean,
    "message": "string",
    "data": object|array,
    "timestamp": "ISO_8601_timestamp"
}
```



