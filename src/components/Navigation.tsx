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
        <HomeIcon className='h-full w-full' style={{ color: '#026E81' }} />
      ),
      onClick: () => router.push('/dashboard'),
      bgColor: '#4CC2D7',
      borderColor: '#026E81'
    },
    {
      title: t('shareReport', language),
      icon: (
        <Share2 className='h-full w-full' style={{ color: '#026E81' }} />
      ),
      onClick: handleShare,
      bgColor: '#4CC2D7',
      borderColor: '#026E81'
    },
    {
      title: t('export', language),
      icon: (
        <Download className='h-full w-full' style={{ color: '#026E81' }} />
      ),
      onClick: handleExport,
      bgColor: '#4CC2D7',
      borderColor: '#026E81'
    },
    {
      title: t('import', language),
      icon: (
        <Upload className='h-full w-full' style={{ color: '#026E81' }} />
      ),
      onClick: handleImport,
      bgColor: '#4CC2D7',
      borderColor: '#026E81'
    },
    {
      title: t('refresh', language),
      icon: (
        <RefreshCw className='h-full w-full' style={{ color: '#026E81' }} />
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
      bgColor: '#4CC2D7',
      borderColor: '#026E81'
    },
    {
      title: t('statistics', language),
      icon: (
        <BarChart3 className='h-full w-full' style={{ color: '#026E81' }} />
      ),
      onClick: () => router.push('/statistics'),
      bgColor: '#4CC2D7',
      borderColor: '#026E81'
    },
    {
      title: t('settings', language),
      icon: (
        <Settings className='h-full w-full' style={{ color: '#026E81' }} />
      ),
      onClick: () => router.push('/settings'),
      bgColor: '#4CC2D7',
      borderColor: '#026E81'
    },
    {
      title: t('guide', language),
      icon: (
        <Book className='h-full w-full' style={{ color: '#026E81' }} />
      ),
      onClick: () => router.push('/guide'),
      bgColor: '#4CC2D7',
      borderColor: '#026E81'
    },
    {
      title: t('help', language),
      icon: (
        <HelpCircle className='h-full w-full' style={{ color: '#026E81' }} />
      ),
      onClick: () => setShowHelp(true),
      bgColor: '#4CC2D7',
      borderColor: '#026E81'
    },
    {
      title: t('logout', language),
      icon: (
        <LogOut className='h-full w-full' style={{ color: '#026E81' }} />
      ),
      onClick: handleLogout,
      bgColor: '#4CC2D7',
      borderColor: '#026E81'
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 backdrop-blur-md shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottom: '1px solid rgba(76, 194, 215, 0.2)' }}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-3 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 rounded-lg"
          >
            <img src="/lechworld-logo.png" alt="LechWorld" className="w-12 h-12 object-contain" />
            <span style={{ color: '#026E81', fontWeight: 'bold', fontSize: '1.5rem' }}>LechWorld</span>
          </button>
          {currentUser && (
            <span className="px-3 py-1.5 rounded-full text-sm font-semibold shadow-md" style={{ background: '#FFD700', color: '#026E81' }}>
              👤 {currentUser.name}
            </span>
          )}
        </div>
      </div>
      
      {/* Apple-style Dock */}
      <div className='fixed bottom-5 left-1/2 max-w-full -translate-x-1/2 z-50'>
        <Dock className='items-end pb-3'>
          {data.map((item, idx) => (
            <DockItem
              key={idx}
              className='aspect-square rounded-full cursor-pointer shadow-sm backdrop-blur-sm'
              onClick={item.onClick}
            >
              <DockLabel>{item.title}</DockLabel>
              <DockIcon>
                <div className="w-full h-full rounded-full flex items-center justify-center p-3"
                     style={{ backgroundColor: item.bgColor, border: `2px solid ${item.borderColor}` }}>
                  {item.icon}
                </div>
              </DockIcon>
            </DockItem>
          ))}
        </Dock>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" 
             style={{ backgroundColor: 'rgba(2, 110, 129, 0.6)' }}
             onClick={() => setShowHelp(false)}>
          <div className="rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
               style={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '1px solid rgba(76, 194, 215, 0.5)' }}
               onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#026E81' }}>{t('lechWorldHelp', language)}</h2>
                <p className="text-sm mt-1" style={{ color: '#026E81' }}>{t('milesManagementCompanion', language)}</p>
              </div>
              <button onClick={() => setShowHelp(false)} className="p-1 rounded-lg transition-colors"
                      style={{ color: '#026E81' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(76, 194, 215, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(76, 194, 215, 0.1)', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
                <h3 className="font-bold mb-2" style={{ color: '#026E81' }}>{t('quickStart', language)}</h3>
                <p className="text-sm" style={{ color: '#026E81' }}>{t('welcomeHelp', language)}</p>
                <ul className="mt-2 space-y-1 text-sm" style={{ color: '#026E81' }}>
                  <li>• {t('clickMemberCard', language)}</li>
                  <li>• {t('useDockActions', language)}</li>
                  <li>• {t('dataAutoSaved', language)}</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                <h3 className="font-bold mb-2" style={{ color: '#026E81' }}>{t('features', language)}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-semibold" style={{ color: '#026E81' }}>{t('dashboard', language)}</p>
                    <p style={{ color: '#4CC2D7' }}>{t('viewFamilyMembers', language)}</p>
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#026E81' }}>{t('statistics', language)}</p>
                    <p style={{ color: '#4CC2D7' }}>{t('analyzePortfolio', language)}</p>
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#026E81' }}>{t('shareReport', language)}</p>
                    <p style={{ color: '#4CC2D7' }}>{t('sendWhatsApp', language)}</p>
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#026E81' }}>{t('import', language)}/{t('export', language)}</p>
                    <p style={{ color: '#4CC2D7' }}>{t('backupRestore', language)}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(175, 243, 255, 0.2)', border: '1px solid rgba(76, 194, 215, 0.3)' }}>
                <h3 className="font-bold mb-2" style={{ color: '#026E81' }}>{t('settingsHelp', language)}</h3>
                <p className="text-sm" style={{ color: '#026E81' }}>{t('customizeMiles', language)}</p>
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(2, 110, 129, 0.1)', border: '1px solid rgba(2, 110, 129, 0.2)' }}>
                <h3 className="font-bold mb-2" style={{ color: '#026E81' }}>{t('security', language)}</h3>
                <p className="text-sm" style={{ color: '#026E81' }}>{t('dataStoredLocally', language)}</p>
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: '#4CC2D7' }}>
                <h3 className="font-bold mb-2" style={{ color: '#026E81' }}>{t('tips', language)}</h3>
                <ul className="space-y-1 text-sm" style={{ color: '#026E81' }}>
                  <li>• {t('clickOutsideClose', language)}</li>
                  <li>• {t('pressEnterNavigate', language)}</li>
                  <li>• {t('useRefresh', language)}</li>
                  <li>• {t('regularExports', language)}</li>
                </ul>
              </div>

              <div className="text-center pt-4" style={{ borderTop: '1px solid rgba(76, 194, 215, 0.2)' }}>
                <p className="text-sm" style={{ color: '#026E81' }}>{t('version', language)}</p>
                <p className="text-xs mt-1" style={{ color: '#026E81' }}>{t('copyright', language)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}