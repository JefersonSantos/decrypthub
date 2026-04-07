const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  free: {
    name: 'Free',
    webhooks: 1,
    logsRetentionDays: 1,
    requestsPerMonth: 500,
    priceId: null,
    price: 0
  },
  starter: {
    name: 'Starter',
    webhooks: 5,
    logsRetentionDays: 7,
    requestsPerMonth: 10000,
    priceId: process.env.STRIPE_PRICE_STARTER,
    price: 19
  },
  pro: {
    name: 'Pro',
    webhooks: 20,
    logsRetentionDays: 30,
    requestsPerMonth: 100000,
    priceId: process.env.STRIPE_PRICE_PRO,
    price: 49
  },
  enterprise: {
    name: 'Enterprise',
    webhooks: -1, // ilimitado
    logsRetentionDays: 90,
    requestsPerMonth: -1, // ilimitado
    priceId: process.env.STRIPE_PRICE_ENTERPRISE,
    price: 199
  }
};

module.exports = { stripe, PLANS };
