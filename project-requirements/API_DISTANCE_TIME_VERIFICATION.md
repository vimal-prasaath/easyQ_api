# API Distance & ApproximateTime Verification

## ✅ Endpoints That Return `distance` and `approximateTime`

### 1. ✅ GET `/api/hospital/{userId}/{hospitalId}`
**Status:** ✅ Returns both fields  
**Controller:** `getHospitalDetails` in `src/controller/hospital.js:422`  
**Implementation:** Fetches hospital separately, calculates distance/time  
**No aggregation issue:** Uses direct hospital query

### 2. ✅ GET `/api/appoitment/{appointmentId}`
**Status:** ✅ Returns both fields (FIXED)  
**Controller:** `getAppointmentById` in `src/controller/appointment.js:238`  
**Implementation:** Now fetches hospital separately (fixed aggregation issue)  
**Aggregation issue:** ✅ FIXED - Was checking `hospitalInfo` which was removed in projection

### 3. ⚠️ GET `/api/appoitment/patient/{patientId}`
**Actual Route:** `GET /api/appoitment/userId/:patientId` (NOT `/patient/:patientId`)  
**Status:** ✅ Returns both fields  
**Controller:** `getAppointmentsByPatient` in `src/controller/appointment.js:35`  
**Implementation:** Fetches hospitals separately, calculates for each appointment  
**No aggregation issue:** Already fetches hospitals separately (lines 50-57)

### 4. ❌ POST `/api/user/getdetails`
**Status:** ❌ Does NOT return distance/time (User details endpoint)  
**Controller:** `finduser` in `src/controller/user.js:42`  
**Note:** This endpoint returns user profile information, not appointment/hospital data

### 5. ❌ GET `/api/user/{userId}`
**Status:** ❌ Route DOES NOT EXIST  
**Actual Route:** `POST /api/user/getUser` (with userId in body)  
**Note:** This endpoint doesn't return distance/time (user profile only)

### 6. ❌ GET `/api/follow-up/patient/{patientId}`
**Status:** ❌ Does NOT return distance/time  
**Controller:** `getFollowUpAppointmentsByPatient` in `src/controller/followUpAppointmentController.js:63`  
**Service:** `FollowUpAppointmentService.getFollowUpAppointmentsByPatient` uses direct `find()` (no aggregation)  
**Issue:** No distance/time calculation implemented  
**Needs Fix:** Should add distance/time calculation similar to other appointment endpoints

### 7. ✅ POST `/api/hospital/location`
**Status:** ✅ Returns both fields  
**Controller:** `getHospitalDetailsBylocation` in `src/controller/hospital.js:498`  
**Implementation:** Fetches hospitals, calculates distance/time for each  
**No aggregation issue:** Uses direct hospital queries

---

## 📊 Summary

| # | Endpoint | Returns Distance/Time? | Aggregation Issue? | Status |
|---|----------|------------------------|---------------------|--------|
| 1 | `GET /api/hospital/{userId}/{hospitalId}` | ✅ Yes | ✅ No | Working |
| 2 | `GET /api/appoitment/{appointmentId}` | ✅ Yes | ✅ Fixed | Fixed |
| 3 | `GET /api/appoitment/userId/{patientId}` | ✅ Yes | ✅ No | Working (Note: route is `/userId/` not `/patient/`) |
| 4 | `POST /api/user/getdetails` | ❌ No | N/A | Not applicable |
| 5 | `GET /api/user/{userId}` | ❌ No | N/A | Route doesn't exist |
| 6 | `GET /api/follow-up/patient/{patientId}` | ❌ No | ✅ No | **Needs implementation** |
| 7 | `POST /api/hospital/location` | ✅ Yes | ✅ No | Working |

---

## 🔧 Issues Found

### 1. Route Path Mismatch (#3)
- **Expected:** `GET /api/appoitment/patient/{patientId}`
- **Actual:** `GET /api/appoitment/userId/:patientId`
- **Action:** Update documentation or route

### 2. Missing Route (#5)
- **Expected:** `GET /api/user/{userId}`
- **Actual:** `POST /api/user/getUser` (with userId in body)
- **Action:** Route doesn't exist, needs to be created or documentation updated

### 3. Missing Distance/Time (#6)
- **Endpoint:** `GET /api/follow-up/patient/{patientId}`
- **Issue:** Does not calculate or return `distance` and `approximateTime`
- **Action:** Add distance/time calculation similar to other appointment endpoints

---

## ✅ All Aggregation Issues Resolved

All endpoints that use aggregation and return distance/time are now correctly implemented:
- ✅ `getAppointmentById` - Fixed to fetch hospital separately
- ✅ `getAppointmentsByPatient` - Already fetches hospitals separately
- ✅ `getAppointmentsByHospital` - Already fetches hospital separately
- ✅ `getUserAppointments` - Uses direct find, fetches hospitals separately

No other aggregation issues found.

