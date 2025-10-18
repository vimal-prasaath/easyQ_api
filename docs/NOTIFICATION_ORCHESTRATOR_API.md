# Notification Orchestrator APIs

This document provides curl commands for the notification orchestrator endpoints that handle ETA calculations and Places autocomplete functionality.

## Base URL
Replace `{{BASE_URL}}` with your server URL:
- Local: `http://localhost:3000`
- Production: `https://your-domain.com`

---

## ETA/Distance API

Calculate travel time and distance between two points using Google Maps.

### Endpoint
`POST /api/orchestrator/eta`

### Request Body
```json
{
  "origin": { "lat": 12.9716, "lng": 77.5946 },
  "destination": { "lat": 12.9352, "lng": 77.6245 },
  "mode": "driving",
  "departureTime": "now",
  "includePolyline": false
}
```

### Parameters
- `origin` (required): Object with `lat` and `lng` numbers
- `destination` (required): Object with `lat` and `lng` numbers
- `mode` (optional): "driving" | "walking" | "bicycling" | "transit" (default: "driving")
- `departureTime` (optional): "now" | ISO datetime string (default: "now")
- `avoid` (optional): Array of "tolls" | "highways" | "ferries"
- `includePolyline` (optional): Boolean to include route polyline (default: false)
- `includeRaw` (optional): Boolean to include raw Google response (default: false)

### Curl Example
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

### Response
```json
{
  "status": "success",
  "data": {
    "distanceMeters": 12345,
    "durationSeconds": 1800,
    "durationInTrafficSeconds": 2100,
    "text": {
      "distance": "12.3 km",
      "duration": "30 mins"
    },
    "originName": "MG Road, Bengaluru, Karnataka, India",
    "destinationName": "Koramangala, Bengaluru, Karnataka, India",
    "polyline": null
  }
}
```

---

## Places Autocomplete API

Get place suggestions with lat/lng coordinates from text input.

### Endpoint
`POST /api/orchestrator/places/autocomplete`

### Request Body
```json
{
  "input": "St Johns Bengaluru",
  "sessionToken": "optional-session-token",
  "country": "IN"
}
```

### Parameters
- `input` (required): String with minimum 3 characters
- `sessionToken` (optional): String for session correlation (recommended for billing optimization)
- `locationBias` (optional): Object with `lat` and `lng` to bias results
- `radiusMeters` (optional): Number for search radius when using locationBias
- `country` (optional): 2-letter ISO country code (e.g., "IN" for India)

### Curl Example
```bash
curl -X POST "{{BASE_URL}}/api/orchestrator/places/autocomplete" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "St Johns Bengaluru",
    "sessionToken": "optional-session-token",
    "country": "IN"
  }'
```

### Response
```json
{
  "status": "success",
  "data": {
    "predictions": [
      {
        "placeId": "ChIJd8BlQ2BZwokRAFQEcDlJRAI",
        "addressName": "St. John's Medical College",
        "origin": {
          "lat": 12.9352,
          "lng": 77.6245
        },
        "fullAddress": "Sarjapur Road, Bengaluru, Karnataka, India",
        "description": "St. John's Medical College, Sarjapur Road, Bengaluru, Karnataka, India",
        "types": ["hospital", "establishment", "point_of_interest"]
      }
    ]
  }
}
```

---

## Manual Notification Testing APIs

### Send Manual 2-Hour Reminder

Manually trigger a 2-hour reminder notification for testing purposes.

#### Endpoint
`POST /api/orchestrator/notifications/2hour-reminder`

#### Request Body
```json
{
  "patientId": "P0001",
  "appointmentId": "12345"
}
```

#### Parameters
- `patientId` (required): Patient ID
- `appointmentId` (optional): Specific appointment ID (if not provided, sends to all scheduled appointments)

#### Curl Example
```bash
curl -X POST "{{BASE_URL}}/api/orchestrator/notifications/2hour-reminder" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "P0001",
    "appointmentId": "12345"
  }'
```

#### Response
```json
{
  "status": "success",
  "message": "Sent 2-hour reminders for 1 appointment(s)",
  "data": [
    {
      "appointmentId": "12345",
      "tokensSent": 2,
      "message": "2-hour reminder sent successfully"
    }
  ]
}
```

### Send Location-Based Departure Notification

Manually trigger a location-based departure notification with ETA calculation.

#### Endpoint
`POST /api/orchestrator/notifications/location-based`

#### Request Body
```json
{
  "patientId": "P0001",
  "appointmentId": "12345"
}
```

#### Parameters
- `patientId` (required): Patient ID
- `appointmentId` (optional): Specific appointment ID

#### Curl Example
```bash
curl -X POST "{{BASE_URL}}/api/orchestrator/notifications/location-based" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "P0001",
    "appointmentId": "12345"
  }'
```

