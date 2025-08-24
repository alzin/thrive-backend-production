// src/infrastructure/web/swagger/swagger.types.ts

export interface SwaggerComponents {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
    responses?: Record<string, any>;
    parameters?: Record<string, any>;
    examples?: Record<string, any>;
    requestBodies?: Record<string, any>;
    headers?: Record<string, any>;
    links?: Record<string, any>;
    callbacks?: Record<string, any>;
}

export interface SwaggerTag {
    name: string;
    description: string;
}

export interface SwaggerServer {
    url: string;
    description?: string;
    variables?: Record<string, any>;
}

export interface SwaggerInfo {
    title: string;
    version: string;
    description?: string;
    termsOfService?: string;
    contact?: {
        name?: string;
        url?: string;
        email?: string;
    };
    license?: {
        name: string;
        url?: string;
    };
}

export interface SwaggerSpecification {
    openapi: string;
    info: SwaggerInfo;
    servers?: SwaggerServer[];
    components?: SwaggerComponents;
    paths?: Record<string, any>;
    tags?: SwaggerTag[];
    security?: Array<Record<string, string[]>>;
    externalDocs?: {
        description?: string;
        url: string;
    };
}

export interface SwaggerYamlContent {
    components?: SwaggerComponents;
    paths?: Record<string, any>;
    tags?: SwaggerTag[];
    [key: string]: any;
}