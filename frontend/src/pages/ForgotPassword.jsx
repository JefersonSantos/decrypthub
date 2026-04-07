import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await resetPassword(email);
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 max-w-md w-full text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-white mb-2">Email enviado!</h2>
          <p className="text-gray-400 text-sm">Verifique sua caixa de entrada em <strong className="text-white">{email}</strong></p>
          <Link to="/login" className="mt-6 inline-block text-indigo-400 hover:text-indigo-300 text-sm">
            ← Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-white">DecryptHub</h1>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-2">{t('resetPassword')}</h2>
          <p className="text-gray-500 text-sm mb-6">Digite seu email e enviaremos um link para redefinir sua senha.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="seu@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {loading ? t('loading') : t('sendResetEmail')}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
              ← {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
