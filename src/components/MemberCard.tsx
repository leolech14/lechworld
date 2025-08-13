'use client';

import { useState } from 'react';
import { MemberAccounts } from '@/types';
import { AccountModal } from './AccountModal';
import { useStore } from '@/store/useStore';
import { t } from '@/lib/translations';
import { ChevronDown, ChevronUp, Plane, TrendingUp, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MemberCardProps {
  member: string;
  accounts: MemberAccounts;
  milesValue: { [key: string]: number };
}

// Member-specific gradient configurations
const memberGradients: { [key: string]: string } = {
  'Leonardo': 'from-blue-600 via-blue-700 to-blue-800',
  'Osvandré': 'from-green-600 via-green-700 to-green-800',
  'Marilise': 'from-purple-600 via-purple-700 to-purple-800',
  'Graciela': 'from-pink-600 via-pink-700 to-pink-800'
};

// Status badge colors
const statusColors: { [key: string]: { bg: string, text: string, glow: string } } = {
  'PLATINUM': { bg: 'bg-yellow-400', text: 'text-yellow-900', glow: 'shadow-yellow-400/50' },
  'GOLD PLUS': { bg: 'bg-amber-400', text: 'text-amber-900', glow: 'shadow-amber-400/50' }, 
  'DIAMANTE': { bg: 'bg-cyan-400', text: 'text-cyan-900', glow: 'shadow-cyan-400/50' },
  'SAFIRA': { bg: 'bg-blue-500', text: 'text-white', glow: 'shadow-blue-500/50' },
  'PRATA': { bg: 'bg-gray-300', text: 'text-gray-800', glow: 'shadow-gray-300/50' },
  'MULTIPLUS': { bg: 'bg-indigo-400', text: 'text-indigo-900', glow: 'shadow-indigo-400/50' }
};

export function MemberCard({ member, accounts, milesValue }: MemberCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const { language } = useStore();

  // Calculate totals
  const totalMiles = Object.values(accounts).reduce((sum, acc) => sum + (acc.miles || 0), 0);
  const totalValue = Object.entries(accounts).reduce(
    (sum, [program, acc]) => sum + ((acc.miles || 0) * milesValue[program]), 
    0
  );

  // Get gradient for member
  const gradient = memberGradients[member] || 'from-gray-600 via-gray-700 to-gray-800';

  // Toggle program details
  const toggleProgramDetails = (program: string) => {
    setExpandedPrograms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(program)) {
        newSet.delete(program);
      } else {
        newSet.add(program);
      }
      return newSet;
    });
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`
          relative rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500
          bg-gradient-to-br ${gradient} p-1 group cursor-pointer
          hover:scale-[1.02] transform-gpu
        `}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-sm" />
        
        {/* Floating orbs for depth */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        
        {/* Main content container */}
        <div className="relative rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md p-6">
          
          {/* Compact header - always visible */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                {member}
              </h3>
              
              {/* Quick stats grid */}
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/70">{t('totalMiles', language)}</p>
                    <p className="text-lg font-bold text-white">{totalMiles.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Wallet className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/70">{t('portfolioValue', language)}</p>
                    <p className="text-lg font-bold text-white">R$ {totalValue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Expand/Collapse button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </motion.div>
            </button>
          </div>
          
          {/* Expandable content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-white/20">
                  <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                    <Plane className="w-4 h-4" />
                    Airline Programs
                  </h4>
                  
                  <div className="space-y-2">
                    {Object.entries(accounts).map(([program, account]) => (
                      <motion.div
                        key={program}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProgramDetails(program);
                          }}
                          className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 
                                   backdrop-blur-sm transition-all duration-300 border border-white/10
                                   hover:border-white/30 group/item"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-white/20 group-hover/item:bg-white/30 transition-colors">
                                <Plane className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <span className="font-semibold text-white">{program}</span>
                                {account.status && (
                                  <span className={`
                                    ml-2 px-2 py-0.5 rounded-full text-xs font-bold inline-block
                                    ${statusColors[account.status]?.bg || 'bg-gray-400'}
                                    ${statusColors[account.status]?.text || 'text-white'}
                                    shadow-lg ${statusColors[account.status]?.glow || ''}
                                  `}>
                                    {account.status}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">
                                {(account.miles || 0).toLocaleString()}
                              </span>
                              <motion.div
                                animate={{ rotate: expandedPrograms.has(program) ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="w-4 h-4 text-white/70" />
                              </motion.div>
                            </div>
                          </div>
                          
                          {/* Program details */}
                          <AnimatePresence>
                            {expandedPrograms.has(program) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                                  {account.accountNumber && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-white/60">Account:</span>
                                      <span className="text-white/90">{account.accountNumber}</span>
                                    </div>
                                  )}
                                  {account.memberNumber && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-white/60">Member:</span>
                                      <span className="text-white/90">{account.memberNumber}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Value:</span>
                                    <span className="text-white/90 font-semibold">
                                      R$ {((account.miles || 0) * milesValue[program]).toFixed(2)}
                                    </span>
                                  </div>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProgram(program);
                                    }}
                                    className="mt-2 w-full px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30
                                             text-white text-sm font-medium transition-all duration-300
                                             backdrop-blur-sm border border-white/20 hover:border-white/40"
                                  >
                                    View Full Details
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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