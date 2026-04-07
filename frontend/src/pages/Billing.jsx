import { useEffect, useState } from 'react';
import { billingApi } from '../services/api';
import { useLang } from '../context/LangContext';

const PLAN_ORDER = ['free', 'starter', 'pro', 'enterprise'];
const PLAN_COLORS = {
  free: 'border-gray-700',
  starter: 'border-indigo-500',
  pro: 'border-purple-500',
  enterprise: 'border-amber-500'
};

export default function Billing() {
  const { t } = useLang();
  const [plans, setPlans] = useState({});
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  useEffect(() => {
    Promise.all([billingApi.plans(), billingApi.subscription()])
      .then(([p, s]) => {
        setPlans(p.data);
        setSubscription(s.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async (plan) => {
    setCheckoutLoading(plan);
    try {
      const { data } = await billingApi.checkout(plan);
      window.location.href = data.url;
    } catch (err) {
      alert(err.response?.data?.error || t('error_generic'));
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    try {
      const { data } = await billingApi.portal();
      window.location.href = data.url;
    } catch (err) {
      alert(err.response?.data?.error || t('error_generic'));
    }
  };

  if (loading) return <div className="text-center text-gray-400 py-12">{t('loading')}</div>;

  const currentPlan = subscription?.plan || 'free';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('billing')}</h1>
        {currentPlan !== 'free' && (
          <button
            onClick={handlePortal}
            className="text-sm text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-lg transition-colors"
          >
            {t('managePlan')} →
          </button>
        )}
      </div>

      {/* Current plan banner */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">{t('currentPlan')}</p>
            <p className="text-xl font-bold text-white capitalize">{currentPlan}</p>
            {subscription?.subscription?.current_period_end && (
              <p className="text-xs text-gray-500 mt-1">
                Renova em {new Date(subscription.subscription.current_period_end).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Webhooks</p>
            <p className="text-2xl font-bold text-indigo-400">
              {subscription?.limits?.webhooks === -1 ? '∞' : subscription?.limits?.webhooks}
            </p>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLAN_ORDER.map(planKey => {
          const plan = plans[planKey];
          if (!plan) return null;
          const isCurrent = currentPlan === planKey;
          const isPopular = planKey === 'pro';

          return (
            <div
              key={planKey}
              className={`bg-gray-900 border-2 rounded-xl p-5 relative ${
                isCurrent ? 'border-indigo-500' : PLAN_COLORS[planKey]
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-purple-600 text-white text-xs font-medium px-3 py-0.5 rounded-full">
                    {t('mostPopular')}
                  </span>
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-indigo-600 text-white text-xs font-medium px-3 py-0.5 rounded-full">
                    {t('currentPlan')}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-base font-bold text-white capitalize">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-white">${plan.price}</span>
                  <span className="text-gray-500 text-sm">{t('month')}</span>
                </div>
                {planKey === 'starter' && (
                  <p className="text-xs text-green-400 mt-1">🎁 {t('trial')}</p>
                )}
              </div>

              <ul className="space-y-2 mb-5 text-xs text-gray-400">
                <li>✓ {plan.webhooks === -1 ? t('unlimited') : plan.webhooks} {t('webhooksLimit')}</li>
                <li>✓ {plan.requestsPerMonth === -1 ? t('unlimited') : plan.requestsPerMonth.toLocaleString()} {t('requestsLimit')}</li>
                <li>✓ {plan.logsRetentionDays} {t('logsRetention')}</li>
              </ul>

              {planKey === 'free' ? (
                <div className={`w-full text-center text-xs py-2 rounded-lg ${isCurrent ? 'bg-gray-800 text-gray-400' : 'bg-gray-800 text-gray-400'}`}>
                  {isCurrent ? t('currentPlan') : 'Gratuito'}
                </div>
              ) : (
                <button
                  onClick={() => !isCurrent && handleCheckout(planKey)}
                  disabled={isCurrent || checkoutLoading === planKey}
                  className={`w-full text-sm font-medium py-2 rounded-lg transition-colors ${
                    isCurrent
                      ? 'bg-gray-800 text-gray-500 cursor-default'
                      : planKey === 'pro'
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  } disabled:opacity-50`}
                >
                  {checkoutLoading === planKey ? t('loading') : isCurrent ? t('currentPlan') : t('upgrade')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
