import express, { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const paymentRouter = (paymentController: PaymentController): Router => {
    const router = Router();


    // Webhook route - raw body parsing is handled in server.ts
    router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook.bind(paymentController));


    router.use(authenticate);

    // Other routes that need JSON parsing
    router.post('/create-payment-intent', paymentController.createPaymentIntent.bind(paymentController));
    router.post('/create-checkout-session', paymentController.createCheckoutSession.bind(paymentController));
    router.post('/verify-checkout-session', paymentController.verifyCheckoutSession.bind(paymentController));
    router.get('/create-customer-portal', paymentController.createCustomerPortal.bind(paymentController));
    router.get('/discount-status', paymentController.checkDiscountEligibility.bind(paymentController));

    router.post('/end-trial', paymentController.endTrial.bind(paymentController));


    return router;
};

export default paymentRouter;