const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { stripe, PLANS } = require('../services/stripe');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/billing/plans - retorna planos disponíveis
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

// GET /api/billing/subscription - retorna assinatura atual
router.get('/subscription', async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, stripe_customer_id')
      .eq('id', req.user.id)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    res.json({
      plan: profile?.plan || 'free',
      limits: PLANS[profile?.plan || 'free'],
      subscription: subscription || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/checkout - cria sessão de checkout Stripe
router.post('/checkout', async (req, res) => {
  try {
    const { plan } = req.body;

    if (!PLANS[plan] || !PLANS[plan].priceId) {
      return res.status(400).json({ error: 'Plano inválido' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', req.user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Cria customer no Stripe se não existir
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: profile?.full_name || req.user.email,
        metadata: { supabase_user_id: req.user.id }
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', req.user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/billing?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/billing?canceled=true`,
      subscription_data: {
        trial_period_days: plan === 'starter' ? 7 : undefined,
        metadata: { supabase_user_id: req.user.id, plan }
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/portal - abre portal de gerenciamento Stripe
router.post('/portal', async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', req.user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: 'Nenhuma assinatura encontrada' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/billing`
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
