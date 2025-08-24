import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { AppDataSource } from './infrastructure/database/config/database.config';
import { Server } from './infrastructure/web/server';

dotenv.config();

const PORT = parseInt(process.env.PORT || '5000', 10);

async function bootstrap() {
  try {
    // Initialize database
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    // Start server
    const server = new Server(PORT);
    await server.start();
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();