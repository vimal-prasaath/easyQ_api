# Hospital Autocomplete API - CURL Commands

This document contains all CURL commands for the Hospital Autocomplete and Suggestion APIs.

---

## Table of Contents
1. [Hospital Autocomplete API](#hospital-autocomplete-api)
2. [Save Hospital Suggestion API](#save-hospital-suggestion-api)

---

## Hospital Autocomplete API

### Endpoint
`POST /api/hospital/autocomplete`

### Description
Searches for hospitals using Google Places API autocomplete. Returns only hospitals that are **NOT already in your database** (filters out existing hospitals by coordinates).

### Features
- Uses Google Places API
- Filters to hospitals only (excludes other places)
- Excludes hospitals already in database (50 meters tolerance)
- Returns simplified location (street, city, state)
- Open API (no authentication required)

---

### 1. Basic Search

```bash
curl -X POST "http://localhost:3000/api/hospital/autocomplete" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Apollo Hospital"
  }'
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Hospital autocomplete results retrieved successfully",
  "data": {
    "hospitals": [
      {
        "placeId": "ChIJ...",
        "hospitalName": "Apollo Hospital",
        "location": {
          "street": "Main Road",
          "city": "Chennai",
          "state": "Tamil Nadu",
          "pincode": "600001",
          "country": "India"
        },
        "fullAddress": "Apollo Hospital, Main Road, Chennai, Tamil Nadu 600001",
        "coordinates": {
          "lat": 13.0827,
          "lng": 80.2707
        },
        "description": "Apollo Hospital, Main Road, Chennai"
      }
    ],
    "totalResults": 1
  }
}
```

---

### 2. Search with Location Bias

Prioritizes results near a specific location:

```bash
curl -X POST "http://localhost:3000/api/hospital/autocomplete" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Apollo",
    "locationBias": {
      "lat": 13.0827,
      "lng": 80.2707
    },
    "radiusMeters": 5000
  }'
```

---

### 3. Search with Country Filter

Restrict results to a specific country:

```bash
curl -X POST "http://localhost:3000/api/hospital/autocomplete" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Apollo Hospital",
    "country": "IN"
  }'
```

---

### 4. Complete Example with All Parameters

```bash
curl -X POST "http://localhost:3000/api/hospital/autocomplete" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Apollo Hospital",
    "sessionToken": "optional-session-token",
    "locationBias": {
      "lat": 13.0827,
      "lng": 80.2707
    },
    "radiusMeters": 5000,
    "country": "IN"
  }'
```

---

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | String | Yes | Search query (hospital name) - minimum 2 characters |
| `sessionToken` | String | No | Optional session token for Google Places API billing |
| `locationBias` | Object | No | Location to bias results towards `{lat: number, lng: number}` |
| `radiusMeters` | Number | No | Radius in meters (used with locationBias) |
| `country` | String | No | 2-letter country code (e.g., "IN" for India) |

---

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `placeId` | String | Google Places ID |
| `hospitalName` | String | Name of the hospital |
| `location.street` | String | Street address |
| `location.city` | String | City name |
| `location.state` | String | State name |
| `location.pincode` | String | Postal/ZIP code |
| `location.country` | String | Country name |
| `fullAddress` | String | Complete formatted address |
| `coordinates.lat` | Number | Latitude |
| `coordinates.lng` | Number | Longitude |
| `description` | String | Description from Google Places |

---

## Save Hospital Suggestion API

### Endpoint
`POST /api/hospital/suggest`

### Description
Saves a hospital suggestion from a user. Stores hospital name, location, and user information in the database.

### Features
- Open API (no authentication required)
- Stores user suggestions for review
- Saves complete location and coordinate information

---

### 1. Basic Save Suggestion

```bash
curl -X POST "http://localhost:3000/api/hospital/suggest" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "P0001",
    "hospitalName": "Apollo Hospital",
    "location": {
      "street": "Main Road",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "pincode": "600001",
      "country": "India"
    }
  }'
```

---

### 2. Complete Save Suggestion (All Fields)

```bash
curl -X POST "http://localhost:3000/api/hospital/suggest" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "P0001",
    "hospitalName": "Apollo Hospital",
    "location": {
      "street": "Main Road",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "pincode": "600001",
      "country": "India"
    },
    "placeId": "ChIJ1234567890",
    "fullAddress": "Apollo Hospital, Main Road, Chennai, Tamil Nadu 600001, India",
    "coordinates": {
      "lat": 13.0827,
      "lng": 80.2707
    }
  }'
```

---

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | String | Yes | User ID who is suggesting the hospital |
| `hospitalName` | String | Yes | Name of the hospital |
| `location` | Object | Yes | Location object (see below) |
| `location.street` | String | No | Street address |
| `location.city` | String | Yes | City name |
| `location.state` | String | Yes | State name |
| `location.pincode` | String | No | Postal/ZIP code |
| `location.country` | String | No | Country name |
| `placeId` | String | No | Google Places ID |
| `fullAddress` | String | No | Complete formatted address |
| `coordinates` | Object | No | Coordinates object |
| `coordinates.lat` | Number | No | Latitude |
| `coordinates.lng` | Number | No | Longitude |

---

### Response

**Success Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Hospital suggestion saved successfully",
  "data": {
    "suggestionId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "hospitalName": "Apollo Hospital",
    "location": {
      "street": "Main Road",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "pincode": "600001",
      "country": "India"
    },
    "suggestedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "User ID is required"
}
```

---

## Production URLs

Replace `http://localhost:3000` with your production API URL:

```bash
# Example for production
curl -X POST "https://your-api-domain.com/api/hospital/autocomplete" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Apollo Hospital"
  }'
```

---

## Notes

1. **No Authentication Required**: Both APIs are open APIs and don't require authentication tokens.

2. **Coordinate Matching**: The autocomplete API automatically filters out hospitals that already exist in your database by comparing coordinates (50 meters tolerance).

3. **Hospital Filtering**: Only places identified as hospitals by Google Places API are returned (filters out clinics, pharmacies, etc. if they don't match hospital types).

4. **Rate Limiting**: These APIs may be subject to rate limiting. Check your API configuration.

5. **Session Tokens**: For Google Places API billing optimization, you can use session tokens. Generate a unique token per user session and reuse it for multiple requests.

---

## Example Workflow

1. **User types in search box**: "Apollo"
2. **Frontend calls autocomplete API**:
   ```bash
   POST /api/hospital/autocomplete
   { "input": "Apollo" }
   ```
3. **User sees suggestions** (only hospitals not in database)
4. **User clicks "Suggest" button** on a hospital
5. **Frontend calls suggest API**:
   ```bash
   POST /api/hospital/suggest
   {
     "userId": "P0001",
     "hospitalName": "Apollo Hospital",
     "location": { ... }
   }
   ```
6. **Suggestion saved** for admin review

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success (Autocomplete) |
| 201 | Created (Suggestion saved) |
| 400 | Bad Request (Validation error) |
| 404 | Not Found (No results) |
| 500 | Internal Server Error |

---

## Support

For issues or questions, contact the development team.



