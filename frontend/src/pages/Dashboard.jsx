import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { webhooksApi, billingApi } from '../services/api';
import { useLang } from '../context/LangContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { t } = useLang();
  const [webhooks, setWebhooks] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      webhooksApi.list(),
      billingApi.subscription()
    ]).then(([wh, sub]) => {
      setWebhooks(wh.data);
      setSubscription(sub.data);
    }).finally(() => setLoading(false));
  }, []);

  const activeWebhooks = webhooks.filter(w => w.is_active).length;
  const plan = subscription?.plan || 'free';
  const limits = subscription?.limits;
  const requestsUsed = subscription?.subscription ? 0 : 0;

  const statsCards = [
    { label: t('totalWebhooks'), value: webhooks.length, icon: '🔗', color: 'indigo' },
    { label: t('active'), value: activeWebhooks, icon: '✅', color: 'green' },
    { label: t('currentPlan'), value: plan.charAt(0).toUpperCase() + plan.slice(1), icon: '💳', color: 'purple' },
    { label: t('requestsThisMonth'), value: requestsUsed.toLocaleString(), icon: '📊', color: 'blue' },
  ];

  const colorMap = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('dashboard')}</h1>
        <Link
          to="/webhooks/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + {t('newWebhook')}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map(card => (
          <div key={card.label} className={`bg-gray-900 border rounded-xl p-4 ${colorMap[card.color]}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">{card.label}</span>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Plan limit bar */}
      {limits && limits.webhooks !== -1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Webhooks utilizados</span>
            <span className="text-sm text-white font-medium">{webhooks.length} / {limits.webhooks}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min((webhooks.length / limits.webhooks) * 100, 100)}%` }}
            />
          </div>
          {webhooks.length >= limits.webhooks && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-amber-400">⚠️ Limite atingido</p>
              <Link to="/billing" className="text-xs text-indigo-400 hover:text-indigo-300">
                {t('upgrade')} →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Recent webhooks */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{t('recentActivity')}</h2>
          <Link to="/webhooks" className="text-xs text-indigo-400 hover:text-indigo-300">
            {t('webhooks')} →
          </Link>
        </div>
        {webhooks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-sm">Nenhum webhook criado ainda.</p>
            <Link to="/webhooks/new" className="mt-3 inline-block text-indigo-400 hover:text-indigo-300 text-sm">
              Criar primeiro webhook →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {webhooks.slice(0, 5).map(wh => (
              <div key={wh.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${wh.is_active ? 'bg-green-400' : 'bg-gray-600'}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{wh.name}</p>
                    <p className="text-xs text-gray-500">{wh.destination_url}</p>
                  </div>
                </div>
                <Link to={`/webhooks/${wh.id}/logs`} className="text-xs text-indigo-400 hover:text-indigo-300">
                  {t('logs')} →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
