import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../common/LanguageSelector';
import { supabase } from '../../lib/supabase';

interface LoginPageProps {
  onSwitchToSignup: () => void;
  showSuccess?: boolean;
}

export function LoginPage({ onSwitchToSignup, showSuccess = false }: LoginPageProps) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [displaySuccess, setDisplaySuccess] = useState(showSuccess);
  const { signIn } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (showSuccess) {
      setDisplaySuccess(true);
      const timer = setTimeout(() => setDisplaySuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Special handling for admin account
      if (emailOrPhone === 'admin@gmail.com' && password === 'Shub@0811') {
        try {
          // Try to sign in first
          await signIn(emailOrPhone, password);
        } catch (signInErr: any) {
          // If admin doesn't exist, create the account
          if (signInErr.message.includes('Invalid') || signInErr.message.includes('credentials')) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: emailOrPhone,
              password: password,
              options: {
                data: {
                  full_name: 'Admin'
                }
              }
            });

            if (signUpError) throw signUpError;

            if (signUpData.user) {
              // Insert profile with admin role
              const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: signUpData.user.id,
                  email: emailOrPhone,
                  name: 'Admin',
                  role: 'admin'
                });

              if (profileError) throw profileError;

              // Now sign in
              await signIn(emailOrPhone, password);
            }
          } else {
            throw signInErr;
          }
        }
      } else {
        // Regular user login
        await signIn(emailOrPhone, password);
      }
      // Sign in successful - let the auth state change handle the rest
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('Unknown') || err.message.includes('Invalid')) {
        setTimeout(() => onSwitchToSignup(), 2000);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {displaySuccess && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center space-x-3 animate-fadeIn">
              <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              <p className="text-emerald-700 font-medium">Account created successfully! Please log in.</p>
            </div>
          )}

          <div className="text-center mb-6">
            <img
              src="/logo kuki copy copy copy copy.png"
              alt="KUKI"
              className="w-24 h-24 mx-auto mb-4 object-contain"
            />
            <h1 className="text-3xl font-bold text-gray-900">KUKI</h1>
            <p className="text-gray-600">{t('auth.login')}</p>
          </div>

          <div className="mb-6">
            <LanguageSelector />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.email')} / {t('auth.phone')}
              </label>
              <input
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={`${t('auth.email')} / ${t('auth.phone')}`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder={t('auth.password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t('auth.loginButton')
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">{t('auth.noAccount')}</p>
            <button
              onClick={onSwitchToSignup}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {t('auth.signup')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}