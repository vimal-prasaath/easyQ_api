# Doctor Management APIs - Complete Implementation

## Overview
This document provides complete `curl` commands for testing the enhanced doctor management system. The implementation includes:

1. **Counter-based Doctor IDs** - D0001, D0002, etc.
2. **Photo Upload Integration** - Firebase Storage with organized folder structure
3. **Complete CRUD Operations** - Create, Read, Update, Delete doctors
4. **Hospital Integration** - Automatic department management
5. **Profile Image Management** - Upload and update doctor photos

## API Endpoints

### 1. Create Doctor (with Counter-based ID)
```bash
curl -X POST http://localhost:3000/api/doctor/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
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
      "dateOfBirth": "1985-06-15T00:00:00.000Z",
      "specialization": "Cardiology",
      "qualification": ["MBBS", "MD Cardiology", "Fellowship in Interventional Cardiology"],
      "serviceStartDate": "2015-03-01T00:00:00.000Z",
      "experienceYears": 8,
      "isHeadOfDepartment": false,
      "hospitalId": "6155",
      "profileImage": {
        "fileName": null,
        "fileUrl": "https://example.com/default-doctor.png",
        "uploadedAt": null
      },
      "consultantFee": 1500,
      "status": "Available",
      "workingHours": [
        {
          "day": "Monday",
          "date": "2024-01-22T00:00:00.000Z",
          "available": "morning",
          "timeSlots": [
            {
              "startTime": "09:00",
              "endTime": "12:00"
            }
          ]
        }
      ],
      "patientIds": [],
      "maxAppointment": "20",
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    },
    "doctorId": "D0001",
    "experience": 8
  }
}
```

### 2. Upload Doctor Profile Image
```bash
curl -X PUT http://localhost:3000/api/doctor/upload-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "doctorId=D0001" \
  -F "file=@/path/to/doctor_photo.jpg"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor image uploaded successfully",
  "data": {
    "message": "Doctor image uploaded successfully",
    "profileImage": {
      "fileName": "D0001-1705315200000-123456789.jpg",
      "fileUrl": "https://storage.googleapis.com/your-bucket/hospitals/6155/doctors/D0001-1705315200000-123456789.jpg",
      "uploadedAt": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

### 3. Get Doctor by ID
```bash
curl -X POST http://localhost:3000/api/doctor/get \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "doctorId": "D0001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor retrieved successfully",
  "data": {
    "doctor": {
      "doctorId": "D0001",
      "name": "Dr. Sarah Johnson",
      "email": "sarah.johnson@hospital.com",
      "mobileNumber": "9876543210",
      "gender": "Female",
      "dateOfBirth": "1985-06-15T00:00:00.000Z",
      "specialization": "Cardiology",
      "qualification": ["MBBS", "MD Cardiology", "Fellowship in Interventional Cardiology"],
      "serviceStartDate": "2015-03-01T00:00:00.000Z",
      "experienceYears": 8,
      "isHeadOfDepartment": false,
      "hospitalId": "6155",
      "profileImage": {
        "fileName": "D0001-1705315200000-123456789.jpg",
        "fileUrl": "https://storage.googleapis.com/your-bucket/hospitals/6155/doctors/D0001-1705315200000-123456789.jpg",
        "uploadedAt": "2024-01-15T12:00:00.000Z"
      },
      "consultantFee": 1500,
      "status": "Available",
      "workingHours": [
        {
          "day": "Monday",
          "date": "2024-01-22T00:00:00.000Z",
          "available": "morning",
          "timeSlots": [
            {
              "startTime": "09:00",
              "endTime": "12:00"
            }
          ]
        }
      ],
      "patientIds": [],
      "maxAppointment": "20",
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

### 4. Update Doctor Information
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
      "dateOfBirth": "1985-06-15T00:00:00.000Z",
      "specialization": "Cardiology",
      "qualification": ["MBBS", "MD Cardiology", "Fellowship in Interventional Cardiology", "PhD Cardiovascular Sciences"],
      "serviceStartDate": "2015-03-01T00:00:00.000Z",
      "experienceYears": 8,
      "isHeadOfDepartment": false,
      "hospitalId": "6155",
      "profileImage": {
        "fileName": "D0001-1705315200000-123456789.jpg",
        "fileUrl": "https://storage.googleapis.com/your-bucket/hospitals/6155/doctors/D0001-1705315200000-123456789.jpg",
        "uploadedAt": "2024-01-15T12:00:00.000Z"
      },
      "consultantFee": 1800,
      "status": "Available",
      "workingHours": [
        {
          "day": "Monday",
          "date": "2024-01-22T00:00:00.000Z",
          "available": "morning",
          "timeSlots": [
            {
              "startTime": "09:00",
              "endTime": "12:00"
            }
          ]
        }
      ],
      "patientIds": [],
      "maxAppointment": "20",
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T12:30:00.000Z"
    }
  }
}
```

### 5. Get All Doctors by Hospital
```bash
curl -X GET http://localhost:3000/api/doctor/all/6155 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctors retrieved successfully",
  "data": [
    {
      "doctorId": "D0001",
      "name": "Dr. Sarah Johnson-Smith",
      "email": "sarah.johnson@hospital.com",
      "mobileNumber": "9876543210",
      "gender": "Female",
      "specialization": "Cardiology",
      "experienceYears": 8,
      "isHeadOfDepartment": false,
      "hospitalId": "6155",
      "profileImage": {
        "fileName": "D0001-1705315200000-123456789.jpg",
        "fileUrl": "https://storage.googleapis.com/your-bucket/hospitals/6155/doctors/D0001-1705315200000-123456789.jpg",
        "uploadedAt": "2024-01-15T12:00:00.000Z"
      },
      "consultantFee": 1800,
      "status": "Available"
    },
    {
      "doctorId": "D0002",
      "name": "Dr. Michael Chen",
      "email": "michael.chen@hospital.com",
      "mobileNumber": "9876543211",
      "gender": "Male",
      "specialization": "Neurology",
      "experienceYears": 12,
      "isHeadOfDepartment": true,
      "hospitalId": "6155",
      "profileImage": {
        "fileName": null,
        "fileUrl": "https://example.com/default-doctor.png",
        "uploadedAt": null
      },
      "consultantFee": 2000,
      "status": "Available"
    }
  ]
}
```

### 6. Delete Doctor
```bash
curl -X DELETE http://localhost:3000/api/doctor/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "doctorId": "D0001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor deleted successfully",
  "data": {
    "deletedDoctor": {
      "doctorId": "D0001",
      "name": "Dr. Sarah Johnson-Smith",
      "email": "sarah.johnson@hospital.com",
      "specialization": "Cardiology",
      "hospitalId": "6155"
    }
  }
}
```

## Firebase Folder Structure

The doctor images will be stored in Firebase with the following structure:

```
your-bucket/
├── hospitals/
│   └── 6155/
│       ├── doctors/
│       │   ├── D0001-1705315200000-123456789.jpg
│       │   ├── D0002-1705315300000-987654321.png
│       │   └── D0003-1705315400000-456789123.jpg
│       ├── registrationCertificate-1234567890-123456789.pdf
│       ├── logo-1234567890-123456789.png
│       └── hospitalImages-1234567890-123456789.jpg
└── owners/
    └── A0001/
        ├── aadharCard-1234567890-123456789.jpg
        └── panCard-1234567890-123456789.jpg
