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

**Endpoint:** `POST /api/login/`

**Base URL:** `https://api2-cd3vrfxtha-uc.a.run.app`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "phoneNumber": "+919894643371"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "message": "Login successful",
        "user": {
            "userId": "P0016",
            "profileUpadate": false
        }
    },
    "timestamp": "2025-07-27T20:19:01.024Z"
}
```

**Flow Logic:**
- If `profileUpdate: false` → New user flow / should sign up
- If `profileUpdate: true` → Navigate to dashboard

### Signup
**Status:** ✅ Available  
**Integration:** ❌ Not Done

**Endpoint:** `POST /api/signup`

**Base URL:** `https://api2-cd3vrfxtha-uc.a.run.app`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "name": "admintest ss",
    "gender": "Female",
    "dateOfBirth": "10/20/1995",
    "email": "admin31233e@easyq.com",
    "phoneNumber": "+919894643371",
    "role": "user"
}
```

**Response:**
```json
{
    "success": true,
    "message": "User registration successful",
    "data": {
        "message": "User registered successfully!",
        "user": {
            "userId": "P0016",
            "email": "admin31233e@easyq.com"
        }
    },
    "timestamp": "2025-07-27T20:28:01.575Z"
}
```

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

### Get User Favourites
**Status:** ✅ Available

**Endpoint:** `GET /api/favourite/{userId}`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "message": "Favourite hospitals retrieved successfully",
    "data": [
        {
            "address": {
                "street": "456 King's Road",
                "city": "Mumbai",
                "state": "Maharashtra",
                "zipCode": "400001",
                "country": "India"
            },
            "location": {
                "type": "Point",
                "coordinates": [
                    72.8777,
                    19.076
                ]
            },
            "patientIds": [],
            "_id": "687a435dc874d91b59521823",
            "name": "Royal Care Hospital",
            "email": "contact@royalcare.org",
            "phoneNumber": "9911223344",
            "ambulanceNumber": "9977885522",
            "departments": [
                {
                    "name": "Cardiology",
                    "headOfDepartment": "Dr. Priya Singh",
                    "contactNumber": "9911223345",
                    "description": "Advanced heart care.",
                    "doctorIds": [],
                    "_id": "687a435dc874d91b59521824",
                    "id": "687a435dc874d91b59521824"
                },
                {
                    "name": "Pediatrics",
                    "headOfDepartment": "Dr. Jane Smith",
                    "contactNumber": "9911223346",
                    "description": "Specialized child healthcare.",
                    "doctorIds": [
                        "8147"
                    ],
                    "_id": "687a435dc874d91b59521825",
                    "total_number_Doctor": 1,
                    "id": "687a435dc874d91b59521825"
                },
                {
                    "name": "Orthopedics",
                    "headOfDepartment": "Dr. Sneha Patel",
                    "contactNumber": "9911223347",
                    "description": "Musculoskeletal system expertise.",
                    "doctorIds": [],
                    "_id": "687a435dc874d91b59521826",
                    "id": "687a435dc874d91b59521826"
                },
                {
                    "name": "Neurology",
                    "headOfDepartment": "Dr. Vivek Reddy",
                    "contactNumber": "9911223348",
                    "description": "Brain and nervous system specialists.",
                    "doctorIds": [],
                    "_id": "687a435dc874d91b59521827",
                    "id": "687a435dc874d91b59521827"
                },
                {
                    "name": "Oncology",
                    "headOfDepartment": "Dr. Divya Sharma",
                    "contactNumber": "9911223349",
                    "description": "Cancer treatment and research.",
                    "doctorIds": [],
                    "_id": "687a435dc874d91b59521828",
                    "id": "687a435dc874d91b59521828"
                },
                {
                    "name": "Dermatology",
                    "headOfDepartment": "Dr. Rohan Gupta",
                    "contactNumber": "9911223350",
                    "description": "Skin, hair, and nail health.",
                    "doctorIds": [],
                    "_id": "687a435dc874d91b59521829",
                    "id": "687a435dc874d91b59521829"
                },
                {
                    "name": "Gastroenterology",
                    "headOfDepartment": "Dr. Meera Rao",
                    "contactNumber": "9911223351",
                    "description": "Digestive health and disorders.",
                    "doctorIds": [],
                    "_id": "687a435dc874d91b5952182a",
                    "id": "687a435dc874d91b5952182a"
                },
                {
                    "name": "Emergency Medicine",
                    "headOfDepartment": "Dr. Karan Singh",
                    "contactNumber": "9911223352",
                    "description": "Immediate medical response.",
                    "doctorIds": [],
                    "_id": "687a435dc874d91b5952182b",
                    "id": "687a435dc874d91b5952182b"
                },
                {
                    "name": "Radiology",
                    "headOfDepartment": "Dr. Pooja Verma",
                    "contactNumber": "9911223353",
                    "description": "Medical imaging and diagnostics.",
                    "doctorIds": [],
                    "_id": "687a435dc874d91b5952182c",
                    "id": "687a435dc874d91b5952182c"
                },
                {
                    "name": "Ophthalmology",
                    "headOfDepartment": "Dr. Suresh Das",
                    "contactNumber": "9911223354",
                    "description": "Eye care and vision correction.",
                    "doctorIds": [],
                    "_id": "687a435dc874d91b5952182d",
                    "id": "687a435dc874d91b5952182d"
                }
            ],
            "hospitalType": "Super-Specialty Hospital",
            "imageUrl": "https://placehold.co/600x400/90EE90/000000?text=Hospital+Two",
            "averageRating": 0,
            "hospitalId": "9112",
            "createdAt": "2025-07-18T12:51:41.090Z",
            "updatedAt": "2025-07-18T13:18:20.427Z",
            "__v": 1,
            "id": "687a435dc874d91b59521823",
            "isFavourite": true
        }
    ]
}
```

