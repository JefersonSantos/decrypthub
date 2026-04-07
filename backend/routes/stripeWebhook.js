const express = require('express');
const router = express.Router();
const { stripe } = require('../services/stripe');
const supabase = require('../services/supabase');

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[STRIPE WEBHOOK] Assinatura inválida:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userId = sub.metadata?.supabase_user_id;
        const plan = sub.metadata?.plan || 'free';

        if (!userId) break;

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: sub.id,
          stripe_price_id: sub.items.data[0]?.price.id,
          plan,
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString()
        }, { onConflict: 'stripe_subscription_id' });

        if (sub.status === 'active' || sub.status === 'trialing') {
          await supabase.from('profiles').update({ plan }).eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata?.supabase_user_id;

        if (!userId) break;

        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', sub.id);

        await supabase.from('profiles').update({ plan: 'free' }).eq('id', userId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customer = await stripe.customers.retrieve(invoice.customer);
        const userId = customer.metadata?.supabase_user_id;

        if (!userId) break;

        await supabase.from('profiles').update({ plan: 'free' }).eq('id', userId);
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('user_id', userId)
          .eq('status', 'active');
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[STRIPE WEBHOOK] Erro ao processar evento:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
