'use client';

import { useState } from 'react';
import { X, Eye, EyeOff, Edit, Save } from 'lucide-react';
import { Account } from '@/types';
import { useStore } from '@/store/useStore';
import { t } from '@/lib/translations';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: string;
  program: string;
  account: Account;
}

export function AccountModal({ isOpen, onClose, member, program, account }: AccountModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(account);
  const { showPasswords, togglePasswords, updateAccount, milesValue, language } = useStore();

  if (!isOpen) return null;

  const handleSave = () => {
    updateAccount(member, program, formData);
    setIsEditing(false);
  };

  const fields = [
    { label: t('accountNumber', language), key: 'accountNumber' as keyof Account },
    { label: t('memberNumber', language), key: 'memberNumber' as keyof Account },
    { label: t('siteLogin', language), key: 'login' as keyof Account },
    { label: t('sitePassword', language), key: 'password' as keyof Account, secure: true },
    { label: t('milesPassword', language), key: 'milesPassword' as keyof Account, secure: true },
    { label: t('milesBalance', language), key: 'miles' as keyof Account, type: 'number' },
    { label: t('status', language), key: 'status' as keyof Account },
    { label: t('lastUpdated', language), key: 'lastUpdated' as keyof Account },
    { label: t('notes', language), key: 'notes' as keyof Account },
  ].filter(field => account[field.key] !== undefined);

  const value = (account.miles || 0) * milesValue[program];

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
         style={{ backgroundColor: 'rgba(2, 110, 129, 0.6)' }}
         onClick={onClose}>
      <div className="rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" 
           style={{ backgroundColor: 'rgba(161, 198, 223, 0.98)', border: '1px solid rgba(161, 198, 223, 0.5)' }}
           onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#026E81' }}>{program}</h2>
            <p className="text-sm mt-1 font-medium" style={{ color: '#00ABBD' }}>{member}</p>
            {account.status && (
              <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full font-semibold shadow-md"
                    style={{ backgroundColor: '#FFD700', color: '#026E81' }}>
                {account.status}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors"
                  style={{ color: '#026E81' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <label className="text-sm font-medium" style={{ color: '#026E81' }}>{field.label}</label>
              {isEditing ? (
                <input
                  type={field.type || 'text'}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value
                  })}
                  className="mt-1 w-full p-2 rounded-xl focus:ring-2 outline-none transition-all duration-200"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '2px solid #00ABBD',
                    color: '#026E81'
                  }}
                />
              ) : (
                <div className="mt-1 p-3 rounded-xl font-mono text-sm"
                     style={{ 
                       backgroundColor: 'rgba(255, 255, 255, 0.3)',
                       border: '1px solid rgba(0, 171, 189, 0.3)',
                       color: '#026E81'
                     }}>
                  {field.secure && !showPasswords 
                    ? '••••••••' 
                    : (formData[field.key] || '—')}
                </div>
              )}
            </div>
          ))}
          
          <div>
            <label className="text-sm font-medium" style={{ color: '#026E81' }}>{t('value', language)}</label>
            <div className="mt-1 p-4 rounded-xl font-bold text-lg"
                 style={{ 
                   backgroundColor: 'rgba(255, 215, 0, 0.2)',
                   border: '1px solid rgba(255, 215, 0, 0.3)',
                   color: '#026E81'
                 }}>
              R$ {value.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6 pt-4" style={{ borderTop: '1px solid rgba(0, 171, 189, 0.3)' }}>
          <button
            onClick={togglePasswords}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #026E81 0%, #4CC2D7 100%)',
              color: '#AFF3FF'
            }}
          >
            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPasswords ? t('hidePasswords', language) : t('showPasswords', language)}
          </button>
          
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl transition-all duration-200"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    color: '#026E81'
                  }}
                >
                  {t('cancel', language)}
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  style={{ 
                    backgroundColor: '#4CC2D7',
                    color: '#026E81'
                  }}
                >
                  <Save className="w-4 h-4" />
                  {t('save', language)}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                style={{ 
                  backgroundColor: '#FFD700',
                  color: '#026E81'
                }}
              >
                <Edit className="w-4 h-4" />
                {t('edit', language)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}