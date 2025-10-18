# Complete Admin Portal - All Curl Commands

### FCM — Send Test Notification (Open API)

Send a test push notification to the user's most recent active device.

```bash
curl -X POST "{{BASE_URL}}/api/fcm/test" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "P0001",
    "title": "Test Notification",
    "body": "Hi, this is a test notification.",
    "data": { "env": "dev" }
  }'
```

Notes:
- Provide a valid `userId` that has at least one active FCM token.
- Only the most recent active token is used.
- On invalid/expired token, it is deactivated automatically.

### Notification Orchestrator — ETA/Distance (Open API)

Calculate travel time and distance between two points using Google Maps.

```bash
curl -X POST "{{BASE_URL}}/api/orchestrator/eta" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": { "lat": 12.9716, "lng": 77.5946 },
    "destination": { "lat": 12.9352, "lng": 77.6245 },
    "mode": "driving",
    "departureTime": "now",
    "includePolyline": false
  }'
```

Response includes distance, duration (with traffic), origin/destination names, and optional polyline.

### Notification Orchestrator — Places Autocomplete (Open API)

Get place suggestions with lat/lng coordinates from text input.

```bash
curl -X POST "{{BASE_URL}}/api/orchestrator/places/autocomplete" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "St Johns Bengaluru",
    "sessionToken": "optional-session-token",
    "country": "IN"
  }'
```

Response includes up to 5 predictions with placeId, description, name, address, and location coordinates.

### Notification Orchestrator — Place Reviews & Ratings (Open API)

Get reviews and ratings for a place using address and coordinates.

```bash
curl -X POST "{{BASE_URL}}/api/orchestrator/place-reviews" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {
      "lat": 11.672718,
      "lng": 78.1339232
    },
    "description": "Meyyanur Main Road, Salem, Tamil Nadu, India",
    "fullAddress": "Meyyanur Main Road, Salem, Tamil Nadu 636004, India",
    "street": "Meyyanur Main Road",
    "city": "Salem",
    "state": "Tamil Nadu",
    "pincode": "636004"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "placeId": "ChIJn24QsUbwqzsRkiQk-72yFXk",
    "name": "Meyyanur Main Road",
    "formattedAddress": "Meyyanur Main Road, Salem, Tamil Nadu 636004, India",
    "rating": 4.2,
    "userRatingsTotal": 156
  }
}
```

**Required Fields:**
- `origin`: Object with `lat` and `lng` coordinates
- `description`: Address description string (from autocomplete response)

**Optional Fields:**
- `fullAddress`: Complete formatted address string
- `street`: Street address
- `city`: City name
- `state`: State/province
- `pincode`: Postal code

### Notification Orchestrator — User Documents by Appointment (Open API)

Get all documents for a user grouped by appointment ID.

```bash
curl -X GET "{{BASE_URL}}/api/user/documents/P0001"
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "User documents retrieved successfully",
  "data": {
    "userId": "P0001",
    "appointments": [
      {
        "appId": "84528",
        "date": "2024-01-15T00:00:00.000Z",
        "hospital": "City General Hospital",
        "doctorId": "D0001",
        "doctorName": "Dr. John Smith",
        "reports": [
          {
            "documentId": 1,
            "documentUrl": "https://storage.googleapis.com/bucket/appointments/84528/documents/doc-1234567890-123456789.pdf",
            "fileName": "lab_report.pdf"
          },
          {
            "documentId": 2,
            "documentUrl": "https://storage.googleapis.com/bucket/appointments/84528/documents/doc-1234567891-123456790.png",
            "fileName": "xray_image.png"
          }
        ]
      },
      {
        "appId": "84529",
        "date": "2024-01-10T00:00:00.000Z",
        "hospital": "City General Hospital",
        "doctorId": "D0002",
        "doctorName": "Dr. Jane Doe",
        "reports": [
          {
            "documentId": 1,
            "documentUrl": "https://storage.googleapis.com/bucket/appointments/84529/documents/doc-1234567892-123456791.jpg",
            "fileName": "prescription.jpg"
          }
        ]
      }
    ],
    "totalAppointments": 2,
    "totalDocuments": 3
  }
}
```

**Response Fields:**
- `userId`: User ID
- `appointments`: Array of appointments with documents
  - `appId`: Appointment ID
  - `date`: Appointment date
  - `hospital`: Hospital name
  - `doctorId`: Doctor ID
  - `doctorName`: Doctor name
  - `reports`: Array of documents for this appointment
    - `documentId`: Document sequence number
    - `documentUrl`: Full URL to the document
    - `fileName`: Original file name
- `totalAppointments`: Total number of appointments with documents
- `totalDocuments`: Total number of documents across all appointments

## Overview
This document provides complete `curl` commands for testing the entire admin portal system. The implementation includes:

1. **Account Management** - Admin signup, login, onboarding, and profile management
2. **Hospital Management** - Hospital creation, updates, and document management
3. **Doctor Management** - Complete CRUD operations with image uploads
4. **QR Code System** - QR generation and check-in/check-out functionality

6. **Dashboard** - Real-time statistics, date-specific tokens, and patient check-ins

## 🔐 **AUTHENTICATION & ACCOUNT MANAGEMENT**

### 1. Admin Signup (Auto JWT)
```bash
curl -X POST http://localhost:3000/api/admin/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "securePassword123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "admin": {
      "adminId": "A0001",
      "email": "admin@hospital.com",
      "username": "admin@hospital.com",
      "verificationStatus": "Pending",
      "isActive": true,
      "onboardingProgress": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Admin Login
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "securePassword123"
  }'
```

### 3. Complete Onboarding (Single API)
```bash
curl -X PUT http://localhost:3000/api/admin/onboarding \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "adminId": "A0001",
    "ownerName": "Dr. John Doe",
    "ownerMobile": "9876543210",
    "ownerProof": "Aadhar",
    "ownerProofNumber": "123456789012",
    "hospitalName": "City General Hospital",
    "hospitalType": "Multi-Specialty",
    "registrationNumber": "HOSP123456",
    "yearEstablished": 2010,
    "address": "123 Medical Center Drive",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "location": {
      "coordinates": [72.8777, 19.0760]
    },
    "googleMapLink": "https://maps.google.com/?q=123+Medical+Center+Drive",
    "addressName": "City General Hospital Main Building",
    "origin": {
      "lat": 19.0760,
      "lng": 72.8777
    },
    "fullAddress": "123 Medical Center Drive, Mumbai, Maharashtra 400001, India",
    "rating": 4.5,
    "userRatingsTotal": 234,
    "phoneNumber": "022-12345678",
    "alternativePhone": "022-12345679",
    "emailAddress": "info@citygeneral.com",
    "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "startTime": "09:00",
    "endTime": "18:00",
    "openAlways": false,
    "maxTokenPerDay": 100,
    "unlimitedToken": false,
    "about": "City General Hospital is a leading multi-specialty healthcare facility committed to providing comprehensive medical care with state-of-the-art technology and experienced medical professionals. We offer 24/7 emergency services and specialize in cardiology, neurology, orthopedics, and general medicine.",
    "services": "Emergency Care, Cardiology, Neurology, Orthopedics, General Medicine, Pediatrics, Gynecology, Dermatology, Ophthalmology, ENT, Laboratory Services, Radiology, Pharmacy"
  }'
```

### 4. Get Admin Details
```bash
curl -X GET http://localhost:3000/api/admin/A0001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 5. Update Owner Information
```bash
curl -X PUT http://localhost:3000/api/admin/owner-info \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "adminId": "A0001",
    "name": "Dr. Jane Smith",
    "mobile": "9876543211",
    "proof": "PAN",
    "proofNumber": "ABCDE1234F"
  }'
```

### 6. Update Hospital Information
```bash
curl -X PUT http://localhost:3000/api/admin/hospital/complete-info \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "adminId": "A0001",
    "hospitalId": "H0001",
    "name": "City General Medical Center",
    "hospitalType": "Hospital",
    "registrationNumber": "HOSP123458",
    "yearEstablished": 2015,
    "address": "456 Healthcare Avenue",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400002",
    "location": {
      "coordinates": [72.8777, 19.0760]
    },
    "googleMapLink": "https://maps.google.com/?q=456+Healthcare+Avenue",
    "phoneNumber": "022-98765432",
    "alternativePhone": "022-98765433",
    "emailAddress": "contact@citygeneral.com",
    "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "startTime": "08:00",
    "endTime": "20:00",
    "openAlways": false,
    "maxTokenPerDay": 150,
    "unlimitedToken": false,
    "about": "City General Medical Center is a modern healthcare facility dedicated to providing exceptional medical care with cutting-edge technology and compassionate service. Our team of highly qualified doctors and medical staff work together to ensure the best possible outcomes for our patients.",
    "services": "Emergency Care, Cardiology, Neurology, Orthopedics, General Medicine, Pediatrics, Gynecology, Dermatology, Ophthalmology, ENT, Laboratory Services, Radiology, Pharmacy, Physical Therapy, Mental Health Services"
  }'
