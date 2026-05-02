# Database Schema Documentation

## Overview
This document provides a complete schema reference for all MongoDB collections in the EasyQ API system.

---

## Collections

### 1. User (userProfile)
**Collection Name:** `users`  
**Model File:** `src/model/userProfile.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | String | Yes | Unique user identifier (format: P#### or A####) |
| `name` | String | Yes | User's full name (2-50 characters, letters and spaces only) |
| `gender` | String | Yes | Enum: 'male', 'female', 'other' |
| `dateOfBirth` | Date | No | User's date of birth (validated for age 0-120) |
| `role` | String | Yes | Enum: 'user', 'admin', 'doctor' (default: 'user') |
| `email` | String | Yes | Unique email address (validated) |
| `phoneNumber` | String | Yes | Mobile phone number (validated) |
| `location` | String | No | User's location (max 100 characters) |
| `addresses` | Array | No | Array of address objects (see Address Schema below) |
| `isActive` | Boolean | Yes | Account active status (default: true, false for admin) |
| `profileUpadate` | Boolean | Yes | Profile update completion flag (default: false) |
| `lastLoginAt` | Date | No | Last login timestamp |
| `googleId` | String | No | Google OAuth ID (unique, sparse) |
| `sessionToken` | String | No | Session token (not selected by default) |
| `accessToken` | String | No | Access token (not selected by default) |
| `refreshToken` | String | No | Refresh token (not selected by default) |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

#### Address Schema (within addresses array)
```javascript
{
  addressId: String,
  addressName: String,        // Max 100 chars
  origin: {
    lat: Number,              // -90 to 90
    lng: Number               // -180 to 180
  },
  fullAddress: String,        // Max 500 chars
  street: String,             // Max 200 chars
  city: String,               // Max 100 chars
  state: String,              // Max 100 chars
  pincode: String,            // Max 10 chars
  isDefault: Boolean,         // Default: false
  createdAt: Date
}
```

#### Indexes
- `email` (unique)
- `userId` (unique)
- `googleId` (sparse, unique)

#### Virtual Fields
- `age` - Calculated from dateOfBirth

#### Auto-Generated Fields
- `userId` - Auto-generated on save (P#### for users, A#### for admins)

---

### 2. Appointment
**Collection Name:** `appointments`  
**Model File:** `src/model/appointment.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `appointmentId` | String | Yes | Unique appointment ID (5-digit auto-generated) |
| `patientId` | String | Yes | Reference to User (patient) |
| `doctorId` | String | Yes | Reference to Doctor |
| `hospitalId` | String | Yes | Reference to Hospital |
| `hospitalName` | String | Yes | Hospital name |
| `doctorName` | String | Yes | Doctor name |
| `appointmentDate` | Date | Yes | Appointment date (must be today or future) |
| `appointmentTime` | String | Yes | Time in HH:MM format |
| `reasonForAppointment` | String | Yes | Reason text (max 500 chars) |
| `appointmentType` | String | Yes | Type of appointment |
| `status` | String | Yes | Appointment status |
| `bookingSource` | String | No | Source of booking |
| `bookedByID` | String | No | ID of person who booked |
| `confirmationSent` | Boolean | Yes | Confirmation email sent (default: false) |
| `reminderSent` | Boolean | Yes | Reminder sent (default: false) |
| `followUp` | Object | No | Follow-up appointment details (see below) |
| `batchNumber` | Number | No | Batch number for orchestration (min: 1) |
| `batchStatus` | String | No | Enum: 'pending', 'sent', 'arrived', 'no_show' |
| `suggestedArrivalAt` | Date | No | Suggested arrival time |
| `patientNotes` | String | No | Patient notes (max 1000 chars) |
| `doctorNotes` | String | No | Doctor notes (max 2000 chars) |
| `reportUrls` | Array[String] | Yes | Array of report URLs (default: []) |
| `meetingPlatform` | String | No | Meeting platform name |
| `paymentStatus` | String | Yes | Payment status |
| `paymentAmount` | Number | Yes | Payment amount (min: 0, default: 0) |
| `currency` | String | Yes | Currency code (default: "INR") |
| `paymentMethod` | String | No | Payment method |
| `transactionId` | String | No | Transaction ID (unique, sparse) |
| `cancellationReason` | String | No | Cancellation reason (max 500 chars) |
| `rescheduledFrom` | Object | No | Original appointment details |
| `qrCodeDataUrl` | String | No | QR code data URL |
| `checkInTime` | Date | No | Check-in timestamp |
| `checkOutTime` | Date | No | Check-out timestamp |
| `isCheckedIn` | Boolean | Yes | Check-in status (default: false) |
| `lastScannedDate` | Date | No | Last QR scan date |
| `checkInStatus` | String | Yes | Enum: 'Not Checked-in', 'Checked-in', 'Checked-out' |
| `scannedBy` | String | No | ID of person who scanned |
| `statusHistory` | Array | No | Array of status change records |
| `slotNumber` | Number | No | Slot number (min: 1) |
| `tokenNumber` | Number | No | Token number (min: 1) |
| `tokenDisplay` | String | No | Token display format (e.g., S1T001) |
| `patientAddress` | Object | No | Patient address for ETA (see below) |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

