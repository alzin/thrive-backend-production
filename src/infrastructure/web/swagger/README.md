# Swagger API Documentation

## Overview

This directory contains the Swagger/OpenAPI documentation for the Thrive in Japan LMS API.

## Structure

```
swagger/
├── swagger.config.ts       # Main Swagger configuration
├── swagger.setup.ts        # Swagger UI setup and customization
├── definitions/           # YAML definitions for each API route
│   ├── common.yml        # Common schemas and definitions
│   ├── auth.yml          # Authentication endpoints
│   ├── user.yml          # User management endpoints
│   ├── profile.yml       # Profile management endpoints
│   ├── course.yml        # Course and lesson endpoints
│   ├── session.yml       # Session management endpoints
│   ├── booking.yml       # Booking endpoints
│   ├── calendar.yml      # Calendar view endpoints
│   ├── community.yml     # Community posts endpoints
│   ├── payment.yml       # Payment processing endpoints
│   └── admin.yml         # Admin-only endpoints
└── README.md            # This file
```

## Accessing the Documentation

Once the server is running, you can access the Swagger documentation at:

- **Swagger UI**: `http://localhost:5000/docs`
- **OpenAPI JSON Spec**: `http://localhost:5000/api-spec`

## Authentication

Most endpoints require JWT authentication. To authenticate:

1. Use the `/api/auth/login` endpoint to get a JWT token
2. Click the "Authorize" button in Swagger UI
3. Enter the token in the format: `Bearer YOUR_JWT_TOKEN`
4. Click "Authorize" to apply the token to all requests

## Environment Variables

Make sure these environment variables are set:

```env
API_URL=http://localhost:5000/api
NODE_ENV=development
```

## Adding New Endpoints

To add new API documentation:

1. Create or update the appropriate YAML file in the `definitions/` directory
2. Follow the OpenAPI 3.0 specification
3. Add any new schemas to `common.yml` if they're shared across multiple endpoints
4. The documentation will be automatically loaded when the server restarts

## YAML File Structure

Each YAML file should contain:

```yaml
tags:
  - name: TagName
    description: Description of the API group

paths:
  /endpoint/path:
    method:
      tags:
        - TagName
      summary: Short description
      description: Detailed description
      parameters: []
      requestBody: {}
      responses: {}
```

## Schema References

Use `$ref` to reference schemas from common.yml:

```yaml
schema:
  $ref: "#/components/schemas/User"
```

## Testing

- In development, "Try it out" functionality is enabled
- In production, this feature is disabled for security
- Always test your endpoints after documenting them

## Customization

The Swagger UI is customized with:

- Custom CSS matching the Thrive in Japan brand colors
- Hidden top bar for cleaner look
- Persistent authorization
- Alphabetically sorted tags and operations

## Best Practices

1. Keep descriptions clear and concise
2. Provide example values for all fields
3. Document all possible response codes
4. Include validation rules in schema definitions
5. Use consistent naming conventions
6. Group related endpoints using tags

## Troubleshooting

If endpoints are not showing up:

1. Check YAML syntax (use a YAML validator)
2. Ensure the file is in the `definitions/` directory
3. Restart the server
4. Check console for any parsing errors

## Updates

When updating the API:

1. Update the corresponding YAML file
2. Update the version in `swagger.config.ts`
3. Document breaking changes in the API changelog
