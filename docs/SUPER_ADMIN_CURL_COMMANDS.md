# 🚀 **SUPER ADMIN MANAGEMENT APIs - CURL COMMANDS**

## 📋 **OVERVIEW**
This document provides comprehensive CURL commands for all Super Admin Management APIs including authentication, admin management, and user management.

---

## 🔐 **SUPER ADMIN AUTHENTICATION APIs**

### 1. **Super Admin Signup**
```bash
curl -X POST http://localhost:3000/api/super-admin/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "email": "admin@easyq.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Super admin created successfully",
  "data": {
    "superAdminId": "SA0001",
    "username": "superadmin",
    "email": "admin@easyq.com",
    "isActive": true,
    "createdAt": "2024-01-22T10:00:00.000Z"
  }
}
```

### 2. **Super Admin Login**
```bash
curl -X POST http://localhost:3000/api/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "superAdmin": {
      "superAdminId": "SA0001",
      "username": "superadmin",
      "email": "admin@easyq.com",
      "isActive": true,
      "lastLogin": "2024-01-22T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 👥 **ADMIN MANAGEMENT APIs**

### 3. **Get All Admins**
```bash
curl -X GET "http://localhost:3000/api/super-admin/admins" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "status": "success",
  "message": "Admins retrieved successfully",
  "data": {
    "admins": [
      {
        "adminId": "A0001",
        "name": "John Doe",
        "email": "john@hospital.com",
        "verificationStatus": "Pending",
        "isActive": true,
        "createdAt": "2024-01-22T10:00:00.000Z"
      }
    ],
    "totalCount": 1,
    "filter": "all"
  }
}
```

### 4. **Get Pending Admins**
```bash
curl -X GET "http://localhost:3000/api/super-admin/admins?status=pending" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "status": "success",
  "message": "Admins retrieved successfully",
  "data": {
    "admins": [
      {
        "adminId": "A0001",
        "name": "John Doe",
        "email": "john@hospital.com",
        "verificationStatus": "Pending",
        "isActive": true,
        "createdAt": "2024-01-22T10:00:00.000Z"
      }
    ],
    "totalCount": 1,
    "filter": "pending"
  }
}
```

### 5. **Get Approved Admins**
```bash
curl -X GET "http://localhost:3000/api/super-admin/admins?status=approved" \
  -H "Content-Type: application/json"
```

### 6. **Get Rejected Admins**
```bash
curl -X GET "http://localhost:3000/api/super-admin/admins?status=rejected" \
  -H "Content-Type: application/json"
```

### 7. **Get On Hold Admins**
```bash
curl -X GET "http://localhost:3000/api/super-admin/admins?status=on_hold" \
  -H "Content-Type: application/json"
```

### 8. **Hold Admin**
```bash
curl -X PUT http://localhost:3000/api/super-admin/admins/A0001/hold \
  -H "Content-Type: application/json" \
  -d '{
    "holdReason": "Missing documentation",
    "holdBy": "SA0001",
    "canBeApprovedLater": true
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Admin put on hold successfully",
  "data": {
    "adminId": "A0001",
    "name": "John Doe",
    "email": "john@hospital.com",
    "verificationStatus": "On Hold",
    "holdInfo": {
      "holdReason": "Missing documentation",
      "holdDate": "2024-01-22T10:00:00.000Z",
      "holdBy": "SA0001",
      "canBeApprovedLater": true
    }
  }
}
```

### 9. **Approve Admin**
```bash
curl -X PUT http://localhost:3000/api/super-admin/admins/A0001/approve \
  -H "Content-Type: application/json" \
  -d '{
    "approvedBy": "SA0001"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Admin approved successfully",
  "data": {
    "adminId": "A0001",
    "name": "John Doe",
    "email": "john@hospital.com",
    "verificationStatus": "Approved",
    "isActive": true
  }
}
```

### 10. **Reject Admin**
```bash
curl -X PUT http://localhost:3000/api/super-admin/admins/A0001/reject \
  -H "Content-Type: application/json" \
  -d '{
    "rejectedBy": "SA0001",
    "reason": "Incomplete documentation"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Admin rejected successfully",
  "data": {
    "adminId": "A0001",
    "name": "John Doe",
    "email": "john@hospital.com",
    "verificationStatus": "Rejected",
    "isActive": false
  }
}
```

### 11. **Activate Admin (Existing API)**
```bash
curl -X PUT http://localhost:3000/api/admin/user/activate/A0001 \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": true
  }'
```

---

## 👤 **USER MANAGEMENT APIs**

### 12. **Get All Users (Page 1)**
```bash
curl -X GET "http://localhost:3000/api/super-admin/users?page=1&limit=10" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "status": "success",
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "userId": "P0001",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phoneNumber": "+1234567890",
        "role": "user",
        "isActive": true,
        "createdAt": "2024-01-22T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 50,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 13. **Get All Users (Page 2)**
