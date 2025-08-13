'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Navigation } from '@/components/Navigation';
import { MemberCard } from '@/components/MemberCard';
import { StatsCard } from '@/components/StatsCard';
import { Users, Plane, TrendingUp, DollarSign } from 'lucide-react';
import { t } from '@/lib/translations';

export default function DashboardPage() {
  const { currentUser, accounts, milesValue, language, initializeAuth } = useStore();
  const router = useRouter();

  useEffect(() => {
    // Initialize authentication from sessionStorage
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return null;
  }

  // Calculate statistics
  const calculateStats = () => {
    let totalMiles = 0;
    let totalValue = 0;
    let programCount = new Set<string>();

    Object.values(accounts).forEach(memberAccounts => {
      Object.entries(memberAccounts).forEach(([program, acc]) => {
        totalMiles += acc.miles || 0;
        totalValue += (acc.miles || 0) * milesValue[program];
        programCount.add(program);
      });
    });

    return {
      totalMembers: Object.keys(accounts).length,
      totalPrograms: programCount.size,
      totalMiles,
      totalValue
    };
  };

  const stats = calculateStats();
  const members = ['Osvandré', 'Marilise', 'Graciela', 'Leonardo'];

  return (
    <div className="min-h-screen relative overflow-hidden bottom-safe scroll-smooth" 
         style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #1a1a2e 50%, #0f3460 75%, #1a1a2e 100%)' }}>
      {/* Enhanced animated background for gradient cards */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(76, 194, 215, 0.15), transparent 70%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 70%, rgba(2, 110, 129, 0.15), transparent 70%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.03), transparent 60%)' }} />
        {/* Floating particles for depth */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/20 rounded-full blur-sm animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-purple-400/20 rounded-full blur-sm animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-3/4 w-1 h-1 bg-green-400/30 rounded-full blur-sm animate-pulse delay-500" />
      </div>
      <div className="relative z-10">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-6">
        {/* Compact header with better contrast */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-white drop-shadow-lg">
            {t('familyOverview', language)}
          </h2>
          <p className="text-sm sm:text-base text-blue-200/80">{t('trackManageMiles', language)}</p>
        </div>
        
        {/* Compact Stats Grid - optimized for smaller cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
          <StatsCard
            title={t('totalMembers', language)}
            value={stats.totalMembers}
            icon={Users}
            color="blue"
          />
          <StatsCard
            title={t('programs', language)}
            value={stats.totalPrograms}
            icon={Plane}
            color="amber"
          />
          <StatsCard
            title={t('totalMiles', language)}
            value={stats.totalMiles.toLocaleString()}
            icon={TrendingUp}
            color="emerald"
          />
          <StatsCard
            title={t('totalValue', language)}
            value={`R$ ${stats.totalValue.toFixed(2)}`}
            icon={DollarSign}
            color="purple"
          />
        </div>

        {/* Optimized Members Grid for compact cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 pb-20 sm:pb-24">
          {members.map(member => (
            <MemberCard
              key={member}
              member={member}
              accounts={accounts[member] || {}}
              milesValue={milesValue}
            />
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}