```

### 7. Delete Admin and All Associated Data
```bash
curl -X DELETE http://localhost:3000/api/admin/A0001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## 📁 **DOCUMENT MANAGEMENT**

### 8. Upload Hospital Documents

#### 8.1 Registration Certificate
```bash
curl -X PUT http://localhost:3000/api/admin/hospital-documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "adminId=A0001" \
  -F "documentType=registrationCertificate" \
  -F "file=@/path/to/registration_certificate.pdf"
```

#### 8.2 Hospital Logo
```bash
curl -X PUT http://localhost:3000/api/admin/hospital-documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "adminId=A0001" \
  -F "documentType=logo" \
  -F "file=@/path/to/hospital_logo.png"
```

#### 8.3 Hospital Images
```bash
curl -X PUT http://localhost:3000/api/admin/hospital-documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "adminId=A0001" \
  -F "documentType=hospitalImages" \
  -F "file=@/path/to/hospital_image1.jpg"
```

#### 8.4 Accreditation (Optional)
```bash
curl -X PUT http://localhost:3000/api/admin/hospital-documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "adminId=A0001" \
  -F "documentType=accreditation" \
  -F "file=@/path/to/accreditation_certificate.pdf"
```

### 9. Upload Owner Documents

#### 9.1 Aadhar Card
```bash
curl -X PUT http://localhost:3000/api/admin/owner-documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "adminId=A0001" \
  -F "documentType=aadharCard" \
  -F "file=@/path/to/aadhar_card.jpg"
```

#### 9.2 PAN Card
```bash
curl -X PUT http://localhost:3000/api/admin/owner-documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "adminId=A0001" \
  -F "documentType=panCard" \
  -F "file=@/path/to/pan_card.jpg"
```

## 🔗 **URL UPDATE ENDPOINTS (Frontend File Upload)**

### 10. Update Hospital Logo URL
```bash
curl -X PUT http://localhost:3000/api/admin/hospital-logo-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "adminId": "A0001",
    "fileUrl": "https://storage.googleapis.com/your-bucket/hospitals/H0001/logo-1234567890-123456789.png",
    "fileName": "hospital_logo.png"
  }'
```

### 11. Update Hospital Images URL
```bash
curl -X PUT http://localhost:3000/api/admin/hospital-images-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "adminId": "A0001",
    "fileUrl": "https://storage.googleapis.com/your-bucket/hospitals/H0001/hospitalImages-1234567890-123456789.jpg",
    "fileName": "hospital_image1.jpg"
  }'
```

### 12. Update Hospital Documents URL
```bash
curl -X PUT http://localhost:3000/api/admin/hospital-documents-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "adminId": "A0001",
    "documentType": "registrationCertificate",
    "fileUrl": "https://storage.googleapis.com/your-bucket/hospitals/H0001/registrationCertificate-1234567890-123456789.pdf",
    "fileName": "registration_certificate.pdf"
  }'
```

**Supported document types:**
- `registrationCertificate`
- `accreditation`

### 13. Update Owner Documents URL
```bash
curl -X PUT http://localhost:3000/api/admin/owner-documents-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "adminId": "A0001",
    "documentType": "aadharCard",
    "fileUrl": "https://storage.googleapis.com/your-bucket/owners/A0001/aadharCard-1234567890-123456789.jpg",
    "fileName": "aadhar_card.jpg"
  }'
```

**Supported document types:**
- `aadharCard`
- `panCard`

## 👨‍⚕️ **DOCTOR MANAGEMENT**

### **Doctor Permissions System**

The doctor management system includes a comprehensive permissions system that allows admins to control what each doctor can access and do within the system. Each permission has two flags:

- **`enabled`**: Whether the doctor has access to this feature
- **`viewOnly`**: Whether the doctor can only view (read-only) or can also modify (read-write)

#### **Available Permissions:**

| Permission | Description | Use Case |
|------------|-------------|----------|
| `profile` | Access to doctor profile information | View/edit own profile |
| `tokenIssued` | View/manage issued tokens | Track patient tokens |
| `checkedIn` | View/manage patient check-ins | Monitor patient arrivals |
| `userLogs` | Access to user activity logs | Audit patient activities |
| `documentsView` | View patient documents | Access medical records |
| `doctorsList` | View list of doctors | See other doctors in hospital |
| `addDoctor` | Add new doctors | Create doctor accounts |
| `editDoctor` | Edit doctor information | Modify doctor details |
| `deleteDoctor` | Delete doctors | Remove doctor accounts |
| `todayLogs` | View today's activity logs | Daily operations monitoring |
| `scanQr` | Scan QR codes for check-in/out | Patient check-in operations |
| `uploadDocs` | Upload patient documents | Add medical documents |

#### **Permission Examples:**

```json
// Full access doctor (admin-level)
{
  "permissions": {
    "profile": { "enabled": true, "viewOnly": false },
    "tokenIssued": { "enabled": true, "viewOnly": false },
    "checkedIn": { "enabled": true, "viewOnly": false },
    "userLogs": { "enabled": true, "viewOnly": false },
    "documentsView": { "enabled": true, "viewOnly": false },
    "doctorsList": { "enabled": true, "viewOnly": false },
    "addDoctor": { "enabled": true, "viewOnly": false },
    "editDoctor": { "enabled": true, "viewOnly": false },
    "deleteDoctor": { "enabled": true, "viewOnly": false },
    "todayLogs": { "enabled": true, "viewOnly": false },
    "scanQr": { "enabled": true, "viewOnly": false },
    "uploadDocs": { "enabled": true, "viewOnly": false }
  }
}

// Read-only doctor (limited access)
{
  "permissions": {
    "profile": { "enabled": true, "viewOnly": true },
    "tokenIssued": { "enabled": true, "viewOnly": true },
    "checkedIn": { "enabled": true, "viewOnly": true },
    "userLogs": { "enabled": false, "viewOnly": false },
    "documentsView": { "enabled": true, "viewOnly": true },
    "doctorsList": { "enabled": true, "viewOnly": true },
    "addDoctor": { "enabled": false, "viewOnly": false },
    "editDoctor": { "enabled": false, "viewOnly": false },
    "deleteDoctor": { "enabled": false, "viewOnly": false },
    "todayLogs": { "enabled": true, "viewOnly": true },
    "scanQr": { "enabled": true, "viewOnly": false },
    "uploadDocs": { "enabled": false, "viewOnly": false }
  }
}

// Basic doctor (minimal access)
{
  "permissions": {
    "profile": { "enabled": true, "viewOnly": false },
    "tokenIssued": { "enabled": false, "viewOnly": false },
    "checkedIn": { "enabled": false, "viewOnly": false },
    "userLogs": { "enabled": false, "viewOnly": false },
    "documentsView": { "enabled": true, "viewOnly": false },
    "doctorsList": { "enabled": false, "viewOnly": false },
    "addDoctor": { "enabled": false, "viewOnly": false },
    "editDoctor": { "enabled": false, "viewOnly": false },
    "deleteDoctor": { "enabled": false, "viewOnly": false },
    "todayLogs": { "enabled": false, "viewOnly": false },
    "scanQr": { "enabled": true, "viewOnly": false },
    "uploadDocs": { "enabled": true, "viewOnly": false }
  }
}
```

### 10. Create Doctor (Requires Approved Admin) - Enhanced Specialization Support

**NEW: Support for Multiple Departments (Comma-separated)**
- Valid departments: General Medicine, General Checkup, Pediatrics, Gynecology, Cardiology, Dermatology, Dental, Diabetology, Eye Care, Orthopedics, Gastroenterology, Pulmonology, Neurology, Urology, Physiotherapy, Emergency Care
- Input: Single department (e.g., "Cardiology") or multiple departments (e.g., "Cardiology,General Medicine,Emergency Care")
- Invalid departments are automatically filtered out
- Empty specialization defaults to "General Medicine"
```bash
curl -X POST http://localhost:3000/api/doctor/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "x-user-id: A0001" \
  -d '{
    "adminId": "A0001",
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@hospital.com",
    "mobileNumber": "9876543210",
    "gender": "Female",
    "dateOfBirth": "1985-06-15",
    "specialization": "Cardiology,General Medicine,Emergency Care",
    "qualification": ["MBBS", "MD Cardiology", "Fellowship in Interventional Cardiology"],
    "serviceStartDate": "2015-03-01",
    "isHeadOfDepartment": false,
    "hospitalId": "6155",
    "consultantFee": 1500,
    "status": "Available",
    "unlimitedToken": false,
    "workingHours": [
      {
        "day": "Monday",
        "date": "2024-01-22",
        "available": "morning",
        "timeSlots": [
          {
            "startTime": "09:00",
            "endTime": "12:00"
          }
        ]
      },
      {
        "day": "Tuesday",
        "date": "2024-01-23",
        "available": "afternoon",
        "timeSlots": [
          {
            "startTime": "14:00",
            "endTime": "17:00"
          }
        ]
      }
    ],
    "maxAppointment": "20",
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
  }'
```

