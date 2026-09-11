import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TrainlyLogo } from '../components/TrainlyLogo';
import { LanguageSelector } from '../components/LanguageSelector';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, signup, continueAsGuest } = useAuth();
  const { t } = useLanguage();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isSignUp) {
      const ok = await signup(name, email, password);
      setIsLoading(false);
      if (ok) {
        onSuccess();
      } else {
        setError('Signup failed. Please ensure a valid email address (e.g. user@gmail.com) and try again.');
      }
    } else {
      const ok = await login(email, password);
      setIsLoading(false);
      if (ok) {
        onSuccess();
      } else {
        setError('Invalid credentials. (Hint: test email with demo123)');
      }
    }
  };

  const handleGuest = async () => {
    setIsLoading(true);
    await continueAsGuest();
    setIsLoading(false);
    onSuccess();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-100 via-blue-50/20 to-indigo-50/30 dark:from-gray-950 dark:via-slate-950 dark:to-gray-900 transition-colors relative overflow-hidden select-none">
      {/* Soft static ambient gradient glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-400/10 dark:bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Split-Screen Card */}
      <div className="w-full max-w-4xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10">
        
        {/* Left Panel: Very light background with original logo in the middle and the two specified lines */}
        <div className="p-8 md:p-10 flex flex-col justify-between bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 relative overflow-hidden min-h-[400px] md:min-h-[490px]">
          {/* Subtle top spacer for vertical balance */}
          <div className="hidden sm:block" />

          {/* Original Trainly Logo in the middle of the left side (shifted one line down) */}
          <div className="my-auto py-6 flex items-center justify-center z-10 translate-y-5 sm:translate-y-6">
            <TrainlyLogo variant="original" size="2xl" className="hover:scale-105 transition-transform duration-300 drop-shadow-sm" />
          </div>

          {/* Only the two specified lines */}
          <div className="z-10 mt-auto pb-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-wide">
              Real-time ETA
            </h3>
            <p className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 mt-1 tracking-wide">
              Live Tracking
            </p>
          </div>
        </div>

        {/* Right Panel: Authentication Form */}
        <div className="p-8 md:p-10 flex flex-col justify-between">
          
          {/* Language Selector Top Right */}
          <div className="flex justify-end mb-4">
            <LanguageSelector compact />
          </div>

          {/* Form Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {isSignUp ? t('create_account') : t('welcome_back')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
              {isSignUp ? 'Sign up to report delays and personalize trips.' : t('login_subtitle')}
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('full_name')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t('password')}
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => alert('For this demo, any password or "demo123" works!')}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {t('forgot_password')}
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 transform active:scale-[0.99]"
                >
                  {isLoading ? '...' : isSignUp ? t('sign_up') : t('log_in')}
                </button>

                <button
                  type="button"
                  onClick={handleGuest}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-sm transition-all focus:outline-none"
                >
                  {t('continue_as_guest')}
                </button>
              </div>
            </form>
          </div>

          {/* Toggle between Sign Up and Log In */}
          <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
            {isSignUp ? (
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(''); }}
                className="hover:underline text-blue-600 dark:text-blue-400 font-medium"
              >
                {t('already_have_account')}
              </button>
            ) : (
              <span>
                {t('new_here')}{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(''); }}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  {t('create_account')}
                </button>
              </span>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
