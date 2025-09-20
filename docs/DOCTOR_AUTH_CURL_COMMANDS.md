# Doctor Authentication - Curl Commands

## Overview
This document provides complete `curl` commands for testing the doctor authentication system. The implementation includes:

1. **Doctor Signup** - Doctor sets password when first added by admin
2. **Doctor Login** - Doctor authenticates with email/password
3. **Doctor Profile** - Get current doctor's profile (protected route)

## 🔐 **DOCTOR AUTHENTICATION**

### 1. Doctor Signup (Set Password)
```bash
curl -X POST http://localhost:3000/api/doctor/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.johnson@hospital.com",
    "password": "securePassword123",
    "confirmPassword": "securePassword123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password set successfully. You can now login.",
  "data": {
    "doctorId": "D0001",
    "email": "sarah.johnson@hospital.com"
  }
}
```

**Error Response (Doctor Not Found):**
```json
{
  "success": false,
  "message": "Doctor not found with this email address. Please contact your administrator.",
  "error": "NotFoundError",
  "statusCode": 404
}
```

**Error Response (Password Already Set):**
```json
{
  "success": false,
  "message": "Password is already set for this doctor account.",
  "error": "ConflictError",
  "statusCode": 409
}
```

**Error Response (Password Mismatch):**
```json
{
  "success": false,
  "message": "Password and confirm password do not match.",
  "error": "ValidationError",
  "statusCode": 400
}
```

### 2. Doctor Login
```bash
curl -X POST http://localhost:3000/api/doctor/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.johnson@hospital.com",
    "password": "securePassword123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor logged in successfully",
  "data": {
    "doctor": {
      "doctorId": "D0001",
      "name": "Dr. Sarah Johnson",
      "email": "sarah.johnson@hospital.com",
      "mobileNumber": "9876543210",
      "gender": "Female",
      "specialization": "Cardiology",
      "hospitalId": "6155",
      "consultantFee": 1500,
      "status": "Available",
      "isPasswordSet": true,
      "lastLogin": "2024-01-15T10:30:00.000Z",
      "permissions": {
        "profile": { "enabled": true, "viewOnly": false },
        "tokenIssued": { "enabled": true, "viewOnly": false },
        "checkedIn": { "enabled": true, "viewOnly": false },
        "userLogs": { "enabled": true, "viewOnly": true },
        "documentsView": { "enabled": true, "viewOnly": false },
        "doctorsList": { "enabled": true, "viewOnly": true },
        "addDoctor": { "enabled": false, "viewOnly": false },
        "editDoctor": { "enabled": false, "viewOnly": false },
        "deleteDoctor": { "enabled": false, "viewOnly": false },
        "todayLogs": { "enabled": true, "viewOnly": true },
        "scanQr": { "enabled": true, "viewOnly": false },
        "uploadDocs": { "enabled": true, "viewOnly": false }
      }
    },
    "adminId": "A0001",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "loggedInAs": "doctor"
  }
}
```

**Error Response (Invalid Credentials):**
```json
{
  "success": false,
  "message": "Invalid email or password.",
  "error": "UnauthorizedError",
  "statusCode": 401
}
```

**Error Response (Password Not Set):**
```json
{
  "success": false,
  "message": "Password not set. Please complete your registration first.",
  "error": "ValidationError",
  "statusCode": 400
}
```

### 3. Get Doctor Profile (Protected Route)
```bash
curl -X GET http://localhost:3000/api/doctor/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor profile retrieved successfully",
  "data": {
    "doctor": {
      "doctorId": "D0001",
      "name": "Dr. Sarah Johnson",
      "email": "sarah.johnson@hospital.com",
      "mobileNumber": "9876543210",
      "gender": "Female",
      "specialization": "Cardiology",
      "hospitalId": "6155",
      "consultantFee": 1500,
      "status": "Available",
      "isPasswordSet": true,
      "lastLogin": "2024-01-15T10:30:00.000Z",
      "permissions": {
        "profile": { "enabled": true, "viewOnly": false },
        "tokenIssued": { "enabled": true, "viewOnly": false },
        "checkedIn": { "enabled": true, "viewOnly": false },
        "userLogs": { "enabled": true, "viewOnly": true },
        "documentsView": { "enabled": true, "viewOnly": false },
        "doctorsList": { "enabled": true, "viewOnly": true },
        "addDoctor": { "enabled": false, "viewOnly": false },
        "editDoctor": { "enabled": false, "viewOnly": false },
        "deleteDoctor": { "enabled": false, "viewOnly": false },
        "todayLogs": { "enabled": true, "viewOnly": true },
        "scanQr": { "enabled": true, "viewOnly": false },
        "uploadDocs": { "enabled": true, "viewOnly": false }
      }
    },
    "adminId": "A0001",
    "loggedInAs": "doctor"
  }
}
```

**Error Response (No Token):**
```json
{
  "success": false,
  "message": "Access token is required.",
  "error": "UnauthorizedError",
  "statusCode": 401
}
```

**Error Response (Invalid Token):**
```json
{
  "success": false,
  "message": "Invalid access token.",
  "error": "UnauthorizedError",
  "statusCode": 401
}
```

## 🔄 **Complete Workflow Testing**

### **Step 1: Admin Creates Doctor**
```bash
# First, admin creates a doctor (existing API)
curl -X POST http://localhost:3000/api/doctor/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "x-user-id: A0001" \
  -d '{
    "adminId": "A0001",
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@hospital.com",
    "mobileNumber": "9876543210",
    "gender": "Female",
    "specialization": "Cardiology",
    "hospitalId": "6155",
    "consultantFee": 1500,
    "permissions": {
      "profile": { "enabled": true, "viewOnly": false },
      "scanQr": { "enabled": true, "viewOnly": false }
    }
  }'
```

### **Step 2: Doctor Sets Password**
```bash
# Doctor sets password using signup API
curl -X POST http://localhost:3000/api/doctor/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.johnson@hospital.com",
    "password": "securePassword123",
    "confirmPassword": "securePassword123"
  }'
```

### **Step 3: Doctor Logs In**
```bash
# Doctor logs in and gets JWT token
curl -X POST http://localhost:3000/api/doctor/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.johnson@hospital.com",
    "password": "securePassword123"
  }'
```

### **Step 4: Doctor Accesses Protected Route**
```bash
# Doctor uses JWT token to access profile
curl -X GET http://localhost:3000/api/doctor/profile \
  -H "Authorization: Bearer DOCTOR_JWT_TOKEN"
```

## ⚠️ **Important Notes**

### **Authentication Requirements:**
- Replace `YOUR_JWT_TOKEN_HERE` with actual token from login response
- Doctor profile route requires valid JWT authentication
- Token must be of type 'doctor' (not admin token)

### **Password Requirements:**
- Minimum 6 characters
- Password and confirm password must match
- Password is hashed using bcrypt (same as admin)

### **Security Features:**
- Password is not returned in API responses
- JWT tokens include doctor type validation
- Account lockout not implemented (as per requirements)
- Password reset not implemented (as per requirements)

### **Error Handling:**
- All endpoints return structured error responses
- Validation errors include field-specific messages
- Authentication errors return 401/403 status codes
- Clear error messages for different scenarios

## ✅ **Success Criteria**

- ✅ Doctor can set password after being created by admin
- ✅ Doctor can login with email/password
- ✅ JWT token generation and validation
- ✅ Complete doctor profile returned on login
- ✅ Permission-based access control
- ✅ Secure password hashing
- ✅ Proper error handling and validation
- ✅ Clean separation of concerns
- ✅ Reusable authentication middleware