#### **Example 1: Single Department (Backward Compatible)**
```bash
curl -X POST http://localhost:3000/api/doctor/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "x-user-id: A0001" \
  -d '{
    "adminId": "A0001",
    "name": "Dr. John Smith",
    "email": "john.smith@hospital.com",
    "mobileNumber": "9876543210",
    "gender": "Male",
    "specialization": "Cardiology",
    "hospitalId": "H0001",
    "consultantFee": 1000
  }'
```

#### **Example 2: Multiple Departments (New Feature)**
```bash
curl -X POST http://localhost:3000/api/doctor/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "x-user-id: A0001" \
  -d '{
    "adminId": "A0001",
    "name": "Dr. Jane Doe",
    "email": "jane.doe@hospital.com",
    "mobileNumber": "9876543211",
    "gender": "Female",
    "specialization": "Pediatrics,General Medicine,Emergency Care",
    "hospitalId": "H0001",
    "consultantFee": 1200
  }'
```

#### **Example 3: Invalid Departments (Auto-filtered)**
```bash
curl -X POST http://localhost:3000/api/doctor/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "x-user-id: A0001" \
  -d '{
    "adminId": "A0001",
    "name": "Dr. Mike Wilson",
    "email": "mike.wilson@hospital.com",
    "mobileNumber": "9876543212",
    "gender": "Male",
    "specialization": "Cardiology,InvalidDept,General Medicine",
    "hospitalId": "H0001",
    "consultantFee": 1100
  }'
```
**Result:** Invalid department "InvalidDept" is filtered out, stored as "Cardiology,General Medicine"

#### **Example 4: Empty Specialization (Auto-default)**
```bash
curl -X POST http://localhost:3000/api/doctor/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "x-user-id: A0001" \
  -d '{
    "adminId": "A0001",
    "name": "Dr. Lisa Brown",
    "email": "lisa.brown@hospital.com",
    "mobileNumber": "9876543213",
    "gender": "Female",
    "specialization": "",
    "hospitalId": "H0001",
    "consultantFee": 900
  }'
```
**Result:** Empty specialization defaults to "General Medicine"

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor created successfully",
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
    "doctorId": "D0001",
    "experience": 8
  }
}
```

### 11. Upload Doctor Profile Image (Requires Approved Admin)
```bash
curl -X PUT http://localhost:3000/api/doctor/upload-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "x-user-id: A0001" \
  -F "adminId=A0001" \
  -F "doctorId=D0001" \
  -F "file=@/path/to/doctor_photo.jpg"
```

### 12. Get Doctor by ID
```bash
curl -X POST http://localhost:3000/api/doctor/get \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "doctorId": "D0001"
  }'
```

### 13. Update Doctor Information - Enhanced Specialization Support

**NEW: Enhanced Specialization Updates with Hospital Department Sync**
- Supports updating to single or multiple departments
- Invalid departments are automatically filtered out
- Empty specialization defaults to "General Medicine"
- **Hospital departments are automatically synced** when specialization changes
- **Empty departments are automatically cleaned up**
```bash
curl -X PUT http://localhost:3000/api/doctor/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "doctorId": "D0001",
    "name": "Dr. Sarah Johnson-Smith",
    "consultantFee": 1800,
    "status": "Available",
    "unlimitedToken": true,
    "qualification": ["MBBS", "MD Cardiology", "Fellowship in Interventional Cardiology", "PhD Cardiovascular Sciences"],
    "permissions": {
      "profile": { "enabled": true, "viewOnly": false },
      "tokenIssued": { "enabled": true, "viewOnly": false },
      "checkedIn": { "enabled": true, "viewOnly": false },
      "userLogs": { "enabled": true, "viewOnly": true },
      "documentsView": { "enabled": true, "viewOnly": false },
      "doctorsList": { "enabled": true, "viewOnly": true },
      "addDoctor": { "enabled": true, "viewOnly": false },
      "editDoctor": { "enabled": true, "viewOnly": false },
      "deleteDoctor": { "enabled": false, "viewOnly": false },
      "todayLogs": { "enabled": true, "viewOnly": true },
      "scanQr": { "enabled": true, "viewOnly": false },
      "uploadDocs": { "enabled": true, "viewOnly": false }
    }
  }'
```

#### **Example 1: Update to Multiple Departments**
```bash
curl -X PUT http://localhost:3000/api/doctor/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "doctorId": "D0001",
    "specialization": "Cardiology,General Medicine,Emergency Care",
    "consultantFee": 1500
  }'
```

#### **Example 2: Update with Invalid Departments (Auto-filtered)**
```bash
curl -X PUT http://localhost:3000/api/doctor/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "doctorId": "D0001",
    "specialization": "Cardiology,InvalidDept,General Medicine",
    "consultantFee": 1400
  }'
```
**Result:** Invalid department "InvalidDept" is filtered out, stored as "Cardiology,General Medicine"

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor updated successfully",
  "data": {
    "doctor": {
      "doctorId": "D0001",
      "name": "Dr. Sarah Johnson-Smith",
      "email": "sarah.johnson@hospital.com",
      "mobileNumber": "9876543210",
      "gender": "Female",
      "specialization": "Cardiology,General Medicine,Emergency Care",
      "hospitalId": "6155",
      "consultantFee": 1800,
      "status": "Available",
      "unlimitedToken": true,
      "permissions": {
        "profile": { "enabled": true, "viewOnly": false },
        "tokenIssued": { "enabled": true, "viewOnly": false },
        "checkedIn": { "enabled": true, "viewOnly": false },
        "userLogs": { "enabled": true, "viewOnly": true },
        "documentsView": { "enabled": true, "viewOnly": false },
        "doctorsList": { "enabled": true, "viewOnly": true },
        "addDoctor": { "enabled": true, "viewOnly": false },
        "editDoctor": { "enabled": true, "viewOnly": false },
        "deleteDoctor": { "enabled": false, "viewOnly": false },
        "todayLogs": { "enabled": true, "viewOnly": true },
        "scanQr": { "enabled": true, "viewOnly": false },
        "uploadDocs": { "enabled": true, "viewOnly": false }
      }
    }
  }
}
```

### 13.1. Update Only Doctor Permissions
```bash
curl -X PUT http://localhost:3000/api/doctor/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "doctorId": "D0001",
    "permissions": {
      "addDoctor": { "enabled": true, "viewOnly": false },
      "editDoctor": { "enabled": true, "viewOnly": false },
      "deleteDoctor": { "enabled": true, "viewOnly": false }
    }
  }'
```

### 13.2. Disable Doctor Permissions
```bash
curl -X PUT http://localhost:3000/api/doctor/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "doctorId": "D0001",
    "permissions": {
      "scanQr": { "enabled": false, "viewOnly": false },
      "uploadDocs": { "enabled": false, "viewOnly": false }
    }
  }'
```

### 13.3. Permission Validation Examples

#### **Valid Permission Request:**
```bash
curl -X POST http://localhost:3000/api/doctor/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "x-user-id: A0001" \
  -d '{
    "adminId": "A0001",
    "name": "Dr. John Smith",
    "email": "john.smith@hospital.com",
    "mobileNumber": "9876543210",
    "gender": "Male",
    "specialization": "General Medicine",
    "hospitalId": "H0001",
    "consultantFee": 1000,
    "permissions": {
      "profile": { "enabled": true, "viewOnly": false },
      "scanQr": { "enabled": true, "viewOnly": false }
    }
  }'
```

#### **Invalid Permission Request (Invalid Permission Key):**
```bash
curl -X POST http://localhost:3000/api/doctor/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "x-user-id: A0001" \
  -d '{
    "adminId": "A0001",
    "name": "Dr. John Smith",
    "email": "john.smith@hospital.com",
    "mobileNumber": "9876543210",
    "gender": "Male",
    "specialization": "General Medicine",
    "hospitalId": "H0001",
    "consultantFee": 1000,
    "permissions": {
      "invalidPermission": { "enabled": true, "viewOnly": false }
    }
  }'
```

**Expected Error Response:**
```json
{
  "success": false,
  "message": "Invalid permission: invalidPermission. Valid permissions are: profile, tokenIssued, checkedIn, userLogs, documentsView, doctorsList, addDoctor, editDoctor, deleteDoctor, todayLogs, scanQr, uploadDocs",
  "error": "ValidationError",
  "statusCode": 400
}
```

#### **Invalid Permission Request (Invalid Data Type):**
```bash
curl -X POST http://localhost:3000/api/doctor/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "x-user-id: A0001" \
  -d '{
    "adminId": "A0001",
    "name": "Dr. John Smith",
    "email": "john.smith@hospital.com",
    "mobileNumber": "9876543210",
    "gender": "Male",
    "specialization": "General Medicine",
    "hospitalId": "H0001",
    "consultantFee": 1000,
    "permissions": {
      "profile": { "enabled": "true", "viewOnly": false }
    }
  }'
```

