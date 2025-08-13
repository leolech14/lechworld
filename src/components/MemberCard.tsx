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
      <div className="rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 hover:-translate-y-1 group"
           style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: '#026E81' }}>{member}</h3>
        
        <div className="space-y-3 mb-4 p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, #026E81 0%, #4CC2D7 100%)', border: '1px solid rgba(76, 194, 215, 0.3)' }}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: '#FFFFFF' }}>{t('totalMiles', language)}</span>
            <span className="font-bold text-lg" style={{ color: '#FFFFFF' }}>{totalMiles.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: '#FFFFFF' }}>{t('portfolioValue', language)}</span>
            <span className="font-bold text-lg" style={{ color: '#FFFFFF' }}>R$ {totalValue.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(accounts).map(([program, account]) => (
            <button
              key={program}
              onClick={() => setSelectedProgram(program)}
              className="w-full text-left p-3 rounded-xl transition-all duration-200 hover:shadow-md group/item"
              style={{ 
                backgroundColor: 'rgba(76, 194, 215, 0.08)',
                border: '1px solid rgba(76, 194, 215, 0.2)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(76, 194, 215, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(76, 194, 215, 0.08)'}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: '#026E81' }}>{program}</span>
                  {account.status && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ 
                            backgroundColor: statusColors[account.status]?.bg || '#026E81',
                            color: statusColors[account.status]?.text || '#AFF3FF'
                          }}>
                      {account.status}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold" style={{ color: '#026E81' }}>{(account.miles || 0).toLocaleString()}</span>
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