#### Follow-up Object Schema
```javascript
{
  isFollowUp: Boolean,           // Default: false
  parentAppointmentId: String,   // Reference to Appointment
  followUpReason: String,        // Max 500 chars
  createdBy: String,             // Enum: 'admin', 'doctor', 'nurse'
  createdById: String
}
```

#### Patient Address Schema (for ETA)
```javascript
{
  addressId: String,
  addressName: String,          // Max 100 chars
  origin: {
    lat: Number,                 // -90 to 90
    lng: Number                  // -180 to 180
  },
  fullAddress: String            // Max 500 chars
}
```

#### Status History Schema
```javascript
[{
  status: String,
  timestamp: Date,               // Default: Date.now
  changedBy: String              // Reference to User
}]
```

#### Indexes
- `patientId`
- `doctorId`
- `hospitalId`
- `appointmentDate`, `appointmentTime`
- `doctorId`, `appointmentDate`, `status`
- `status`
- `paymentStatus`
- `doctorId`, `appointmentDate`, `slotNumber`, `tokenNumber`
- `tokenDisplay`
- `followUp.isFollowUp`, `patientId`
- `followUp.parentAppointmentId`
- `followUp.createdBy`, `followUp.createdById`

---

### 3. Hospital
**Collection Name:** `hospitals`  
**Model File:** `src/model/hospital.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hospitalId` | String | Yes | Unique hospital ID (format: H####) |
| `name` | String | Yes | Hospital name |
| `email` | String | Yes | Unique email address |
| `phoneNumber` | String | No | Phone number |
| `ambulanceNumber` | String | No | Ambulance contact |
| `address` | Object | No | Address object (see below) |
| `location` | Object | No | GeoJSON Point for geospatial queries |
| `isActive` | Boolean | Yes | Active status (default: true) |
| `departments` | Array | No | Array of department objects (see below) |
| `hospitalType` | String | Yes | Enum: 'Hospital', 'Clinic', 'Consultant' |
| `adminId` | String | Yes | Reference to AdminProfile |
| `registrationNumber` | String | Yes | Registration number |
| `yearEstablished` | Number | No | Year (1900 to current year) |
| `googleMapLink` | String | No | Google Maps link |
| `addressName` | String | No | Address name (max 100 chars) |
| `origin` | Object | No | Coordinates object (lat, lng) |
| `fullAddress` | String | No | Full address (max 500 chars) |
| `rating` | Number | No | Rating (0-5, default: null) |
| `userRatingsTotal` | Number | No | Total ratings count (min: 0, default: 0) |
| `alternativePhone` | String | No | Alternative phone number |
| `emailAddress` | String | No | Alternative email |
| `workingDays` | Array[String] | No | Array of days: Monday-Sunday |
| `startTime` | String | No | Opening time (HH:MM format) |
| `endTime` | String | No | Closing time (HH:MM format) |
| `openAlways` | Boolean | Yes | 24/7 status (default: false) |
| `maxTokenPerDay` | Number | No | Max tokens per day (min: 1) |
| `unlimitedToken` | Boolean | Yes | Unlimited tokens flag (default: false) |
| `documents` | Object | No | Document references (see below) |
| `imageUrl` | String | Yes | Hospital image URL (default placeholder) |
| `patientIds` | Array[String] | No | Array of patient IDs |
| `averageRating` | Number | Yes | Average rating (0-5, default: 0) |
| `about` | String | No | About hospital text |
| `services` | String | No | Services description |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

#### Address Object Schema
```javascript
{
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String              // Default: "India"
}
```

#### Location Object Schema (GeoJSON)
```javascript
{
  type: String,                 // Enum: "Point" (default: "Point")
  coordinates: [Number]         // [longitude, latitude]
}
```

#### Origin Object Schema
```javascript
{
  lat: Number,                  // -90 to 90
  lng: Number                   // -180 to 180
}
```

#### Department Schema
```javascript
[{
  name: String,                 // Required
  headOfDepartment: String,
  departmentHeadDoctorId: String,
  contactNumber: String,
  description: String,
  doctorIds: [String],          // References to Doctor
  total_number_Doctor: Number   // Virtual: doctorIds.length - 1
}]
```

#### Documents Object Schema
```javascript
{
  registrationCertificate: {
    fileName: String,
    fileUrl: String,
    fileKey: String,
    uploadedAt: Date
  },
  accreditation: {
    fileName: String,
    fileUrl: String,
    fileKey: String,
    uploadedAt: Date
  },
  logo: {
    fileName: String,
    fileUrl: String,
    fileKey: String,
    uploadedAt: Date
  },
  hospitalImages: [{
    fileName: String,
    fileUrl: String,
    fileKey: String,
    uploadedAt: Date
  }]
}
```

#### Indexes
- `location` (2dsphere index for geospatial queries)

#### Auto-Generated Fields
- `hospitalId` - Auto-generated on save (H#### format)

---

### 4. Doctor
**Collection Name:** `doctors`  
**Model File:** `src/model/doctor.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `doctorId` | String | Yes | Unique doctor ID (format: D####) |
| `name` | String | Yes | Doctor's full name |
| `email` | String | Yes | Email address (validated) |
| `mobileNumber` | String | Yes | 10-digit mobile number |
| `gender` | String | Yes | Enum: 'Male', 'Female', 'Other' |
| `dateOfBirth` | Date | No | Date of birth |
| `specialization` | String | Yes | Comma-separated specializations (default: "General Medicine") |
| `qualification` | Array[String] | Yes | Array of qualifications (default: []) |
| `registrationNumber` | String | No | Medical registration number |
| `doctorType` | String | No | Type of doctor |
| `serviceStartDate` | Date | Yes | Service start date |
| `experienceYears` | Number | Virtual | Calculated from serviceStartDate |
| `isHeadOfDepartment` | Boolean | Yes | Head of department flag (default: false) |
| `hospitalId` | String | Yes | Reference to Hospital |
| `profileImageUrl` | String | Yes | Profile image URL (default placeholder) |
| `profileImage` | Object | No | Profile image details (see below) |
| `consultantFee` | Number | Yes | Consultation fee (min: 0) |
| `status` | String | Yes | Enum: 'Available', 'Unavailable', 'On Leave', 'Emergency Only' |
| `workingHours` | Array | No | Array of working hour objects (see below) |
| `patientIds` | Array[String] | No | Array of patient IDs |
| `maxAppointment` | String | Yes | Max appointments (default: "20") |
| `unlimitedToken` | Boolean | Yes | Unlimited tokens flag (default: false) |
| `password` | String | No | Password (not selected by default) |
| `isPasswordSet` | Boolean | Yes | Password set flag (default: false) |
| `lastLogin` | Date | No | Last login timestamp |
| `permissions` | Object | No | Permission object (see below) |
| `delays` | Array | No | Array of delay objects (see below) |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

#### Profile Image Object Schema
```javascript
{
  fileName: String,             // Default: null
  fileUrl: String,              // Default: placeholder
  uploadedAt: Date              // Default: null
}
```

#### Working Hours Schema
```javascript
[{
  day: String,                  // Enum: Monday-Sunday
  date: Date,                    // Required, MM/DD/YYYY format
  available: String,            // Enum: 'earlyMorning', 'morning', 'afternoon', 'evening', 'night'
  timeSlots: [{
    startTime: String,           // Required, HH:MM format
    endTime: String              // Required, HH:MM format
  }]
}]
```

#### Permissions Object Schema
```javascript
{
  profile: { enabled: Boolean, viewOnly: Boolean },
  tokenIssued: { enabled: Boolean, viewOnly: Boolean },
  checkedIn: { enabled: Boolean, viewOnly: Boolean },
  userLogs: { enabled: Boolean, viewOnly: Boolean },
  documentsView: { enabled: Boolean, viewOnly: Boolean },
  doctorsList: { enabled: Boolean, viewOnly: Boolean },
  addDoctor: { enabled: Boolean, viewOnly: Boolean },
  editDoctor: { enabled: Boolean, viewOnly: Boolean },
  deleteDoctor: { enabled: Boolean, viewOnly: Boolean },
  todayLogs: { enabled: Boolean, viewOnly: Boolean },
  scanQr: { enabled: Boolean, viewOnly: Boolean },
  uploadDocs: { enabled: Boolean, viewOnly: Boolean }
}
// All default: { enabled: false, viewOnly: false }
```

#### Delays Schema
```javascript
[{
  date: Date,                   // Required
  startTime: String,            // Required, HH:MM format
  durationMinutes: Number,      // Required, 1-480 minutes
  reason: String,               // Required, max 500 chars
  isActive: Boolean,           // Default: true
  createdAt: Date,              // Default: Date.now
  createdBy: String             // Required
}]
```

#### Virtual Fields
- `experienceYears` - Calculated from serviceStartDate

#### Auto-Generated Fields
- `doctorId` - Auto-generated on save (D#### format)

---

### 5. Nurse
**Collection Name:** `nurses`  
**Model File:** `src/model/nurse.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nurseId` | String | Yes | Unique nurse ID (format: N####) |
| `name` | String | Yes | Nurse's full name |
| `email` | String | Yes | Email address (validated) |
| `mobileNumber` | String | Yes | 10-digit mobile number |
| `gender` | String | Yes | Enum: 'Male', 'Female', 'Other' |
| `dateOfBirth` | Date | No | Date of birth |
| `qualification` | Array[String] | Yes | Array of qualifications (default: []) |
| `serviceStartDate` | Date | Yes | Service start date |
| `experienceYears` | Number | Virtual | Calculated from serviceStartDate |
| `hospitalId` | String | Yes | Reference to Hospital |
| `profileImageUrl` | String | Yes | Profile image URL (default placeholder) |
| `profileImage` | Object | No | Profile image details (same as Doctor) |
| `status` | String | Yes | Enum: 'Available', 'On Duty', 'Off Duty', 'On Leave' |
| `workingHours` | Array | No | Array of working hour objects (similar to Doctor) |
| `patientIds` | Array[String] | No | Array of patient IDs |
| `password` | String | No | Password (not selected by default) |
| `isPasswordSet` | Boolean | Yes | Password set flag (default: false) |
| `lastLogin` | Date | No | Last login timestamp |
| `permissions` | Object | No | Permission object (see below) |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

#### Permissions Object Schema
```javascript
{
  profile: { enabled: Boolean, viewOnly: Boolean },
  tokenIssued: { enabled: Boolean, viewOnly: Boolean },
  checkedIn: { enabled: Boolean, viewOnly: Boolean },
  userLogs: { enabled: Boolean, viewOnly: Boolean },
  documentsView: { enabled: Boolean, viewOnly: Boolean },
  nursesList: { enabled: Boolean, viewOnly: Boolean },
  addNurse: { enabled: Boolean, viewOnly: Boolean },
  editNurse: { enabled: Boolean, viewOnly: Boolean },
  deleteNurse: { enabled: Boolean, viewOnly: Boolean },
  todayLogs: { enabled: Boolean, viewOnly: Boolean },
  scanQr: { enabled: Boolean, viewOnly: Boolean },
  uploadDocs: { enabled: Boolean, viewOnly: Boolean }
}
// All default: { enabled: false, viewOnly: false }
```

#### Working Hours Schema
```javascript
[{
  day: String,                  // Enum: Monday-Sunday
  date: Date,                    // Required, MM/DD/YYYY format
  available: String,            // Enum: 'earyMorning', 'morning', 'afternoon', 'night'
  timeSlots: [{
    startTime: String,           // Required
    endTime: String              // Required
  }]
}]
```

#### Virtual Fields
- `experienceYears` - Calculated from serviceStartDate

#### Auto-Generated Fields
- `nurseId` - Auto-generated on save (N#### format)

---

### 6. AdminProfile
**Collection Name:** `adminprofiles`  
**Model File:** `src/model/adminProfile.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `adminId` | String | Yes | Unique admin ID (format: A####) |
| `email` | String | Yes | Unique email address |
| `password` | String | Yes | Hashed password (min 8 chars) |
| `username` | String | Yes | Unique username (3-50 chars) |
| `ownerInfo` | Object | Conditional | Owner information (see below) |
| `ownerDocuments` | Object | No | Owner documents (see below) |
| `hospitalId` | String | Conditional | Reference to Hospital (required if basicInfoCollected) |
| `ownerInfoCollected` | Boolean | Yes | Owner info collection flag (default: false) |
| `basicInfoCollected` | Boolean | Yes | Basic info collection flag (default: false) |
| `addressInfoCollected` | Boolean | Yes | Address info collection flag (default: false) |
| `contactDetailsCollected` | Boolean | Yes | Contact details flag (default: false) |
| `documentsCollected` | Boolean | Yes | Documents collection flag (default: false) |
| `operationDetailsCollected` | Boolean | Yes | Operation details flag (default: false) |
| `verificationStatus` | String | Yes | Enum: 'Pending', 'Approved', 'Rejected', 'On Hold' |
| `isActive` | Boolean | Yes | Active status (default: true) |
| `holdInfo` | Object | No | Hold information (see below) |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |
| `verifiedAt` | Date | No | Verification timestamp |
| `lastLoginAt` | Date | No | Last login timestamp |

#### Owner Info Object Schema
```javascript
{
  name: String,                 // Required if ownerInfoCollected
  mobile: String,              // Required if ownerInfoCollected, 10 digits
  proof: String,               // Enum: 'Aadhar', 'PAN', 'Driving License', 'Voter ID'
  proofNumber: String          // Required if ownerInfoCollected
}
```

#### Owner Documents Object Schema
```javascript
{
  aadharCard: {
    fileName: String,
    fileUrl: String,
    fileKey: String,
    uploadedAt: Date
  },
  panCard: {
    fileName: String,
    fileUrl: String,
    fileKey: String,
    uploadedAt: Date
  }
}
```

#### Hold Info Object Schema
```javascript
{
  holdReason: String,          // Max 500 chars
  holdDate: Date,
  holdBy: String,              // superAdminId
  canBeApprovedLater: Boolean  // Default: true
}
```

#### Indexes
- `email` (unique)
- `username` (unique)
- `adminId` (unique)
- `verificationStatus`
- `isActive`

#### Instance Methods
- `comparePassword(candidatePassword)` - Compare password
- `isOnboardingComplete()` - Check if all 6 steps completed
- `getHospitalDetails()` - Get hospital details
- `isFullyVerified()` - Check if fully verified
- `getOnboardingProgress()` - Get progress percentage (0-100)

#### Static Methods
- `findByEmail(email)` - Find by email
- `findByUsername(username)` - Find by username
- `findPendingVerifications()` - Find pending verifications

#### Auto-Generated Fields
- `adminId` - Auto-generated on save (A#### format)
- `password` - Auto-hashed on save

---

### 7. SuperAdmin
**Collection Name:** `superadmins`  
**Model File:** `src/model/superAdmin.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `superAdminId` | String | Yes | Unique super admin ID (format: SA####) |
| `username` | String | Yes | Unique username (3-50 chars) |
| `email` | String | Yes | Unique email address |
| `password` | String | Yes | Hashed password (min 8 chars) |
| `isActive` | Boolean | Yes | Active status (default: true) |
| `lastLogin` | Date | No | Last login timestamp |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

#### Indexes
- `username` (unique)
- `email` (unique)
- `superAdminId` (unique)
- `isActive`

#### Instance Methods
- `comparePassword(candidatePassword)` - Compare password
- `updateLastLogin()` - Update last login timestamp

#### Static Methods
- `findByUsername(username)` - Find by username
- `findByEmail(email)` - Find by email
- `findActiveSuperAdmins()` - Find active super admins

#### Auto-Generated Fields
- `superAdminId` - Auto-generated on save (SA#### format)
- `password` - Auto-hashed on save

---

### 8. Facility (HospitalDetails)
**Collection Name:** `hospitaldetails`  
**Model File:** `src/model/facility.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hospitalId` | String | Yes | Reference to Hospital (unique) |
| `facilities` | Array[String] | Yes | Array of facility names (default: []) |
| `labs` | Array | No | Array of lab objects (see below) |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

#### Labs Schema
```javascript
[{
  name: String,                 // Required
  servicesOffered: [String],    // Default: []
  contactNumber: String,        // 10 digits
  isOpen24x7: Boolean          // Default: false
}]
```

---

### 9. HospitalFavourite
**Collection Name:** `favourites`  
**Model File:** `src/model/hospitalFavourite.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | String | Yes | Reference to User |
| `favouriteHospitals` | Array | No | Array of favourite hospital objects (see below) |
| `createdAt` | Date | Auto | Creation timestamp |

#### Favourite Hospitals Schema
```javascript
[{
  hospitalId: String,          // Required
  isFavourite: Boolean         // Default: false
}]
```

#### Indexes
- `userId`, `hospitalId` (compound unique)

---

### 10. HospitalReview
**Collection Name:** `hospitalreviews`  
**Model File:** `src/model/hospitalReview.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reviewId` | String | Yes | Unique review ID (8-char alphanumeric) |
| `hospitalId` | String | Yes | Reference to Hospital |
| `patientId` | String | Yes | Patient ID |
| `overallRating` | Number | Yes | Rating 1-5 (0.5 increments) |
| `categoryRatings` | Object | No | Category ratings (see below) |
| `reviewText` | String | Yes | Review text (20-2000 chars, min 5 words) |
| `visitType` | String | Yes | Enum: 'Emergency', 'Inpatient', 'Outpatient', 'Diagnostic', 'Surgery', 'Consultation', 'Maternity' |
| `visitDate` | Date | Yes | Visit date (within last 2 years, not future) |
| `stayDuration` | Number | No | Stay duration in days (0-365) |
| `departmentVisited` | Array[String] | No | Array of department names |
| `wouldRecommend` | Boolean | Yes | Recommendation flag |
| `isVerified` | Boolean | Yes | Verification status (default: false) |
| `isAnonymous` | Boolean | Yes | Anonymous flag (default: false) |
| `verificationDetails` | Object | No | Verification details (see below) |
| `adminResponse` | Object | No | Admin response (see below) |
| `status` | String | Yes | Enum: 'Pending', 'Approved', 'Rejected', 'Hidden', 'Under_Review' |
| `moderationFlags` | Object | No | Moderation flags (see below) |
| `interactionMetrics` | Object | No | Interaction metrics (see below) |
| `metadata` | Object | No | Metadata (see below) |
| `createdAt` | Date | Auto | Creation timestamp (immutable) |
| `updatedAt` | Date | Auto | Last update timestamp |

#### Category Ratings Schema
```javascript
{
  cleanliness: Number,          // 1-5, 0.5 increments
  staffBehavior: Number,        // 1-5, 0.5 increments
  waitingTime: Number,          // 1-5, 0.5 increments
  foodQuality: Number,          // 1-5, 0.5 increments
  amenities: Number,           // 1-5, 0.5 increments
  emergencyResponse: Number     // 1-5, 0.5 increments
}
```

#### Verification Details Schema
```javascript
{
  patientCode: String,
  verifiedBy: String,
  verifiedAt: Date
}
```

#### Admin Response Schema
```javascript
{
  responseText: String,         // Max 1000 chars
  respondedAt: Date,
  respondedBy: String           // Max 100 chars
}
```

#### Moderation Flags Schema
```javascript
{
  isSpam: Boolean,              // Default: false
  isInappropriate: Boolean,      // Default: false
  isFake: Boolean,              // Default: false
  suspicionScore: Number         // 0-10, default: 0
}
```

#### Interaction Metrics Schema
```javascript
{
  helpfulCount: Number,          // Min: 0, default: 0
  reportCount: Number,           // Min: 0, default: 0
  viewCount: Number             // Min: 0, default: 0
}
```

#### Metadata Schema
```javascript
{
  ipAddress: String,            // IPv4 or IPv6 validated
  userAgent: String,            // Max 500 chars
  submissionSource: String      // Enum: 'Web', 'Mobile_App', 'Email_Survey', 'SMS_Survey', 'Paper_Form'
}
```

#### Virtual Fields
- `averageCategoryRating` - Average of category ratings
- `reviewAge` - Days since creation

#### Indexes
- `hospitalId`, `status`
- `overallRating` (descending)
- `createdAt` (descending)
- `visitType`, `status`
- `patientId`, `hospitalId` (compound unique)
- `moderationFlags.suspicionScore` (descending)

---

### 11. Review (DoctorReview)
**Collection Name:** `doctorreviews`  
**Model File:** `src/model/review.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reviewId` | String | Yes | Unique review ID (8-char alphanumeric) |
| `doctorId` | String | Yes | Reference to Doctor |
| `patientId` | String | Yes | Patient ID |
| `overallRating` | Number | Yes | Rating 1-5 (0.5 increments) |
| `categoryRatings` | Object | No | Category ratings (see below) |
| `reviewText` | String | Yes | Review text (15-1500 chars, min 3 words) |
| `visitDate` | Date | Yes | Visit date (within last year, not future) |
| `treatmentType` | String | Yes | Enum: 'Consultation', 'Surgery', 'Treatment', 'Follow-up', 'Emergency', 'Diagnostic', 'Therapy' |
| `appointmentType` | String | Yes | Enum: 'First_Visit', 'Follow_up', 'Second_Opinion', 'Emergency' |
| `treatmentOutcome` | String | No | Enum: 'Excellent', 'Good', 'Satisfactory', 'Poor', 'Ongoing' |
| `wouldRecommend` | Boolean | Yes | Recommendation flag |
| `isVerified` | Boolean | Yes | Verification status (default: false) |
| `isAnonymous` | Boolean | Yes | Anonymous flag (default: false) |
| `verificationDetails` | Object | No | Verification details (see below) |
| `adminResponse` | Object | No | Admin response (see below) |
| `status` | String | Yes | Enum: 'Pending', 'Approved', 'Rejected', 'Hidden', 'Under_Review' |
| `moderationFlags` | Object | No | Moderation flags (same as HospitalReview) |
| `interactionMetrics` | Object | No | Interaction metrics (same as HospitalReview) |
| `metadata` | Object | No | Metadata (see below) |
| `createdAt` | Date | Auto | Creation timestamp (immutable) |
| `updatedAt` | Date | Auto | Last update timestamp |

#### Category Ratings Schema
```javascript
{
  communication: Number,      // 1-5, 0.5 increments
  expertise: Number,           // 1-5, 0.5 increments
  punctuality: Number,         // 1-5, 0.5 increments
  bedSideManner: Number        // 1-5, 0.5 increments
}
```

#### Verification Details Schema
```javascript
{
  appointmentId: String,
  verifiedBy: String,
  verifiedAt: Date
}
```

#### Admin Response Schema
```javascript
{
  responseText: String,        // Max 800 chars
  respondedAt: Date,
  respondedBy: String          // Max 100 chars
}
```

#### Metadata Schema
```javascript
{
  ipAddress: String,           // IPv4 validated
  submissionSource: String     // Enum: 'Web', 'Mobile_App', 'Email_Survey'
}
```

#### Virtual Fields
- `averageCategoryRating` - Average of category ratings
- `reviewAge` - Days since creation

#### Indexes
- `doctorId`, `status`
- `overallRating` (descending)
- `createdAt` (descending)
- `treatmentType`, `status`
- `patientId`, `doctorId` (compound unique)
- `moderationFlags.suspicionScore` (descending)

---

### 12. PatientNotes
**Collection Name:** `patientnotes`  
**Model File:** `src/model/patientNotes.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `noteId` | String | Yes | Unique note ID (8-char alphanumeric) |
| `doctorId` | String | Yes | Reference to Doctor |
| `patientId` | String | Yes | Patient ID |
| `notes` | String | Yes | Notes content (max 2000 chars) |
| `diagnosis` | String | No | Diagnosis text (max 500 chars) |
| `prescription` | Array | No | Array of prescription objects (see below) |
| `visitType` | String | Yes | Enum: 'Regular Checkup', 'Follow-up', 'Emergency', 'Consultation', 'Surgery' |
| `symptoms` | Array[String] | No | Array of symptom strings |
| `vitalSigns` | Object | No | Vital signs object (see below) |
| `followUpDate` | Date | No | Follow-up appointment date |
| `isPrivate` | Boolean | Yes | Private flag (default: false) |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

#### Prescription Schema
```javascript
[{
  medicine: String,            // Required
  dosage: String,              // Required
  frequency: String,           // Required
  duration: String             // Required
}]
```

#### Vital Signs Schema
```javascript
{
  bloodPressure: String,
  heartRate: String,
  temperature: String,
  weight: String,
  height: String
}
```

#### Indexes
- `doctorId`, `patientId`
- `createdAt` (descending)

---

### 13. FCMToken
**Collection Name:** `fcmtokens`  
**Model File:** `src/model/fcmToken.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | String | Yes | Reference to User |
| `fcmToken` | String | Yes | FCM token (unique) |
| `deviceInfo` | Object | No | Device information (see below) |
| `isActive` | Boolean | Yes | Active status (default: true) |
| `lastUsed` | Date | Yes | Last used timestamp (default: Date.now) |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

#### Device Info Schema
```javascript
{
  platform: String,            // Enum: 'ios', 'android', 'web' (default: 'android')
  appVersion: String,          // Default: '1.0.0'
  deviceModel: String,         // Default: 'Unknown'
  osVersion: String             // Default: 'Unknown'
}
```

#### Indexes
- `userId`, `isActive`
- `fcmToken` (unique)

#### Static Methods
- `findActiveTokensByUserId(userId)` - Find active tokens for user
- `deactivateOldTokens(userId, keepLatest)` - Deactivate old tokens

---

### 14. FCMModel (UserToken)
**Collection Name:** `usertokens`  
**Model File:** `src/model/fcmModel.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | String | Yes | Reference to User |
| `fcmToken` | String | No | FCM token |

---

### 15. SearchSuggestion
**Collection Name:** `searchsuggestions`  
**Model File:** `src/model/search.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | String | Yes | Reference to User |
| `lastquery` | Array[String] | Yes | Array of search queries (default: []) |
| `lastSearchedAt` | Date | Yes | Last search timestamp (default: Date.now) |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

#### Indexes
- `userId`

---

### 16. Counter
**Collection Name:** `counters`  
**Model File:** `src/model/counter.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | String | Yes | Counter name (e.g., 'userId_sequence', 'hospitalId') |
| `sequence_value` | Number | Yes | Current sequence value (default: 0) |

#### Usage
Used for auto-generating sequential IDs:
- `userId_sequence` - For user IDs (P####)
- `adminId_sequence` - For admin IDs (A####)
- `hospitalId` - For hospital IDs (H####)
- `doctorId` - For doctor IDs (D####)
- `nurseId` - For nurse IDs (N####)
- `superAdminId` - For super admin IDs (SA####)

---

### 17. NotificationHistory
**Collection Name:** `notificationhistories`  
**Model File:** `src/model/notificationHistory.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | Yes | Notification title (max 200 chars) |
| `body` | String | Yes | Notification body (max 1000 chars) |
| `data` | Mixed | Yes | Additional data object (default: {}) |
| `sentBy` | Object | Yes | Sender information (see below) |
| `recipientType` | String | Yes | Enum: 'all_patients', 'specific_patients', 'hospital' |
| `recipientCount` | Number | Yes | Total recipient count (default: 0) |
| `successfulCount` | Number | Yes | Successful delivery count (default: 0) |
| `failedCount` | Number | Yes | Failed delivery count (default: 0) |
| `status` | String | Yes | Enum: 'pending', 'sending', 'completed', 'failed' |
| `errorMessage` | String | No | Error message if failed |
| `sentAt` | Date | Yes | Sent timestamp (default: Date.now) |
| `completedAt` | Date | No | Completion timestamp |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

#### Sent By Schema
```javascript
{
  superAdminId: String,        // Required, reference to SuperAdmin
  superAdminName: String
}
```

#### Indexes
- `sentBy.superAdminId`
- `sentAt` (descending)
- `status`
- `recipientType`

---

### 18. File (UserHospitalFiles)
**Collection Name:** `userhospitalfiles`  
**Model File:** `src/model/file.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | String | Yes | Reference to User (unique) |
| `hospitals` | Array | No | Array of hospital document objects (see below) |

#### Hospital Documents Schema
```javascript
[{
  hospitalId: String,           // Reference to Hospital
  documents: [{
    fileName: String,           // Required
    mimeType: String,          // Required
    size: Number,              // Required
    fileType: String,          // Required
    fileKey: String,
    fileUrl: String,
    uploadedAt: Date           // Default: Date.now
  }]
}]
```

---

### 19. QAEntry
**Collection Name:** `qaentries`  
**Model File:** `src/model/qaEntry.js`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | String | Yes | Question text (unique, text index) |
| `answer` | String | Yes | Answer text (text index) |
| `category` | String | No | Category (default: 'General', lowercase) |
| `tags` | Array[String] | No | Array of tags (lowercase, text index) |
| `lastUpdatedBy` | ObjectId | No | Reference to User |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

#### Indexes
- Text index on: `question`, `answer`, `category`, `tags`

---

## ID Generation Patterns

### User IDs
- **Format:** `P####` (e.g., P0001, P0002)
- **Counter:** `userId_sequence`
- **Prefix:** `P` for regular users

### Admin IDs
- **Format:** `A####` (e.g., A0001, A0002)
- **Counter:** `adminId_sequence`
- **Prefix:** `A` for admins

### Hospital IDs
- **Format:** `H####` (e.g., H0001, H0002)
- **Counter:** `hospitalId`
- **Prefix:** `H`

### Doctor IDs
- **Format:** `D####` (e.g., D0001, D0002)
- **Counter:** `doctorId`
- **Prefix:** `D`

### Nurse IDs
- **Format:** `N####` (e.g., N0001, N0002)
- **Counter:** `nurseId`
- **Prefix:** `N`

### Super Admin IDs
- **Format:** `SA####` (e.g., SA0001, SA0002)
- **Counter:** `superAdminId`
- **Prefix:** `SA`

### Appointment IDs
- **Format:** 5-digit numeric (e.g., 03433)
- **Generation:** `generate-unique-id` library
- **Pattern:** Numbers only, length 5

### Review IDs
- **Format:** 8-character alphanumeric
- **Generation:** `generate-unique-id` library
- **Pattern:** Numbers and letters, length 8

### Note IDs
- **Format:** 8-character alphanumeric
- **Generation:** `generate-unique-id` library
- **Pattern:** Numbers and letters, length 8

---

## Common Field Patterns

### Timestamps
Most collections include:
- `createdAt` - Auto-set on creation
- `updatedAt` - Auto-updated on save

### Status Fields
Common status enums:
- **Appointment:** Various status strings
- **Check-in:** 'Not Checked-in', 'Checked-in', 'Checked-out'
- **Review:** 'Pending', 'Approved', 'Rejected', 'Hidden', 'Under_Review'
- **Verification:** 'Pending', 'Approved', 'Rejected', 'On Hold'
- **Notification:** 'pending', 'sending', 'completed', 'failed'

### Rating Fields
- Range: 1-5
- Increments: 0.5 (1, 1.5, 2, 2.5, etc.)
- Validation: `Number.isInteger(value * 2)`

### Address Patterns
Two address formats used:
1. **Simple Address Object:**
   ```javascript
   {
     street, city, state, zipCode, country
   }
   ```

2. **GeoJSON Location:**
   ```javascript
   {
     type: "Point",
     coordinates: [longitude, latitude]
   }
   ```

3. **Origin Coordinates:**
   ```javascript
   {
     lat: Number,  // -90 to 90
     lng: Number   // -180 to 180
   }
   ```

### File/Document Pattern
Common document structure:
```javascript
{
  fileName: String,
  fileUrl: String,
  fileKey: String,
  uploadedAt: Date
}
```

---

## Relationships

### User Relationships
- **Appointments:** One-to-many (patientId)
- **Favourites:** One-to-one (userId)
- **Reviews:** One-to-many (patientId)
- **FCM Tokens:** One-to-many (userId)
- **Search Suggestions:** One-to-one (userId)
- **Files:** One-to-one (userId)

### Hospital Relationships
- **Appointments:** One-to-many (hospitalId)
- **Doctors:** One-to-many (hospitalId)
- **Nurses:** One-to-many (hospitalId)
- **Admin:** One-to-one (adminId)
- **Facilities:** One-to-one (hospitalId)
- **Reviews:** One-to-many (hospitalId)
- **Favourites:** Many-to-many (via HospitalFavourite)

### Doctor Relationships
- **Appointments:** One-to-many (doctorId)
- **Hospital:** Many-to-one (hospitalId)
- **Reviews:** One-to-many (doctorId)
- **Patient Notes:** One-to-many (doctorId)
- **Departments:** Many-to-many (via hospital.departments.doctorIds)

### Appointment Relationships
- **Patient:** Many-to-one (patientId → User)
- **Doctor:** Many-to-one (doctorId → Doctor)
- **Hospital:** Many-to-one (hospitalId → Hospital)
- **Follow-up:** Self-referential (followUp.parentAppointmentId)

---

## Indexes Summary

### Most Indexed Fields
- `userId` / `patientId` - User lookups
- `hospitalId` - Hospital lookups
- `doctorId` - Doctor lookups
- `email` - Authentication
- `status` - Filtering
- `createdAt` - Sorting (descending)
- `appointmentDate` - Date range queries

### Compound Indexes
- `userId`, `hospitalId` - Favourites
- `patientId`, `doctorId` - Reviews
- `doctorId`, `appointmentDate`, `status` - Appointment queries
- `hospitalId`, `status` - Review filtering

### Geospatial Indexes
- `location` (2dsphere) - Hospital location queries

### Text Indexes
- `question`, `answer`, `category`, `tags` - QA search

---

## Security Notes

### Fields Not Returned by Default
- `password` / `passwordHash`
- `sessionToken`
- `accessToken`
- `refreshToken`
- `__v` (MongoDB version key)
- `_id` (sometimes excluded)

### Password Hashing
- **Algorithm:** bcrypt
- **Rounds:** 12 (configurable via `BCRYPT_ROUNDS`)
- **Auto-hashed:** On save if modified

### Token Fields
- Stored with `select: false` to prevent accidental exposure
- Removed in `toJSON` transform

---

## Validation Rules

### Email
- Must match email regex pattern
- Stored in lowercase
- Unique where applicable

### Phone Numbers
- 10-digit format for Indian numbers
- Validated with regex: `/^[0-9]{10}$/`

### Dates
- Date of birth: Age validation (0-120 years)
- Appointment dates: Must be today or future
- Visit dates: Must be in past (within specified range)

### Ratings
- Range: 1-5
- Increments: 0.5
- Validation: `Number.isInteger(value * 2)`

### Coordinates
- Latitude: -90 to 90
- Longitude: -180 to 180

### Text Lengths
- Names: 2-50 characters
- Descriptions: Various max lengths (100-2000 chars)
- Review text: 15-2000 characters with word count validation

---

## Notes

1. **ID Generation:** Most IDs are auto-generated using Counter collection
2. **Timestamps:** All collections use `timestamps: true` option
3. **Validation:** Extensive validation on save and update
4. **Indexes:** Optimized for common query patterns
5. **Relationships:** Primarily reference-based (not embedded)
6. **Virtual Fields:** Used for calculated values (age, experience, ratings)
7. **Pre-save Hooks:** Used for ID generation, password hashing, timestamp updates
8. **Text Search:** Full-text search available on QA entries

---

**Last Updated:** November 2025  
**Version:** 1.0

