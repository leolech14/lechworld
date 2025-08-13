'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Navigation } from '@/components/Navigation';
import { TrendingUp, Award, Target, Activity, PieChart, BarChart3, Users, Plane } from 'lucide-react';
import { t } from '@/lib/translations';

export default function StatisticsPage() {
  const { currentUser, accounts, milesValue, language, initializeAuth } = useStore();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('all');

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
    const memberStats: any = {};
    const programStats: any = {};
    let totalMiles = 0;
    let totalValue = 0;

    Object.entries(accounts).forEach(([member, memberAccounts]) => {
      memberStats[member] = { miles: 0, value: 0, programs: 0 };
      
      Object.entries(memberAccounts).forEach(([program, acc]) => {
        const miles = acc.miles || 0;
        const value = miles * milesValue[program];
        
        memberStats[member].miles += miles;
        memberStats[member].value += value;
        memberStats[member].programs++;
        
        if (!programStats[program]) {
          programStats[program] = { miles: 0, value: 0, members: 0 };
        }
        programStats[program].miles += miles;
        programStats[program].value += value;
        programStats[program].members++;
        
        totalMiles += miles;
        totalValue += value;
      });
    });

    // Find top performers
    const topMember = Object.entries(memberStats).reduce((top: any, [member, stats]: any) => 
      (!top || stats.miles > top.stats.miles) ? { member, stats } : top, null);
    
    const topProgram = Object.entries(programStats).reduce((top: any, [program, stats]: any) => 
      (!top || stats.miles > top.stats.miles) ? { program, stats } : top, null);

    return { memberStats, programStats, totalMiles, totalValue, topMember, topProgram };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at top right, rgba(76, 194, 215, 0.08), transparent)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at bottom left, rgba(2, 110, 129, 0.08), transparent)' }} />
      </div>
      <div className="relative z-10">
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#026E81' }}>
              {t('statisticsAnalytics', language)}
            </h2>
            <p style={{ color: '#4CC2D7' }}>{t('comprehensiveInsights', language)}</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#4CC2D7' }}>{t('totalPortfolio', language)}</p>
                  <p className="text-2xl font-bold mt-2" style={{ color: '#026E81' }}>R$ {stats.totalValue.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: '#FFD700' }}>
                  <TrendingUp className="w-6 h-6" style={{ color: '#026E81' }} />
                </div>
              </div>
            </div>

            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#4CC2D7' }}>{t('totalMiles', language)}</p>
                  <p className="text-2xl font-bold mt-2" style={{ color: '#026E81' }}>{stats.totalMiles.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: '#4CC2D7' }}>
                  <Activity className="w-6 h-6" style={{ color: '#026E81' }} />
                </div>
              </div>
            </div>

            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#4CC2D7' }}>{t('topMember', language)}</p>
                  <p className="text-xl font-bold mt-2" style={{ color: '#026E81' }}>{stats.topMember?.member}</p>
                  <p className="text-sm" style={{ color: '#4CC2D7' }}>{stats.topMember?.stats.miles.toLocaleString()} {t('miles', language)}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: '#AFF3FF' }}>
                  <Award className="w-6 h-6" style={{ color: '#026E81' }} />
                </div>
              </div>
            </div>

            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#4CC2D7' }}>{t('bestProgram', language)}</p>
                  <p className="text-xl font-bold mt-2" style={{ color: '#026E81' }}>{stats.topProgram?.program}</p>
                  <p className="text-sm" style={{ color: '#4CC2D7' }}>{stats.topProgram?.stats.miles.toLocaleString()} {t('miles', language)}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: '#026E81' }}>
                  <Target className="w-6 h-6" style={{ color: '#AFF3FF' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Member Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#026E81' }}>
                <Users className="w-5 h-5" />
                {t('memberPerformance', language)}
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.memberStats).map(([member, data]: any) => (
                  <div key={member} className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(76, 194, 215, 0.1)', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold" style={{ color: '#026E81' }}>{member}</span>
                      <span className="text-sm font-bold" style={{ color: '#026E81' }}>{data.miles.toLocaleString()} {t('miles', language)}</span>
                    </div>
                    <div className="w-full rounded-full h-3" style={{ backgroundColor: 'rgba(76, 194, 215, 0.2)' }}>
                      <div 
                        className="h-3 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(data.miles / stats.totalMiles) * 100}%`,
                          background: 'linear-gradient(90deg, #026E81 0%, #4CC2D7 100%)'
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span style={{ color: '#026E81', fontWeight: '600' }}>R$ {data.value.toFixed(2)}</span>
                      <span style={{ color: '#4CC2D7', fontWeight: '500' }}>{data.programs} {t('programs', language)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#026E81' }}>
                <Plane className="w-5 h-5" />
                {t('programDistribution', language)}
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.programStats).map(([program, data]: any) => (
                  <div key={program} className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 215, 0, 0.15)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold" style={{ color: '#026E81' }}>{program}</span>
                      <span className="text-sm font-bold" style={{ color: '#026E81' }}>{data.miles.toLocaleString()} {t('miles', language)}</span>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ backgroundColor: 'rgba(255, 215, 0, 0.3)' }}>
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(data.miles / stats.totalMiles) * 100}%`,
                          background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)'
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                      <span style={{ color: '#026E81', fontWeight: '600' }}>R$ {data.value.toFixed(2)}</span>
                      <span style={{ color: '#4CC2D7' }}>{data.members} {t('members', language)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
              <PieChart className="w-8 h-8 mb-3" style={{ color: '#4CC2D7' }} />
              <h4 className="font-bold mb-2" style={{ color: '#026E81' }}>{t('portfolioInsights', language)}</h4>
              <p className="text-sm" style={{ color: '#4CC2D7' }}>
                Average miles per member: {Math.round(stats.totalMiles / Object.keys(stats.memberStats).length).toLocaleString()}
              </p>
              <p className="text-sm mt-1" style={{ color: '#4CC2D7' }}>
                Average value per program: R$ {(stats.totalValue / Object.keys(stats.programStats).length).toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
              <BarChart3 className="w-8 h-8 mb-3" style={{ color: '#FFD700' }} />
              <h4 className="font-bold mb-2" style={{ color: '#026E81' }}>{t('growthPotential', language)}</h4>
              <p className="text-sm" style={{ color: '#4CC2D7' }}>
                Highest value program: {Object.entries(milesValue).reduce((max: any, [prog, val]) => 
                  (!max || val > max.value) ? { program: prog, value: val } : max, null)?.program}
              </p>
              <p className="text-sm mt-1" style={{ color: '#4CC2D7' }}>
                Most diversified: {Object.entries(stats.memberStats).reduce((max: any, [member, data]: any) => 
                  (!max || data.programs > max.programs) ? { member, programs: data.programs } : max, null)?.member}
              </p>
            </div>

            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
              <Activity className="w-8 h-8 mb-3" style={{ color: '#026E81' }} />
              <h4 className="font-bold mb-2" style={{ color: '#026E81' }}>{t('quickStats', language)}</h4>
              <p className="text-sm" style={{ color: '#4CC2D7' }}>
                Total accounts: {Object.values(stats.memberStats).reduce((sum: number, data: any) => sum + data.programs, 0)}
              </p>
              <p className="text-sm mt-1" style={{ color: '#4CC2D7' }}>
                Avg miles/account: {Math.round(stats.totalMiles / Object.values(stats.memberStats).reduce((sum: number, data: any) => sum + data.programs, 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}