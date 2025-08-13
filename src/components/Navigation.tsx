'use client';

import {
  Share2,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  HomeIcon,
  Users,
  Plane,
  FileText,
  Book
} from 'lucide-react';
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { t } from '@/lib/translations';

export function Navigation() {
  const { currentUser, logout, exportData, language } = useStore();
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const handleShare = () => {
    const stats = calculateStats();
    const report = generateWhatsAppReport(stats);
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, '_blank');
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lechworld-backup-${Date.now()}.json`;
    a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            useStore.getState().importData(data);
            alert(language === 'pt' ? 'Dados importados com sucesso!' : 'Data imported successfully!');
          } catch (error) {
            alert(language === 'pt' ? 'Erro ao importar arquivo' : 'Error importing file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const calculateStats = () => {
    const { accounts, milesValue } = useStore.getState();
    let totalMiles = 0;
    let totalValue = 0;
    const memberDetails: any = {};
    const programTotals: any = {};

    Object.entries(accounts).forEach(([member, memberAccounts]) => {
      memberDetails[member] = { miles: 0, value: 0, programs: [] };
      
      Object.entries(memberAccounts).forEach(([program, acc]) => {
        const miles = acc.miles || 0;
        const value = miles * milesValue[program];
        
        totalMiles += miles;
        totalValue += value;
        memberDetails[member].miles += miles;
        memberDetails[member].value += value;
        
        if (miles > 0) {
          memberDetails[member].programs.push({ program, miles, status: acc.status });
          
          if (!programTotals[program]) {
            programTotals[program] = 0;
          }
          programTotals[program] += miles;
        }
      });
    });

    return { totalMiles, totalValue, memberDetails, programTotals };
  };

  const generateWhatsAppReport = (stats: any) => {
    let report = `${t('familyMilesReport', language)}\n`;
    report += `📅 ${new Date().toLocaleDateString('pt-BR')} • ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n`;
    
    report += `━━━━━━━━━━━━━━━━━━━━\n`;
    report += `${t('portfolioSummary', language)}\n`;
    report += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    report += `${t('familyMembers', language)}: ${Object.keys(stats.memberDetails).length}\n`;
    report += `✈️ ${t('totalMiles', language)}: *${stats.totalMiles.toLocaleString()}*\n`;
    report += `💰 ${t('totalValue', language)}: *R$ ${stats.totalValue.toFixed(2)}*\n`;
    report += `📈 Avg per ${t('member', language)}: ${Math.round(stats.totalMiles / Object.keys(stats.memberDetails).length).toLocaleString()} ${t('miles', language)}\n\n`;
    
    report += `━━━━━━━━━━━━━━━━━━━━\n`;
    report += `${t('memberBreakdown', language)}\n`;
    report += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    Object.entries(stats.memberDetails).forEach(([member, details]: any) => {
      if (details.miles > 0) {
        report += `*${member}*\n`;
        report += `├ ${t('total', language)}: ${details.miles.toLocaleString()} ${t('miles', language)}\n`;
        report += `├ ${t('value', language)}: R$ ${details.value.toFixed(2)}\n`;
        report += `└ ${t('programs', language)}:\n`;
        details.programs.forEach((prog: any, idx: number) => {
          const isLast = idx === details.programs.length - 1;
          const status = prog.status ? ` (${prog.status})` : '';
          report += `  ${isLast ? '└' : '├'} ${prog.program}: ${prog.miles.toLocaleString()}${status}\n`;
        });
        report += `\n`;
      }
    });
    
    report += `━━━━━━━━━━━━━━━━━━━━\n`;
    report += `✈️ *${t('airlineTotals', language).toUpperCase()}*\n`;
    report += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    const sortedPrograms = Object.entries(stats.programTotals)
      .sort((a: any, b: any) => b[1] - a[1]);
    
    sortedPrograms.forEach(([program, miles]: any) => {
      const percentage = ((miles / stats.totalMiles) * 100).toFixed(1);
      report += `${program}: ${miles.toLocaleString()} (${percentage}%)\n`;
    });
    
    report += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    report += `${t('generatedBy', language)}\n`;
    report += `👤 ${currentUser?.name || 'User'}\n`;
    report += `━━━━━━━━━━━━━━━━━━━━`;
    
    return report;
  };

  const data = [
    {
      title: t('home', language),
      icon: (
        <HomeIcon className='h-full w-full' />
      ),
      onClick: () => router.push('/dashboard'),
      gradient: 'from-primary-600 to-primary-700',
      iconColor: 'text-white'
    },
    {
      title: t('shareReport', language),
      icon: (
        <Share2 className='h-full w-full' />
      ),
      onClick: handleShare,
      gradient: 'from-blue-600 to-blue-700',
      iconColor: 'text-white'
    },
    {
      title: t('export', language),
      icon: (
        <Download className='h-full w-full' />
      ),
      onClick: handleExport,
      gradient: 'from-success-600 to-success-700',
      iconColor: 'text-white'
    },
    {
      title: t('import', language),
      icon: (
        <Upload className='h-full w-full' />
      ),
      onClick: handleImport,
      gradient: 'from-success-600 to-success-700',
      iconColor: 'text-white'
    },
    {
      title: t('refresh', language),
      icon: (
        <RefreshCw className='h-full w-full' />
      ),
      onClick: () => {
        // Force a re-render without page reload
        const { accounts, milesValue } = useStore.getState();
        useStore.setState({ accounts: { ...accounts } });
        // Visual feedback
        const icon = document.querySelector(`[title="${t('refresh', language)}"] svg`);
        if (icon) {
          icon.classList.add('animate-spin');
          setTimeout(() => icon.classList.remove('animate-spin'), 1000);
        }
      },
      gradient: 'from-blue-600 to-blue-700',
      iconColor: 'text-white'
    },
    {
      title: t('statistics', language),
      icon: (
        <BarChart3 className='h-full w-full' />
      ),
      onClick: () => router.push('/statistics'),
      gradient: 'from-warning-600 to-warning-700',
      iconColor: 'text-white'
    },
    {
      title: t('settings', language),
      icon: (
        <Settings className='h-full w-full' />
      ),
      onClick: () => router.push('/settings'),
      gradient: 'from-gray-600 to-gray-700',
      iconColor: 'text-white'
    },
    {
      title: t('guide', language),
      icon: (
        <Book className='h-full w-full' />
      ),
      onClick: () => router.push('/guide'),
      gradient: 'from-primary-600 to-primary-700',
      iconColor: 'text-white'
    },
    {
      title: t('help', language),
      icon: (
        <HelpCircle className='h-full w-full' />
      ),
      onClick: () => setShowHelp(true),
      gradient: 'from-blue-600 to-blue-700',
      iconColor: 'text-white'
    },
    {
      title: t('logout', language),
      icon: (
        <LogOut className='h-full w-full' />
      ),
      onClick: handleLogout,
      gradient: 'from-error-600 to-error-700',
      iconColor: 'text-white'
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 sm:gap-3 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded-lg touch-target p-2"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <Plane className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <span className="hidden sm:inline text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">LechWorld</span>
          </button>
          {currentUser && (
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-xs sm:text-sm font-semibold border border-primary-200 dark:border-primary-800">
              <Users className="inline w-3 h-3 mr-1" />
              {currentUser.name}
            </span>
          )}
        </div>
      </div>
      
      {/* Mobile-optimized Dock - Bottom navigation for thumb zone */}
      <div className='fixed bottom-0 left-0 right-0 pb-safe z-50 px-2 sm:px-0 sm:bottom-5 sm:left-1/2 sm:right-auto sm:max-w-full sm:-translate-x-1/2'>
        <Dock className='items-end pb-2 sm:pb-3 w-full sm:w-auto'>
          {data.map((item, idx) => (
            <DockItem
              key={idx}
              className='aspect-square rounded-full cursor-pointer shadow-sm backdrop-blur-sm touch-target'
              onClick={item.onClick}
              aria-label={item.title}
            >
              <DockLabel>{item.title}</DockLabel>
              <DockIcon>
                <div className={`w-full h-full rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center p-2 sm:p-3 shadow-lg hover:shadow-xl transition-all ${item.iconColor}`}>
                  {item.icon}
                </div>
              </DockIcon>
            </DockItem>
          ))}
        </Dock>
      </div>

      {/* Mobile-optimized Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60]" 
             onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 w-full sm:max-w-2xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800" 
               onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('lechWorldHelp', language)}</h2>
                <p className="text-xs sm:text-sm mt-1 text-gray-600 dark:text-gray-400">{t('milesManagementCompanion', language)}</p>
              </div>
              <button onClick={() => setShowHelp(false)} className="touch-target p-2 rounded-lg transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      style={{ minWidth: '48px', minHeight: '48px' }}
                      aria-label="Close help">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                <h3 className="font-bold mb-2 text-primary-700 dark:text-primary-400">{t('quickStart', language)}</h3>
                <p className="text-sm text-primary-600 dark:text-primary-500">{t('welcomeHelp', language)}</p>
                <ul className="mt-2 space-y-1 text-sm text-primary-600 dark:text-primary-500">
                  <li>• {t('clickMemberCard', language)}</li>
                  <li>• {t('useDockActions', language)}</li>
                  <li>• {t('dataAutoSaved', language)}</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
                <h3 className="font-bold mb-2 text-warning-700 dark:text-warning-400">{t('features', language)}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{t('dashboard', language)}</p>
                    <p className="text-gray-600 dark:text-gray-400">{t('viewFamilyMembers', language)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{t('statistics', language)}</p>
                    <p className="text-gray-600 dark:text-gray-400">{t('analyzePortfolio', language)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{t('shareReport', language)}</p>
                    <p className="text-gray-600 dark:text-gray-400">{t('sendWhatsApp', language)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{t('import', language)}/{t('export', language)}</p>
                    <p className="text-gray-600 dark:text-gray-400">{t('backupRestore', language)}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <h3 className="font-bold mb-2 text-blue-700 dark:text-blue-400">{t('settingsHelp', language)}</h3>
                <p className="text-sm text-blue-600 dark:text-blue-500">{t('customizeMiles', language)}</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">{t('security', language)}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('dataStoredLocally', language)}</p>
              </div>

              <div className="p-4 rounded-xl border border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/10">
                <h3 className="font-bold mb-2 text-primary-700 dark:text-primary-400">{t('tips', language)}</h3>
                <ul className="space-y-1 text-sm text-primary-600 dark:text-primary-500">
                  <li>• {t('clickOutsideClose', language)}</li>
                  <li>• {t('pressEnterNavigate', language)}</li>
                  <li>• {t('useRefresh', language)}</li>
                  <li>• {t('regularExports', language)}</li>
                </ul>
              </div>

              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('version', language)}</p>
                <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">{t('copyright', language)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}