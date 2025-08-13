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
    <div className="min-h-screen relative overflow-hidden bottom-safe scroll-smooth bg-gray-25 dark:bg-gray-950">
      {/* Untitled UI Style animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/20 via-transparent to-blue-50/20 dark:from-primary-900/10 dark:to-blue-900/10" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-primary-100/30 to-transparent rounded-full blur-3xl animate-float dark:from-primary-900/20" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-transparent rounded-full blur-3xl animate-float animation-delay-2000 dark:from-blue-900/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-warning-100/20 to-transparent rounded-full blur-3xl animate-float animation-delay-4000 dark:from-warning-900/10" />
      </div>
      
      <div className="relative z-10">
        <Navigation />
        
        <div className={`
          max-w-6xl mx-auto
          ${isMobile ? 'px-2 py-2' : 'px-4 lg:px-6 py-6'}
        `}>
          {/* Untitled UI Style Header */}
          <div className={isMobile ? 'mb-4' : 'mb-8'}>
            <h1 className={`
              font-semibold text-gray-900 dark:text-gray-50
              ${isMobile ? 'text-2xl' : 'text-4xl'}
            `}
            style={{ 
              fontWeight: 'var(--font-weight-semibold)',
              letterSpacing: 'var(--letter-spacing-tight)'
            }}>
              {t('familyOverview', language)}
            </h1>
            <p className={`
              text-gray-600 dark:text-gray-400
              ${isMobile ? 'text-sm mt-1' : 'text-lg mt-2'}
            `}>
              {t('trackManageMiles', language)}
            </p>
          </div>
          
          {/* Untitled UI Stats Grid with proper spacing */}
          <div className={`
            grid grid-cols-2 md:grid-cols-4
            ${isMobile ? 'gap-3 mb-6' : 'gap-4 mb-8'}
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

          {/* Untitled UI Members Grid */}
          <div className={`
            grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2
            ${isMobile ? 'gap-3 pb-24' : 'gap-6 pb-32'}
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