**Expected Error Response:**
```json
{
  "success": false,
  "message": "Permission profile.enabled must be a boolean value",
  "error": "ValidationError",
  "statusCode": 400
}
```

#### **Invalid Permission Request (Missing Required Properties):**
```bash
curl -X POST http://localhost:3000/api/doctor/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "x-user-id: A0001" \
  -d '{
    "adminId": "A0001",
    "name": "Dr. John Smith",
    "email": "john.smith@hospital.com",
    "mobileNumber": "9876543210",
    "gender": "Male",
    "specialization": "General Medicine",
    "hospitalId": "H0001",
    "consultantFee": 1000,
    "permissions": {
      "profile": "invalid"
    }
  }'
```

**Expected Error Response:**
```json
{
  "success": false,
  "message": "Permission profile must be an object with enabled and viewOnly properties",
  "error": "ValidationError",
  "statusCode": 400
}
```

### 14. Get All Doctors by Hospital
```bash
curl -X GET http://localhost:3000/api/doctor/all/6155 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 15. Delete Doctor (Requires Approved Admin)
```bash
curl -X DELETE http://localhost:3000/api/doctor/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "x-user-id: A0001" \
  -d '{
    "adminId": "A0001",
    "doctorId": "D0001"
  }'
```

### 16. Update Doctor Profile Image URL (Frontend File Upload)
```bash
curl -X PUT http://localhost:3000/api/doctor/update-image-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "adminId": "A0001",
    "doctorId": "D0001",
    "fileUrl": "https://storage.googleapis.com/your-bucket/hospitals/H0001/doctors/D0001-1705315200000-123456789.jpg",
    "fileName": "doctor_photo.jpg"
  }'
```

### 17. Delete Doctor with Hospital Department Cleanup

**NEW: Automatic Hospital Department Cleanup**
- Removes doctor from all hospital departments
- Automatically cleans up empty departments
- Maintains data consistency across the system

```bash
curl -X DELETE http://localhost:3000/api/doctor/delete/D0001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor deleted successfully",
  "data": {
    "doctorId": "D0001",
    "name": "Dr. Sarah Johnson",
    "specialization": "Cardiology,General Medicine,Emergency Care"
  }
}
```

**Hospital Department Changes:**
- Doctor removed from all departments
- Empty departments automatically deleted
- Department doctor counts updated

### 18. Get Available Time Slots for Doctor
```bash
curl -X POST http://localhost:3000/api/doctor/available-time-slots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "doctorId": "D0001",
    "date": "2024-01-22"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Available time slots retrieved successfully",
  "data": {
    "doctorId": "D0001",
    "doctorName": "Dr. Sarah Johnson",
    "date": "2024-01-22",
    "day": "Monday",
    "maxAppointment": "20",
    "unlimitedToken": false,
    "availableTimeSlots": [
      {
        "startTime": "09:00",
        "endTime": "11:00",
        "duration": 120,
        "maxTokens": 20,
        "bookedAppointments": 5,
        "remainingSlots": 15,
        "isAvailable": true
      },
      {
        "startTime": "11:00",
        "endTime": "13:00",
        "duration": 120,
        "maxTokens": 20,
        "bookedAppointments": 20,
        "remainingSlots": 0,
        "isAvailable": false
      },
      {
        "startTime": "13:00",
        "endTime": "15:00",
        "duration": 120,
        "maxTokens": 20,
        "bookedAppointments": 8,
        "remainingSlots": 12,
        "isAvailable": true
      },
      {
        "startTime": "15:00",
        "endTime": "17:00",
        "duration": 120,
        "maxTokens": 20,
        "bookedAppointments": 3,
        "remainingSlots": 17,
        "isAvailable": true
      },
      {
        "startTime": "17:00",
        "endTime": "17:30",
        "duration": 30,
        "maxTokens": 5,
        "bookedAppointments": 2,
        "remainingSlots": 3,
        "isAvailable": true
      }
    ]
  }
}
```

**Alternative Date Formats:**
```bash
# Using MM/DD/YYYY format
curl -X POST http://localhost:3000/api/doctor/available-time-slots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "doctorId": "D0001",
    "date": "01/22/2024"
  }'
```

## 📱 **QR CODE SYSTEM**

### 16. Generate QR Code
```bash
curl -X POST http://localhost:3000/api/qrgenerator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "appointmentId": "APT001",
    "userId": "U0001",
    "hospitalId": "H0001"
  }'
```

## 📄 **APPOINTMENT DOCUMENT MANAGEMENT**

### 20. Upload Appointment Documents (Multiple Files)
```bash
curl -X POST http://localhost:3000/api/appoitment/APT001/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "documents=@/path/to/lab_report.pdf" \
  -F "documents=@/path/to/xray_image.png" \
  -F "documents=@/path/to/prescription.jpg"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully uploaded 3 document(s).",
  "data": {
    "appointmentId": "APT001",
    "uploadedDocuments": [
      {
        "fileName": "lab_report.pdf",
        "mimeType": "application/pdf",
        "size": 1024000,
        "fileUrl": "https://storage.googleapis.com/your-bucket/appointments/APT001/documents/doc-1234567890-123456789.pdf",
        "filePath": "appointments/APT001/documents/doc-1234567890-123456789.pdf",
        "uploadedAt": "2025-01-15T10:30:00.000Z"
      },
      {
        "fileName": "xray_image.png",
        "mimeType": "image/png",
        "size": 512000,
        "fileUrl": "https://storage.googleapis.com/your-bucket/appointments/APT001/documents/doc-1234567891-123456790.png",
        "filePath": "appointments/APT001/documents/doc-1234567891-123456790.png",
        "uploadedAt": "2025-01-15T10:30:01.000Z"
      },
      {
        "fileName": "prescription.jpg",
        "mimeType": "image/jpeg",
        "size": 256000,
        "fileUrl": "https://storage.googleapis.com/your-bucket/appointments/APT001/documents/doc-1234567892-123456791.jpg",
        "filePath": "appointments/APT001/documents/doc-1234567892-123456791.jpg",
        "uploadedAt": "2025-01-15T10:30:02.000Z"
      }
    ],
    "totalDocuments": 3,
    "errors": []
  },
  "timestamp": "2025-01-15T10:30:03.000Z"
}
```

### 21. Get Appointment Documents
```bash
curl -X GET http://localhost:3000/api/appoitment/APT001/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Appointment documents retrieved successfully.",
  "data": {
    "appointmentId": "APT001",
    "documents": [
      {
        "documentId": 1,
        "documentUrl": "https://storage.googleapis.com/your-bucket/appointments/APT001/documents/doc-1234567890-123456789.pdf",
        "fileName": "doc-1234567890-123456789.pdf"
      },
      {
        "documentId": 2,
        "documentUrl": "https://storage.googleapis.com/your-bucket/appointments/APT001/documents/doc-1234567891-123456790.png",
        "fileName": "doc-1234567891-123456790.png"
      },
      {
        "documentId": 3,
        "documentUrl": "https://storage.googleapis.com/your-bucket/appointments/APT001/documents/doc-1234567892-123456791.jpg",
        "fileName": "doc-1234567892-123456791.jpg"
      }
    ],
    "totalDocuments": 3
  },
  "timestamp": "2025-01-15T10:35:00.000Z"
}
```

### 22. Delete Appointment Document
```bash
curl -X DELETE http://localhost:3000/api/appoitment/APT001/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "documentUrl": "https://storage.googleapis.com/your-bucket/appointments/APT001/documents/doc-1234567890-123456789.pdf"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully.",
  "data": {
    "appointmentId": "APT001",
    "deletedDocumentUrl": "https://storage.googleapis.com/your-bucket/appointments/APT001/documents/doc-1234567890-123456789.pdf",
    "remainingDocuments": 2
  },
  "timestamp": "2025-01-15T10:40:00.000Z"
}
```

### 17. QR Code Scan (Check-in/Check-out)
```bash
curl -X GET "http://localhost:3000/api/qr/scan?userId=U0001&appointmentId=APT001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response - Check-in:**
```json
{
  "message": "Patient John Doe checked in successfully at 10:30:45 AM",
  "user": {
    "userId": "U0001",
    "name": "John Doe",
    "email": "john.doe@email.com"
  },
  "appointmentDetails": {
    "appointmentId": "APT001",
    "appointmentDate": "2024-01-15T00:00:00.000Z",
    "appointmentTime": "11:00",
    "doctorName": "Dr. Sarah Johnson",
    "hospitalName": "City General Hospital",
    "checkInTime": "2024-01-15T10:30:45.123Z",
    "checkOutTime": null,
    "isCheckedIn": true,
    "checkInStatus": "Checked-in",
    "lastScannedDate": "2024-01-15T00:00:00.000Z"
  },
  "scanInfo": {
    "scannedAt": "2024-01-15T10:30:45.123Z",
    "scannedBy": "A0001",
    "action": "Check-in"
  }
}
```