#### Response
```json
{
  "status": "success",
  "message": "Location-based departure notification sent successfully",
  "data": {
    "appointmentId": "12345",
    "travelTimeMinutes": 25,
    "suggestedDepartureTime": "2024-01-22T13:30:00.000Z",
    "hospitalName": "St. John's Medical College",
    "tokensSent": 2
  }
}
```

### Send Doctor Delay Notification

Manually trigger doctor delay notifications to all affected patients.

#### Endpoint
`POST /api/orchestrator/notifications/doctor-delay`

#### Request Body
```json
{
  "doctorId": "D0001",
  "delayMinutes": 30,
  "reason": "Emergency case in progress",
  "date": "2024-01-22" // optional, defaults to today
}
```

#### Parameters
- `doctorId` (required): Doctor ID
- `delayMinutes` (required): Delay in minutes (1-480)
- `reason` (required): Reason for delay
- `date` (optional): Date (YYYY-MM-DD). Defaults to today

#### Curl Example
```bash
curl -X POST "{{BASE_URL}}/api/orchestrator/notifications/doctor-delay" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "D0001",
    "delayMinutes": 30,
    "reason": "Emergency case in progress"
  }'
```

#### Response
```json
{
  "status": "success",
  "message": "Doctor delay notifications sent to 5 patients",
  "data": {
    "doctorId": "D0001",
    "delayMinutes": 30,
    "notificationsSent": 5,
    "results": [
      {
        "appointmentId": "12345",
        "patientId": "P0001",
        "tokensSent": 2
      }
    ]
  }
}
```

---

## Batch Orchestration APIs

### Process ETA-Based Batches

Manually trigger ETA-based batch processing to check for appointments that need departure notifications.

#### Endpoint
`POST /api/orchestrator/batch/process-eta`

#### Curl Example
```bash
curl -X POST "{{BASE_URL}}/api/orchestrator/batch/process-eta"
```

#### Response
```json
{
  "status": "success",
  "message": "ETA batch processing completed. 3 notifications triggered.",
  "data": {
    "success": true,
    "notificationsTriggered": 3,
    "results": [
      {
        "appointmentId": "12345",
        "patientId": "P0001",
        "batchNumber": 1,
        "travelTimeMinutes": 25,
        "tokensSent": 2
      }
    ]
  }
}
```

### Detect No-Shows

Manually trigger no-show detection and batch advancement.

#### Endpoint
`POST /api/orchestrator/batch/detect-noshow`

#### Curl Example
```bash
curl -X POST "{{BASE_URL}}/api/orchestrator/batch/detect-noshow"
```

#### Response
```json
{
  "status": "success",
  "message": "No-show detection completed. 2 no-shows detected.",
  "data": {
    "success": true,
    "noShowsDetected": 2,
    "results": [
      {
        "appointmentId": "12345",
        "patientId": "P0001",
        "batchNumber": 1,
        "advanced": true
      }
    ]
  }
}
```

### Handle Check-In

Manually handle a patient check-in event and potentially advance to the next batch.

#### Endpoint
`POST /api/orchestrator/batch/checkin`

#### Request Body
```json
{
  "appointmentId": "12345"
}
```

#### Parameters
- `appointmentId` (required): Appointment ID that was checked in

#### Curl Example
```bash
curl -X POST "{{BASE_URL}}/api/orchestrator/batch/checkin" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "12345"
  }'
```

#### Response
```json
{
  "status": "success",
  "message": "Advanced to next batch",
  "data": {
    "success": true,
    "appointmentId": "12345",
    "shouldAdvance": true,
    "message": "Advanced to next batch"
  }
}
```

### Advance to Next Batch

Manually advance to the next batch for a specific doctor and time slot.

#### Endpoint
`POST /api/orchestrator/batch/advance`

#### Request Body
```json
{
  "doctorId": "D0001",
  "appointmentDate": "2024-01-22",
  "appointmentTime": "14:00"
}
```

#### Parameters
- `doctorId` (required): Doctor ID
- `appointmentDate` (required): Appointment date (YYYY-MM-DD)
- `appointmentTime` (required): Appointment time (HH:MM)

#### Curl Example
```bash
curl -X POST "{{BASE_URL}}/api/orchestrator/batch/advance" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "D0001",
    "appointmentDate": "2024-01-22",
    "appointmentTime": "14:00"
  }'
```

#### Response
```json
{
  "status": "success",
  "message": "Advanced to next batch. 3 appointments triggered.",
  "data": {
    "success": true,
    "nextBatchNumber": 2,
    "appointmentsTriggered": 3,
    "results": [
      {
        "appointmentId": "12346",
        "patientId": "P0002",
        "batchNumber": 2,
        "travelTimeMinutes": 20,
        "tokensSent": 1
      }
    ]
  }
}
```

