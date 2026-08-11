import express from 'express';
import { addToCart, placeOrder, updateQuantity, deleteCartItem, getAllOrders, getSellerOrders, reorderFromOrder, getSellerCart, createStripePaymentIntentController, confirmStripePaymentController, chargeAuthorizeNetController } from '../controllers/orderController.js';

const orderRouter = express.Router();

// Cart management routes
orderRouter.post('/add-to-cart', addToCart);
orderRouter.post('/update-quantity', updateQuantity);
orderRouter.post('/delete-cart-item', deleteCartItem);
orderRouter.post('/seller-cart', getSellerCart);

// Order placement route
orderRouter.post('/place-order', placeOrder);

// Stripe test payment routes
orderRouter.post('/create-payment-intent', createStripePaymentIntentController);
orderRouter.post('/confirm-stripe-payment', confirmStripePaymentController);
orderRouter.post('/charge-authorize-net', chargeAuthorizeNetController);

// Order retrieval routes
orderRouter.get('/all-orders', getAllOrders);
orderRouter.post('/seller-orders', getSellerOrders);

// Reorder route
orderRouter.post('/reorder', reorderFromOrder);

export default orderRouter;