**Expected Response - Check-out:**
```json
{
  "message": "Patient John Doe checked out successfully at 12:45:30 PM",
  "user": {
    "userId": "U0001",
    "name": "John Doe",
    "email": "john.doe@email.com"
  },
  "appointmentDetails": {
    "appointmentId": "APT001",
    "appointmentDate": "2024-01-15T00:00:00.000Z",
    "appointmentTime": "11:00",
    "doctorName": "Dr. Sarah Johnson",
    "hospitalName": "City General Hospital",
    "checkInTime": "2024-01-15T10:30:45.123Z",
    "checkOutTime": "2024-01-15T12:45:30.456Z",
    "isCheckedIn": false,
    "checkInStatus": "Checked-out",
    "lastScannedDate": "2024-01-15T00:00:00.000Z"
  },
  "scanInfo": {
    "scannedAt": "2024-01-15T12:45:30.456Z",
    "scannedBy": "A0001",
    "action": "Check-out"
  }
}
```



## 📊 **DASHBOARD**

### 18. Get Admin Dashboard Data
```bash
curl -X POST http://localhost:3000/api/admin/dashboard \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "adminId": "A0001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "admin": {
      "adminId": "A0001",
      "email": "admin@hospital.com",
      "username": "admin@hospital.com",
      "ownerInfo": {
        "name": "Dr. John Doe",
        "mobile": "9876543210",
        "proof": "Aadhar",
        "proofNumber": "123456789012"
      },
      "ownerDocuments": {
        "aadharCard": {
          "fileName": "aadhar_card.jpg",
          "fileUrl": "https://storage.googleapis.com/your-bucket/owners/A0001/aadharCard-1234567890-123456789.jpg",
          "uploadedAt": "2024-01-15T10:30:00.000Z"
        }
      },
      "verificationStatus": "Pending",
      "isActive": true,
      "onboardingProgress": 100
    },
    "hospital": {
      "hospitalId": "H0001",
      "name": "City General Hospital",
      "hospitalType": "Multi-Specialty",
      "registrationNumber": "HOSP123456",
      "yearEstablished": 2010,
      "address": {
        "street": "123 Medical Center Drive",
        "city": "Mumbai",
        "state": "Maharashtra",
        "zipCode": "400001",
        "country": "India"
      },
      "contact": {
        "phoneNumber": "022-12345678",
        "alternativePhone": "022-12345679",
        "emailAddress": "info@citygeneral.com"
      },
      "operation": {
        "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "startTime": "09:00",
        "endTime": "18:00",
        "openAlways": false,
        "maxTokenPerDay": 100,
        "unlimitedToken": false
      },
      "documents": {
        "registrationCertificate": {
          "fileName": "registration_certificate.pdf",
          "fileUrl": "https://storage.googleapis.com/your-bucket/hospitals/H0001/registrationCertificate-1234567890-123456789.pdf",
          "uploadedAt": "2024-01-15T10:30:00.000Z"
        },
        "logo": {
          "fileName": "hospital_logo.png",
          "fileUrl": "https://storage.googleapis.com/your-bucket/hospitals/H0001/logo-1234567890-123456789.png",
          "uploadedAt": "2024-01-15T10:30:00.000Z"
        }
      },
      "about": "City General Hospital is a leading multi-specialty healthcare facility committed to providing comprehensive medical care with state-of-the-art technology and experienced medical professionals. We offer 24/7 emergency services and specialize in cardiology, neurology, orthopedics, and general medicine.",
      "services": "Emergency Care, Cardiology, Neurology, Orthopedics, General Medicine, Pediatrics, Gynecology, Dermatology, Ophthalmology, ENT, Laboratory Services, Radiology, Pharmacy"
    },
    "statistics": {
      "totalDoctors": 5,
      "totalAppointments": 25,
      "totalPatients": 20,
      "todayAppointments": 8,
      "pendingVerifications": 0
    },
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

### 19. Get Date-Specific Statistics (Tokens and Patient Check-ins)
```bash
curl -X POST http://localhost:3000/api/admin/today-stats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "adminId": "A0001",
    "date": "2024-01-27"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "summary": {
      "totalTokensIssued": 25,
      "totalPatientsCheckedIn": 18,
      "date": "2024-01-27"
    },
    "patients": [
      {
        "patientId": "P0001",
        "name": "John Doe",
        "email": "john.doe@email.com",
        "phoneNumber": "+919876543210",
        "appointmentId": "12345",
        "checkInStatus": "Checked-in",
        "checkInTime": "2024-01-27T10:30:00.000Z",
        "checkOutTime": null,
        "appointmentDate": "2024-01-27T00:00:00.000Z",
        "appointmentTime": "10:30"
      },
      {
        "patientId": "P0002",
        "name": "Jane Smith",
        "email": "jane.smith@email.com",
        "phoneNumber": "+919876543211",
        "appointmentId": "12346",
        "checkInStatus": "Checked-out",
        "checkInTime": "2024-01-27T09:15:00.000Z",
        "checkOutTime": "2024-01-27T11:45:00.000Z",
        "appointmentDate": "2024-01-27T00:00:00.000Z",
        "appointmentTime": "09:30"
      },
      {
        "patientId": "P0003",
        "name": "Mike Johnson",
        "email": "mike.johnson@email.com",
        "phoneNumber": "+919876543212",
        "appointmentId": "12347",
        "checkInStatus": "Not Checked-in",
        "checkInTime": null,
        "checkOutTime": null,
        "appointmentDate": "2024-01-27T00:00:00.000Z",
        "appointmentTime": "14:00"
      }
    ]
  }
}
```

## 🔄 **TESTING SEQUENCE**

### **Complete Workflow Testing:**

1. **Account Setup**
   ```bash
   # 1. Signup admin
   curl -X POST http://localhost:3000/api/admin/signup -H "Content-Type: application/json" -d '{"email": "admin@hospital.com", "password": "securePassword123"}'
   
   # 2. Complete onboarding
   curl -X PUT http://localhost:3000/api/admin/onboarding -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d '{...}'
   
   # 3. Upload documents
   curl -X PUT http://localhost:3000/api/admin/hospital-documents -H "Authorization: Bearer YOUR_JWT_TOKEN" -F "adminId=A0001" -F "documentType=registrationCertificate" -F "file=@/path/to/file.pdf"
   ```

2. **Doctor Management**
   ```bash
   # 4. Add doctor (requires approved admin)
   curl -X POST http://localhost:3000/api/doctor/add -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "x-user-id: A0001" -d '{...}'
   
   # 5. Upload doctor image
   curl -X PUT http://localhost:3000/api/doctor/upload-image -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "x-user-id: A0001" -F "adminId=A0001" -F "doctorId=D0001" -F "file=@/path/to/doctor_photo.jpg"
   ```

3. **QR Code Operations**
   ```bash
   # 6. Generate QR code
   curl -X POST http://localhost:3000/api/qrgenerator -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d '{...}'
   
   # 7. Scan QR for check-in
   curl -X GET "http://localhost:3000/api/qr/scan?userId=U0001&appointmentId=APT001" -H "Authorization: Bearer YOUR_JWT_TOKEN"
   
   # 8. Scan QR for check-out
   curl -X GET "http://localhost:3000/api/qr/scan?userId=U0001&appointmentId=APT001" -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

4. **Appointment Document Management**
   ```bash
   # 9. Upload appointment documents (after checkout)
   curl -X POST http://localhost:3000/api/appoitment/APT001/documents/upload -H "Authorization: Bearer YOUR_JWT_TOKEN" -F "documents=@/path/to/lab_report.pdf" -F "documents=@/path/to/xray.png"
   
   # 10. Get appointment documents
   curl -X GET http://localhost:3000/api/appoitment/APT001/documents -H "Authorization: Bearer YOUR_JWT_TOKEN"
   
   # 11. Delete specific document
   curl -X DELETE http://localhost:3000/api/appoitment/APT001/documents -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d '{"documentUrl": "https://storage.googleapis.com/your-bucket/appointments/APT001/documents/doc-1234567890-123456789.pdf"}'
   ```



5. **Dashboard**
   ```bash
   # 12. Get dashboard data
   curl -X POST http://localhost:3000/api/admin/dashboard -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d '{"adminId": "A0001"}'
   
   # 13. Get date-specific statistics
    curl -X POST http://localhost:3000/api/admin/today-stats -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d '{"adminId": "A0001", "date": "2024-01-27"}'
   ```

## 📁 **FIREBASE FOLDER STRUCTURE**

```
your-bucket/
├── hospitals/
│   └── H0001/
│       ├── registrationCertificate-1234567890-123456789.pdf
│       ├── logo-1234567890-123456789.png
│       ├── hospitalImages-1234567890-123456789.jpg
│       ├── accreditation-1234567890-123456789.pdf
│       └── doctors/
│           ├── D0001-1705315200000-123456789.jpg
│           ├── D0002-1705315300000-987654321.png
│           └── D0003-1705315400000-456789123.jpg
├── owners/
│   └── A0001/
│       ├── aadharCard-1234567890-123456789.jpg
│       └── panCard-1234567890-123456789.jpg
└── appointments/
    └── APT001/
        └── documents/
            ├── doc-1234567890-123456789.pdf
            ├── doc-1234567891-123456790.png
            └── doc-1234567892-123456791.jpg
```

