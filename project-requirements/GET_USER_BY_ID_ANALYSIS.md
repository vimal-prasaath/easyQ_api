# Analysis: GET /api/user/{userId} Endpoint

## 📋 Current Status

**❌ NO - The endpoint `GET /api/user/{userId}` does NOT exist in the codebase.**

---

## 🔍 Current Implementation

### Existing User Endpoints

The current user routes are defined in `src/routes/user/index.js`:

```1:18:src/routes/user/index.js
import express from 'express';
import {getAllUser,updateUser,finduser, deleteUser , resetUserPassword , activateUser, getAllInActiveUser} from "../../controller/user.js"
import authorizeRoles from '../../middleware/authorization.js';
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js"
const router = express.Router();

router.get('/', authorizeRoles, getAllUser)
router.get('/admins',authorizeRoles,getAllInActiveUser)

router.put('/:userId', authorizeOwnerOrAdmin, updateUser);
router.put('/activate/:userId',authorizeRoles, activateUser);
router.put('/reset-password', authorizeOwnerOrAdmin, resetUserPassword);

router.get('/getUser', authorizeOwnerOrAdmin, finduser);
router.delete('/delete/:userId',  authorizeOwnerOrAdmin, deleteUser)


export default router;
```

### Current "Get User by ID" Implementation

**Endpoint:** `POST /api/user/getUser`  
**Method:** POST (not GET)  
**Controller:** `finduser` in `src/controller/user.js`  
**Request:** userId in request body (not URL parameter)

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

**Current Usage:**
```json
POST /api/user/getUser
{
  "userId": "P0001"
}
```

---

## 📊 Pattern Analysis Across Codebase

### Comparison with Other Entities

| Entity | GET by ID Endpoint | Method | Parameter Location | Pattern |
|--------|-------------------|--------|-------------------|---------|
| **User** | `POST /api/user/getUser` | POST | Request Body | ❌ Non-RESTful |
| **Admin** | `GET /api/admin/:adminId` | GET | URL Parameter | ✅ RESTful |
| **Doctor** | `POST /api/doctor/get` | POST | Request Body | ❌ Non-RESTful |
| **Nurse** | `POST /api/nurse/get` | POST | Request Body | ❌ Non-RESTful |
| **Appointment** | `GET /api/appointment/:appointmentId` | GET | URL Parameter | ✅ RESTful |

### Admin Implementation (RESTful Pattern)

```49:49:src/routes/admin/index.js
router.get('/:adminId', authenticateAdmin, getAdminDetails);
```

```324:342:src/controller/admin.js
export const getAdminDetails = async (req, res, next) => {
    try {
        const { adminId } = req.params;

        if (!adminId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Admin ID is required.")
            );
        }

        const result = await AdminService.getAdminById(adminId);

        return res.status(httpStatusCode.OK).json(
            constructResponse(true, httpStatusCode.OK, "Admin details retrieved successfully", result)
        );
    } catch (error) {
        next(error);
    }
};
```

### Doctor Implementation (Non-RESTful Pattern)

```11:11:src/routes/doctor/index.js
router.post("/get", authorizeOwnerOrAdmin, getDoctor)
```

```77:136:src/controller/doctor.js
export async function getDoctor(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'get_doctor' });

    try {
        const { doctorId } = req.body;
        
        if (!doctorId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ResponseFormatter.formatErrorResponse({
                    message: "doctorId is required in request body",
                    statusCode: httpStatusCode.BAD_REQUEST
                })
            );
        }
        
        doctorLogger.info('Doctor retrieval started', {
            userId: req.user?.userId,
            doctorId
        });

        const doctor = await DoctorService.getDoctorById(doctorId);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Doctor retrieved successfully",
            data: { doctor },
            statusCode: httpStatusCode.OK
        });

        // ... logging and response
    } catch (error) {
        next(error);
    }
}
```

---

## 🏗️ Route Registration Analysis

### Route Registration in app.js

