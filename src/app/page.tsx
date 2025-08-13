'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Plane } from 'lucide-react';
import { t } from '@/lib/translations';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const { login, language } = useStore();
  const router = useRouter();

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #026E81 0%, #00ABBD 50%, #0099DD 100%)' }}>
      {/* Premium animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at top right, rgba(255, 153, 51, 0.2), transparent)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at bottom left, rgba(161, 198, 223, 0.3), transparent)' }} />
      </div>
      
      <div className="relative rounded-3xl shadow-2xl p-8 w-full max-w-md backdrop-blur-md" style={{ backgroundColor: 'rgba(175, 243, 255, 0.95)', border: '1px solid rgba(76, 194, 215, 0.5)' }}>
        {/* Premium glass effect overlay */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)' }} />
        
        <div className="relative text-center mb-8 z-10">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/lechworld-logo.png" alt="LechWorld" className="w-24 h-24 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#026E81' }}>LechWorld</h1>
          <p className="mt-2 font-medium" style={{ color: '#4CC2D7' }}>{t('tagline', language)}</p>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-4 z-10">
          <div>
            <input
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
              className="w-full p-3 rounded-xl backdrop-blur-sm focus:ring-2 outline-none transition-all duration-200"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '2px solid #4CC2D7',
                color: '#026E81'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#FFD700'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#4CC2D7'}
              autoComplete="off"
              autoFocus
            />
          </div>

          {showPassword && (
            <div>
              <input
                ref={passwordRef}
                type="password"
                placeholder={t('password', language)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl backdrop-blur-sm focus:ring-2 outline-none transition-all duration-200"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '2px solid #4CC2D7',
                  color: '#026E81'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#FF9933'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#00ABBD'}
                autoComplete="off"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg transform hover:-translate-y-0.5 hover:shadow-xl"
            style={{ 
              background: 'linear-gradient(135deg, #026E81 0%, #4CC2D7 100%)',
              color: '#AFF3FF'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #4CC2D7 0%, #AFF3FF 100%)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #026E81 0%, #4CC2D7 100%)'}
          >
            {t('enterLechWorld', language)}
          </button>
        </form>

        <p className="relative text-xs text-center mt-6 z-10" style={{ color: '#026E81' }}>
          {t('availableUsers', language)}: Leonardo, Osvandré, Marilise, Graciela
        </p>
      </div>
    </div>
  );
}