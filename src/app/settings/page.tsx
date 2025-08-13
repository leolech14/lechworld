'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Navigation } from '@/components/Navigation';
import { Save, RefreshCw, DollarSign, Eye, EyeOff, Shield, Palette, Bell, Globe } from 'lucide-react';
import { t } from '@/lib/translations';

export default function SettingsPage() {
  const { currentUser, milesValue, updateMilesValue, showPasswords, togglePasswords, exportData, importData, language, setLanguage } = useStore();
  const router = useRouter();
  const [values, setValues] = useState(milesValue);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return null;
  }

  const handleSave = () => {
    Object.entries(values).forEach(([program, value]) => {
      updateMilesValue(program, value);
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    const defaultValues = {
      'SMILES': 0.021,
      'LATAM PASS': 0.014,
      'AMERICAN': 0.018,
      'UNITED': 0.017,
      'TAP': 0.016,
      'EMIRATES': 0.019,
      'DELTA': 0.015,
      'AVIANCA': 0.013
    };
    setValues(defaultValues);
  };

  const handleExportSettings = () => {
    const settings = {
      milesValue: values,
      showPasswords,
      notifications,
      theme,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lechworld-settings-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at top right, rgba(76, 194, 215, 0.08), transparent)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at bottom left, rgba(2, 110, 129, 0.08), transparent)' }} />
      </div>
      <div className="relative z-10">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#026E81' }}>
              {t('settingsTitle', language)}
            </h2>
            <p style={{ color: '#4CC2D7' }}>{t('managePreferences', language)}</p>
          </div>

          {saved && (
            <div className="mb-4 p-4 rounded-xl shadow-lg" style={{ backgroundColor: '#AFF3FF', border: '1px solid #4CC2D7' }}>
              <p className="font-semibold" style={{ color: '#026E81' }}>{t('settingsSaved', language)}</p>
            </div>
          )}

          {/* Miles Values */}
          <div className="rounded-xl shadow-lg p-6 mb-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#026E81' }}>
              <DollarSign className="w-5 h-5" />
              {t('milesValues', language)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(values).map(([program, value]) => (
                <div key={program} className="flex items-center gap-3">
                  <label className="flex-1 font-semibold" style={{ color: '#026E81' }}>{program}</label>
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#4CC2D7' }}>R$</span>
                    <input
                      type="number"
                      step="0.001"
                      value={value * 1000}
                      onChange={(e) => setValues({ ...values, [program]: parseFloat(e.target.value) / 1000 || 0 })}
                      className="w-24 p-2 rounded-lg text-right font-mono"
                      style={{ 
                        backgroundColor: 'rgba(76, 194, 215, 0.08)',
                        border: '2px solid #4CC2D7',
                        color: '#026E81'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                style={{ 
                  backgroundColor: '#4CC2D7',
                  color: '#026E81'
                }}
              >
                <Save className="w-4 h-4" />
                {t('saveValues', language)}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200"
                style={{ 
                  backgroundColor: 'rgba(255, 215, 0, 0.2)',
                  border: '1px solid #FFD700',
                  color: '#026E81'
                }}
              >
                <RefreshCw className="w-4 h-4" />
                {t('resetDefaults', language)}
              </button>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="rounded-xl shadow-lg p-6 mb-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#026E81' }}>
              <Shield className="w-5 h-5" />
              {t('privacySecurity', language)}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(76, 194, 215, 0.08)' }}>
                <div className="flex items-center gap-3">
                  {showPasswords ? <Eye className="w-5 h-5" style={{ color: '#4CC2D7' }} /> : <EyeOff className="w-5 h-5" style={{ color: '#4CC2D7' }} />}
                  <div>
                    <p className="font-semibold" style={{ color: '#026E81' }}>{t('showPasswords', language)}</p>
                    <p className="text-sm" style={{ color: '#4CC2D7' }}>{t('displayPasswordsPlain', language)}</p>
                  </div>
                </div>
                <button
                  onClick={togglePasswords}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200`}
                  style={{ backgroundColor: showPasswords ? '#4CC2D7' : 'rgba(76, 194, 215, 0.3)' }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      showPasswords ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" style={{ color: '#FFD700' }} />
                  <div>
                    <p className="font-semibold" style={{ color: '#026E81' }}>{t('autoLock', language)}</p>
                    <p className="text-sm" style={{ color: '#4CC2D7' }}>{t('lockAfterInactivity', language)}</p>
                  </div>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200`}
                  style={{ backgroundColor: 'rgba(255, 215, 0, 0.3)' }}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 translate-x-1`} />
                </button>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="rounded-xl shadow-lg p-6 mb-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#026E81' }}>
              <Palette className="w-5 h-5" />
              {t('appearance', language)}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(76, 194, 215, 0.08)' }}>
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5" style={{ color: '#4CC2D7' }} />
                  <div>
                    <p className="font-semibold" style={{ color: '#026E81' }}>{t('theme', language)}</p>
                    <p className="text-sm" style={{ color: '#4CC2D7' }}>{t('chooseTheme', language)}</p>
                  </div>
                </div>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="px-3 py-1 rounded-lg"
                  style={{ 
                    backgroundColor: 'white',
                    border: '2px solid #4CC2D7',
                    color: '#026E81'
                  }}
                >
                  <option value="light">{t('light', language)}</option>
                  <option value="dark">{t('dark', language)}</option>
                  <option value="auto">{t('auto', language)}</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5" style={{ color: '#FFD700' }} />
                  <div>
                    <p className="font-semibold" style={{ color: '#026E81' }}>{t('language', language)}</p>
                    <p className="text-sm" style={{ color: '#4CC2D7' }}>{t('chooseLanguage', language)}</p>
                  </div>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'pt' | 'en')}
                  className="px-3 py-1 rounded-lg"
                  style={{ 
                    backgroundColor: 'white',
                    border: '2px solid #FFD700',
                    color: '#026E81'
                  }}
                >
                  <option value="pt">{t('portuguese', language)}</option>
                  <option value="en">{t('english', language)}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-xl shadow-lg p-6 mb-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#026E81' }}>
              <Bell className="w-5 h-5" />
              {t('notifications', language)}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}>
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5" style={{ color: '#FFD700' }} />
                  <div>
                    <p className="font-semibold" style={{ color: '#026E81' }}>{t('milesExpiryAlerts', language)}</p>
                    <p className="text-sm" style={{ color: '#4CC2D7' }}>{t('getNotifiedExpiry', language)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200`}
                  style={{ backgroundColor: notifications ? '#FFD700' : 'rgba(255, 215, 0, 0.3)' }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: '#026E81' }}>{t('dataManagement', language)}</h3>
            <div className="flex gap-3">
              <button
                onClick={handleExportSettings}
                className="px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                style={{ 
                  backgroundColor: '#026E81',
                  color: '#AFF3FF'
                }}
              >
                {t('exportSettings', language)}
              </button>
              <button
                onClick={() => {
                  if (confirm(t('confirmReset', language))) {
                    handleReset();
                    togglePasswords();
                    setNotifications(true);
                    setTheme('light');
                  }
                }}
                className="px-4 py-2 rounded-xl transition-all duration-200"
                style={{ 
                  backgroundColor: 'rgba(255, 215, 0, 0.2)',
                  border: '1px solid #FFD700',
                  color: '#026E81'
                }}
              >
                {t('resetAllSettings', language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}