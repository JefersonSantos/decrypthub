import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    else navigate('/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-white">DecryptHub</h1>
          <p className="text-gray-400 text-sm mt-1">ClickBank Webhook Decryptor</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6">{t('login')}</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('password')}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300">
                {t('forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {loading ? t('loading') : t('login')}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-500">
              <span className="bg-gray-900 px-2">ou</span>
            </div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            <span>🔵</span>
            {t('continueWithGoogle')}
          </button>

          <p className="text-center text-gray-500 text-sm mt-6">
            {t('noAccount')}{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              {t('register')}
            </Link>
          </p>
        </div>

        <button onClick={toggleLang} className="mt-4 w-full text-center text-xs text-gray-600 hover:text-gray-400">
          🌐 {lang === 'pt' ? 'Switch to English' : 'Mudar para Português'}
        </button>
      </div>
    </div>
  );
}
