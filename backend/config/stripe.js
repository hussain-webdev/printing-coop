import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Create a Stripe Payment Intent
const createStripePaymentIntent = async (amount) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe works in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('[v0] Error creating Stripe payment intent:', error.message);
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
};

// Confirm that a payment intent succeeded
const confirmStripePayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      status: paymentIntent.status,
      id: paymentIntent.id,
      amount: paymentIntent.amount,
    };
  } catch (error) {
    console.error('[v0] Error retrieving Stripe payment intent:', error.message);
    throw new Error(`Failed to retrieve payment intent: ${error.message}`);
  }
};

export { createStripePaymentIntent, confirmStripePayment, stripe };
