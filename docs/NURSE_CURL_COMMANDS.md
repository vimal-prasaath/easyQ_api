# Nurse API CURL Commands

## Overview
This document provides comprehensive CURL commands for all Nurse-related APIs in the EasyQ system. These commands can be used for testing, integration, and development purposes.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Nurse Authentication APIs](#nurse-authentication-apis)
3. [Nurse Management APIs](#nurse-management-apis)
4. [Common Authentication APIs](#common-authentication-apis)
5. [Image Management APIs](#image-management-apis)
6. [Error Examples](#error-examples)

---

## Prerequisites

### Base URL
```bash
BASE_URL="http://localhost:3000/api"
# For production: BASE_URL="https://your-production-url.com/api"
```

### Required Headers
```bash
# For authenticated requests
AUTH_HEADER="Authorization: Bearer YOUR_JWT_TOKEN"

# For admin requests
ADMIN_AUTH_HEADER="Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# For file uploads
CONTENT_TYPE="Content-Type: multipart/form-data"
```

---

## Nurse Authentication APIs

### 1. Nurse Signup
**Description:** Complete nurse registration with password setup

```bash
curl -X POST "${BASE_URL}/nurse/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nurse@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

**Expected Response:**
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
**Description:** Authenticate nurse and get JWT token

```bash
curl -X POST "${BASE_URL}/nurse/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nurse@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
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
**Description:** Get authenticated nurse's profile data

```bash
curl -X GET "${BASE_URL}/nurse/profile" \
  -H "${AUTH_HEADER}"
```

**Expected Response:**
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
**Description:** Create new nurse (Admin only)

```bash
curl -X POST "${BASE_URL}/nurse/add" \
  -H "Content-Type: application/json" \
  -H "${ADMIN_AUTH_HEADER}" \
  -d '{
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
  }'
```

**Expected Response:**
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
**Description:** Get specific nurse details

```bash
curl -X POST "${BASE_URL}/nurse/get" \
  -H "Content-Type: application/json" \
  -d '{
    "nurseId": "N0001"
  }'
```

**Expected Response:**
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
**Description:** Update nurse information

```bash
curl -X PUT "${BASE_URL}/nurse/update" \
  -H "Content-Type: application/json" \
  -d '{
    "nurseId": "N0001",
    "name": "Jane Smith Nurse",
    "status": "On Duty",
    "workingHours": [
      {
        "day": "Monday",
        "date": "01/01/2024",
        "available": "morning",
        "timeSlots": [
          {
            "startTime": "08:00",
            "endTime": "16:00"
          }
        ]
      }
    ]
  }'
```

**Expected Response:**
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
**Description:** Delete nurse (Admin only)

```bash
curl -X DELETE "${BASE_URL}/nurse/delete" \
  -H "Content-Type: application/json" \
  -H "${ADMIN_AUTH_HEADER}" \
  -d '{
    "nurseId": "N0001",
    "adminId": "A0001"
  }'
```

**Expected Response:**
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
**Description:** Get all nurses for a specific hospital

```bash
curl -X GET "${BASE_URL}/nurse/all/H0001"
```

**With Query Parameters:**
```bash
curl -X GET "${BASE_URL}/nurse/all/H0001?page=1&limit=10&status=Available&search=Jane"
```

**Expected Response:**
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
**Description:** Unified signup for both doctors and nurses

```bash
curl -X POST "${BASE_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Account activated successfully",
  "data": {
    "userId": "D0001",
    "userType": "doctor",
    "email": "user@example.com"
  }
}
```

### 2. Common Login
**Description:** Unified login for both doctors and nurses

```bash
curl -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "D0001",
      "name": "John Doctor",
      "email": "user@example.com",
      "userType": "doctor",
      "hospitalId": "H0001",
      "permissions": {...}
    }
  }
}
```

---

## Image Management APIs

### 1. Upload Nurse Image
**Description:** Upload nurse profile image (Admin only)

```bash
curl -X PUT "${BASE_URL}/nurse/upload-image" \
  -H "${ADMIN_AUTH_HEADER}" \
  -F "adminId=A0001" \
  -F "nurseId=N0001" \
  -F "file=@/path/to/nurse-image.jpg"
```

**Expected Response:**
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
**Description:** Update nurse image URL when frontend handles upload (Admin only)

```bash
curl -X PUT "${BASE_URL}/nurse/update-image-url" \
  -H "Content-Type: application/json" \
  -H "${ADMIN_AUTH_HEADER}" \
  -d '{
    "adminId": "A0001",
    "nurseId": "N0001",
    "fileUrl": "https://example.com/nurse-image.jpg",
    "fileName": "nurse-image.jpg"
  }'
```

**Expected Response:**
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

## Error Examples

### 1. Validation Error
```bash
curl -X POST "${BASE_URL}/nurse/add" \
  -H "Content-Type: application/json" \
  -H "${ADMIN_AUTH_HEADER}" \
  -d '{
    "adminId": "A0001",
    "name": "",
    "email": "invalid-email"
  }'
```

**Error Response:**
```json
{
  "success": false,
  "message": "Name, email, and mobile number are required fields.",
  "error": {
    "code": "ValidationError",
    "details": "Please provide a valid email address."
  }
}
```

### 2. Unauthorized Error
```bash
curl -X GET "${BASE_URL}/nurse/profile"
```

**Error Response:**
```json
{
  "success": false,
  "message": "Access token is required.",
  "error": {
    "code": "UnauthorizedError",
    "details": "Access token is required."
  }
}
```

### 3. Not Found Error
```bash
curl -X POST "${BASE_URL}/nurse/get" \
  -H "Content-Type: application/json" \
  -d '{
    "nurseId": "N9999"
  }'
```

**Error Response:**
```json
{
  "success": false,
  "message": "Nurse not found with the provided ID.",
  "error": {
    "code": "NotFoundError",
    "details": "Nurse not found with the provided ID."
  }
}
```

### 4. Conflict Error
```bash
curl -X POST "${BASE_URL}/nurse/add" \
  -H "Content-Type: application/json" \
  -H "${ADMIN_AUTH_HEADER}" \
  -d '{
    "adminId": "A0001",
    "name": "Another Nurse",
    "email": "nurse@example.com",
    "mobileNumber": "9876543210",
    "gender": "Female",
    "serviceStartDate": "2020-01-01",
    "hospitalId": "H0001"
  }'
```

**Error Response:**
```json
{
  "success": false,
  "message": "A nurse with this email address already exists.",
  "error": {
    "code": "ConflictError",
    "details": "A nurse with this email address already exists."
  }
}
```

---

## Testing Scripts

### Complete Nurse Flow Test
```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "=== Testing Nurse APIs ==="

# 1. Create Nurse (Admin)
echo "1. Creating nurse..."
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/nurse/add" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "adminId": "A0001",
    "name": "Test Nurse",
    "email": "testnurse@example.com",
    "mobileNumber": "9876543210",
    "gender": "Female",
    "serviceStartDate": "2020-01-01",
    "hospitalId": "H0001"
  }')

echo "Create Response: $CREATE_RESPONSE"

# 2. Nurse Signup
echo "2. Nurse signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "${BASE_URL}/nurse/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testnurse@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }')

echo "Signup Response: $SIGNUP_RESPONSE"

# 3. Nurse Login
echo "3. Nurse login..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/nurse/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testnurse@example.com",
    "password": "password123"
  }')

echo "Login Response: $LOGIN_RESPONSE"

# Extract token from login response
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

# 4. Get Nurse Profile
echo "4. Getting nurse profile..."
PROFILE_RESPONSE=$(curl -s -X GET "${BASE_URL}/nurse/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "Profile Response: $PROFILE_RESPONSE"

echo "=== Test Complete ==="
```

### Common Auth Test
```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "=== Testing Common Auth APIs ==="

# 1. Common Signup (for existing doctor/nurse)
echo "1. Common signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "existing@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }')

echo "Common Signup Response: $SIGNUP_RESPONSE"

# 2. Common Login
echo "2. Common login..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "existing@example.com",
    "password": "password123"
  }')

echo "Common Login Response: $LOGIN_RESPONSE"

echo "=== Test Complete ==="
```

---

## Notes

1. **Replace Placeholders:**
   - `YOUR_JWT_TOKEN` with actual JWT token
   - `YOUR_ADMIN_JWT_TOKEN` with actual admin JWT token
   - `H0001`, `A0001`, `N0001` with actual IDs
   - `/path/to/nurse-image.jpg` with actual file path

2. **File Upload:**
   - Use `-F` flag for multipart/form-data
   - Use `@` prefix for file paths
   - Ensure file exists and is accessible

3. **Error Handling:**
   - Check HTTP status codes
   - Parse error responses for debugging
   - Validate required fields before sending requests

4. **Testing:**
   - Use the provided test scripts
   - Test both success and error scenarios
   - Verify authentication and authorization

5. **Production:**
   - Update BASE_URL for production environment
   - Use proper SSL certificates
   - Implement proper error handling in your application
