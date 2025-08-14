# Final Admin API Implementation - Complete Curl Commands

## Overview
This document provides complete `curl` commands for testing the streamlined admin onboarding system. The implementation includes:

1. **Single Onboarding API** - All core information in one call
2. **Separate File Upload APIs** - For hospital and owner documents
3. **Sequential Admin ID Generation** - A0001, A0002, etc.
4. **Auto JWT Token on Signup** - No separate login needed
5. **Firebase File Storage** - With organized folder structure

## API Endpoints

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

### 2. Admin Login (if needed)
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
    "googleMapLink": "https://maps.google.com/?q=123+Medical+Center+Drive",
    "phoneNumber": "022-12345678",
    "alternativePhone": "022-12345679",
    "emailAddress": "info@citygeneral.com",
    "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "startTime": "09:00",
    "endTime": "18:00",
    "openAlways": false,
    "maxTokenPerDay": 100,
    "unlimitedToken": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Onboarding information updated successfully",
  "data": {
    "admin": {
      "adminId": "A0001",
      "onboardingProgress": 100
    },
    "hospital": {
      "hospitalId": "6155",
      "hospitalMongoId": "6899115087e7fd626c2e2522",
      "name": "City General Hospital"
    }
  }
}
```

### 4. Hospital Document Uploads

#### 4.1 Registration Certificate
```bash
curl -X PUT http://localhost:3000/api/admin/hospital-documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "adminId=A0001" \
  -F "documentType=registrationCertificate" \
  -F "file=@/path/to/registration_certificate.pdf"
```

#### 4.2 Hospital Logo
```bash
curl -X PUT http://localhost:3000/api/admin/hospital-documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "adminId=A0001" \
  -F "documentType=logo" \
  -F "file=@/path/to/hospital_logo.png"
```

#### 4.3 Hospital Images
```bash
curl -X PUT http://localhost:3000/api/admin/hospital-documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "adminId=A0001" \
  -F "documentType=hospitalImages" \
  -F "file=@/path/to/hospital_image1.jpg"
```

#### 4.4 Accreditation (Optional)
```bash
curl -X PUT http://localhost:3000/api/admin/hospital-documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "adminId=A0001" \
  -F "documentType=accreditation" \
  -F "file=@/path/to/accreditation_certificate.pdf"
```

**Expected Response for Hospital Documents:**
```json
{
  "message": "Hospital document uploaded successfully",
  "document": {
    "fileName": "registration_certificate.pdf",
    "fileUrl": "https://storage.googleapis.com/your-bucket/hospitals/A0001/registrationCertificate-1234567890-123456789.pdf",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 5. Owner Document Uploads

#### 5.1 Aadhar Card
```bash
curl -X PUT http://localhost:3000/api/admin/owner-documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "adminId=A0001" \
  -F "documentType=aadharCard" \
  -F "file=@/path/to/aadhar_card.jpg"
```

#### 5.2 PAN Card
```bash
curl -X PUT http://localhost:3000/api/admin/owner-documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "adminId=A0001" \
  -F "documentType=panCard" \
  -F "file=@/path/to/pan_card.jpg"
```

**Expected Response for Owner Documents:**
```json
{
  "message": "Owner document uploaded successfully",
  "document": {
    "fileName": "aadhar_card.jpg",
    "fileUrl": "https://storage.googleapis.com/your-bucket/owners/A0001/aadharCard-1234567890-123456789.jpg",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 6. Get Admin Details
```bash
curl -X GET http://localhost:3000/api/admin/A0001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 7. Get Admin Dashboard Data
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
        },
        "panCard": {
          "fileName": "pan_card.jpg",
          "fileUrl": "https://storage.googleapis.com/your-bucket/owners/A0001/panCard-1234567890-123456789.jpg",
          "uploadedAt": "2024-01-15T10:30:00.000Z"
        }
      },
      "verificationStatus": "Pending",
      "isActive": true,
      "onboardingProgress": 100,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "hospital": {
      "hospitalId": "6155",
      "hospitalMongoId": "6899115087e7fd626c2e2522",
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
      "location": {
        "type": "Point",
        "coordinates": [0, 0]
      },
      "googleMapLink": "https://maps.google.com/?q=123+Medical+Center+Drive",
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
          "fileUrl": "https://storage.googleapis.com/your-bucket/hospitals/6155/registrationCertificate-1234567890-123456789.pdf",
          "uploadedAt": "2024-01-15T10:30:00.000Z"
        },
        "logo": {
          "fileName": "hospital_logo.png",
          "fileUrl": "https://storage.googleapis.com/your-bucket/hospitals/6155/logo-1234567890-123456789.png",
          "uploadedAt": "2024-01-15T10:30:00.000Z"
        }
      },
      "isActive": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "statistics": {
      "totalDoctors": 0,
      "totalAppointments": 0,
      "totalPatients": 0,
      "todayAppointments": 0,
      "pendingVerifications": 0
    },
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

