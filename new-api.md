# API Documentation

## Location-based Hospital Search

Search for hospitals based on geographical location.

### Request

```bash
curl --location 'http://localhost:3000/api/hospital/location' \
--header 'Content-Type: application/json' \
--data '{
"location": {
"type": "Point",
"coordinates": [77.4661301,12.9542802]
}
}'

Response: response will sorted based on the user locatin and it will be suggested

{"data":[{
"address": {
"street": "Sarjapur Road, Koramangala",
"city": "Bangalore",
"state": "Karnataka",
"zipCode": "560034",
"country": "India"
},
"location": {
"type": "Point",
"coordinates": [
77.6117,
12.9343
]
},
"\_id": "6889075fa7560119cc12ec43",
"name": "St. John's Medical College Hospital",
"email": "dean@stjohns.in",
"phoneNumber": "+91-80-2206-5000",
"ambulanceNumber": "+91-80-2206-5108",
"departments": [
{
"name": "Neurology",
"headOfDepartment": "Dr. Thomas Matthew",
"departmentHeadDoctorId": "2974",
"contactNumber": "+91-80-2206-5010",
"description": "Advanced neurological treatments",
"doctorIds": [
"2974",
"6481",
"9357",
"1826",
"5692"
],
"\_id": "6889075fa7560119cc12ec44",
"id": "6889075fa7560119cc12ec44"
},
{
"name": "ICU",
"headOfDepartment": "Dr. Mary Francis",
"departmentHeadDoctorId": "8435",
"contactNumber": "+91-80-2206-5011",
"description": "Intensive care and critical care medicine",
"doctorIds": [
"8435",
"3719",
"7265",
"4851"
],
"\_id": "6889075fa7560119cc12ec45",
"id": "6889075fa7560119cc12ec45"
}
],
"hospitalType": "Teaching hospital",
"imageUrl": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
"patientIds": [],
"averageRating": 4,
"hospitalId": "2155",
"createdAt": "2025-07-29T17:39:43.623Z",
"updatedAt": "2025-07-29T17:39:43.624Z",
"\_\_v": 0,
"id": "6889075fa7560119cc12ec43"
}]
}
```

## Hospital Search

Search hospitals by name, treatment types, city, state, etc.

### Request

```bash
curl --location 'http://localhost:3000/api/search' \
--header 'Content-Type: application/json' \
--data '{
    "userId": "P0003",
    "name": "Apollo",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "treatmentType": "Neurology"
}'
```

### Response

```json
{
"data": [{
            "name": "Apollo Hospital Hyderabad",
            "email": "info.hyderabad@apollohospitals.com",
            "phoneNumber": "+91-40-2378-8888",
            "address": {
                "street": "Road No. 72, Opp. Bharatiya Vidya Bhavan, Film Nagar",
                "city": "Hyderabad",
                "state": "Telangana",
                "zipCode": "500033",
                "country": "India"
            },
            "departments": [
                {
                    "name": "Oncology",
                    "headOfDepartment": "Dr. K. Senthil Kumar",
                    "departmentHeadDoctorId": "5274",
                    "contactNumber": "+91-40-2378-8889",
                    "description": "Comprehensive cancer treatment",
                    "doctorIds": [
                        "5274",
                        "8637",
                        "2941",
                        "7358",
                        "4896"
                    ],
                    "_id": "688907baa7560119cc12ec64"
                },
                {
                    "name": "Neurology",
                    "headOfDepartment": "Dr. Alok Ranjan",
                    "departmentHeadDoctorId": "9152",
                    "contactNumber": "+91-40-2378-8890",
                    "description": "Advanced neurological treatments",
                    "doctorIds": [
                        "9152",
                        "3476",
                        "6829",
                        "1597"
                    ],
                    "_id": "688907baa7560119cc12ec65"
                }
            ],
            "hospitalType": "Multi-specialty",
            "imageUrl": "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
            "averageRating": 4.4,
            "hospitalId": "7562"
        }]

        }