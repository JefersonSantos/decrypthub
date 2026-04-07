import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

export default function Settings() {
  const { t } = useLang();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', company_name: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    profileApi.get().then(({ data }) => {
      setForm({ full_name: data.full_name || '', company_name: data.company_name || '' });
      setLoading(false);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await profileApi.update(form);
      setSuccess(t('save_success'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(t('error_generic'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await profileApi.delete();
      await signOut();
      navigate('/login');
    } catch (err) {
      setError(t('error_generic'));
    }
  };

  if (loading) return <div className="text-center text-gray-400 py-12">{t('loading')}</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('settings')}</h1>

      {/* Profile form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Perfil</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg p-3 mb-4 text-sm">{success}</div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nome completo</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Empresa</label>
            <input
              type="text"
              value={form.company_name}
              onChange={e => setForm({ ...form, company_name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Nome da empresa"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg px-6 py-2.5 text-sm transition-colors"
          >
            {saving ? t('loading') : t('save')}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-gray-900 border border-red-500/20 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-red-400 mb-2">Zona de Perigo</h2>
        <p className="text-xs text-gray-500 mb-4">Ao excluir sua conta, todos os webhooks e logs serão permanentemente removidos.</p>

        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 rounded-lg transition-colors"
          >
            Excluir minha conta
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              className="text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              Confirmar exclusão
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              className="text-sm text-gray-400 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