### 8. Update Owner Information
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

**Expected Response:**
```json
{
  "success": true,
  "message": "Owner information updated successfully",
  "data": {
    "message": "Owner information updated successfully",
    "ownerInfo": {
      "name": "Dr. Jane Smith",
      "mobile": "9876543211",
      "proof": "PAN",
      "proofNumber": "ABCDE1234F"
    },
    "onboardingProgress": 100,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### 9. Update Hospital Basic Information
```bash
curl -X PUT http://localhost:3000/api/admin/hospital/basic-info \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "adminId": "A0001",
    "name": "City General Medical Center",
    "hospitalType": "Multi-Specialty",
    "registrationNumber": "HOSP123457",
    "yearEstablished": 2015,
    "googleMapLink": "https://maps.google.com/?q=City+General+Medical+Center"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Hospital basic information updated successfully",
  "data": {
    "message": "Hospital basic information updated successfully",
    "hospital": {
      "hospitalId": "6155",
      "name": "City General Medical Center",
      "hospitalType": "Multi-Specialty",
      "registrationNumber": "HOSP123457",
      "yearEstablished": 2015,
      "googleMapLink": "https://maps.google.com/?q=City+General+Medical+Center"
    },
    "onboardingProgress": 100,
    "updatedAt": "2024-01-15T11:15:00.000Z"
  }
}
```

## Firebase Folder Structure

The files will be stored in Firebase with the following structure:

```
your-bucket/
├── hospitals/
│   └── A0001/
│       ├── registrationCertificate-1234567890-123456789.pdf
│       ├── logo-1234567890-123456789.png
│       ├── hospitalImages-1234567890-123456789.jpg
│       └── accreditation-1234567890-123456789.pdf
└── owners/
    └── A0001/
        ├── aadharCard-1234567890-123456789.jpg
        └── panCard-1234567890-123456789.jpg
```

## File Upload Specifications

- **Supported Formats**: JPEG, PNG, PDF
- **Maximum Size**: 5MB per file
- **File Naming**: `{documentType}-{timestamp}-{random}.{extension}`
- **Storage**: Firebase Storage with public URLs
- **Database**: File metadata stored in respective models

## Testing Sequence

1. **Signup** → Get JWT token automatically
2. **Complete Onboarding** → Sets all progress flags to 100%
3. **Upload Hospital Documents** → Store in `hospitals/A0001/` folder
4. **Upload Owner Documents** → Store in `owners/A0001/` folder
5. **Verify Admin Details** → Check all information and progress

## Key Benefits

✅ **Single Onboarding API** - All core information in one call  
✅ **Separate File Uploads** - Organized document management  
✅ **Auto JWT on Signup** - No separate login step  
✅ **Sequential IDs** - A0001, A0002, etc. for easy tracking  
✅ **Firebase Integration** - Cloud storage with organized folders  
✅ **Progress Tracking** - 100% completion after onboarding  
✅ **Validation** - File type and size validation  
✅ **Error Handling** - Comprehensive error responses  

## Success Criteria

- ✅ Admin signup creates sequential ID (A0001)
- ✅ JWT token returned automatically on signup
- ✅ Single onboarding API updates all information
- ✅ Progress flags set to 100% after onboarding
- ✅ Hospital documents stored in `hospitals/A0001/` folder
- ✅ Owner documents stored in `owners/A0001/` folder
- ✅ File URLs saved in database
- ✅ Proper validation and error handling
- ✅ Swagger documentation updated

## Notes

- Replace `YOUR_JWT_TOKEN_HERE` with the actual token from signup/login
- Replace `/path/to/file` with actual file paths on your system
- Ensure Firebase Storage is properly configured
- File uploads support multipart/form-data format
- All endpoints require admin authentication
- Progress tracking is automatic and based on onboarding completion
