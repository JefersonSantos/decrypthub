import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { webhooksApi } from '../services/api';
import { useLang } from '../context/LangContext';

export default function WebhookLogs() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { id } = useParams();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [page, statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await webhooksApi.logs(id, { page, limit: 20, status: statusFilter || undefined });
      setLogs(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/webhooks')} className="text-gray-400 hover:text-white transition-colors">
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold text-white">{t('logs')}</h1>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{total} total</span>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {['', 'success', 'error'].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {s === '' ? 'Todos' : s === 'success' ? t('success') : t('error')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">{t('loading')}</div>
      ) : logs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-400">{t('noLogs')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    log.status === 'success'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {log.status === 'success' ? t('success') : t('error')}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(log.received_at).toLocaleString('pt-BR')}
                  </span>
                  {log.processing_time_ms && (
                    <span className="text-xs text-gray-600">{log.processing_time_ms}ms</span>
                  )}
                  {log.destination_response_status && (
                    <span className="text-xs text-gray-600">→ HTTP {log.destination_response_status}</span>
                  )}
                </div>
                <span className="text-gray-600 text-xs">{expanded === log.id ? '▲' : '▼'}</span>
              </div>

              {expanded === log.id && (
                <div className="border-t border-gray-800 p-4">
                  {log.error_message && (
                    <div className="mb-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-xs text-red-400">{log.error_message}</p>
                    </div>
                  )}
                  {log.payload && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium">{t('payload')}:</p>
                      <pre className="text-xs text-gray-300 bg-gray-800 rounded-lg p-3 overflow-auto max-h-64">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs px-3 py-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg disabled:opacity-40 transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-xs text-gray-400">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-xs px-3 py-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg disabled:opacity-40 transition-colors"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