---

## Rate Limiting

Both endpoints are rate-limited to 120 requests per minute per IP address.

## Error Responses

### Validation Error (400)
```json
{
  "status": "error",
  "name": "ValidationError",
  "message": "origin.lat and origin.lng are required and must be valid numbers"
}
```

### No Route Found (404)
```json
{
  "status": "error",
  "name": "NotFoundError",
  "message": "No route found between origin and destination"
}
```

### Rate Limit Exceeded (429)
```json
{
  "status": "error",
  "name": "RateLimitError",
  "message": "Too many requests, please try again later"
}
```

---

## Session Token Best Practices

For Places Autocomplete, generate a session token on the frontend:

### Web/JavaScript
```javascript
import { v4 as uuidv4 } from 'uuid';

// Generate when user focuses search input
const sessionToken = uuidv4();

// Use same token for all autocomplete requests in this session
// and for the final place details request
```

### Benefits
- Better relevance across suggestions
- Billing optimization with Google Maps
- No server storage required

---

## Token Management APIs

### Migrate Existing Appointments to Add Token Numbers

Add token numbers to appointments that don't have them yet.

#### Endpoint
`POST /api/token/migrate`

#### Request Body
```json
{
  "doctorId": "D0001"
}
```

#### Parameters
- `doctorId` (optional): String to limit migration to specific doctor

#### Curl Example
```bash
curl -X POST "{{BASE_URL}}/api/token/migrate" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "D0001"
  }'
```

#### Response
```json
{
  "status": "success",
  "message": "Token migration completed",
  "data": {
    "migrated": 25,
    "errors": 0,
    "total": 25
  }
}
```

### Get Token Statistics

Retrieve token usage statistics for a specific doctor.

#### Endpoint
`GET /api/token/stats/{doctorId}`

#### Parameters
- `doctorId` (required): Doctor ID in URL path
- `date` (optional): Specific date (YYYY-MM-DD) or 'all' for all dates

#### Curl Example
```bash
curl "{{BASE_URL}}/api/token/stats/D0001?date=2024-01-22"
```

---

## Doctor Delay Management APIs

### Set Doctor Delay

Set a delay that affects all appointments from startTime onwards.

#### Endpoint
`POST /api/doctor/delay`

#### Request Body
```json
{
  "doctorId": "D0001",
  "date": "2024-01-22",
  "startTime": "11:00",
  "durationMinutes": 45,
  "reason": "Emergency surgery"
}
```

#### Parameters
- `doctorId` (required): Doctor ID
- `date` (required): Date in YYYY-MM-DD format
- `startTime` (required): Start time in HH:MM format
- `durationMinutes` (required): Delay duration in minutes (1-480)
- `reason` (required): Reason for delay (max 500 characters)

#### Curl Example
```bash
curl -X POST "{{BASE_URL}}/api/doctor/delay" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "D0001",
    "date": "2024-01-22",
    "startTime": "11:00",
    "durationMinutes": 45,
    "reason": "Emergency surgery"
  }'
```

#### Response
```json
{
  "status": "success",
  "message": "Delay set successfully",
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
    "affectedAppointments": 8,
    "message": "Delay set successfully. 8 appointments will be affected."
  }
}
```

### Get Active Delays

Retrieve all active delays for a doctor.

#### Endpoint
`GET /api/doctor/delay/{doctorId}`

#### Parameters
- `doctorId` (required): Doctor ID in URL path
- `date` (optional): Specific date (YYYY-MM-DD) to filter delays

#### Curl Example
```bash
curl "{{BASE_URL}}/api/doctor/delay/D0001?date=2024-01-22"
```

### Clear Delays

Clear all active delays for a doctor.

#### Endpoint
`DELETE /api/doctor/delay/{doctorId}`

#### Parameters
- `doctorId` (required): Doctor ID in URL path
- `date` (optional): Specific date to clear delays for

#### Curl Example
```bash
curl -X DELETE "{{BASE_URL}}/api/doctor/delay/D0001?date=2024-01-22"
```

### Reset Availability (End of Day)

Clear all active delays for all doctors or specific doctor.

#### Endpoint
`POST /api/doctor/reset-availability`

#### Request Body
```json
{
  "doctorId": "D0001"
}
```

#### Parameters
- `doctorId` (optional): Specific doctor ID, if not provided resets all doctors

#### Curl Example
```bash
curl -X POST "{{BASE_URL}}/api/doctor/reset-availability" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "D0001"
  }'
```

### Get Adjusted Time

Calculate the actual appointment time after applying all active delays.

#### Endpoint
`POST /api/doctor/adjusted-time`

