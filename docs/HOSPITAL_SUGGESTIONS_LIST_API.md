# Hospital Suggestions List API

## Overview
This API endpoint allows admins to retrieve a list of all hospital suggestions submitted by users, including user details (name, phone number, email, etc.).

## Endpoint
**GET** `/api/hospital/suggestions`

## Authentication
**Not Required**: This is an open API - no authentication needed

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Number | No | 1 | Page number for pagination |
| `limit` | Number | No | 20 | Number of results per page |
| `search` | String | No | - | Search by hospital name or full address |
| `city` | String | No | - | Filter by city |
| `state` | String | No | - | Filter by state |
| `sortBy` | String | No | `suggestedAt` | Field to sort by |
| `sortOrder` | String | No | `desc` | Sort order (`asc` or `desc`) |

## Response Format

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Hospital suggestions retrieved successfully",
    "data": {
        "suggestions": [
            {
                "suggestionId": "67890abcdef1234567890",
                "hospitalName": "Kiruba Hospital",
                "location": {
                    "street": "Rajaji Road",
                    "city": "Salem",
                    "state": "Tamil Nadu",
                    "pincode": "636007",
                    "country": "India"
                },
                "fullAddress": "5, Rajaji Rd, Seerangapalayam, Salem, Tamil Nadu 636007, India",
                "placeId": "ChIJC6LIzErwqzsROtkmXBrsup4",
                "coordinates": {
                    "lat": 11.6669958,
                    "lng": 78.1560419
                },
                "suggestedAt": "2025-12-02T19:30:00.000Z",
                "createdAt": "2025-12-02T19:30:00.000Z",
                "updatedAt": "2025-12-02T19:30:00.000Z",
                "suggestedBy": {
                    "userId": "P0001",
                    "name": "Vimal",
                    "phoneNumber": "+919894643371",
                    "email": "vimalprasaath@gmail.com",
                    "role": "user"
                }
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 5,
            "totalCount": 100,
            "limit": 20,
            "hasNext": true,
            "hasPrev": false
        }
    },
    "timestamp": "2025-12-02T19:39:50.959Z"
}
```


## cURL Examples

### Basic Request (List all suggestions)
```bash
curl -X GET "http://localhost:3000/api/hospital/suggestions" \
  -H "Content-Type: application/json"
```

### With Pagination
```bash
curl -X GET "http://localhost:3000/api/hospital/suggestions?page=1&limit=10" \
  -H "Content-Type: application/json"
```

### Search by Hospital Name or Address
```bash
curl -X GET "http://localhost:3000/api/hospital/suggestions?search=Kiruba" \
  -H "Content-Type: application/json"
```

### Filter by City
```bash
curl -X GET "http://localhost:3000/api/hospital/suggestions?city=Salem" \
  -H "Content-Type: application/json"
```

### Filter by State
```bash
curl -X GET "http://localhost:3000/api/hospital/suggestions?state=Tamil%20Nadu" \
  -H "Content-Type: application/json"
```

### Combined Filters (Search + City + Pagination)
```bash
curl -X GET "http://localhost:3000/api/hospital/suggestions?search=Hospital&city=Salem&page=1&limit=20" \
  -H "Content-Type: application/json"
```

### Sort by Created Date (Ascending)
```bash
curl -X GET "http://localhost:3000/api/hospital/suggestions?sortBy=createdAt&sortOrder=asc" \
  -H "Content-Type: application/json"
```

## Notes

1. **Authentication**: This is an open API - no authentication required.

2. **User Details**: If a user is not found in the database, the `suggestedBy` object will show:
   ```json
   {
       "userId": "P0001",
       "name": "User not found",
       "phoneNumber": "N/A",
       "email": "N/A",
       "role": "N/A"
   }
   ```

3. **Pagination**: Default page size is 20. Maximum recommended limit is 100 per page.

4. **Search**: The search parameter searches in both `hospitalName` and `fullAddress` fields (case-insensitive).

5. **Sorting**: Available sort fields include:
   - `suggestedAt` (default)
   - `createdAt`
   - `updatedAt`
   - `hospitalName`

## Example Response with Multiple Suggestions

```json
{
    "success": true,
    "message": "Hospital suggestions retrieved successfully",
    "data": {
        "suggestions": [
            {
                "suggestionId": "67890abcdef1234567890",
                "hospitalName": "Kiruba Hospital",
                "location": {
                    "street": "Rajaji Road",
                    "city": "Salem",
                    "state": "Tamil Nadu",
                    "pincode": "636007",
                    "country": "India"
                },
                "fullAddress": "5, Rajaji Rd, Seerangapalayam, Salem, Tamil Nadu 636007, India",
                "placeId": "ChIJC6LIzErwqzsROtkmXBrsup4",
                "coordinates": {
                    "lat": 11.6669958,
                    "lng": 78.1560419
                },
                "suggestedAt": "2025-12-02T19:30:00.000Z",
                "createdAt": "2025-12-02T19:30:00.000Z",
                "updatedAt": "2025-12-02T19:30:00.000Z",
                "suggestedBy": {
                    "userId": "P0001",
                    "name": "Vimal",
                    "phoneNumber": "+919894643371",
                    "email": "vimalprasaath@gmail.com",
                    "role": "user"
                }
            },
            {
                "suggestionId": "67890abcdef1234567891",
                "hospitalName": "Apollo Hospital",
                "location": {
                    "street": "Main Road",
                    "city": "Chennai",
                    "state": "Tamil Nadu",
                    "pincode": "600001",
                    "country": "India"
                },
                "fullAddress": "123 Main Road, Chennai, Tamil Nadu 600001, India",
                "placeId": "ChIJG_scM6ZvUjoR8R2_eWC2q6w",
                "coordinates": {
                    "lat": 13.085639,
                    "lng": 80.2816114
                },
                "suggestedAt": "2025-12-02T18:00:00.000Z",
                "createdAt": "2025-12-02T18:00:00.000Z",
                "updatedAt": "2025-12-02T18:00:00.000Z",
                "suggestedBy": {
                    "userId": "P0002",
                    "name": "John Doe",
                    "phoneNumber": "+919876543210",
                    "email": "john@example.com",
                    "role": "user"
                }
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 1,
            "totalCount": 2,
            "limit": 20,
            "hasNext": false,
            "hasPrev": false
        }
    },
    "timestamp": "2025-12-02T19:39:50.959Z"
}
```

