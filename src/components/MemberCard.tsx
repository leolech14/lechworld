'use client';

import { useState } from 'react';
import { MemberAccounts } from '@/types';
import { AccountModal } from './AccountModal';
import { useStore } from '@/store/useStore';
import { t } from '@/lib/translations';

interface MemberCardProps {
  member: string;
  accounts: MemberAccounts;
  milesValue: { [key: string]: number };
}

const statusColors: { [key: string]: { bg: string, text: string } } = {
  'PLATINUM': { bg: '#FFD700', text: '#026E81' },
  'GOLD PLUS': { bg: '#FFD700', text: '#026E81' }, 
  'DIAMANTE': { bg: '#4CC2D7', text: '#026E81' },
  'SAFIRA': { bg: '#026E81', text: '#AFF3FF' },
  'PRATA': { bg: '#FFFFFF', text: '#026E81' },
  'MULTIPLUS': { bg: '#AFF3FF', text: '#026E81' }
};

export function MemberCard({ member, accounts, milesValue }: MemberCardProps) {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const { language } = useStore();

  // Calculate totals
  const totalMiles = Object.values(accounts).reduce((sum, acc) => sum + (acc.miles || 0), 0);
  const totalValue = Object.entries(accounts).reduce(
    (sum, [program, acc]) => sum + ((acc.miles || 0) * milesValue[program]), 
    0
  );

  return (
    <>
      <div className="rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-4 sm:p-6 hover:-translate-y-1 group"
           style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: '#026E81' }}>{member}</h3>
        
        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, #026E81 0%, #4CC2D7 100%)', border: '1px solid rgba(76, 194, 215, 0.3)' }}>
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>{t('totalMiles', language)}</span>
            <span className="font-bold text-base sm:text-lg" style={{ color: '#FFFFFF' }}>{totalMiles.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>{t('portfolioValue', language)}</span>
            <span className="font-bold text-base sm:text-lg" style={{ color: '#FFFFFF' }}>R$ {totalValue.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2 touch-spacing">
          {Object.entries(accounts).map(([program, account]) => (
            <button
              key={program}
              onClick={() => setSelectedProgram(program)}
              className="w-full text-left touch-target p-3 rounded-xl transition-all duration-200 hover:shadow-md group/item active:scale-98"
              style={{ 
                backgroundColor: 'rgba(76, 194, 215, 0.08)',
                border: '1px solid rgba(76, 194, 215, 0.2)',
                minHeight: '56px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(76, 194, 215, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(76, 194, 215, 0.08)'}
              onTouchStart={(e) => e.currentTarget.style.backgroundColor = 'rgba(76, 194, 215, 0.2)'}
              onTouchEnd={(e) => e.currentTarget.style.backgroundColor = 'rgba(76, 194, 215, 0.08)'}
              aria-label={`${program}: ${(account.miles || 0).toLocaleString()} miles`}
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-sm sm:text-base font-semibold" style={{ color: '#026E81' }}>{program}</span>
                  {account.status && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold inline-block"
                          style={{ 
                            backgroundColor: statusColors[account.status]?.bg || '#026E81',
                            color: statusColors[account.status]?.text || '#AFF3FF'
                          }}>
                      {account.status}
                    </span>
                  )}
                </div>
                <span className="text-sm sm:text-base font-bold" style={{ color: '#026E81' }}>{(account.miles || 0).toLocaleString()}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedProgram && (
        <AccountModal
          isOpen={true}
          onClose={() => setSelectedProgram(null)}
          member={member}
          program={selectedProgram}
          account={accounts[selectedProgram]}
        />
      )}
    </>
  );
}