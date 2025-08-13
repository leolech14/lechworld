'use client';

import { useState } from 'react';
import { MemberAccounts } from '@/types';
import { AccountModal } from './AccountModal';
import { useStore } from '@/store/useStore';
import { t } from '@/lib/translations';
import { ChevronDown, ChevronUp, Plane, TrendingUp, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface MemberCardProps {
  member: string;
  accounts: MemberAccounts;
  milesValue: { [key: string]: number };
}

// Member-specific configurations using Untitled UI colors
const memberConfigs: { [key: string]: { gradient: string, border: string, avatar: string } } = {
  'Leonardo': {
    gradient: 'from-[var(--color-blue-50)] to-[var(--color-blue-100)]',
    border: 'border-[var(--color-blue-600)]',
    avatar: 'bg-gradient-to-br from-[var(--color-blue-600)] to-[var(--color-blue-700)]'
  },
  'Osvandré': {
    gradient: 'from-[var(--color-success-50)] to-[var(--color-success-100)]',
    border: 'border-[var(--color-success-600)]',
    avatar: 'bg-gradient-to-br from-[var(--color-success-600)] to-[var(--color-success-700)]'
  },
  'Marilise': {
    gradient: 'from-[var(--color-primary-50)] to-[var(--color-primary-100)]',
    border: 'border-[var(--color-primary-600)]',
    avatar: 'bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-700)]'
  },
  'Graciela': {
    gradient: 'from-[var(--color-error-50)] to-[var(--color-error-100)]',
    border: 'border-[var(--color-error-600)]',
    avatar: 'bg-gradient-to-br from-[var(--color-error-600)] to-[var(--color-error-700)]'
  }
};

// Status badge colors using Untitled UI semantic colors
const statusColors: { [key: string]: { bg: string, text: string, border: string } } = {
  'PLATINUM': { 
    bg: 'bg-[var(--color-warning-50)]', 
    text: 'text-[var(--color-warning-700)]',
    border: 'border-[var(--color-warning-200)]'
  },
  'GOLD PLUS': { 
    bg: 'bg-[var(--color-warning-100)]', 
    text: 'text-[var(--color-warning-800)]',
    border: 'border-[var(--color-warning-300)]'
  }, 
  'DIAMANTE': { 
    bg: 'bg-[var(--color-blue-50)]', 
    text: 'text-[var(--color-blue-700)]',
    border: 'border-[var(--color-blue-200)]'
  },
  'SAFIRA': { 
    bg: 'bg-[var(--color-blue-100)]', 
    text: 'text-[var(--color-blue-800)]',
    border: 'border-[var(--color-blue-300)]'
  },
  'PRATA': { 
    bg: 'bg-[var(--color-gray-100)]', 
    text: 'text-[var(--color-gray-700)]',
    border: 'border-[var(--color-gray-300)]'
  },
  'MULTIPLUS': { 
    bg: 'bg-[var(--color-primary-50)]', 
    text: 'text-[var(--color-primary-700)]',
    border: 'border-[var(--color-primary-200)]'
  }
};

export function MemberCard({ member, accounts, milesValue }: MemberCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const { language } = useStore();
  const isMobile = useIsMobile();

  // Calculate totals
  const totalMiles = Object.values(accounts).reduce((sum, acc) => sum + (acc.miles || 0), 0);
  const totalValue = Object.entries(accounts).reduce(
    (sum, [program, acc]) => sum + ((acc.miles || 0) * milesValue[program]), 
    0
  );

  // Get styling for member
  const config = memberConfigs[member] || {
    gradient: 'from-[var(--color-gray-50)] to-[var(--color-gray-100)]',
    border: 'border-[var(--color-gray-600)]',
    avatar: 'bg-gradient-to-br from-[var(--color-gray-600)] to-[var(--color-gray-700)]'
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`
          relative bg-white dark:bg-[var(--color-gray-900)] 
          border border-[var(--color-gray-200)] dark:border-[var(--color-gray-800)]
          transition-all duration-[var(--duration-200)]
          ${isExpanded ? 'shadow-lg' : 'shadow-sm'}
          ${isMobile ? '' : 'hover:shadow-xl'}
        `}
        style={{ borderRadius: 'var(--radius-lg)' }}
      >
        {/* Ultra Compact Collapsed View - 60-70px height on mobile */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-full flex items-center justify-between
            ${isMobile ? 'p-3' : 'p-4'}
            ${isExpanded ? 'border-b border-white/10' : ''}
          `}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar Circle - Untitled UI Style */}
            <div className={`
              flex-shrink-0 rounded-full flex items-center justify-center
              ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}
              ${config.avatar}
              text-white shadow-md
            `}
            style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: isMobile ? 'var(--font-size-sm)' : 'var(--font-size-md)' }}>
              {member[0]}
            </div>
            
            {/* Compact Info */}
            <div className="flex-1 min-w-0 text-left">
              <h3 className="truncate"
                style={{ 
                  fontWeight: 'var(--font-weight-semibold)',
                  fontSize: isMobile ? 'var(--font-size-sm)' : 'var(--font-size-md)',
                  color: 'var(--color-gray-900)',
                  lineHeight: isMobile ? 'var(--line-height-sm)' : 'var(--line-height-md)'
                }}>
                {member}
              </h3>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"
                  style={{ 
                    fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
                    color: 'var(--color-gray-600)'
                  }}>
                  <TrendingUp className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} style={{ color: 'var(--color-blue-600)' }} />
                  {totalMiles.toLocaleString()}
                </span>
                <span className="flex items-center gap-1"
                  style={{ 
                    fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
                    color: 'var(--color-gray-600)'
                  }}>
                  <DollarSign className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} style={{ color: 'var(--color-success-600)' }} />
                  {totalValue.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Expand/Collapse Icon - Untitled UI Style */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className={`
              rounded-full p-2 transition-colors
              ${isMobile ? 'ml-2' : 'ml-3'}
            `}
            style={{ 
              backgroundColor: isExpanded ? 'var(--color-gray-100)' : 'var(--color-gray-50)',
              color: 'var(--color-gray-600)'
            }}
          >
            <ChevronDown className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
          </motion.div>
        </button>
        
        {/* Expanded Content - Progressive Disclosure */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={isMobile ? 'p-3 space-y-2' : 'p-4 space-y-3'}>
                {/* Compact Airline List */}
                <div className="space-y-1.5">
                  {Object.entries(accounts).map(([program, account]) => (
                    <motion.button
                      key={program}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setSelectedProgram(program)}
                      className={`
                        w-full flex items-center justify-between
                        text-left group transition-all
                        ${isMobile ? 'p-2' : 'p-2.5'}
                      `}
                      style={{ 
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-gray-50)',
                        border: '1px solid var(--color-gray-200)',
                        transitionDuration: 'var(--duration-200)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-gray-100)';
                        e.currentTarget.style.borderColor = 'var(--color-gray-300)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-gray-50)';
                        e.currentTarget.style.borderColor = 'var(--color-gray-200)';
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Plane className={`
                          flex-shrink-0
                          ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}
                        `} style={{ color: 'var(--color-gray-400)' }} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate"
                              style={{ 
                                fontWeight: 'var(--font-weight-medium)',
                                fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
                                color: 'var(--color-gray-900)'
                              }}>
                              {program}
                            </span>
                            {account.status && (
                              <span className={`
                                px-2 py-0.5 rounded-full border
                                ${statusColors[account.status]?.bg || 'bg-[var(--color-gray-100)]'}
                                ${statusColors[account.status]?.text || 'text-[var(--color-gray-700)]'}
                                ${statusColors[account.status]?.border || 'border-[var(--color-gray-300)]'}
                              `}
                              style={{ 
                                fontSize: isMobile ? '10px' : 'var(--font-size-xs)',
                                fontWeight: 'var(--font-weight-medium)'
                              }}>
                                {account.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="ml-2"
                        style={{ 
                          fontWeight: 'var(--font-weight-semibold)',
                          fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
                          color: 'var(--color-gray-900)'
                        }}>
                        {(account.miles || 0).toLocaleString()}
                      </span>
                    </motion.button>
                  ))}
                </div>
                
                {/* Summary Footer - Untitled UI Style */}
                <div className="pt-3 flex justify-between items-center"
                  style={{ 
                    borderTop: '1px solid var(--color-gray-200)',
                    marginTop: 'var(--spacing-2)'
                  }}>
                  <span style={{ 
                    fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
                    color: 'var(--color-gray-500)'
                  }}>
                    {Object.keys(accounts).length} {t('programs', language).toLowerCase()}
                  </span>
                  <span style={{ 
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
                    color: 'var(--color-gray-700)'
                  }}>
                    {t('total', language)}: {totalMiles.toLocaleString()} miles
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Account Modal */}
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