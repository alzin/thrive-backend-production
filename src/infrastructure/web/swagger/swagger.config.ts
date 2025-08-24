// src/infrastructure/web/swagger/swagger.config.ts
import swaggerJsdoc from 'swagger-jsdoc';
import * as path from 'path';

const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Thrive in Japan LMS API',
            version: '1.0.0',
            description: 'API documentation for Thrive in Japan Learning Management System',
            contact: {
                name: 'Thrive in Japan Support',
                email: 'support@thriveinjapan.com',
            },
            license: {
                name: 'Proprietary',
            },
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:5000/api',
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT Bearer token',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [
        path.join(__dirname, './definitions/*.yml'),
        path.join(__dirname, '../routes/*.ts'),
    ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);