## ⚠️ **IMPORTANT NOTES**

### **Authentication Requirements:**
- Replace `YOUR_JWT_TOKEN_HERE` with actual token from signup/login
- All endpoints require valid JWT authentication
- Admin verification required for doctor management operations

### **File Upload Requirements:**
- Replace `/path/to/file` with actual file paths
- Supported formats: JPEG, PNG, PDF, Word docs, Excel files, text files
- Maximum file size: 10MB per file (appointment documents), 5MB (other uploads)
- Use multipart/form-data for file uploads
- Uses busboy middleware for Firebase Functions compatibility

### **Location Coordinates:**
- **Format**: `[longitude, latitude]` (GeoJSON format)
- **Example**: `[72.8777, 19.0760]` for Mumbai, India
- **Default**: If not provided, coordinates default to `[0, 0]`
- **Usage**: Used for location-based search and distance calculations
- **Note**: Coordinates should be in decimal degrees format

### **Time Slots API Features:**
- **Slot Generation**: Automatically generates 2-hour time slots from doctor's working hours
- **Partial Slots**: Handles edge cases (e.g., 17:00-17:30) with proportional token limits
- **Token Limits**: Each slot has calculated limits based on `maxAppointment` and `unlimitedToken` settings
- **Proportional Limits**: Partial slots get reduced token limits (e.g., 30-min slot = 25% of full limit)
- **Availability Tracking**: Real-time appointment counting per time slot
- **Date Formats**: Supports both ISO (YYYY-MM-DD) and MM/DD/YYYY formats
- **Day Mapping**: Automatically maps dates to days of week for working hours lookup

### **Admin Verification:**
- Only admins with `verificationStatus: "Approved"` can manage doctors
- New admins start with `verificationStatus: "Pending"`
- Doctor operations require `x-user-id` header

### **QR Code Features:**
- **One-time completion**: Prevents multiple check-ins after check-out
- **Date validation**: Only allows scanning on appointment date
- **Audit trail**: Tracks who performed each scan
- **Status management**: Not Checked-in → Checked-in → Checked-out

### **Appointment Document Management:**
- **Checkout Requirement**: Documents can only be uploaded after appointment checkout (checkInStatus = 'Checked-out')
- **Multiple Files**: Supports up to 10 files per upload request
- **File Types**: PDF, images (JPEG, PNG, GIF), Word docs (.doc, .docx), Excel files (.xls, .xlsx), text files (.txt)
- **File Size**: Maximum 10MB per file
- **Storage**: Files stored in Firebase Storage under `appointments/{appointmentId}/documents/`
- **Database**: URLs stored in appointment.reportUrls array
- **Deletion**: Removes files from both Firebase Storage and database
- **Busboy**: Uses busboy middleware for Firebase Functions compatibility

### **Error Handling:**
- All endpoints return structured error responses
- Validation errors include field-specific messages
- Authentication errors return 401/403 status codes
- Database errors include detailed context

### **Performance Considerations:**
- File uploads use Firebase Storage for scalability
- Database queries are optimized with indexing
- Response caching for frequently accessed data
- Batch operations for bulk data processing

## ✅ **SUCCESS CRITERIA**

- ✅ Complete admin onboarding workflow
- ✅ Hospital and doctor management
- ✅ QR code system for patient check-in/check-out
- ✅ Appointment document management (upload/delete/view)
- ✅ Real-time dashboard with statistics
- ✅ Secure authentication and authorization
- ✅ File upload and management (busboy + Firebase)
- ✅ Comprehensive error handling
- ✅ Counter-based ID generation
- ✅ Firebase storage integration
- ✅ JWT authentication
- ✅ MongoDB data models
- ✅ Input validation
- ✅ Performance optimization
- ✅ Security measures
- ✅ Audit logging

## 8. Appointment Summary API

### Get Appointments Summary (All Appointments)
```bash
curl -X POST "https://your-api.com/api/appointsummary" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"adminId": "ADMIN001"}'
```

**Expected Response:**
```json
{
    "success": true,
    "message": "Appointments summary retrieved successfully",
    "data": {
        "appointments": [
            {
                "_id": "appointment_id",
                "appointmentId": "APT001",
                "reportUrls": [
                    "https://storage.googleapis.com/bucket/appointments/APT001/documents/doc-1234567890-123456789.pdf"
                ],
                "appointmentDate": "2024-01-15T10:00:00.000Z",
                "checkInStatus": "Checked-in",
                "checkOutStatus": "Checked-out",
                "patientName": "John Doe",
                "doctorName": "Dr. Smith"
            }
        ],
        "totalCount": 1,
        "date": "all dates"
    }
}
```

### Get Appointments Summary (Filtered by Date)
```bash
curl -X POST "https://your-api.com/api/appointsummary" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"adminId": "ADMIN001", "date": "2024-01-15"}'
```

**Expected Response:**
```json
{
    "success": true,
    "message": "Appointments summary retrieved successfully",
    "data": {
        "appointments": [
            {
                "_id": "appointment_id",
                "appointmentId": "APT001",
                "reportUrls": [
                    "https://storage.googleapis.com/bucket/appointments/APT001/documents/doc-1234567890-123456789.pdf"
                ],
                "appointmentDate": "2024-01-15T10:00:00.000Z",
                "checkInStatus": "Checked-in",
                "checkOutStatus": "Checked-out",
                "patientName": "John Doe",
                "doctorName": "Dr. Smith"
            }
        ],
        "totalCount": 1,
        "date": "2024-01-15"
    }
}
```

### Error Response (Missing adminId)
```bash
curl -X POST "https://your-api.com/api/appointsummary" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-01-15"}'
```

### Error Response (Invalid Date Format)
```bash
curl -X POST "https://your-api.com/api/appointsummary" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"adminId": "ADMIN001", "date": "invalid-date"}'
```

**Expected Response:**
```json
{
    "success": false,
    "message": "Invalid date format. Please use YYYY-MM-DD format.",
    "error": "ValidationError"
}
```

---

## 🏥 **HOSPITAL MANAGEMENT APIs**

### Create Hospital with Enhanced Address Fields

Create a new hospital with optional Google Maps address integration.

```bash
curl -X POST "{{BASE_URL}}/api/hospital/basicDetails" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "name": "City General Hospital",
    "email": "info@cityhospital.com",
    "phoneNumber": "+91-9876543210",
    "hospitalType": "Hospital",
    "registrationNumber": "HOSP123456",
    "yearEstablished": 2010,
    "address": {
      "street": "123 Medical Center Drive",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001",
      "country": "India"
    },
    "location": {
      "type": "Point",
      "coordinates": [72.8777, 19.0760]
    },
    "googleMapLink": "https://maps.google.com/?q=123+Medical+Center+Drive",
    "addressName": "City General Hospital Main Building",
    "origin": {
      "lat": 19.0760,
      "lng": 72.8777
    },
    "fullAddress": "123 Medical Center Drive, Mumbai, Maharashtra 400001, India",
    "rating": 4.5,
    "userRatingsTotal": 234
  }'
```

**Expected Response:**
```json
{
  "message": "Hospital Data is Created Successfully",
  "hospitalId": "H0001"
}
```

### Update Hospital with Enhanced Address Fields

Update hospital information including the new address fields.

```bash
curl -X PUT "{{BASE_URL}}/api/hospital/details/H0001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "name": "City General Medical Center",
    "addressName": "Updated Hospital Main Building",
    "origin": {
      "lat": 19.0760,
      "lng": 72.8777
    },
    "fullAddress": "456 Healthcare Avenue, Mumbai, Maharashtra 400002, India",
    "googleMapLink": "https://maps.google.com/?q=456+Healthcare+Avenue",
    "rating": 4.7,
    "userRatingsTotal": 456
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Hospital updated successfully",
  "data": {
    "hospitalId": "H0001",
    "name": "City General Medical Center",
    "addressName": "Updated Hospital Main Building",
    "origin": {
      "lat": 19.0760,
      "lng": 72.8777
    },
    "fullAddress": "456 Healthcare Avenue, Mumbai, Maharashtra 400002, India"
  }
}
```

### Get Hospital Details

Retrieve hospital information including the new address fields.

