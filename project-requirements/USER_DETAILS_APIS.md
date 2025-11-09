# APIs Returning Full User Details from User Model

## 📋 Overview

This document lists all API endpoints that return **complete user details** from the `userProfile` model in the EasyQ API codebase. Only APIs that return the full user object (not partial data) are included.

---

## 🔍 User Model Structure

The `userProfile` model contains the following fields:
- `userId` (String, unique)
- `name` (String)
- `gender` (String: 'male', 'female', 'other')
- `dateOfBirth` (Date)
- `role` (String: 'user', 'admin', 'doctor')
- `email` (String, unique)
- `phoneNumber` (String, required)
- `location` (String)
- `addresses` (Array of address objects)
- `isActive` (Boolean)
- `profileUpadate` (Boolean)
- `lastLoginAt` (Date)
- `createdAt` (Date)
- `updatedAt` (Date)

**Note:** Sensitive fields like `passwordHash`, `sessionToken`, `accessToken`, `refreshToken` are excluded from responses by default.

---

## 📡 API Endpoints Returning Full User Details

### 1. **Get User by ID**
**Endpoint:** `POST /api/user/getUser`  
**Method:** POST  
**Controller:** `finduser` in `src/controller/user.js`  
**Service:** `UserService.getUserById(userId)`  
**Route:** `src/routes/user/index.js`  
**Authorization:** `authorizeOwnerOrAdmin` middleware

**Request Body:**
```json
{
  "userId": "P0001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User found successfully",
  "data": {
    "user": {
      "userId": "P0001",
      "name": "John Doe",
      "gender": "male",
      "dateOfBirth": "1990-01-15T00:00:00.000Z",
      "role": "user",
      "email": "john@example.com",
      "phoneNumber": "+919876543210",
      "location": "Bangalore",
      "addresses": [],
      "isActive": true,
      "profileUpadate": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  },
  "statusCode": 200
}
```

**Code Reference:**
```42:57:src/controller/user.js
export const finduser = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await UserService.getUserById(userId);
    
    const response = ResponseFormatter.formatSuccessResponse({
      message: "User found successfully",
      data: { user },
      statusCode: httpStatusCode.OK
    });
    
    res.status(httpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
}
```

---

