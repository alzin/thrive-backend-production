import 'reflect-metadata';

import { Server } from './infrastructure/web/server';
import { ENV_CONFIG } from './infrastructure/config/env.config';
import { AppDataSource } from './infrastructure/database/config/database.config';

async function bootstrap() {
  try {
    // Initialize database
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    // Start server
    const server = new Server(ENV_CONFIG.PORT);
    await server.start();
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();