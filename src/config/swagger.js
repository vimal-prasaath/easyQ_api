import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerComponents, swaggerPaths } from './swaggerSchemas.js';

const definition = {
  openapi: "3.0.0",
  info: {
    title: "EasyQ API Documentation",
    version: "1.0.0",
    description: "API documentation for EasyQ application",
    contact: {
      name: "EasyQ Support",
      url: "https://easyq.com/support",
      email: "support@easyq.com",
    },
  },
  servers: [
    {
      url: "https://api2-cd3vrfxtha-uc.a.run.app",
      description: "Production server",
    },
  ],
  components: swaggerComponents,
  paths: swaggerPaths,
};

const swaggerOptions = {
  definition: definition,
  apis: ['./src/app.js'],
};

const specs = swaggerJsdoc(swaggerOptions);

export default specs;