### 2. **Get All Users**
**Endpoint:** `GET /api/user`  
**Method:** GET  
**Controller:** `getAllUser` in `src/controller/user.js`  
**Service:** `UserService.getAllUsers()`  
**Route:** `src/routes/user/index.js`  
**Authorization:** `authorizeRoles` middleware

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "userId": "P0001",
        "name": "John Doe",
        "email": "john@example.com",
        "phoneNumber": "+919876543210",
        // ... other user fields
      }
    ]
  },
  "meta": {
    "count": 10
  },
  "statusCode": 200
}
```

**Code Reference:**
```7:22:src/controller/user.js
export const getAllUser = async (req, res, next) => {
  try {
    const users = await UserService.getAllUsers();
    
    const response = ResponseFormatter.formatSuccessResponse({
      message: "Users retrieved successfully",
      data: { users },
      meta: { count: users.length },
      statusCode: httpStatusCode.OK
    });
    
    res.status(httpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
}
```

---

### 3. **Update User**
**Endpoint:** `PUT /api/user/:userId`  
**Method:** PUT  
**Controller:** `updateUser` in `src/controller/user.js`  
**Service:** `UserService.updateUser(userId, updateData)`  
**Route:** `src/routes/user/index.js`  
**Authorization:** `authorizeOwnerOrAdmin` middleware

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "gender": "male",
  "dateOfBirth": "1990-01-15",
  "email": "john.updated@example.com",
  "mobileNumber": "+919876543210",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "userId": "P0001",
      "name": "John Doe Updated",
      "email": "john.updated@example.com",
      // ... updated user fields
    }
  },
  "statusCode": 200
}
```

**Code Reference:**
```24:41:src/controller/user.js
export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const updatedUser = await UserService.updateUser(userId, updateData);
    
    const response = ResponseFormatter.formatSuccessResponse({
      message: "User updated successfully",
      data: { user: updatedUser },
      statusCode: httpStatusCode.OK
    });
    
    res.status(httpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
}
```

---

### 4. **Get All Inactive Users (Admins)**
**Endpoint:** `GET /api/user/admins`  
**Method:** GET  
**Controller:** `getAllInActiveUser` in `src/controller/user.js`  
**Service:** `UserService.getAllInActiveUsers()`  
**Route:** `src/routes/user/index.js`  
**Authorization:** `authorizeRoles` middleware

**Response:**
```json
{
  "success": true,
  "message": "Inactive users retrieved successfully",
  "data": {
    "users": [
      {
        "userId": "A0001",
        "name": "Admin User",
        "email": "admin@example.com",
        "isActive": false,
        // ... other user fields
      }
    ]
  },
  "meta": {
    "count": 5
  },
  "statusCode": 200
}
```

**Code Reference:**
```163:178:src/controller/user.js
export const getAllInActiveUser = async (req, res, next) => {
    try {
        const inactiveUsers = await UserService.getAllInActiveUsers(); 
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Inactive users retrieved successfully",
            data: { users: inactiveUsers },
            meta: { count: inactiveUsers.length },
            statusCode: httpStatusCode.OK
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) { 
        next(error); 
    }
}
```

---

### 5. **Activate User**
**Endpoint:** `PUT /api/user/activate/:userId`  
**Method:** PUT  
**Controller:** `activateUser` in `src/controller/user.js`  
**Service:** `UserService.activateUser(userId)`  
**Route:** `src/routes/user/index.js`  
**Authorization:** `authorizeRoles` middleware

**Response:**
```json
{
  "success": true,
  "message": "Admin user activated successfully.",
  "data": {
    "user": {
      "userId": "A0001",
      "name": "Admin User",
      "isActive": true,
      // ... other user fields
    }
  },
  "statusCode": 200
}
```

**Code Reference:**
```133:146:src/controller/user.js
export const activateUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const activatedUser = await UserService.activateUser(userId);
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Admin user activated successfully.",
            data: { user: activatedUser },
            statusCode: httpStatusCode.OK
        });
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}
```

---

### 6. **Reset User Password**
**Endpoint:** `PUT /api/user/reset-password`  
**Method:** PUT  
**Controller:** `resetUserPassword` in `src/controller/user.js`  
**Service:** `UserService.resetPassword(userId, password)`  
**Route:** `src/routes/user/index.js`  
**Authorization:** `authorizeOwnerOrAdmin` middleware

**Request Body:**
```json
{
  "userId": "P0001",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User password reset successfully",
  "data": {
    "user": {
      "userId": "P0001",
      "name": "John Doe",
      // ... user fields (passwordHash excluded)
    }
  },
  "statusCode": 200
}
```

**Code Reference:**
```148:161:src/controller/user.js
export const resetUserPassword = async (req, res, next) => {
    try {
        const { userId ,password} = req.body;
        const updatedUser = await UserService.resetPassword(userId, password);
        const response = ResponseFormatter.formatSuccessResponse({
            message: "User password reset successfully",
            data: { user: updatedUser },
            statusCode: httpStatusCode.OK
        });
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}
```

---

### 7. **Search Users**
**Endpoint:** `GET /api/user/search?search=query&page=1&limit=10&sortBy=createdAt&sortOrder=desc`  
**Method:** GET  
**Controller:** `searchUsers` in `src/controller/user.js`  
**Service:** `UserService.searchUsers(search, options)`  
**Route:** Defined in protected routes  
**Authorization:** Required

**Query Parameters:**
- `search` (String): Search query
- `page` (Number): Page number
- `limit` (Number): Results per page
- `sortBy` (String): Field to sort by
- `sortOrder` (String): 'asc' or 'desc'

**Response:**
```json
{
  "success": true,
  "message": "Users search completed successfully",
  "data": [
    {
      "userId": "P0001",
      "name": "John Doe",
      "email": "john@example.com",
      // ... user fields
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 50,
      "hasNext": true,
      "hasPrev": false
    },
    "searchQuery": "john"
  },
  "statusCode": 200
}
```

**Code Reference:**
```93:114:src/controller/user.js
export const searchUsers = async (req, res, next) => {
  try {
    const { search, page, limit, sortBy, sortOrder } = req.query;
    const options = { page: Number(page), limit: Number(limit), sortBy, sortOrder };
    
    const result = await UserService.searchUsers(search, options);
    
    const response = ResponseFormatter.formatSuccessResponse({
      message: "Users search completed successfully",
      data: result.users,
      meta: {
        pagination: result.pagination,
        searchQuery: search
      },
      statusCode: httpStatusCode.OK
    });
    
    res.status(httpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
}
```

---

### 8. **Get User Statistics**
**Endpoint:** `GET /api/user/stats`  
**Method:** GET  
**Controller:** `getUserStats` in `src/controller/user.js`  
**Service:** `UserService.getUserStats()`  
**Route:** Defined in protected routes  
**Authorization:** Required

**Response:**
```json
{
  "success": true,
  "message": "User statistics retrieved successfully",
  "data": {
    "totalUsers": 100,
    "activeUsers": 85,
    "inactiveUsers": 15,
    "usersByGender": [
      { "_id": "male", "count": 50 },
      { "_id": "female", "count": 45 },
      { "_id": "other", "count": 5 }
    ],
    "recentUsers": [
      {
        "userId": "P0001",
        "name": "John Doe",
        // ... user fields
      }
    ]
  },
  "statusCode": 200
}
```

**Code Reference:**
```116:130:src/controller/user.js
export const getUserStats = async (req, res, next) => {
  try {
    const stats = await UserService.getUserStats();
    
    const response = ResponseFormatter.formatSuccessResponse({
      message: "User statistics retrieved successfully",
      data: stats,
      statusCode: httpStatusCode.OK
    });
    
    res.status(httpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
}
```

---

### 9. **Get All Users (Super Admin)**
**Endpoint:** `GET /api/super-admin/users`  
**Method:** GET  
**Controller:** `getAllUsers` in `src/controller/superAdminController.js`  
**Route:** `src/routes/superAdmin/index.js`  
**Authorization:** Super Admin only

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "userId": "P0001",
        "name": "John Doe",
        // ... all user fields
      }
    ]
  },
  "statusCode": 200
}
```

---

## 📊 Summary Table

| # | Endpoint | Method | Returns Full User Object | Authorization |
|---|----------|--------|--------------------------|----------------|
| 1 | `/api/user/getUser` | POST | ✅ | `authorizeOwnerOrAdmin` |
| 2 | `/api/user` | GET | ✅ | `authorizeRoles` |
| 3 | `/api/user/:userId` | PUT | ✅ | `authorizeOwnerOrAdmin` |
| 4 | `/api/user/admins` | GET | ✅ | `authorizeRoles` |
| 5 | `/api/user/activate/:userId` | PUT | ✅ | `authorizeRoles` |
| 6 | `/api/user/reset-password` | PUT | ✅ | `authorizeOwnerOrAdmin` |
| 7 | `/api/user/search` | GET | ✅ | Required |
| 8 | `/api/user/stats` | GET | ✅ (in recentUsers array) | Required |
| 9 | `/api/super-admin/users` | GET | ✅ | Super Admin |

---

## 🔐 Security Notes

1. **Sensitive Fields Excluded:** All endpoints automatically exclude sensitive fields:
   - `passwordHash`
   - `sessionToken`
   - `accessToken`
   - `refreshToken`
   - `_id` (MongoDB internal ID)
   - `__v` (MongoDB version key)

2. **Authorization:** Most endpoints require proper authorization:
   - `authorizeOwnerOrAdmin`: User can access their own data or admin can access any
   - `authorizeRoles`: Role-based access control
   - Super Admin endpoints: Only super admin access

3. **Data Filtering:** The `toJSON` transform in the user model automatically removes sensitive fields:
```181:191:src/model/userProfile.js
toJSON: { 
    transform: function(doc, ret) {
        delete ret.passwordHash;
        delete ret.sessionToken;
        delete ret.accessToken;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
    },
},
```

---

## 📝 Notes

- **All listed APIs return complete user objects** from the `userProfile` model
- All user detail endpoints use the `UserService` class methods
- The user model is located at `src/model/userProfile.js`
- User IDs follow the pattern: `P####` for users, `A####` for admins
- The `profileUpadate` field (note: typo in model) indicates if user has completed profile setup
- Addresses are stored as an array within the user document
- All timestamps are in ISO 8601 format
- **Excluded APIs:** Login, Signup, and VerifyToken endpoints are not included as they only return partial user data (userId, email, name, etc.)

---

**Last Updated:** November 2025  
**Version:** 1.0