### Get User Documents
**Status:** ✅ Available

**Endpoint:** `POST /api/getfile`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "userId": "A0001"
}
```

**Response:**
```json
{
    "files": {
        "_id": "687d21aa6be7d50b1111af9a",
        "userId": "A0001",
        "hospitals": [
            {
                "hospitalId": "4806",
                "documents": [
                    {
                        "fileName": "flow diagram in the .png",
                        "mimeType": "image/png",
                        "size": 885775,
                        "fileType": "txt",
                        "fileKey": "uploads/users/A0001/1753031070262-82657165.png",
                        "fileUrl": "https://storage.googleapis.com/gs://the-easy-q.firebasestorage.app/uploads/users/A0001/1753031070262-82657165.png",
                        "uploadedAt": "2025-07-20T17:04:42.657Z",
                        "_id": "687d21aa6be7d50b1111af9c"
                    },
                    {
                        "fileName": "WhatsApp Image 2022-09-15 at 11.34.19 PM.jpeg",
                        "mimeType": "image/jpeg",
                        "size": 87795,
                        "fileType": "png",
                        "fileKey": "uploads/users/A0001/1753215126890-121657435.jpeg",
                        "fileUrl": "https://storage.googleapis.com/undefined/uploads/users/A0001/1753215126890-121657435.jpeg",
                        "uploadedAt": "2025-07-22T20:12:09.767Z",
                        "_id": "687ff0993b5087340e1b1eee"
                    },
                    {
                        "fileName": "WhatsApp Image 2022-09-15 at 11.34.19 PM.jpeg",
                        "mimeType": "image/jpeg",
                        "size": 87795,
                        "fileType": "png",
                        "fileKey": "uploads/users/A0001/1753216234340-537165645.jpeg",
                        "fileUrl": "https://storage.googleapis.com/undefined/uploads/users/A0001/1753216234340-537165645.jpeg",
                        "uploadedAt": "2025-07-22T20:30:37.165Z",
                        "_id": "687ff4ed3a2b6e1942a9ecb9"
                    },
                    {
                        "fileName": "doctor flow diagram .png",
                        "mimeType": "image/png",
                        "size": 1660002,
                        "fileType": "png",
                        "fileKey": "uploads/users/A0001/1753216273961-260281765.png",
                        "fileUrl": "https://storage.googleapis.com/undefined/uploads/users/A0001/1753216273961-260281765.png",
                        "uploadedAt": "2025-07-22T20:31:18.242Z",
                        "_id": "687ff5163a2b6e1942a9ecc3"
                    }
                ],
                "_id": "687d21aa6be7d50b1111af9b"
            }
        ],
        "__v": 7
    }
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



