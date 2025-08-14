# Hospital & API Integration Guide

---

## 1. Hospital Management

### 1.1 Create Hospital (Basic Details)
**Endpoint:** `POST http://localhost:3000/api/hospital/basicDetails`  
**Purpose:** Creates a new hospital (inactive by default).

**Payload Example:**
```json
{
  "name": "Aravind Eye Hospital Madurai",
  "email": "inf12o@aravind.org",
  "phoneNumber": "+91‑452‑4356105",
  "ambulanceNumber": "",
  "address": {
    "street": "Kuruvikaran Salai, Anna Nagar, Shenoy Nagar",
    "city": "Madurai",
    "state": "Tamil Nadu",
    "zipCode": "625020",
    "country": "India"
  },
  "location": {
    "type": "Point",
    "coordinates": [78.1200, 9.9230]
  },
  "departments": [
    {
      "name": "Ophthalmology",
      "headOfDepartment": "Dr. P. Namperumalsamy",
      "departmentHeadDoctorId": "4621",
      "contactNumber": "+91‑452‑4356110",
      "description": "Comprehensive eye care, cataract surgery, retinal care",
      "doctorIds": []
    }
  ],
  "hospitalType": "Specialty hospital",
  "imageUrl": "https://images.unsplash.com/photo-1584467735871-bfb5f53f2f7f?auto=format&fit=crop&w=1470&q=80",
  "patientIds": [],
  "averageRating": 4.5
}
```

### 1.2 Add Facilities & Labs
**Endpoint:** `POST https://api2-cd3vrfxtha-uc.a.run.app/api/hospital/facilities`  
**Purpose:** Adds facilities and lab details to an existing hospital.

**Payload Example:**
```json
{
  "hospitalId": "8626",
  "facilities": [
    "24/7 Emergency Services",
    "Advanced Cardiac Care Unit",
    "CT Scan & MRI Imaging",
    "In-house Pharmacy",
    "Intensive Care Unit (ICU)",
    "Digital X-Ray",
    "Blood Bank"
  ],
  "labs": [
    {
      "name": "Apollo Diagnostics Lab",
      "servicesOffered": ["Blood Tests", "Biochemistry", "Hematology", "Microbiology", "Pathology"],
      "contactNumber": "8026302635",
      "isOpen24x7": true
    },
    {
      "name": "Cardiac Catheterization Lab",
      "servicesOffered": ["Angiography", "Angioplasty", "Cardiac Interventions"],
      "contactNumber": "8026302636",
      "isOpen24x7": true
    }
  ]
}
```

### 1.3 Activate Hospital (Admin Only)
**Endpoints:**
- `GET http://localhost:3000/api/hospital/admin/activate` – Check activation status.
- `POST http://localhost:3000/api/hospital/admin/activate` – Activate hospital.

**Payload Example (POST):**
```json
{
  "hospitalId": "0270"
}
```

---

## 2. Doctor Management

### 2.1 Add Doctor
**Endpoint:** `POST https://api2-cd3vrfxtha-uc.a.run.app/api/doctor/add`  
**Purpose:** Adds a doctor profile with schedule and availability.

**Payload Example:**
```json
{
  "name": "Dr. Priya Sharma",
  "email": "priya5.sharma@example.com",
  "mobileNumber": "9876543210",
  "gender": "Female",
  "dateOfBirth": "07/22/1978",
  "specialization": "Cardiology",
  "qualification": ["MBBS", "MD (Cardiology)"],
  "serviceStartDate": "08/23/2003",
  "isHeadOfDepartment": true,
  "hospitalId": "9442",
  "profileImageUrl": "https://example.com/profiles/priya-sharma.jpg",
  "consultantFee": 1000,
  "status": "Available",
  "workingHours": [
    {
      "day": "Monday",
      "date": "08/23/2025",
      "available": "morning",
      "timeSlots": [
        { "startTime": "09:00", "endTime": "12:00" }
      ]
    },
    {
      "day": "Wednesday",
      "date": "08/24/2025",
      "available": "afternoon",
      "timeSlots": [
        { "startTime": "14:00", "endTime": "17:00" }
      ]
    }
  ],
  "patientIds": []
}
```

### 2.2 Get Doctor Data
- **Appointments by Doctor:**  
  `GET https://api2-cd3vrfxtha-uc.a.run.app/api/appoitment/doctor/{doctorId}`  
  Example: `/5746`

- **Doctor Details:**  
  `GET https://api2-cd3vrfxtha-uc.a.run.app/api/doctor/{doctorId}`  
  Example: `/5746`

---

## 3. Patient Notes & Prescriptions

### 3.1 Get Patient Notes
- **By Patient:** `GET http://localhost:3000/api/patient-notes/patient/{patientId}`  
  Example: `/P0001`
- **By Doctor:** `GET http://localhost:3000/api/patient-notes/doctor/{doctorId}`  
  Example: `/5746`

### 3.2 Create Patient Notes / Prescription
**Endpoint:** `POST http://localhost:3000/api/patient-notes`

**Payload Example:**
```json
{
  "doctorId": "5746",
  "patientId": "P0001",
  "notes": "Patient presented with a persistent cough and mild fever for the past three days. Complains of general fatigue.",
  "diagnosis": "Acute Bronchitis",
  "prescription": [
    { "medicine": "Amoxicillin", "dosage": "500mg", "frequency": "Three times a day", "duration": "7 days" },
    { "medicine": "Cough Syrup", "dosage": "10ml", "frequency": "Twice a day", "duration": "5 days" }
  ],
  "visitType": "Regular Checkup",
  "symptoms": ["Cough", "Fever", "Fatigue", "Sore Throat"],
  "vitalSigns": {
    "bloodPressure": "120/80 mmHg",
    "heartRate": "72 bpm",
    "temperature": "99.8°F",
    "weight": "70 kg",
    "height": "175 cm"
  },
  "followUpDate": "2025-08-01T09:00:00.000Z",
  "isPrivate": false
}
```

---

## 4. QR Code Management

### 4.1 Generate QR Code
**Endpoint:** `POST http://localhost:3000/api/qrgenerator`

**Payload Example:**
```json
{
  "userId": "P0021",
  "appointmentId": "61833"
}
```

### 4.2 Resolve QR Code
**Endpoint:** `GET http://localhost:3000/api/qrgenerator/getdetails`  
**Query Parameters:** `userId`, `appointmentId`

Example:  
```
http://localhost:3000/api/qrgenerator/getdetails?userId=3744&appointmentId=57304
```

---

