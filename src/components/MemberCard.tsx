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

// Member-specific gradient configurations - subtle for compact view
const memberGradients: { [key: string]: string } = {
  'Leonardo': 'from-blue-500/20 to-blue-600/20',
  'Osvandré': 'from-green-500/20 to-green-600/20',
  'Marilise': 'from-purple-500/20 to-purple-600/20',
  'Graciela': 'from-pink-500/20 to-pink-600/20'
};

// Member accent colors for borders and highlights
const memberAccents: { [key: string]: string } = {
  'Leonardo': 'border-blue-500',
  'Osvandré': 'border-green-500',
  'Marilise': 'border-purple-500',
  'Graciela': 'border-pink-500'
};

// Status badge colors - ultra compact
const statusColors: { [key: string]: { bg: string, text: string } } = {
  'PLATINUM': { bg: 'bg-yellow-400/20', text: 'text-yellow-300' },
  'GOLD PLUS': { bg: 'bg-amber-400/20', text: 'text-amber-300' }, 
  'DIAMANTE': { bg: 'bg-cyan-400/20', text: 'text-cyan-300' },
  'SAFIRA': { bg: 'bg-blue-500/20', text: 'text-blue-300' },
  'PRATA': { bg: 'bg-gray-300/20', text: 'text-gray-300' },
  'MULTIPLUS': { bg: 'bg-indigo-400/20', text: 'text-indigo-300' }
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
  const gradient = memberGradients[member] || 'from-gray-500/20 to-gray-600/20';
  const accent = memberAccents[member] || 'border-gray-500';

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`
          relative rounded-lg border backdrop-blur-sm
          transition-all duration-300
          ${accent} ${isExpanded ? 'border-opacity-60' : 'border-opacity-30'}
          bg-gradient-to-br ${gradient}
          ${isMobile ? '' : 'hover:shadow-lg'}
        `}
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
            {/* Avatar Circle */}
            <div className={`
              flex-shrink-0 rounded-full flex items-center justify-center font-bold
              ${isMobile ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'}
              bg-gradient-to-br ${gradient.replace('/20', '/40')} border ${accent}
              text-white shadow-sm
            `}>
              {member[0]}
            </div>
            
            {/* Compact Info */}
            <div className="flex-1 min-w-0 text-left">
              <h3 className={`
                font-semibold text-white truncate
                ${isMobile ? 'text-sm' : 'text-base'}
              `}>
                {member}
              </h3>
              <div className="flex items-center gap-3">
                <span className={`
                  text-blue-200/80 flex items-center gap-1
                  ${isMobile ? 'text-xs' : 'text-sm'}
                `}>
                  <TrendingUp className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                  {totalMiles.toLocaleString()}
                </span>
                <span className={`
                  text-green-200/80 flex items-center gap-1
                  ${isMobile ? 'text-xs' : 'text-sm'}
                `}>
                  <DollarSign className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                  {totalValue.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Expand/Collapse Icon */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className={`
              rounded-full p-1 bg-white/10 text-white/60
              ${isMobile ? 'ml-2' : 'ml-3'}
            `}
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
                        w-full rounded-md bg-white/5 hover:bg-white/10 
                        transition-all duration-200 flex items-center justify-between
                        text-left group border border-white/5 hover:border-white/10
                        ${isMobile ? 'p-2' : 'p-2.5'}
                      `}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Plane className={`
                          text-white/50 flex-shrink-0
                          ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}
                        `} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`
                              font-medium text-white/90 truncate
                              ${isMobile ? 'text-xs' : 'text-sm'}
                            `}>
                              {program}
                            </span>
                            {account.status && (
                              <span className={`
                                px-1.5 py-0.5 rounded-full font-medium
                                ${statusColors[account.status]?.bg || 'bg-gray-400/20'}
                                ${statusColors[account.status]?.text || 'text-gray-300'}
                                ${isMobile ? 'text-[10px]' : 'text-xs'}
                              `}>
                                {account.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`
                        font-semibold text-white ml-2
                        ${isMobile ? 'text-xs' : 'text-sm'}
                      `}>
                        {(account.miles || 0).toLocaleString()}
                      </span>
                    </motion.button>
                  ))}
                </div>
                
                {/* Summary Footer */}
                <div className={`
                  pt-2 border-t border-white/10 flex justify-between items-center
                  ${isMobile ? 'text-xs' : 'text-sm'}
                `}>
                  <span className="text-white/60">
                    {Object.keys(accounts).length} {t('programs', language).toLowerCase()}
                  </span>
                  <span className="font-semibold text-white/80">
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