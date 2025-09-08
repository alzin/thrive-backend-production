import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { courseRouter } from './routes/course.routes';
import { communityRouter } from './routes/community.routes';
import { bookingRouter } from './routes/booking.routes';
import { adminRouter } from './routes/admin.routes';
import { profileRouter } from './routes/profile.routes';
import { paymentRouter } from './routes/payment.routes';
import { calendarRouter } from './routes/calendar.routes';
import { sessionRouter } from './routes/session.routes';
import { subscriptionRouter } from './routes/subscription.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { publicProfileRouter } from './routes/publicProfile.routes'; // Add this import
import { feedbackRouter } from './routes/feedback.routes';

import { setupSwagger } from './swagger/swagger.setup';
import { activityRouter } from './routes/activity.routes';
import { announcementRouter } from './routes/announcement.routes';
import { videoRouter } from './routes/video.routes';

export class Server {
  private app: Application;
  private port: number;

  constructor(port: number) {
    this.app = express();
    this.port = port;
    this.configureMiddleware();
    this.configureRoutes();
    this.configureSwagger();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:", "https://*.amazonaws.com"], // Allow S3 images
        },
      },
    }));

    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    }));

    this.app.use(compression());
    this.app.use(morgan('dev'));
    this.app.use(cookieParser());

    this.app.use((req, res, next) => {
      if (req.originalUrl === "/api/payment/webhook") {
        next();
      } else {
        express.json({ limit: '10mb' })(req, res, next); // Increased limit for file uploads
      }
    });
  }

  private configureRoutes(): void {
    this.app.use('/uploads', express.static('uploads'));

    // Public routes (no authentication required)
    this.app.use('/api/public/profile', publicProfileRouter); // Add this line

    // API routes
    this.app.use('/api/auth', authRouter);
    this.app.use('/api/users', userRouter);
    this.app.use('/api/profile', profileRouter);
    this.app.use('/api/courses', courseRouter);
    this.app.use('/api/community', communityRouter);
    this.app.use('/api/bookings', bookingRouter);
    this.app.use('/api/payment', paymentRouter);
    this.app.use('/api/admin', adminRouter);
    this.app.use('/api/calendar', calendarRouter);
    this.app.use('/api/sessions', sessionRouter);
    this.app.use('/api/subscriptions', subscriptionRouter);
    this.app.use('/api/dashboard', dashboardRouter);
    this.app.use('/api/activities', activityRouter);
    this.app.use('/api/announcements', announcementRouter);
    this.app.use('/api/videos', videoRouter);
    this.app.use('/api/feedback', feedbackRouter)

    // Health check
    this.app.get('/', (_, res) => {
      res.send("OK")
    });
  }

  private configureErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private configureSwagger(): void {
    setupSwagger(this.app);
  }

  public async start(): Promise<void> {
    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
      console.log(`API Documentation available at http://localhost:${this.port}/docs`);

      // Log S3 configuration status
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        console.log(`✅ AWS S3 configured for bucket: ${process.env.AWS_S3_BUCKET_NAME || 'thrive-in-japan'}`);
      } else {
        console.log(`⚠️  AWS S3 not configured - using local storage`);
      }
    });
  }

  public getApp(): Application {
    return this.app;
  }
}