```bash
curl -X GET "{{BASE_URL}}/api/hospital/USER_ID/H0001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "hospitalId": "H0001",
    "name": "City General Medical Center",
    "email": "info@cityhospital.com",
    "phoneNumber": "+91-9876543210",
    "hospitalType": "Hospital",
    "address": {
      "street": "123 Medical Center Drive",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001",
      "country": "India"
    },
    "location": {
      "type": "Point",
      "coordinates": [72.8777, 19.0760]
    },
    "googleMapLink": "https://maps.google.com/?q=123+Medical+Center+Drive",
    "addressName": "City General Hospital Main Building",
    "origin": {
      "lat": 19.0760,
      "lng": 72.8777
    },
    "fullAddress": "123 Medical Center Drive, Mumbai, Maharashtra 400001, India",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### Notes on Enhanced Address Fields:

- **`addressName`**: Optional field for a descriptive name of the hospital location
- **`origin`**: Optional object containing latitude and longitude coordinates
- **`fullAddress`**: Optional field for the complete formatted address
- All new address fields are **optional** and won't break existing functionality
- These fields work alongside the existing `address`, `location`, and `googleMapLink` fields
- Use the enhanced autocomplete API (`/api/orchestrator/places/autocomplete`) to get structured address data including city, state, and pincode

---

## 👤 **USER ADDRESS MANAGEMENT APIs**

### Add User Address with Enhanced Fields

Add a new address to a user with structured address components.

```bash
curl -X POST "{{BASE_URL}}/api/user/address" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "userId": "P0001",
    "addressName": "Home",
    "origin": {
      "lat": 11.6690603,
      "lng": 78.13931099999999
    },
    "fullAddress": "123 Main Street, Salem, Tamil Nadu 636004, India",
    "street": "123 Main Street",
    "city": "Salem",
    "state": "Tamil Nadu",
    "pincode": "636004",
    "isDefault": true
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Address added successfully",
  "data": {
    "userId": "P0001",
    "address": {
      "addressId": "550e8400-e29b-41d4-a716-446655440000",
      "addressName": "Home",
      "origin": {
        "lat": 11.6690603,
        "lng": 78.13931099999999
      },
      "fullAddress": "123 Main Street, Salem, Tamil Nadu 636004, India",
      "street": "123 Main Street",
      "city": "Salem",
      "state": "Tamil Nadu",
      "pincode": "636004",
      "isDefault": true,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

### Get User Addresses

Retrieve all addresses for a user.

```bash
curl -X GET "{{BASE_URL}}/api/user/address/P0001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "userId": "P0001",
    "addresses": [
      {
        "addressId": "550e8400-e29b-41d4-a716-446655440000",
        "addressName": "Home",
        "origin": {
          "lat": 11.6690603,
          "lng": 78.13931099999999
        },
        "fullAddress": "123 Main Street, Salem, Tamil Nadu 636004, India",
        "street": "123 Main Street",
        "city": "Salem",
        "state": "Tamil Nadu",
        "pincode": "636004",
        "isDefault": true,
        "createdAt": "2024-01-15T10:00:00.000Z"
      },
      {
        "addressId": "550e8400-e29b-41d4-a716-446655440001",
        "addressName": "Office",
        "origin": {
          "lat": 12.9716,
          "lng": 77.5946
        },
        "fullAddress": "456 Business Park, Bangalore, Karnataka 560001, India",
        "street": "456 Business Park",
        "city": "Bangalore",
        "state": "Karnataka",
        "pincode": "560001",
        "isDefault": false,
        "createdAt": "2024-01-15T11:00:00.000Z"
      }
    ]
  }
}
```

### Update User Address

Update specific address fields for a user.

```bash
curl -X PUT "{{BASE_URL}}/api/user/address/P0001/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "addressName": "Updated Home Address",
    "street": "789 New Street",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pincode": "600001",
    "fullAddress": "789 New Street, Chennai, Tamil Nadu 600001, India"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Address updated successfully",
  "data": {
    "userId": "P0001",
    "address": {
      "addressId": "550e8400-e29b-41d4-a716-446655440000",
      "addressName": "Updated Home Address",
      "origin": {
        "lat": 11.6690603,
        "lng": 78.13931099999999
      },
      "fullAddress": "789 New Street, Chennai, Tamil Nadu 600001, India",
      "street": "789 New Street",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "pincode": "600001",
      "isDefault": true,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

### Delete User Address

Remove a specific address from user's address list.

```bash
curl -X DELETE "{{BASE_URL}}/api/user/address/P0001/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Address deleted successfully",
  "data": {
    "userId": "P0001",
    "deletedAddress": {
      "addressId": "550e8400-e29b-41d4-a716-446655440000",
      "addressName": "Updated Home Address"
    }
  }
}
```

### Notes on Enhanced Address Fields:

- **`street`**: Optional street address field (max 200 characters)
- **`city`**: Optional city name (max 100 characters)
- **`state`**: Optional state/province (max 100 characters)
- **`pincode`**: Optional postal code (max 10 characters)
- **All new fields are optional** and won't break existing functionality
- **Use with autocomplete API** to automatically populate structured address data
- **Flexible updates** - can update individual fields or all together
- **Default address management** - only one address can be marked as default

---

## 🔍 **ENHANCED DOCTOR SEARCH EXAMPLES**

### Enhanced Specialization Search
**NEW: Advanced Search Capabilities**
- **Partial Matching**: Search for "Medicine" finds doctors with "General Medicine,Cardiology"
- **Case-Insensitive**: Search works regardless of case
- **Word Boundary Matching**: Better partial matching within comma-separated values
- **Multiple Department Support**: Returns doctors with multiple specializations

#### **Example 1: Partial Search (Finds Multiple Departments)**
```bash
curl -X GET "http://localhost:3000/api/doctor/search?specialization=Medicine" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```
**Result:** Finds doctors with "General Medicine", "General Medicine,Cardiology", "Emergency Medicine", etc.

#### **Example 2: Exact Department Search**
```bash
curl -X GET "http://localhost:3000/api/doctor/search?specialization=Cardiology" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```
**Result:** Finds doctors with "Cardiology" or "Cardiology,General Medicine" or "General Medicine,Cardiology"

#### **Example 3: Case-Insensitive Search**
```bash
curl -X GET "http://localhost:3000/api/doctor/search?specialization=cardiology" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```
**Result:** Same as Example 2, regardless of case

#### **Example 4: Search by Specialization Endpoint**
```bash
curl -X GET "http://localhost:3000/api/doctor/specialization/General%20Medicine" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```
**Result:** Returns all doctors with "General Medicine" in their specialization

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "doctorId": "D0001",
        "name": "Dr. Sarah Johnson",
        "specialization": "Cardiology,General Medicine,Emergency Care",
        "experience": 8,
        "rating": 4.5
      },
      {
        "doctorId": "D0002",
        "name": "Dr. John Smith",
        "specialization": "General Medicine,Pediatrics",
        "experience": 5,
        "rating": 4.2
      }
    ],
    "specialization": "General Medicine",
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalRecords": 2,
      "limit": 10
    }
  }
}
```

### Valid Departments List:
- General Medicine
- General Checkup
- Pediatrics
- Gynecology
- Cardiology
- Dermatology
- Dental
- Diabetology
- Eye Care
- Orthopedics
- Gastroenterology
- Pulmonology
- Neurology
- Urology
- Physiotherapy
- Emergency Care

## 🏥 **DOCTOR DELAY MANAGEMENT APIs**

### 18. Set Doctor Delay

```bash
curl -X POST http://localhost:3000/api/doctor/delay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "doctorId": "D0001",
    "date": "2024-01-22",
    "startTime": "11:00",
    "durationMinutes": 45,
    "reason": "Emergency surgery",
    "createdBy": "A0001"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Delay set successfully. 3 appointments will be affected.",
  "data": {
    "delay": {
      "date": "2024-01-22T00:00:00.000Z",
      "startTime": "11:00",
      "durationMinutes": 45,
      "reason": "Emergency surgery",
      "isActive": true,
      "createdAt": "2024-01-22T10:30:00.000Z",
      "createdBy": "A0001"
    },
    "affectedAppointments": 3
  }
}
```

**Notes:**
- Automatically sends FCM notifications to affected patients
- Message: "Doctor is delayed by X minutes. Reason: Y. If you wish to reschedule, you can click and reschedule."

### 19. Get Doctors with Delays by Hospital

```bash
curl -X GET "http://localhost:3000/api/doctor/delays/hospital/H0002?date=2024-01-22" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Response:**
```json
{
  "status": "success",
  "message": "Doctors with delays retrieved successfully",
  "data": {
    "hospitalId": "H0002",
    "date": "2024-01-22",
    "doctorsWithDelays": [
      {
        "doctorId": "D0001",
        "name": "Dr. John Smith",
        "email": "john.smith@hospital.com",
        "delays": [
          {
            "startTime": "11:00",
            "durationMinutes": 45,
            "reason": "Emergency surgery",
            "isActive": true,
            "createdAt": "2024-01-22T10:30:00.000Z",
            "createdBy": "A0001"
          }
        ]
      },
      {
        "doctorId": "D0002",
        "name": "Dr. Sarah Johnson",
        "email": "sarah.johnson@hospital.com",
        "delays": [
          {
            "startTime": "14:00",
            "durationMinutes": 30,
            "reason": "Traffic delay",
            "isActive": true,
            "createdAt": "2024-01-22T13:45:00.000Z",
            "createdBy": "A0001"
          }
        ]
      }
    ],
    "totalDoctorsWithDelays": 2
  }
}
```

**Notes:**
- Returns all doctors in the hospital with active delays for the specified date
- If no date provided, defaults to today
- Only shows doctors with active delays

### 20. Get Doctor Delays

```bash
curl -X GET "http://localhost:3000/api/doctor/delay/D0001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Response:**
```json
{
  "status": "success",
  "message": "Doctor delays retrieved successfully",
  "data": {
    "doctorId": "D0001",
    "name": "Dr. John Smith",
    "delays": [
      {
        "date": "2024-01-22T00:00:00.000Z",
        "startTime": "11:00",
        "durationMinutes": 45,
        "reason": "Emergency surgery",
        "isActive": true,
        "createdAt": "2024-01-22T10:30:00.000Z",
        "createdBy": "A0001"
      }
    ]
  }
}
```

### 21. Clear Doctor Delays

```bash
curl -X DELETE "http://localhost:3000/api/doctor/delay/D0001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Response:**
```json
{
  "status": "success",
  "message": "All delays cleared for doctor D0001",
  "data": {
    "doctorId": "D0001",
    "delaysCleared": 2,
    "clearedAt": "2024-01-22T15:30:00.000Z"
  }
}
```

### 22. Reset Doctor Availability

```bash
curl -X POST "http://localhost:3000/api/doctor/reset-availability" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "doctorId": "D0001",
    "date": "2024-01-22"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Doctor availability reset successfully",
  "data": {
    "doctorId": "D0001",
    "date": "2024-01-22",
    "delaysCleared": 1,
    "resetAt": "2024-01-22T15:30:00.000Z"
  }
}
```

### 23. Get Adjusted Time

```bash
curl -X POST "http://localhost:3000/api/doctor/adjusted-time" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "doctorId": "D0001",
    "date": "2024-01-22",
    "originalTime": "11:00"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Adjusted time calculated successfully",
  "data": {
    "doctorId": "D0001",
    "date": "2024-01-22",
    "originalTime": "11:00",
    "adjustedTime": "11:45",
    "delayMinutes": 45,
    "reason": "Emergency surgery"
  }
}
```

### 24. Manual Delay Cleanup

```bash
curl -X POST "http://localhost:3000/api/doctor/delays/cleanup" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Response:**
```json
{
  "status": "success",
  "message": "Expired delays cleaned up successfully",
  "data": {
    "success": true,
    "totalDelaysCleaned": 3,
    "doctorsAffected": 2,
    "cleanupResults": [
      {
        "doctorId": "D0001",
        "name": "Dr. John Smith",
        "delaysCleaned": [
          {
            "startTime": "11:00",
            "durationMinutes": 45,
            "reason": "Emergency surgery",
            "expiredAt": "2024-01-22T15:30:00.000Z"
          }
        ]
      }
    ],
    "cleanupTime": "2024-01-22T15:30:00.000Z"
  }
}
```

