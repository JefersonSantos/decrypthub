import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { webhooksApi } from '../services/api';
import { useLang } from '../context/LangContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Webhooks() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const { data } = await webhooksApi.list();
      setWebhooks(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (slug) => {
    const url = `${API_URL}/webhook/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleToggle = async (wh) => {
    await webhooksApi.update(wh.id, { is_active: !wh.is_active });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return;
    setDeleting(id);
    await webhooksApi.delete(id);
    setDeleting(null);
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('webhooks')}</h1>
        <Link
          to="/webhooks/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + {t('newWebhook')}
        </Link>
      </div>

      {webhooks.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h3 className="text-lg font-semibold text-white mb-2">Nenhum webhook ainda</h3>
          <p className="text-gray-500 text-sm mb-6">Crie seu primeiro webhook para começar a receber notificações do ClickBank</p>
          <Link
            to="/webhooks/new"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            + {t('newWebhook')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(wh => (
            <div key={wh.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${wh.is_active ? 'bg-green-400' : 'bg-gray-600'}`} />
                    <h3 className="text-sm font-semibold text-white truncate">{wh.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${wh.is_active ? 'bg-green-500/10 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                      {wh.is_active ? t('active') : t('inactive')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{t('generatedUrl')}:</span>
                      <code className="text-xs text-indigo-300 truncate">{API_URL}/webhook/{wh.slug}</code>
                      <button
                        onClick={() => handleCopy(wh.slug)}
                        className="text-xs text-gray-500 hover:text-indigo-400 flex-shrink-0 transition-colors"
                      >
                        {copied === wh.slug ? '✅' : '📋'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{t('destinationUrl')}:</span>
                      <span className="text-xs text-gray-400 truncate">{wh.destination_url}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/webhooks/${wh.id}/logs`}
                    className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {t('logs')}
                  </Link>
                  <Link
                    to={`/webhooks/${wh.id}/edit`}
                    className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {t('edit')}
                  </Link>
                  <button
                    onClick={() => handleToggle(wh)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      wh.is_active
                        ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                        : 'text-green-400 bg-green-500/10 hover:bg-green-500/20'
                    }`}
                  >
                    {wh.is_active ? 'Pausar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleDelete(wh.id)}
                    disabled={deleting === wh.id}
                    className="text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {deleting === wh.id ? '...' : t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
