import express, { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const paymentController = new PaymentController();


// Webhook route - raw body parsing is handled in server.ts
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);


router.use(authenticate);

// Other routes that need JSON parsing
router.post('/create-payment-intent', paymentController.createPaymentIntent);
router.post('/create-checkout-session', paymentController.createCheckoutSession);
router.post('/verify-checkout-session', paymentController.verifyCheckoutSession);
router.get('/create-customer-portal', paymentController.createCustomerPortal);
router.get('/discount-status', paymentController.checkDiscountEligibility);

router.post('/end-trial', paymentController.endTrial);


export { router as paymentRouter };