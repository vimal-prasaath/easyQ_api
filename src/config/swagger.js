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
        url: 'http://localhost:3000',
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
            name: { type: 'string' },
            address: { type: 'string' },
            contact: { type: 'string' },
            facilities: { 
              type: 'array',
              items: { type: 'string' }
            },
          },
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
      },
    },
  },
  apis: ['./src/routes/**/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

export default specs; 