#### Request Body
```json
{
  "doctorId": "D0001",
  "appointmentDate": "2024-01-22",
  "originalTime": "14:00"
}
```

#### Curl Example
```bash
curl -X POST "{{BASE_URL}}/api/doctor/adjusted-time" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "D0001",
    "appointmentDate": "2024-01-22",
    "originalTime": "14:00"
  }'
```

#### Response
```json
{
  "status": "success",
  "message": "Adjusted time calculated",
  "data": {
    "adjustedTime": "14:45",
    "totalDelayMinutes": 45,
    "delays": [
      {
        "startTime": "11:00",
        "durationMinutes": 45,
        "reason": "Emergency surgery"
      }
    ]
  }
}
```

---

## User Address Management APIs

### Add New Address

Add a new address to user's address list.

#### Endpoint
`POST /api/user/address`

#### Request Body
```json
{
  "userId": "P0001",
  "addressName": "Home",
  "origin": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "fullAddress": "123 Main Street, Bangalore, Karnataka, India",
  "isDefault": true
}
```

#### Parameters
- `userId` (required): User ID
- `addressName` (required): Address name (max 100 chars)
- `origin.lat` (required): Latitude (-90 to 90)
- `origin.lng` (required): Longitude (-180 to 180)
- `fullAddress` (optional): Full address (max 500 chars)
- `isDefault` (optional): Set as default address

#### Curl Example
```bash
curl -X POST "{{BASE_URL}}/api/user/address" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "P0001",
    "addressName": "Home",
    "origin": {
      "lat": 12.9716,
      "lng": 77.5946
    },
    "fullAddress": "123 Main Street, Bangalore, Karnataka, India",
    "isDefault": true
  }'
```

### Get All User Addresses

Retrieve all addresses for a user.

#### Endpoint
`GET /api/user/address/{userId}`

#### Curl Example
```bash
curl "{{BASE_URL}}/api/user/address/P0001"
```

#### Response
```json
{
  "status": "success",
  "message": "User addresses retrieved successfully",
  "data": {
    "userId": "P0001",
    "addresses": [
      {
        "addressId": "uuid-address-id-1",
        "addressName": "Home",
        "origin": {
          "lat": 12.9716,
          "lng": 77.5946
        },
        "fullAddress": "123 Main Street, Bangalore, Karnataka, India",
        "isDefault": true,
        "createdAt": "2024-01-22T10:30:00.000Z"
      },
      {
        "addressId": "uuid-address-id-2",
        "addressName": "Office",
        "origin": {
          "lat": 12.9352,
          "lng": 77.6245
        },
        "fullAddress": "456 Corporate Park, Bangalore, Karnataka, India",
        "isDefault": false,
        "createdAt": "2024-01-22T11:00:00.000Z"
      }
    ],
    "totalCount": 2
  }
}
```

### Update Specific Address

Update a specific address for a user.

#### Endpoint
`PUT /api/user/address/{userId}/{addressId}`

#### Request Body
```json
{
  "addressName": "Updated Home",
  "origin": {
    "lat": 12.9800,
    "lng": 77.6000
  },
  "fullAddress": "Updated address",
  "isDefault": true
}
```

#### Curl Example
```bash
curl -X PUT "{{BASE_URL}}/api/user/address/P0001/uuid-address-id-1" \
  -H "Content-Type: application/json" \
  -d '{
    "addressName": "Updated Home",
    "origin": {
      "lat": 12.9800,
      "lng": 77.6000
    },
    "fullAddress": "Updated address",
    "isDefault": true
  }'
```

### Delete Address

Delete a specific address for a user.

#### Endpoint
`DELETE /api/user/address/{userId}/{addressId}`

#### Curl Example
```bash
curl -X DELETE "{{BASE_URL}}/api/user/address/P0001/uuid-address-id-1"
```

---

## Token Number System

### Format
- **Display**: `S{slotNumber}T{tokenNumber}` (e.g., S1T001, S2T015)
- **Slot numbering**: 1,2,3... based on doctor's timeSlots array order
- **Token reset**: Resets to 001 each day
- **Max tokens**: Calculated proportionally: `(slotDuration/120) * maxAppointment`

### Example
- Doctor timeSlots: [9:00-11:00, 11:00-13:00, 14:00-16:00]
- Max appointments: 20
- Slot 1 (9:00-11:00): S1T001 to S1T020
- Slot 2 (11:00-13:00): S2T001 to S2T020
- Slot 3 (14:00-16:00): S3T001 to S3T020

---

## Notes

- All coordinates use decimal degrees (WGS84)
- Times are in seconds (duration) or human-readable text
- Session tokens are client-generated UUIDs
- Country codes follow ISO 3166-1 alpha-2 standard
- APIs are open (no authentication required)
- Token numbers are automatically assigned during appointment creation