```

## File Upload Specifications

- **Supported Formats**: JPEG, PNG
- **Maximum Size**: 5MB per file
- **File Naming**: `{doctorId}-{timestamp}-{random}.{extension}`
- **Storage**: Firebase Storage with public URLs
- **Database**: File metadata stored in doctor model

## Testing Sequence

1. **Create Doctor** → Get sequential doctor ID (D0001)
2. **Upload Profile Image** → Store in `hospitals/{hospitalId}/doctors/` folder
3. **Get Doctor Details** → Verify all information and image
4. **Update Doctor** → Modify information
5. **Get All Doctors** → List all doctors for hospital
6. **Delete Doctor** → Remove from system

## Key Features

✅ **Counter-based IDs** - D0001, D0002, etc. for easy tracking  
✅ **Photo Upload** - Firebase integration with organized folders  
✅ **Hospital Integration** - Automatic department management  
✅ **Experience Calculation** - Automatic years of service calculation  
✅ **Working Hours** - Detailed schedule management  
✅ **Status Management** - Available/Unavailable/On Leave/Emergency Only  
✅ **Validation** - Comprehensive field validation  
✅ **Error Handling** - Detailed error responses  

## Success Criteria

- ✅ Doctor creation generates sequential ID (D0001)
- ✅ Profile images stored in `hospitals/{hospitalId}/doctors/` folder
- ✅ Image URLs saved in database
- ✅ Hospital departments updated automatically
- ✅ Experience calculated automatically
- ✅ Proper validation and error handling
- ✅ Swagger documentation updated

## Notes

- Replace `YOUR_JWT_TOKEN_HERE` with the actual token from admin login
- Replace `/path/to/doctor_photo.jpg` with actual file paths on your system
- Ensure Firebase Storage is properly configured
- Image uploads support multipart/form-data format
- All endpoints require admin authentication
- Doctor IDs are automatically generated using Counter model