**Notes:**
- Manually triggers cleanup of expired delays
- Automatically runs every hour via cron job
- Only affects delays that have passed their end time

## 📅 **FOLLOW-UP APPOINTMENT MANAGEMENT APIs**

### 25. Create Follow-up Appointment

```bash
curl -X POST http://localhost:3000/api/follow-up \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "P0001",
    "doctorId": "D0001",
    "hospitalId": "H0002",
    "appointmentDate": "2024-01-29",
    "appointmentTime": "10:00",
    "followUpReason": "Blood test results review",
    "createdBy": "doctor",
    "createdById": "D0001",
    "parentAppointmentId": "APT001",
    "consultationType": "Follow-up",
    "notes": "Follow-up for blood test results"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Follow-up appointment created successfully",
  "data": {
    "appointmentId": "APT002",
    "patientId": "P0001",
    "doctorId": "D0001",
    "hospitalId": "H0002",
    "appointmentDate": "2024-01-29T00:00:00.000Z",
    "appointmentTime": "10:00",
    "status": "Scheduled",
    "tokenDisplay": "S1T002",
    "followUp": {
      "isFollowUp": true,
      "parentAppointmentId": "APT001",
      "followUpReason": "Blood test results review",
      "createdBy": "doctor",
      "createdById": "D0001"
    },
    "createdAt": "2024-01-22T10:30:00.000Z"
  }
}
```

**Notes:**
- Automatically sends FCM notification to patient
- Inherits patient address from parent appointment
- Validates parent appointment is completed
- Uses same notification orchestration as regular appointments

### 26. Get Follow-up Appointments by Patient

```bash
curl -X GET "http://localhost:3000/api/follow-up/patient/P0001"
```

**Response:**
```json
{
  "status": "success",
  "message": "Follow-up appointments retrieved successfully",
  "data": {
    "patientId": "P0001",
    "followUpAppointments": [
      {
        "appointmentId": "APT002",
        "patientId": "P0001",
        "doctorId": "D0001",
        "appointmentDate": "2024-01-29T00:00:00.000Z",
        "appointmentTime": "10:00",
        "status": "Scheduled",
        "followUp": {
          "isFollowUp": true,
          "parentAppointmentId": "APT001",
          "followUpReason": "Blood test results review",
          "createdBy": "doctor",
          "createdById": "D0001"
        }
      }
    ],
    "totalFollowUps": 1
  }
}
```

### 27. Get Follow-up Appointments by Doctor

```bash
curl -X GET "http://localhost:3000/api/follow-up/doctor/D0001"
```

**Response:**
```json
{
  "status": "success",
  "message": "Follow-up appointments retrieved successfully",
  "data": {
    "doctorId": "D0001",
    "followUpAppointments": [
      {
        "appointmentId": "APT002",
        "patientId": "P0001",
        "doctorId": "D0001",
        "appointmentDate": "2024-01-29T00:00:00.000Z",
        "appointmentTime": "10:00",
        "status": "Scheduled",
        "followUp": {
          "isFollowUp": true,
          "parentAppointmentId": "APT001",
          "followUpReason": "Blood test results review",
          "createdBy": "doctor",
          "createdById": "D0001"
        }
      }
    ],
    "totalFollowUps": 1
  }
}
```

### 28. Get Follow-up Appointments by Hospital

```bash
curl -X GET "http://localhost:3000/api/follow-up/hospital/H0002"
```

**Response:**
```json
{
  "status": "success",
  "message": "Follow-up appointments retrieved successfully",
  "data": {
    "hospitalId": "H0002",
    "followUpAppointments": [
      {
        "appointmentId": "APT002",
        "patientId": "P0001",
        "doctorId": "D0001",
        "appointmentDate": "2024-01-29T00:00:00.000Z",
        "appointmentTime": "10:00",
        "status": "Scheduled",
        "followUp": {
          "isFollowUp": true,
          "parentAppointmentId": "APT001",
          "followUpReason": "Blood test results review",
          "createdBy": "doctor",
          "createdById": "D0001"
        }
      }
    ],
    "totalFollowUps": 1
  }
}
```

### 29. Get Follow-up Appointments by Creator

```bash
curl -X GET "http://localhost:3000/api/follow-up/creator/doctor/D0001"
```

**Response:**
```json
{
  "status": "success",
  "message": "Follow-up appointments retrieved successfully",
  "data": {
    "createdBy": "doctor",
    "createdById": "D0001",
    "followUpAppointments": [
      {
        "appointmentId": "APT002",
        "patientId": "P0001",
        "doctorId": "D0001",
        "appointmentDate": "2024-01-29T00:00:00.000Z",
        "appointmentTime": "10:00",
        "status": "Scheduled",
        "followUp": {
          "isFollowUp": true,
          "parentAppointmentId": "APT001",
          "followUpReason": "Blood test results review",
          "createdBy": "doctor",
          "createdById": "D0001"
        }
      }
    ],
    "totalFollowUps": 1
  }
}
```

### 30. Enhanced Patient Appointments (with Follow-up Flag)

```bash
curl -X GET "http://localhost:3000/api/appointment/patient/P0001"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "appointments": [
      {
        "appointmentId": "APT001",
        "patientId": "P0001",
        "doctorId": "D0001",
        "appointmentDate": "2024-01-22T00:00:00.000Z",
        "appointmentTime": "10:00",
        "status": "Completed",
        "followUp": {
          "isFollowUp": false
        }
      },
      {
        "appointmentId": "APT002",
        "patientId": "P0001",
        "doctorId": "D0001",
        "appointmentDate": "2024-01-29T00:00:00.000Z",
        "appointmentTime": "10:00",
        "status": "Scheduled",
        "followUp": {
          "isFollowUp": true,
          "parentAppointmentId": "APT001",
          "followUpReason": "Blood test results review",
          "createdBy": "doctor",
          "createdById": "D0001"
        }
      }
    ]
  }
}
```

**Notes:**
- All existing appointment APIs now include `followUp.isFollowUp` flag
- Follow-up appointments are clearly distinguished from regular appointments
- Same notification orchestration applies to follow-up appointments
