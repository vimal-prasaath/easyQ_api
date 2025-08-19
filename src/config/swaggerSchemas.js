/**
 * Centralized Swagger Schemas and Documentation
 * This file contains all API documentation that was previously scattered in route files
 */

export const swaggerSchemas = {
  // Admin Schemas
  AdminSignup: {
    type: 'object',
    required: ['email', 'password', 'username'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Admin email address'
      },
      password: {
        type: 'string',
        minLength: 8,
        description: 'Admin password (minimum 8 characters)'
      },
      username: {
        type: 'string',
        minLength: 3,
        description: 'Admin username (minimum 3 characters)'
      }
    }
  },
  AdminLogin: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Admin email address'
      },
      password: {
        type: 'string',
        description: 'Admin password'
      }
    }
  },
  AdminOnboarding: {
    type: 'object',
    required: [
      'adminId', 'ownerName', 'ownerMobile', 'ownerProof', 'ownerProofNumber',
      'hospitalName', 'hospitalType', 'registrationNumber', 'address', 'city',
      'state', 'pincode', 'phoneNumber', 'workingDays'
    ],
    properties: {
      adminId: {
        type: 'string',
        description: 'Admin ID (e.g., A0001)'
      },
      ownerName: {
        type: 'string',
        description: 'Owner full name'
      },
      ownerMobile: {
        type: 'string',
        pattern: '^[0-9]{10}$',
        description: '10-digit mobile number'
      },
      ownerProof: {
        type: 'string',
        description: 'Type of proof (Aadhar/PAN/Driving License)'
      },
      ownerProofNumber: {
        type: 'string',
        description: 'Proof document number'
      },
      hospitalName: {
        type: 'string',
        description: 'Hospital name'
      },
      hospitalType: {
        type: 'string',
        description: 'Type of hospital'
      },
      registrationNumber: {
        type: 'string',
        description: 'Hospital registration number'
      },
      address: {
        type: 'string',
        description: 'Hospital address'
      },
      city: {
        type: 'string',
        description: 'City'
      },
      state: {
        type: 'string',
        description: 'State'
      },
      pincode: {
        type: 'string',
        description: 'Pincode'
      },
      phoneNumber: {
        type: 'string',
        description: 'Hospital phone number'
      },
      workingDays: {
        type: 'array',
        items: { type: 'string' },
        description: 'Working days of the hospital'
      }
    }
  },
  HospitalCompleteInfo: {
    type: 'object',
    required: ['adminId', 'hospitalId'],
    properties: {
      adminId: {
        type: 'string',
        description: 'Admin ID (e.g., A0001)'
      },
      hospitalId: {
        type: 'string',
        description: 'Hospital ID (e.g., H0001)'
      },
      hospitalName: {
        type: 'string',
        description: 'Hospital name'
      },
      hospitalType: {
        type: 'string',
        description: 'Type of hospital'
      },
      registrationNumber: {
        type: 'string',
        description: 'Hospital registration number'
      },
      address: {
        type: 'string',
        description: 'Hospital address'
      },
      city: {
        type: 'string',
        description: 'City'
      },
      state: {
        type: 'string',
        description: 'State'
      },
      pincode: {
        type: 'string',
        description: 'Pincode'
      },
      phoneNumber: {
        type: 'string',
        description: 'Hospital phone number'
      },
      workingDays: {
        type: 'array',
        items: { type: 'string' },
        description: 'Working days of the hospital'
      }
    }
  },

  // Doctor Schemas
  DoctorCreate: {
    type: 'object',
    required: ['adminId', 'name', 'email', 'mobileNumber', 'specialization', 'hospitalId', 'consultantFee'],
    properties: {
      adminId: {
        type: 'string',
        description: 'Admin ID (required for verification)'
      },
      name: {
        type: 'string',
        description: 'Doctor name'
      },
      email: {
        type: 'string',
        description: 'Doctor email'
      },
      mobileNumber: {
        type: 'string',
        description: 'Doctor mobile number'
      },
      specialization: {
        type: 'string',
        description: 'Doctor specialization'
      },
      hospitalId: {
        type: 'string',
        description: 'Hospital ID'
      },
      consultantFee: {
        type: 'number',
        description: 'Consultant fee'
      },
      status: {
        type: 'string',
        description: 'Doctor status (Available/Unavailable)'
      }
    }
  },
  DoctorGet: {
    type: 'object',
    required: ['doctorId'],
    properties: {
      doctorId: {
        type: 'string',
        description: 'Doctor ID'
      }
    }
  },
  DoctorDelete: {
    type: 'object',
    required: ['adminId', 'doctorId'],
    properties: {
      adminId: {
        type: 'string',
        description: 'Admin ID (required for verification)'
      },
      doctorId: {
        type: 'string',
        description: 'Doctor ID to delete'
      }
    }
  },
  DoctorImageUpload: {
    type: 'object',
    required: ['adminId', 'doctorId'],
    properties: {
      adminId: {
        type: 'string',
        description: 'Admin ID (required for verification)'
      },
      doctorId: {
        type: 'string',
        description: 'Doctor ID'
      }
    }
  },

  // Hospital Schemas
  Hospital: {
    type: 'object',
    properties: {
      hospitalName: {
        type: 'string',
        description: 'Hospital name'
      },
      hospitalType: {
        type: 'string',
        description: 'Type of hospital'
      },
      registrationNumber: {
        type: 'string',
        description: 'Hospital registration number'
      },
      address: {
        type: 'string',
        description: 'Hospital address'
      },
      city: {
        type: 'string',
        description: 'City'
      },
      state: {
        type: 'string',
        description: 'State'
      },
      pincode: {
        type: 'string',
        description: 'Pincode'
      },
      phoneNumber: {
        type: 'string',
        description: 'Hospital phone number'
      }
    }
  },
  HospitalFacility: {
    type: 'object',
    properties: {
      hospitalId: {
        type: 'string',
        description: 'Hospital ID'
      },
      facilities: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of hospital facilities'
      }
    }
  },
  HospitalReview: {
    type: 'object',
    properties: {
      hospitalId: {
        type: 'string',
        description: 'Hospital ID'
      },
      rating: {
        type: 'number',
        minimum: 1,
        maximum: 5,
        description: 'Rating (1-5)'
      },
      comment: {
        type: 'string',
        description: 'Review comment'
      }
    }
  },

  // User Schemas
  UserSignup: {
    type: 'object',
    required: ['email', 'password', 'name', 'gender', 'dateOfBirth', 'mobileNumber', 'role', 'location'],
    properties: {
      name: { type: 'string', description: 'User full name' },
      gender: { type: 'string', enum: ['Male', 'Female', 'Other'], description: 'User gender' },
      dateOfBirth: { type: 'string', format: 'date', description: 'Date of birth' },
      email: { type: 'string', format: 'email', description: 'User email' },
      mobileNumber: { type: 'string', description: 'Mobile number' },
      password: { type: 'string', description: 'User password' },
      role: { type: 'string', enum: ['admin', 'user', 'doctor'], description: 'User role' },
      location: { type: 'string', description: 'User location' }
    }
  },
  UserLogin: {
    type: 'object',
    required: ['phoneNumber'],
    properties: {
      phoneNumber: { type: 'string', description: 'Phone number for login' }
    }
  },
  UserUpdate: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'User full name' },
      gender: { type: 'string', enum: ['male', 'female', 'other'], description: 'User gender' },
      dateOfBirth: { type: 'string', format: 'date', description: 'Date of birth' },
      email: { type: 'string', format: 'email', description: 'User email' },
      mobileNumber: { type: 'string', description: 'Mobile number' },
      location: { type: 'string', description: 'User location' }
    }
  },

  // Favourite Schemas
  FavouriteAdd: {
    type: 'object',
    required: ['userId', 'hospitalId', 'favourite'],
    properties: {
      userId: { type: 'string', description: 'User ID' },
      hospitalId: { type: 'string', description: 'Hospital ID' },
      favourite: { type: 'boolean', description: 'Favourite status' }
    }
  },

  // QR Code Schemas
  QRCodeGenerate: {
    type: 'object',
    required: ['userId', 'appointmentId'],
    properties: {
      userId: { type: 'string', description: 'User ID' },
      appointmentId: { type: 'string', description: 'Appointment ID' }
    }
  },

  // Review Schemas
  DoctorReview: {
    type: 'object',
    required: ['doctorId', 'patientId', 'rating', 'comment'],
    properties: {
      doctorId: { type: 'string', description: 'Doctor ID' },
      patientId: { type: 'string', description: 'Patient ID' },
      rating: { type: 'number', minimum: 1, maximum: 5, description: 'Rating (1-5)' },
      comment: { type: 'string', description: 'Review comment' }
    }
  },

  // Search Schemas
  HospitalSearch: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string', description: 'User ID performing search' },
      name: { type: 'string', description: 'Hospital name to search' },
      city: { type: 'string', description: 'City filter' },
      state: { type: 'string', description: 'State filter' },
      hospitalType: { type: 'string', description: 'Hospital type filter' },
      specialization: { type: 'string', description: 'Medical specialization' },
      coordinates: { 
        type: 'array', 
        items: { type: 'number' },
        description: 'Geographic coordinates [longitude, latitude]'
      }
    }
  },

  // Suggestion Schemas
  SuggestionGet: {
    type: 'object',
    properties: {
      patientId: { type: 'string', description: 'Patient ID for suggestions' }
    }
  },

  // Help Center Schemas
  QAEntry: {
    type: 'object',
    required: ['question', 'answer'],
    properties: {
      question: { type: 'string', description: 'Question text' },
      answer: { type: 'string', description: 'Answer text' },
      category: { type: 'string', description: 'QA category' },
      tags: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'Tags for categorization'
      }
    }
  },

  // File Upload Schemas
  FileUpload: {
    type: 'object',
    properties: {
      file: { type: 'string', format: 'binary', description: 'File to upload' }
    }
  },
  FileGet: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'User ID to get files for' }
    }
  },
  FileDownload: {
    type: 'object',
    properties: {
      fileKey: { type: 'string', description: 'File key for download' }
    }
  },
  FileDelete: {
    type: 'object',
    properties: {
      fileKey: { type: 'string', description: 'File key to delete' }
    }
  },

  // Patient Notes Schemas
  PatientNote: {
    type: 'object',
    required: ['doctorId', 'patientId', 'notes', 'visitType'],
    properties: {
      doctorId: { type: 'string', description: 'Doctor ID' },
      patientId: { type: 'string', description: 'Patient ID' },
      notes: { type: 'string', description: 'Patient notes' },
      visitType: { type: 'string', description: 'Type of visit' }
    }
  },

  // Appointment Schemas
  Appointment: {
    type: 'object',
    required: ['patientId', 'doctorId', 'hospitalId', 'appointmentDate', 'appointmentTime', 'reasonForAppointment', 'appointmentType', 'status', 'paymentStatus'],
    properties: {
      patientId: { type: 'string', description: 'Patient ID' },
      doctorId: { type: 'string', description: 'Doctor ID' },
      hospitalId: { type: 'string', description: 'Hospital ID' },
      appointmentDate: { type: 'string', format: 'date', description: 'Appointment date' },
      appointmentTime: { type: 'string', description: 'Appointment time' },
      reasonForAppointment: { type: 'string', description: 'Reason for appointment' },
      appointmentType: { type: 'string', description: 'Type of appointment' },
      status: { type: 'string', description: 'Appointment status' },
      paymentStatus: { type: 'string', description: 'Payment status' },
      bookingSource: { type: 'string', description: 'Source of booking' },
      patientNotes: { type: 'string', description: 'Patient notes' },
      paymentAmount: { type: 'number', description: 'Payment amount' }
    }
  },

  // Response Schemas
  SuccessResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean'
      },
      message: {
        type: 'string'
      },
      data: {
        type: 'object'
      }
    }
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean'
      },
      message: {
        type: 'string'
      },
      error: {
        type: 'string'
      }
    }
  }
};