```bash
curl -X GET "http://localhost:3000/api/super-admin/users?page=2&limit=10" \
  -H "Content-Type: application/json"
```

### 14. **Get All Users (Large Page)**
```bash
curl -X GET "http://localhost:3000/api/super-admin/users?page=1&limit=50" \
  -H "Content-Type: application/json"
```

---

## 📅 **USER APPOINTMENTS HISTORY APIs**

### 15. **Get User All Appointments**
```bash
curl -X GET "http://localhost:3000/api/super-admin/users/P0001/appointments" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "status": "success",
  "message": "User appointments retrieved successfully",
  "data": {
    "userId": "P0001",
    "appointments": [
      {
        "appointmentId": "APT001",
        "patientId": "P0001",
        "doctorId": "D0001",
        "hospitalId": "H0002",
        "appointmentDate": "2024-01-22T00:00:00.000Z",
        "appointmentTime": "10:00",
        "status": "Completed",
        "consultationType": "General",
        "createdAt": "2024-01-20T10:00:00.000Z"
      }
    ],
    "totalCount": 1,
    "filters": {}
  }
}
```

### 16. **Get User Appointments by Date**
```bash
curl -X GET "http://localhost:3000/api/super-admin/users/P0001/appointments?date=2024-01-01" \
  -H "Content-Type: application/json"
```

### 17. **Get User Appointments by Status**
```bash
curl -X GET "http://localhost:3000/api/super-admin/users/P0001/appointments?status=Completed" \
  -H "Content-Type: application/json"
```

### 18. **Get User Appointments by Multiple Status**
```bash
curl -X GET "http://localhost:3000/api/super-admin/users/P0001/appointments?status=Completed,Scheduled" \
  -H "Content-Type: application/json"
```

### 19. **Get User Appointments by Date Range**
```bash
curl -X GET "http://localhost:3000/api/super-admin/users/P0001/appointments?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Content-Type: application/json"
```

### 20. **Get User Appointments with Combined Filters**
```bash
curl -X GET "http://localhost:3000/api/super-admin/users/P0001/appointments?startDate=2024-01-01&endDate=2024-01-31&status=Completed" \
  -H "Content-Type: application/json"
```

---

## 🔧 **ERROR RESPONSES**

### **Validation Error (400)**
```json
{
  "status": "error",
  "message": "Username, email, and password are required",
  "error": {
    "type": "ValidationError",
    "code": 400,
    "isOperational": true
  }
}
```

### **Authentication Error (401)**
```json
{
  "status": "error",
  "message": "Invalid username or password",
  "error": {
    "type": "AuthenticationError",
    "code": 401,
    "isOperational": true
  }
}
```

### **Not Found Error (404)**
```json
{
  "status": "error",
  "message": "Admin A0001 not found",
  "error": {
    "type": "NotFoundError",
    "code": 404,
    "isOperational": true
  }
}
```

### **Internal Server Error (500)**
```json
{
  "status": "error",
  "message": "Failed to create super admin",
  "error": {
    "type": "InternalServerError",
    "code": 500,
    "isOperational": true
  }
}
```

---

## 📝 **NOTES**

### **API Features:**
- ✅ **Open APIs** - No authentication required (as requested)
- ✅ **Rate Limited** - Protected against abuse
- ✅ **Comprehensive Error Handling** - Detailed error responses
- ✅ **Pagination Support** - For user lists
- ✅ **Flexible Filtering** - Date ranges, status filters
- ✅ **Hold Functionality** - Admin hold with reason tracking

### **Status Values:**
- **Admin Status:** `Pending`, `Approved`, `Rejected`, `On Hold`
- **Appointment Status:** `Scheduled`, `Completed`, `Cancelled`, `No-show`, etc.

### **Pagination:**
- **Default:** page=1, limit=10
- **Response includes:** currentPage, totalPages, totalCount, hasNextPage, hasPrevPage

### **Date Formats:**
- **Input:** `YYYY-MM-DD` (e.g., `2024-01-22`)
- **Output:** ISO 8601 format (e.g., `2024-01-22T10:00:00.000Z`)

---

## 🚀 **QUICK START**

1. **Create Super Admin:**
   ```bash
   curl -X POST http://localhost:3000/api/super-admin/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "email": "admin@easyq.com", "password": "password123"}'
   ```

2. **Login Super Admin:**
   ```bash
   curl -X POST http://localhost:3000/api/super-admin/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "password123"}'
   ```

3. **Get Pending Admins:**
   ```bash
   curl -X GET "http://localhost:3000/api/super-admin/admins?status=pending"
   ```

4. **Get All Users:**
   ```bash
   curl -X GET "http://localhost:3000/api/super-admin/users?page=1&limit=10"
   ```

---

**🎯 All APIs are ready for testing and production use!**
