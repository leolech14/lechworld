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
    <div className="min-h-screen relative overflow-hidden bottom-safe" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      {/* Premium animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at top right, rgba(76, 194, 215, 0.08), transparent)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at bottom left, rgba(2, 110, 129, 0.08), transparent)' }} />
      </div>
      <div className="relative z-10">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Mobile-optimized header */}
        <div className="mb-4 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2" style={{ color: '#026E81' }}>
            {t('familyOverview', language)}
          </h2>
          <p className="text-sm sm:text-base" style={{ color: '#4CC2D7' }}>{t('trackManageMiles', language)}</p>
        </div>
        
        {/* Mobile-first Stats Grid - 2 columns on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-8">
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

        {/* Mobile-first Members Grid - Single column on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pb-24 sm:pb-32">
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