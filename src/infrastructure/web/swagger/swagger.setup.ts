// src/infrastructure/web/swagger/swagger.setup.ts
import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import * as path from 'path';
import * as fs from 'fs';
import { swaggerSpec } from './swagger.config';
import { SwaggerSpecification, SwaggerYamlContent } from './swagger.types';

export function setupSwagger(app: Application): void {
  // Cast swaggerSpec to the proper type
  const spec = swaggerSpec as SwaggerSpecification;

  // Load all YAML files from definitions directory
  const definitionsPath = path.join(__dirname, 'definitions');

  // Check if definitions directory exists
  if (fs.existsSync(definitionsPath)) {
    const yamlFiles = fs.readdirSync(definitionsPath).filter(file => file.endsWith('.yml'));

    // Merge all YAML definitions into the main spec
    yamlFiles.forEach(file => {
      try {
        const filePath = path.join(definitionsPath, file);
        const yamlContent = YAML.load(filePath) as SwaggerYamlContent;

        // Merge components
        if (yamlContent.components) {
          spec.components = {
            ...spec.components,
            ...yamlContent.components,
            schemas: {
              ...spec.components?.schemas,
              ...yamlContent.components?.schemas
            },
            securitySchemes: {
              ...spec.components?.securitySchemes,
              ...yamlContent.components?.securitySchemes
            }
          };
        }

        // Merge paths
        if (yamlContent.paths) {
          spec.paths = {
            ...spec.paths,
            ...yamlContent.paths
          };
        }

        // Merge tags
        if (yamlContent.tags) {
          spec.tags = [
            ...(spec.tags || []),
            ...yamlContent.tags
          ];
        }
      } catch (error) {
        console.error(`Error loading Swagger YAML file ${file}:`, error);
      }
    });
  } else {
    console.warn('Swagger definitions directory not found:', definitionsPath);
  }

  // Custom CSS for Swagger UI
  const customCss = `
    .swagger-ui .topbar { 
      display: none; 
    }
    .swagger-ui .info .title {
      color: #5C633A;
    }
    .swagger-ui .btn.authorize {
      background-color: #5C633A;
      border-color: #5C633A;
    }
    .swagger-ui .btn.authorize:hover {
      background-color: #ff5252;
      border-color: #ff5252;
    }
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #49cc90;
    }
    .swagger-ui .opblock.opblock-put .opblock-summary-method {
      background: #fca130;
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: #f93e3e;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #61affe;
    }
  `;

  // Swagger UI options
  const swaggerOptions = {
    customCss,
    customSiteTitle: 'Thrive in Japan API Documentation',
    customfavicon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: process.env.NODE_ENV !== 'production',
      filter: true,
      deepLinking: true,
      displayOperationId: false,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      docExpansion: 'list' as const,
      tagsSorter: 'alpha' as const,
      operationsSorter: 'alpha' as const
    }
  };

  // Serve Swagger JSON spec at /api-spec
  app.get('/api-spec', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(spec);
  });

  // Serve Swagger UI at /docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec, swaggerOptions));

  console.log('Swagger documentation available at /docs');
}