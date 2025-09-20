# Nurse APIs Documentation

## Overview
This document provides a comprehensive list of all Nurse-related APIs in the EasyQ system. The nurse functionality includes CRUD operations, authentication, image management, and common authentication for both doctors and nurses.

## Table of Contents
1. [Nurse Model](#nurse-model)
2. [Nurse Authentication APIs](#nurse-authentication-apis)
3. [Nurse Management APIs](#nurse-management-apis)
4. [Common Authentication APIs](#common-authentication-apis)
5. [Image Management APIs](#image-management-apis)
6. [API Response Formats](#api-response-formats)
7. [Error Handling](#error-handling)

---

## Nurse Model

### Schema Fields
```javascript
{
  nurseId: String,           // Auto-generated (N0001, N0002, etc.)
  name: String,              // Required
  email: String,             // Required, unique
  mobileNumber: String,      // Required, 10 digits
  gender: String,            // Required: 'Male', 'Female', 'Other'
  dateOfBirth: Date,         // Optional
  qualification: [String],   // Array of qualifications
  serviceStartDate: Date,    // Required
  experienceYears: Number,   // Virtual field (calculated)
  hospitalId: String,        // Required
  profileImageUrl: String,   // Default image URL
  profileImage: Object,      // File details
  status: String,            // 'Available', 'On Duty', 'Off Duty', 'On Leave'
  workingHours: Array,       // Working schedule with time slots
  patientIds: [String],      // Associated patients
  password: String,          // Hashed password
  isPasswordSet: Boolean,    // Password status
  lastLogin: Date,           // Last login timestamp
  permissions: Object,       // Role-based permissions
  createdAt: Date,           // Creation timestamp
  updatedAt: Date            // Last update timestamp
}
```

---

## Nurse Authentication APIs

### 1. Nurse Signup
**Endpoint:** `POST /api/nurse/signup`

**Description:** Complete nurse registration with password setup

**Request Body:**
```json
{
  "email": "nurse@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account activated successfully",
  "data": {
    "nurseId": "N0001",
    "email": "nurse@example.com"
  }
}
```

### 2. Nurse Login
**Endpoint:** `POST /api/nurse/login`

**Description:** Authenticate nurse and get JWT token

**Request Body:**
```json
{
  "email": "nurse@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "nurse": {
      "nurseId": "N0001",
      "name": "Jane Nurse",
      "email": "nurse@example.com",
      "hospitalId": "H0001",
      "permissions": {...}
    }
  }
}
```

### 3. Get Nurse Profile
**Endpoint:** `GET /api/nurse/profile`

**Description:** Get authenticated nurse's profile data

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Nurse profile retrieved successfully",
  "data": {
    "nurseId": "N0001",
    "name": "Jane Nurse",
    "email": "nurse@example.com",
    "hospitalId": "H0001",
    "status": "Available",
    "permissions": {...}
  }
}
```

---

## Nurse Management APIs

### 1. Create Nurse
**Endpoint:** `POST /api/nurse/add`

**Description:** Create new nurse (Admin only)

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "adminId": "A0001",
  "name": "Jane Nurse",
  "email": "nurse@example.com",
  "mobileNumber": "9876543210",
  "gender": "Female",
  "dateOfBirth": "1990-01-01",
  "qualification": ["B.Sc Nursing", "M.Sc Nursing"],
  "serviceStartDate": "2020-01-01",
  "hospitalId": "H0001",
  "status": "Available",
  "workingHours": [
    {
      "day": "Monday",
      "date": "01/01/2024",
      "available": "morning",
      "timeSlots": [
        {
          "startTime": "09:00",
          "endTime": "17:00"
        }
      ]
    }
  ],
  "permissions": {
    "profile": { "enabled": true, "viewOnly": false },
    "tokenIssued": { "enabled": true, "viewOnly": false }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Nurse created successfully",
  "data": {
    "nurseId": "N0001",
    "name": "Jane Nurse",
    "email": "nurse@example.com",
    "hospitalId": "H0001"
  }
}
```

### 2. Get Nurse
**Endpoint:** `POST /api/nurse/get`

**Description:** Get specific nurse details

**Request Body:**
```json
{
  "nurseId": "N0001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Nurse retrieved successfully",
  "data": {
    "nurse": {
      "nurseId": "N0001",
      "name": "Jane Nurse",
      "email": "nurse@example.com",
      "hospitalId": "H0001",
      "status": "Available"
    }
  }
}
```

### 3. Update Nurse
**Endpoint:** `PUT /api/nurse/update`

**Description:** Update nurse information

**Request Body:**
```json
{
  "nurseId": "N0001",
  "name": "Jane Smith Nurse",
  "status": "On Duty",
  "workingHours": [...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Nurse updated successfully",
  "data": {
    "nurse": {
      "nurseId": "N0001",
      "name": "Jane Smith Nurse",
      "status": "On Duty"
    }
  }
}
```

### 4. Delete Nurse
**Endpoint:** `DELETE /api/nurse/delete`

**Description:** Delete nurse (Admin only)

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "nurseId": "N0001",
  "adminId": "A0001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Nurse deleted successfully",
  "data": {
    "deletedNurse": {
      "nurseId": "N0001",
      "name": "Jane Nurse"
    }
  }
}
```

### 5. Get All Nurses by Hospital
**Endpoint:** `GET /api/nurse/all/:hospitalId`

**Description:** Get all nurses for a specific hospital

**URL Parameters:**
- `hospitalId`: Hospital ID

**Response:**
```json
{
  "success": true,
  "message": "Nurses retrieved successfully",
  "data": {
    "nurses": [
      {
        "nurseId": "N0001",
        "name": "Jane Nurse",
        "email": "nurse@example.com",
        "status": "Available"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalNurses": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

## Common Authentication APIs

### 1. Common Signup
**Endpoint:** `POST /api/auth/signup`

**Description:** Unified signup for both doctors and nurses

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account activated successfully",
  "data": {
    "userId": "D0001", // or "N0001"
    "userType": "doctor", // or "nurse"
    "email": "user@example.com"
  }
}
```

### 2. Common Login
**Endpoint:** `POST /api/auth/login`

**Description:** Unified login for both doctors and nurses

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "D0001", // or "N0001"
      "name": "John Doctor", // or "Jane Nurse"
      "email": "user@example.com",
      "userType": "doctor", // or "nurse"
      "hospitalId": "H0001",
      "permissions": {...}
    }
  }
}
```

---

## Image Management APIs

### 1. Upload Nurse Image
**Endpoint:** `PUT /api/nurse/upload-image`

**Description:** Upload nurse profile image (Admin only)

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
adminId: A0001
nurseId: N0001
file: <image_file>
```

**Response:**
```json
{
  "success": true,
  "message": "Nurse image uploaded successfully",
  "data": {
    "nurseId": "N0001",
    "profileImageUrl": "https://storage.googleapis.com/bucket/hospitals/H0001/nurses/N0001-1234567890.jpg",
    "profileImage": {
      "fileName": "N0001-1234567890.jpg",
      "fileUrl": "https://storage.googleapis.com/bucket/hospitals/H0001/nurses/N0001-1234567890.jpg",
      "uploadedAt": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

### 2. Update Nurse Image URL
**Endpoint:** `PUT /api/nurse/update-image-url`

**Description:** Update nurse image URL when frontend handles upload (Admin only)

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "adminId": "A0001",
  "nurseId": "N0001",
  "fileUrl": "https://example.com/nurse-image.jpg",
  "fileName": "nurse-image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Nurse profile image URL updated successfully",
  "data": {
    "nurseId": "N0001",
    "profileImageUrl": "https://example.com/nurse-image.jpg",
    "profileImage": {
      "fileName": "nurse-image.jpg",
      "fileUrl": "https://example.com/nurse-image.jpg",
      "uploadedAt": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

---

## API Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information"
  }
}
```

---

## Error Handling

### Common Error Codes
- `ValidationError`: Invalid input data
- `NotFoundError`: Resource not found
- `ConflictError`: Resource already exists
- `UnauthorizedError`: Authentication required
- `ForbiddenError`: Insufficient permissions
- `InternalServerError`: Server error

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

---

## Authentication & Authorization

### JWT Token Structure
```json
{
  "type": "nurse", // or "doctor"
  "data": {
    "userId": "N0001",
    "role": "nurse",
    "email": "nurse@example.com",
    "hospitalId": "H0001",
    "adminId": "A0001"
  }
}
```

### Permission System
Nurses have role-based permissions for:
- Profile management
- Patient notes access
- Appointment management
- Hospital access
- File operations
- Review management

### Middleware
- `authenticateNurse`: Nurse authentication
- `checkNursePermission`: Permission validation
- `authenticateAdmin`: Admin authentication
- `adminVerificationCheck`: Admin verification

---

## Notes

1. **Nurse IDs**: Auto-generated with format N0001, N0002, etc.
2. **Experience Calculation**: Virtual field calculated from serviceStartDate
3. **Working Hours**: Supports multiple days with time slots
4. **Status Options**: Available, On Duty, Off Duty, On Leave
5. **Image Storage**: Uses Firebase Storage with organized folder structure
6. **Common Auth**: Unified authentication for both doctors and nurses
7. **Existing Doctor APIs**: Remain unchanged and functional

---

## File Structure
```
src/
├── model/nurse.js
├── controller/nurse.js
├── controller/nurseAuth.js
├── controller/commonAuth.js
├── services/nurseService.js
├── services/nurseAuthService.js
├── services/commonAuthService.js
├── middleware/nurseAuth.js
├── policies/nursePolicies.js
└── routes/
    ├── nurse/index.js
    ├── nurseAuth/index.js
    └── auth/index.js
```
