'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Plane, LogIn, User, Lock, Info } from 'lucide-react';
import { t } from '@/lib/translations';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const { login, language, currentUser, initializeAuth } = useStore();
  const router = useRouter();

  useEffect(() => {
    // Initialize authentication from sessionStorage
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (showPassword && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [showPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (login(username)) {
      router.push('/dashboard');
    } else {
      alert('Invalid username. Try: leonardo, osvandré, marilise, or graciela');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8 bg-gray-25 dark:bg-gray-950">
      {/* Untitled UI Premium animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-blue-50/30 dark:from-primary-900/20 dark:to-blue-900/20" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary-100/40 to-transparent rounded-full blur-3xl animate-float dark:from-primary-900/30" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-100/40 to-transparent rounded-full blur-3xl animate-float animation-delay-2000 dark:from-blue-900/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-warning-100/30 to-transparent rounded-full blur-3xl animate-float animation-delay-4000 dark:from-warning-900/20" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md mx-auto border border-gray-200 dark:border-gray-800"
      >
        {/* Untitled UI glass effect overlay */}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none bg-gradient-to-br from-white/50 to-transparent dark:from-gray-900/50" />
        
        <div className="relative text-center mb-6 sm:mb-8 z-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center mb-4"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-xl">
              <Plane className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">LechWorld</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('tagline', language)}</p>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-5 z-10">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <label htmlFor="username" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t('username', language) || 'Username'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                type="text"
                placeholder={t('enterUsername', language)}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && username && !showPassword) {
                    e.preventDefault();
                    setShowPassword(true);
                  }
                }}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 dark:focus:ring-primary-500 dark:focus:border-primary-500 outline-none transition-all duration-200 text-base text-gray-900 dark:text-gray-100"
                style={{ 
                  fontSize: 'max(16px, 1rem)',
                  minHeight: '48px'
                }}
                autoComplete="username"
                autoFocus
              />
            </div>
          </motion.div>

          {showPassword && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('password', language) || 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  ref={passwordRef}
                  type="password"
                  placeholder={t('password', language)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 dark:focus:ring-primary-500 dark:focus:border-primary-500 outline-none transition-all duration-200 text-base text-gray-900 dark:text-gray-100"
                  style={{ 
                    fontSize: 'max(16px, 1rem)',
                    minHeight: '48px'
                  }}
                  autoComplete="current-password"
                />
              </div>
            </motion.div>
          )}

          <motion.button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl active:scale-95 mt-6 flex items-center justify-center gap-2"
            style={{ 
              minHeight: '56px',
              fontSize: 'max(16px, 1.125rem)'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogIn className="w-5 h-5" />
            {t('enterLechWorld', language)}
          </motion.button>
        </form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg z-10"
        >
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">{t('availableUsers', language)}:</span>
              <br className="sm:hidden" />
              <span className="text-blue-600 dark:text-blue-400"> Leonardo, Osvandré, Marilise, Graciela</span>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}