export const swaggerPaths = {
  // Admin Paths
  '/api/admin/signup': {
    post: {
      summary: 'Create a new admin account',
      tags: ['Admin'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AdminSignup' }
          }
        }
      },
      responses: {
        201: {
          description: 'Admin account created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        },
        400: { description: 'Validation error' },
        409: { description: 'Admin with this email/username already exists' },
        500: { description: 'Internal server error' }
      }
    }
  },
  '/api/admin/login': {
    post: {
      summary: 'Authenticate admin and get JWT token',
      tags: ['Admin'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AdminLogin' }
          }
        }
      },
      responses: {
        200: {
          description: 'Admin login successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        },
        401: { description: 'Invalid credentials or inactive account' },
        500: { description: 'Internal server error' }
      }
    }
  },
  '/api/admin/onboarding': {
    put: {
      summary: 'Update complete onboarding information (all steps at once)',
      tags: ['Admin Onboarding'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AdminOnboarding' }
          }
        }
      },
      responses: {
        200: {
          description: 'Onboarding information updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        500: { description: 'Internal server error' }
      }
    }
  },
  '/api/admin/hospital/complete-info': {
    put: {
      summary: 'Update complete hospital information (post-onboarding)',
      tags: ['Admin Hospital Management'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/HospitalCompleteInfo' }
          }
        }
      },
      responses: {
        200: {
          description: 'Hospital information updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden - Admin not authorized for this hospital' },
        404: { description: 'Hospital not found' },
        500: { description: 'Internal server error' }
      }
    }
  },
  '/api/admin/{adminId}': {
    delete: {
      summary: 'Delete admin and all associated data',
      tags: ['Admin Management'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'adminId',
          required: true,
          schema: { type: 'string' },
          description: 'Admin ID to delete'
        }
      ],
      responses: {
        200: {
          description: 'Admin and associated data deleted successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        404: { description: 'Admin not found' },
        500: { description: 'Internal server error' }
      }
    }
  },

  // Doctor Paths
  '/api/doctor/add': {
    post: {
      summary: 'Create a new doctor',
      tags: ['Doctors'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DoctorCreate' }
          }
        }
      },
      responses: {
        201: { description: 'Doctor created successfully' },
        400: { description: 'Invalid input data - adminId is required' },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin verification required - Only approved admins can add doctors' }
      }
    }
  },
  '/api/doctor/get': {
    post: {
      summary: 'Get doctor by ID',
      tags: ['Doctors'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DoctorGet' }
          }
        }
      },
      responses: {
        200: {
          description: 'Doctor details',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        },
        401: { description: 'Unauthorized' },
        404: { description: 'Doctor not found' }
      }
    }
  },
  '/api/doctor/delete': {
    delete: {
      summary: 'Delete a doctor',
      tags: ['Doctors'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DoctorDelete' }
          }
        }
      },
      responses: {
        200: { description: 'Doctor deleted successfully' },
        400: { description: 'Invalid input data - adminId is required' },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin verification required - Only approved admins can delete doctors' },
        404: { description: 'Doctor not found' }
      }
    }
  },
  '/api/doctor/upload-image': {
    post: {
      summary: 'Upload doctor image',
      tags: ['Doctors'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: { $ref: '#/components/schemas/DoctorImageUpload' }
          }
        }
      },
      responses: {
        200: { description: 'Image uploaded successfully' },
        400: { description: 'Invalid input data - adminId is required' },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin verification required - Only approved admins can upload images' },
        404: { description: 'Doctor not found' }
      }
    }
  },

  // Hospital Paths
  '/api/hospital/basicDetails': {
    post: {
      summary: 'Create a new hospital',
      tags: ['Hospitals'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Hospital' }
          }
        }
      },
      responses: {
        201: { description: 'Hospital created successfully' },
        400: { description: 'Invalid input data' },
        401: { description: 'Unauthorized' }
      }
    }
  },
  '/api/hospital/facilities': {
    post: {
      summary: 'Add hospital facilities',
      tags: ['Hospitals'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/HospitalFacility' }
          }
        }
      },
      responses: {
        201: { description: 'Facilities added successfully' },
        400: { description: 'Invalid input data' },
        401: { description: 'Unauthorized' }
      }
    }
  },
  '/api/hospital/review': {
    post: {
      summary: 'Create a hospital review',
      tags: ['Hospitals'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/HospitalReview' }
          }
        }
      },
      responses: {
        201: { description: 'Review created successfully' },
        400: { description: 'Invalid input data' },
        401: { description: 'Unauthorized' }
      }
    }
  },
  '/api/hospital/{hospitalId}': {
    delete: {
      summary: 'Delete a hospital',
      tags: ['Hospitals'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'hospitalId',
          required: true,
          schema: { type: 'string' },
          description: 'Hospital ID to delete'
        }
      ],
      responses: {
        200: { description: 'Hospital deleted successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        404: { description: 'Hospital not found' },
        500: { description: 'Internal server error' }
      }
    }
  },

  // User Paths
  '/api/user': {
    get: {
      summary: 'Get all users',
      tags: ['Users'],
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'List of all users',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/UserUpdate' }
              }
            }
          }
        },
        401: { description: 'Unauthorized' }
      }
    }
  },
  '/api/user/{userId}': {
    put: {
      summary: 'Update user details',
      tags: ['Users'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserUpdate' }
          }
        }
      },
      responses: {
        200: { description: 'User updated successfully' },
        400: { description: 'Invalid input data' },
        401: { description: 'Unauthorized' },
        404: { description: 'User not found' }
      }
    }
  },
  '/api/user/getUser': {
    get: {
      summary: 'Get current user profile',
      tags: ['Users'],
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Current user profile',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserUpdate' }
            }
          }
        },
        401: { description: 'Unauthorized' },
        404: { description: 'User not found' }
      }
    }
  },

  // Login Paths
  '/api/login': {
    post: {
      summary: 'Authenticate user and generate token',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserLogin' }
          }
        }
      },
      responses: {
        200: { description: 'Login successful' },
        401: { description: 'Invalid credentials' }
      }
    }
  },

  // Signup Paths
  '/api/signup': {
    post: {
      summary: 'Create a new user account',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserSignup' }
          }
        }
      },
      responses: {
        201: { description: 'User account created successfully' },
        400: { description: 'Invalid input data' },
        409: { description: 'User already exists' }
      }
    }
  },

  // Favourite Paths
  '/api/favourite/addfav': {
    post: {
      summary: 'Add or update a hospital as favourite',
      tags: ['Favourites'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/FavouriteAdd' }
          }
        }
      },
      responses: {
        200: { description: 'Favourite status updated' },
        400: { description: 'Invalid input data' },
        404: { description: 'User or hospital not found' }
      }
    }
  },
  '/api/favourite/{userId}/{hospitalId}': {
    get: {
      summary: 'Get favourite status for a hospital by user',
      tags: ['Favourites'],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string' }
        },
        {
          in: 'path',
          name: 'hospitalId',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: { description: 'Favourite status retrieved' },
        404: { description: 'User or hospital not found' }
      }
    }
  },

  // QR Code Paths
  '/api/qrgenerator': {
    post: {
      summary: 'Generate a QR code for an appointment',
      tags: ['QR Code'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/QRCodeGenerate' }
          }
        }
      },
      responses: {
        200: { description: 'QR code generated successfully' },
        400: { description: 'Invalid input parameters' },
        401: { description: 'Unauthorized' },
        404: { description: 'User or appointment not found' }
      }
    }
  },
  '/api/qrgenerator/getdetails': {
    get: {
      summary: 'Get QR code details for an appointment',
      tags: ['QR Code'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'userId',
          required: true,
          schema: { type: 'string' }
        },
        {
          in: 'query',
          name: 'appointmentId',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: { description: 'QR code details retrieved successfully' },
        400: { description: 'Invalid input parameters' },
        401: { description: 'Unauthorized' },
        404: { description: 'User or appointment not found' }
      }
    }
  },

  // Review Paths
  '/api/reviews/doctor/reviews': {
    post: {
      summary: 'Create a new doctor review',
      tags: ['Reviews'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DoctorReview' }
          }
        }
      },
      responses: {
        201: { description: 'Review created' },
        400: { description: 'Invalid input data' }
      }
    }
  },
  '/api/reviews/doctor/{doctorId}': {
    get: {
      summary: 'Get reviews for a doctor',
      tags: ['Reviews'],
      parameters: [
        {
          in: 'path',
          name: 'doctorId',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: { description: 'List of reviews for the doctor' },
        404: { description: 'Doctor not found' }
      }
    }
  },

  // Search Paths
  '/api/search': {
    post: {
      summary: 'Search for hospitals based on various criteria',
      tags: ['Search'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/HospitalSearch' }
          }
        }
      },
      responses: {
        200: { description: 'Search results' },
        400: { description: 'Invalid input parameters' },
        401: { description: 'Unauthorized' }
      }
    }
  },

  // Suggestion Paths
  '/api/getSuggestion': {
    get: {
      summary: 'Get similar appointment suggestions for a patient',
      tags: ['Suggestions'],
      parameters: [
        {
          in: 'query',
          name: 'patientId',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: { description: 'List of similar appointment suggestions' },
        400: { description: 'Invalid input data' },
        404: { description: 'Patient not found' }
      }
    }
  },

  // Help Center Paths
  '/api/qa': {
    post: {
      summary: 'Create a new Q&A entry',
      tags: ['HelpCenter'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/QAEntry' }
          }
        }
      },
      responses: {
        201: { description: 'Q&A entry created' },
        400: { description: 'Invalid input data' }
      }
    },
    get: {
      summary: 'Get all Q&A entries',
      tags: ['HelpCenter'],
      responses: {
        200: { description: 'List of Q&A entries' },
        500: { description: 'Server error' }
      }
    }
  },
  '/api/qa/{id}': {
    put: {
      summary: 'Update a Q&A entry',
      tags: ['HelpCenter'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/QAEntry' }
          }
        }
      },
      responses: {
        200: { description: 'Q&A entry updated' },
        400: { description: 'Invalid input data' },
        404: { description: 'Q&A not found' }
      }
    },
    delete: {
      summary: 'Delete a Q&A entry',
      tags: ['HelpCenter'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: { description: 'Q&A entry deleted' },
        404: { description: 'Q&A not found' }
      }
    }
  },

  // File Upload Paths
  '/api/uploadfile': {
    post: {
      summary: 'Upload a file',
      tags: ['Files'],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: { $ref: '#/components/schemas/FileUpload' }
          }
        }
      },
      responses: {
        200: { description: 'File uploaded successfully' },
        400: { description: 'Invalid file or upload error' }
      }
    }
  },
  '/api/getfile': {
    get: {
      summary: 'Get all files for a user',
      tags: ['Files'],
      responses: {
        200: { description: 'List of files' },
        404: { description: 'No files found' }
      }
    }
  },
  '/api/file/download': {
    get: {
      summary: 'Download a file',
      tags: ['Files'],
      responses: {
        200: { description: 'File download link' },
        404: { description: 'File not found' }
      }
    }
  },
  '/api/file/delete': {
    delete: {
      summary: 'Delete a file',
      tags: ['Files'],
      responses: {
        200: { description: 'File deleted' },
        404: { description: 'File not found' }
      }
    }
  },

  // Patient Notes Paths
  '/api/patient-notes': {
    post: {
      summary: 'Create a new patient note',
      tags: ['PatientNotes'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PatientNote' }
          }
        }
      },
      responses: {
        201: { description: 'Patient note created' },
        400: { description: 'Invalid input data' }
      }
    }
  },
  '/api/patient-notes/doctor/{doctorId}': {
    get: {
      summary: 'Get patient notes by doctor ID',
      tags: ['PatientNotes'],
      parameters: [
        {
          in: 'path',
          name: 'doctorId',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: { description: 'List of patient notes for the doctor' },
        404: { description: 'Doctor not found' }
      }
    }
  },
  '/api/patient-notes/patient/{patientId}': {
    get: {
      summary: 'Get patient notes by patient ID',
      tags: ['PatientNotes'],
      parameters: [
        {
          in: 'path',
          name: 'patientId',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: { description: 'List of patient notes for the patient' },
        404: { description: 'Patient not found' }
      }
    }
  },
  '/api/patient-notes/{noteId}': {
    put: {
      summary: 'Update a patient note',
      tags: ['PatientNotes'],
      parameters: [
        {
          in: 'path',
          name: 'noteId',
          required: true,
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PatientNote' }
          }
        }
      },
      responses: {
        200: { description: 'Patient note updated' },
        400: { description: 'Invalid input data' },
        404: { description: 'Note not found' }
      }
    },
    delete: {
      summary: 'Delete a patient note',
      tags: ['PatientNotes'],
      parameters: [
        {
          in: 'path',
          name: 'noteId',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: { description: 'Patient note deleted' },
        404: { description: 'Note not found' }
      }
    }
  },

  // Appointment Paths
  '/api/appointment': {
    post: {
      summary: 'Create a new appointment',
      tags: ['Appointments'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Appointment' }
          }
        }
      },
      responses: {
        201: { description: 'Appointment created successfully' },
        400: { description: 'Invalid input data' },
        401: { description: 'Unauthorized' }
      }
    }
  },
  '/api/appointment/{appointmentId}': {
    put: {
      summary: 'Update an appointment',
      tags: ['Appointments'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'appointmentId',
          required: true,
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Appointment' }
          }
        }
      },
      responses: {
        200: { description: 'Appointment updated successfully' },
        400: { description: 'Invalid input data' },
        401: { description: 'Unauthorized' },
        404: { description: 'Appointment not found' }
      }
    },
    delete: {
      summary: 'Delete an appointment',
      tags: ['Appointments'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'appointmentId',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: { description: 'Appointment deleted successfully' },
        401: { description: 'Unauthorized' },
        404: { description: 'Appointment not found' }
      }
    }
  }
};

export const swaggerComponents = {
  schemas: swaggerSchemas,
  securitySchemes: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  }
};