```166:172:src/app.js
app.use("/api/user", userAddressRoutes);
app.use("/api/user", userDocumentsRoutes);
app.use("/api/follow-up", followUpAppointmentRoutes);
app.use("/api/super-admin", superAdminRoutes);

// 13. API routes (authentication will be applied per route basis)
app.use("/api", apiRoutes);
```

### Protected Routes Configuration

User routes are also registered through the protected routes system:

```124:127:src/config/protectedRouterConfig.js
    //user
    { path: '/user/:userId', method: 'put', resourceType: 'profile', action: 'update', resourceIdParamName: 'userId', handlers: [updateUser] },
    { path: '/user/getdetails', method: 'post', resourceType: 'profile', action: 'read', handlers: [finduser] },
    { path: '/user/delete/:userId', method: 'delete', resourceType: 'profile', action: 'delete', resourceIdParamName: 'userId', handlers: [deleteUser] },
```

**Note:** There's no GET route for `/user/:userId` in the protected routes config.

---

## 🔍 Service Layer Analysis

The `UserService.getUserById()` method exists and is ready to use:

```27:50:src/services/userService.js
static async getUserById(userId) {
    try {
        const user = await User.findOne({ userId: userId }).select('-_id -__v');
        if (!user) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'User not found.'
            );
        }
        return user;
    } catch (error) {
        if (error instanceof EasyQError) {
            throw error;
        }
        throw new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to find user: ${error.message}`
        );
    }
}
```

---

## ✅ Recommendation

### Option 1: Add RESTful GET Endpoint (Recommended)

Add a new GET endpoint following the Admin pattern:

**Route:**
```javascript
router.get('/:userId', authorizeOwnerOrAdmin, getUserById);
```

**Controller:**
```javascript
export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
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

**Benefits:**
- ✅ RESTful API design
- ✅ Consistent with Admin endpoint pattern
- ✅ Standard HTTP method (GET for retrieval)
- ✅ URL parameter is more intuitive
- ✅ Can be cached by HTTP caches
- ✅ Better for API documentation tools

**Route Ordering Consideration:**
The route must be placed **after** specific routes like `/admins` and `/getUser` to avoid route conflicts:

```javascript
router.get('/', authorizeRoles, getAllUser)
router.get('/admins', authorizeRoles, getAllInActiveUser)
router.get('/getUser', authorizeOwnerOrAdmin, finduser) // Keep for backward compatibility
router.get('/:userId', authorizeOwnerOrAdmin, getUserById) // New RESTful endpoint
```

### Option 2: Keep Current Implementation

Keep `POST /api/user/getUser` for backward compatibility but document it as legacy.

---

## 📝 Implementation Checklist

If implementing Option 1:

- [ ] Add `getUserById` controller function in `src/controller/user.js`
- [ ] Add route `router.get('/:userId', ...)` in `src/routes/user/index.js`
- [ ] Ensure route ordering (specific routes before parameterized routes)
- [ ] Add route to `protectedRouterConfig.js` if using protected routes
- [ ] Update Swagger documentation
- [ ] Test with existing authorization middleware
- [ ] Consider keeping `POST /api/user/getUser` for backward compatibility
- [ ] Update API documentation

---

## 🔐 Authorization

The endpoint should use the same authorization as the current implementation:

```javascript
authorizeOwnerOrAdmin
```

This middleware allows:
- Users to access their own profile
- Admins to access any user profile

---

## 📊 Summary

| Aspect | Current | Recommended |
|--------|---------|------------|
| **Endpoint** | `POST /api/user/getUser` | `GET /api/user/:userId` |
| **Method** | POST | GET |
| **Parameter** | Request Body | URL Parameter |
| **RESTful** | ❌ No | ✅ Yes |
| **Consistency** | ❌ Inconsistent | ✅ Matches Admin pattern |
| **HTTP Cache** | ❌ Not cacheable | ✅ Cacheable |

---

**Last Updated:** November 2025  
**Status:** Analysis Complete - Implementation Recommended

