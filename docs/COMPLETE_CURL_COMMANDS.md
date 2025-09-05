# Complete Admin Portal - All Curl Commands

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

### 10. Create Doctor (Requires Approved Admin)
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
    "specialization": "Cardiology",
    "qualification": ["MBBS", "MD Cardiology", "Fellowship in Interventional Cardiology"],
    "serviceStartDate": "2015-03-01",
    "isHeadOfDepartment": false,
    "hospitalId": "6155",
    "consultantFee": 1500,
    "status": "Available",
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
    "maxAppointment": "20"
  }'
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

### 13. Update Doctor Information
```bash
curl -X PUT http://localhost:3000/api/doctor/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "doctorId": "D0001",
    "name": "Dr. Sarah Johnson-Smith",
    "consultantFee": 1800,
    "status": "Available",
    "qualification": ["MBBS", "MD Cardiology", "Fellowship in Interventional Cardiology", "PhD Cardiovascular Sciences"]
  }'
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



4. **Dashboard**
   ```bash
   # 9. Get dashboard data
   curl -X POST http://localhost:3000/api/admin/dashboard -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d '{"adminId": "A0001"}'
   
       # 10. Get date-specific statistics
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
└── owners/
    └── A0001/
        ├── aadharCard-1234567890-123456789.jpg
        └── panCard-1234567890-123456789.jpg
```

## ⚠️ **IMPORTANT NOTES**

### **Authentication Requirements:**
- Replace `YOUR_JWT_TOKEN_HERE` with actual token from signup/login
- All endpoints require valid JWT authentication
- Admin verification required for doctor management operations

### **File Upload Requirements:**
- Replace `/path/to/file` with actual file paths
- Supported formats: JPEG, PNG, PDF
- Maximum file size: 5MB
- Use multipart/form-data for file uploads

### **Location Coordinates:**
- **Format**: `[longitude, latitude]` (GeoJSON format)
- **Example**: `[72.8777, 19.0760]` for Mumbai, India
- **Default**: If not provided, coordinates default to `[0, 0]`
- **Usage**: Used for location-based search and distance calculations
- **Note**: Coordinates should be in decimal degrees format

### **Admin Verification:**
- Only admins with `verificationStatus: "Approved"` can manage doctors
- New admins start with `verificationStatus: "Pending"`
- Doctor operations require `x-user-id` header

### **QR Code Features:**
- **One-time completion**: Prevents multiple check-ins after check-out
- **Date validation**: Only allows scanning on appointment date
- **Audit trail**: Tracks who performed each scan
- **Status management**: Not Checked-in → Checked-in → Checked-out

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

- ✅ Real-time dashboard with statistics
- ✅ Secure authentication and authorization
- ✅ File upload and management
- ✅ Comprehensive error handling
- ✅ Counter-based ID generation
- ✅ Firebase storage integration
- ✅ JWT authentication
- ✅ MongoDB data models
- ✅ Input validation
- ✅ Performance optimization
- ✅ Security measures
- ✅ Audit logging
