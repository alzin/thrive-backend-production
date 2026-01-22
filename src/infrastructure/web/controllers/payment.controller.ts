// backend/src/infrastructure/web/controllers/payment.controller.ts - Updated with Dependency Injection
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

// Use Cases
import { CreatePaymentIntentUseCase } from '../../../application/use-cases/payment/CreatePaymentIntentUseCase';
import { CreateCheckoutSessionUseCase } from '../../../application/use-cases/payment/CreateCheckoutSessionUseCase';
import { VerifyCheckoutSessionUseCase } from '../../../application/use-cases/payment/VerifyCheckoutSessionUseCase';
import { CreateCustomerPortalUseCase } from '../../../application/use-cases/payment/CreateCustomerPortalUseCase';
import { CheckDiscountEligibilityUseCase } from '../../../application/use-cases/payment/CheckDiscountEligibilityUseCase';
import { EndTrialUseCase } from '../../../application/use-cases/payment/EndTrialUseCase';
import { HandleWebhookUseCase } from '../../../application/use-cases/payment/HandleWebhookUseCase';

export class PaymentController {
  constructor(
    private createPaymentIntentUseCase: CreatePaymentIntentUseCase,
    private createCheckoutSessionUseCase: CreateCheckoutSessionUseCase,
    private verifyCheckoutSessionUseCase: VerifyCheckoutSessionUseCase,
    private createCustomerPortalUseCase: CreateCustomerPortalUseCase,
    private checkDiscountEligibilityUseCase: CheckDiscountEligibilityUseCase,
    private endTrialUseCase: EndTrialUseCase,
    private handleWebhookUseCase: HandleWebhookUseCase
  ) { }

  createPaymentIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { amount, currency, email } = req.body;

      const result = await this.createPaymentIntentUseCase.execute({
        amount,
        currency,
        email
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  createCheckoutSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mode, successUrl, cancelUrl, metadata, planType } = req.body;
      const email = req.user!.email;
      const userId = req.user!.userId;

      const result = await this.createCheckoutSessionUseCase.execute({
        mode,
        successUrl,
        cancelUrl,
        metadata,
        planType,
        email,
        userId
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  verifyCheckoutSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.body;

      const result = await this.verifyCheckoutSessionUseCase.execute({ sessionId });

      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Session not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  createCustomerPortal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;

      if (!userId) {
        res.status(400).json({ error: 'User Not Found' });
        return;
      }

      const result = await this.createCustomerPortalUseCase.execute({ userId });

      res.status(200).json({
        message: 'Create Customer Portal Session Successful',
        session: result.session
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Subscription not found') {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message === 'stripeCustomerId Not Found') {
          res.status(400).json({ error: error.message });
          return;
        }
        if (error.message === 'Failed to createCustomerPortalSession') {
          res.status(500).json({ error: error.message });
          return;
        }
      }
      next(error);
    }
  }

  checkDiscountEligibility = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.checkDiscountEligibilityUseCase.execute();

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  endTrial = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;

      if (!userId) {
        res.status(400).json({ error: 'User Not Found' });
        return;
      }

      const result = await this.endTrialUseCase.execute({ userId });

      res.status(200).json({
        message: 'Trial ended and payment activated',
        data: result.data
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Subscription not found') {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message === 'subscriptionId Not Found') {
          res.status(400).json({ error: error.message });
          return;
        }
        if (error.message === 'Failed to cancel trial') {
          res.status(500).json({ error: error.message });
          return;
        }
      }
      next(error);
    }
  }

  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string;

    try {
      await this.handleWebhookUseCase.execute({
        rawBody: req.body,
        signature: sig
      });

      res.json({ received: true });
    } catch (error: any) {
      console.error('❌ Webhook error:', error.message);
      res.status(400).json({ error: `Webhook Error: ${error.message}` });
    }
  };
}