import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { webhooksApi } from '../services/api';
import { useLang } from '../context/LangContext';

export default function WebhookForm() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '',
    secret_key: '',
    destination_url: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEdit) {
      webhooksApi.get(id).then(({ data }) => {
        setForm({
          name: data.name,
          secret_key: '',
          destination_url: data.destination_url,
          is_active: data.is_active
        });
      });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (isEdit && !payload.secret_key) delete payload.secret_key;

      if (isEdit) {
        await webhooksApi.update(id, payload);
      } else {
        await webhooksApi.create(payload);
      }
      setSuccess(t('save_success'));
      setTimeout(() => navigate('/webhooks'), 1000);
    } catch (err) {
      setError(err.response?.data?.error || t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/webhooks')} className="text-gray-400 hover:text-white transition-colors">
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold text-white">
          {isEdit ? t('edit') : t('newWebhook')}
        </h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg p-3 mb-4 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('webhookName')}</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Ex: ClickBank GlycoCept"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('secretKey')}
              {isEdit && <span className="text-gray-500 text-xs ml-2">(deixe vazio para manter a atual)</span>}
            </label>
            <input
              type="text"
              value={form.secret_key}
              onChange={e => setForm({ ...form, secret_key: e.target.value })}
              required={!isEdit}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 font-mono"
              placeholder="Ex: D3N3NYP6J1577CYH"
              maxLength={32}
            />
            <p className="text-xs text-gray-500 mt-1">
              Encontrada em: ClickBank → Accounts → Settings → My Site → Secret Key
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('destinationUrl')}</label>
            <input
              type="url"
              value={form.destination_url}
              onChange={e => setForm({ ...form, destination_url: e.target.value })}
              required
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="https://seu-webhook-destino.com/endpoint"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL para onde o payload descriptografado será enviado
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.is_active ? 'bg-indigo-600' : 'bg-gray-700'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.is_active ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <span className="text-sm text-gray-300">
              {form.is_active ? t('active') : t('inactive')}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {loading ? t('loading') : t('save')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/webhooks')}
              className="px-6 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
