import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EasyQ API Documentation',
      version: '1.0.0',
      description: 'API documentation for EasyQ application',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
            name: { type: 'string' },
          },
        },
        Doctor: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            specialization: { type: 'string' },
            experience: { type: 'number' },
            hospital: { type: 'string' },
          },
        },
        Hospital: {
          type: 'object',
          properties: {
            _id: { type: 'string', readOnly: true, description: 'MongoDB ObjectID' }, // Common for Mongoose models
            name: { type: 'string', description: 'Name of the hospital' },
            email: { type: 'string', format: 'email', description: 'Hospital contact email' },
            phoneNumber: { type: 'string', description: 'Main phone number for the hospital' },
            ambulanceNumber: { type: 'string', description: 'Dedicated ambulance contact number' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
                country: { type: 'string' },
              },
              description: 'Physical address of the hospital'
            },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['Point'], default: 'Point' },
                coordinates: {
                  type: 'array',
                  items: { type: 'number' },
                  minItems: 2,
                  maxItems: 2,
                  description: 'GeoJSON coordinates [longitude, latitude]'
                },
              },
              description: 'Geographical location of the hospital'
            },
            departments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  headOfDepartment: { type: 'string', description: 'Name of the head of the department', nullable: true },
                  contactNumber: { type: 'string', description: 'Contact number for the department', nullable: true },
                  description: { type: 'string' },
                  total_number_Doctor: { type: 'string', description: 'Total number of doctors in the department' } // Assuming this is stored as a string
                }
              },
              description: 'List of departments within the hospital'
            },
            hospitalType: { type: 'string', description: 'E.g., Multi-Specialty Hospital, General Hospital, Clinic' },
            imageUrl: { type: 'string', format: 'url', description: 'URL to the hospital logo or image' },
            createdAt: { type: 'string', format: 'date-time', readOnly: true }, // Common for Mongoose timestamps
            updatedAt: { type: 'string', format: 'date-time', readOnly: true }  // Common for Mongoose timestamps
          },
          example: {
            name: "Care Hospital",
            email: "info.Care@example.com",
            phoneNumber: "9876543201",
            ambulanceNumber: "9988776600",
            address: {
              street: "123 Health ",
              city: "Bengaluru",
              state: "Karnataka",
              zipCode: "560001",
              country: "India"
            },
            location: {
              type: "Point",
              coordinates: [77.5946, 12.9716]
            },
            departments: [
              {
                name: "Cardiology",
                headOfDepartment: "Dr. R. Sharma",
                contactNumber: "9876512345",
                description: "Specializes in heart diseases.",
                total_number_Doctor: "15"
              },
              {
                name: "Pediatrics",
                description: "Child care specialists.",
                total_number_Doctor: "10"
              }
            ],
            hospitalType: "Multi-Specialty Hospital",
            imageUrl: "https://example.com/healing-hands.png"
          }
        },
        HospitalFacility: {
          type: 'object',
          properties: {
            hospitalId: {
              type: 'string',
              description: 'The ID of the hospital to update facilities for.',
              example: '1284', // Replace with an actual hospitalId
            },
            facilities: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'A list of general facilities available in the hospital.',
              example: ['24/7 Emergency', 'Pharmacy', 'Cafeteria', 'Parking'],
            },
            labs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Name of the laboratory or department.',
                    example: 'Central Pathology Lab',
                  },
                  servicesOffered: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    description: 'Services offered by this lab/department (e.g., Blood Test, X-Ray).',
                    example: ['Blood Test', 'Urine Test', 'Biopsy'],
                  },
                  contactNumber: {
                    type: 'string',
                    description: 'Contact number for the lab (optional).',
                    nullable: true, // Indicates this field is optional
                    example: '9123456789',
                  },
                  isOpen24x7: {
                    type: 'boolean',
                    description: 'Indicates if the lab is open 24/7 (optional).',
                    nullable: true, // Indicates this field is optional
                    example: true,
                  },
                },
                required: ['name', 'servicesOffered'], // Name and services are typically required for a lab
              },
              description: 'A list of specialized labs or departments within the hospital and their services.',
            },
          },
          required: ['hospitalId', 'facilities', 'labs'], // These fields are required for the update
          example: {
            hospitalId: '1284',
            facilities: ['24/7 Emergency', 'Pharmacy', 'Cafeteria', 'Parking'],
            labs: [
              {
                name: 'Central Pathology Lab',
                servicesOffered: ['Blood Test', 'Urine Test', 'Biopsy'],
                contactNumber: '9123456789',
                isOpen24x7: true,
              },
              {
                name: 'Radiology Department',
                servicesOffered: ['X-Ray', 'MRI', 'CT Scan'],
              },
            ],
          },
        },
        HospitalReview: {
          type: 'object',
          properties: {
            hospitalId: {
              type: 'string',
              description: 'The ID of the hospital being reviewed.',
              example: '1284',
            },
            reviewerName: {
              type: 'string',
              description: 'The name of the person leaving the review.',
              example: 'Alice Johnson',
            },
            rating: {
              type: 'integer',
              format: 'int32',
              minimum: 1, // Assuming rating is on a scale, e.g., 1 to 5
              maximum: 5,
              description: 'The numerical rating given (e.g., 1-5).',
              example: 4,
            },
            comment: {
              type: 'string',
              description: 'The detailed comment or feedback from the reviewer.',
              example: 'Very professional staff and clean environment. The wait time was a bit long, but overall a good experience.',
            },
            // You might also want to add timestamps or reviewer ID
            createdAt: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
              description: 'Timestamp when the review was created.',
            },
          },
          required: ['hospitalId', 'reviewerName', 'rating', 'comment'], // These fields are mandatory
          example: {
            hospitalId: '1284',
            reviewerName: 'Alice Johnson',
            rating: 4,
            comment: 'Very professional staff and clean environment. The wait time was a bit long, but overall a good experience.',
          },
        },
        HospitalLocationSearch: {
          type: 'object',
          description: 'Parameters for searching hospitals by address details or geographical coordinates. At least one of "address" or "location" must be provided.',
          properties: {
            address: {
              type: 'object',
              description: 'Details of the address to search for. Provide any combination of fields.',
              properties: {
                street: { type: 'string', example: '123 Health St' },
                city: { type: 'string', example: 'Bengaluru' },
                state: { type: 'string', example: 'Karnataka' },
                zipCode: { type: 'string', example: '560001' },
                country: { type: 'string', example: 'India' },
              },
            },
            location: {
              type: 'object',
              description: 'Geographical coordinates for a proximity search. Requires a GeoJSON Point structure.',
              properties: {
                coordinates: {
                  type: 'array',
                  items: { type: 'number' },
                  minItems: 2,
                  maxItems: 2,
                  description: 'GeoJSON coordinates in [longitude, latitude] format.',
                  example: [77.5946, 12.9716], // Example: Bangalore coordinates
                },
              },
            },
          },
          example: {
            address: {
              city: 'Bengaluru',
              street: '123 Health St',
              state: 'Karnataka',
              zipCode: '560001',
              country: 'India',
            },
            location: {
              coordinates: [
                7.506,
                1.917
              ]
            }
          }
        },

        Appointment: {
          type: 'object',
          properties: {
            doctorId: { type: 'string' },
            patientId: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            status: {
              type: 'string',
              enum: ['scheduled', 'completed', 'cancelled']
            },
          },
        },
        Document: {
          type: 'object',
          properties: {
            _id: { type: 'string', readOnly: true, description: 'MongoDB ObjectID' },
            fileName: { type: 'string' },
            mimeType: { type: 'string' },
            size: { type: 'number' },
            fileType: { type: 'string' },
            fileKey: { type: 'string', description: 'Key for S3 storage' },
            fileUrl: { type: 'string', format: 'url', description: 'URL for file access if stored externally' },
            iv: { type: 'string', description: 'Initialization Vector for encrypted files (if stored in DB)' },
            fileBuffer: { type: 'string', format: 'binary', description: 'Encrypted file content (if stored in DB)' },
            uploadedAt: { type: 'string', format: 'date-time' }
          },
          example: {
            fileName: "report.pdf",
            mimeType: "application/pdf",
            size: 123456,
            fileType: "report",
            fileKey: "user123/hospitalXYZ/report.pdf",
            uploadedAt: "2025-07-01T10:00:00Z"
          }
        },
        HospitalDocuments: {
          type: 'object',
          properties: {
            hospitalId: { type: 'string', description: 'ID of the hospital' }, // Should be ref to Hospital _id
            documents: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Document'
              }
            }
          },
          example: {
            hospitalId: "hospitalABC",
            documents: [
              {
                fileName: "xray.png",
                mimeType: "image/png",
                size: 98765,
                fileType: "xray",
                uploadedAt: "2025-07-02T11:00:00Z"
              }
            ]
          }
        },
        UserHospitalFiles: {
          type: 'object',
          properties: {
            _id: { type: 'string', readOnly: true, description: 'MongoDB ObjectID' },
            userId: { type: 'string', required: true, description: 'ID of the user associated with files' }, // Should be ref to User _id
            hospitals: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/HospitalDocuments'
              }
            },
            createdAt: { type: 'string', format: 'date-time', readOnly: true },
            updatedAt: { type: 'string', format: 'date-time', readOnly: true }
          },
          example: {
            userId: "user123",
            hospitals: [
              {
                hospitalId: "hospitalABC",
                documents: [
                  {
                    fileName: "blood_test.pdf",
                    mimeType: "application/pdf",
                    size: 50000,
                    fileType: "lab_report",
                    uploadedAt: "2025-07-03T12:00:00Z"
                  }
                ]
              }
            ]
          }
        },
        QAEntry: {
          type: 'object',
          required: ['question', 'answer'],
          properties: {
            _id: { type: 'string', readOnly: true, description: 'MongoDB ObjectID' },
            question: { type: 'string', description: 'The question asked' },
            answer: { type: 'string', description: 'The answer to the question' },
            category: { type: 'string', description: 'Category of the Q&A', default: 'General' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Keywords for searching and categorization'
            },
            lastUpdatedBy: { type: 'string', description: 'ID of the user who last updated this entry' }, // Should be ref to User _id
            createdAt: { type: 'string', format: 'date-time', readOnly: true },
            updatedAt: { type: 'string', format: 'date-time', readOnly: true }
          },
          example: {
            _id: "65b91b5c90b0d3d8a4e3f4g5",
            question: "How do I reset my password?",
            answer: "You can reset your password by clicking on the 'Forgot Password' link.",
            category: "Account Management",
            tags: ["password", "login", "security"],
            lastUpdatedBy: "65b91b5c90b0d3d8a4e3f4g6",
            createdAt: "2025-07-06T08:00:00Z",
            updatedAt: "2025-07-06T08:00:00Z"
          }
        },
        SearchSuggestion: {
          type: 'object',
          properties: {
            _id: { type: 'string', readOnly: true, description: 'MongoDB ObjectID' },
            userId: { type: 'string', required: true, description: 'ID of the user' }, // Should be ref to User _id
            lastquery: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of last search queries by the user'
            },
            lastSearchedAt: { type: 'string', format: 'date-time', description: 'Timestamp of the last search' },
            createdAt: { type: 'string', format: 'date-time', readOnly: true },
            updatedAt: { type: 'string', format: 'date-time', readOnly: true }
          },
          example: {
            userId: "userABC",
            lastquery: ["doctor", "appointment booking"],
            lastSearchedAt: "2025-07-06T13:00:00Z"
          }
        }

      },
    },
  },
  apis: ['./src/routes/**/*.js'],
};

const specs = swaggerJsdoc(options);

export default specs; 