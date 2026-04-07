const supabase = require('../services/supabase');
const { PLANS } = require('../services/stripe');

/**
 * Verifica limite de requisições do plano do usuário
 */
async function planLimitMiddleware(req, res, next) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', req.user.id)
      .single();

    const plan = profile?.plan || 'free';
    const limits = PLANS[plan];

    // Plano enterprise não tem limite
    if (limits.requestsPerMonth === -1) return next();

    // Conta requisições do mês atual
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('webhook_logs')
      .select('id', { count: 'exact', head: true })
      .gte('received_at', startOfMonth.toISOString())
      .in('webhook_id',
        supabase.from('webhooks').select('id').eq('user_id', req.user.id)
      );

    req.planLimits = limits;
    req.requestsThisMonth = count || 0;
    req.planLimitExceeded = count >= limits.requestsPerMonth;

    next();
  } catch (err) {
    next();
  }
}

module.exports = planLimitMiddleware;
