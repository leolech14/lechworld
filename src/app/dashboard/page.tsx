'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Navigation } from '@/components/Navigation';
import { MemberCard } from '@/components/MemberCard';
import { StatsCard } from '@/components/StatsCard';
import { Users, Plane, TrendingUp, DollarSign } from 'lucide-react';
import { t } from '@/lib/translations';
import { useIsMobile } from '@/hooks/useMediaQuery';

export default function DashboardPage() {
  const { currentUser, accounts, milesValue, language, initializeAuth } = useStore();
  const router = useRouter();
  const isMobile = useIsMobile();

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
    <div className="min-h-screen relative overflow-hidden bottom-safe scroll-smooth bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      {/* Subtle animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative z-10">
        <Navigation />
        
        <div className={`
          max-w-6xl mx-auto
          ${isMobile ? 'px-2 py-2' : 'px-4 lg:px-6 py-6'}
        `}>
          {/* Compact header */}
          <div className={isMobile ? 'mb-3' : 'mb-6'}>
            <h2 className={`
              font-bold text-white
              ${isMobile ? 'text-xl' : 'text-3xl'}
            `}>
              {t('familyOverview', language)}
            </h2>
            <p className={`
              text-blue-200/60
              ${isMobile ? 'text-xs mt-0.5' : 'text-base mt-2'}
            `}>
              {t('trackManageMiles', language)}
            </p>
          </div>
          
          {/* Ultra Compact Stats Grid */}
          <div className={`
            grid grid-cols-2 md:grid-cols-4
            ${isMobile ? 'gap-2 mb-4' : 'gap-3 mb-8'}
          `}>
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
              value={`R$ ${stats.totalValue.toFixed(0)}`}
              icon={DollarSign}
              color="purple"
            />
          </div>

          {/* Compact Members Grid */}
          <div className={`
            grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2
            ${isMobile ? 'gap-2 pb-20' : 'gap-4 pb-24'}
          `}>
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