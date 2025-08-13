import { LucideIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'amber' | 'emerald' | 'purple';
}

const colorStyles = {
  blue: { 
    background: 'from-blue-500/20 to-blue-600/20',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    value: 'text-blue-100',
    title: 'text-blue-200/70'
  },
  amber: { 
    background: 'from-amber-500/20 to-amber-600/20',
    border: 'border-amber-500/30',
    icon: 'text-amber-400',
    value: 'text-amber-100',
    title: 'text-amber-200/70'
  },
  emerald: { 
    background: 'from-emerald-500/20 to-emerald-600/20',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-400',
    value: 'text-emerald-100',
    title: 'text-emerald-200/70'
  },
  purple: { 
    background: 'from-purple-500/20 to-purple-600/20',
    border: 'border-purple-500/30',
    icon: 'text-purple-400',
    value: 'text-purple-100',
    title: 'text-purple-200/70'
  },
};

export function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colors = colorStyles[color];
  const isMobile = useIsMobile();
  
  return (
    <div 
      className={`
        rounded-lg border backdrop-blur-sm
        transition-all duration-300
        bg-gradient-to-br ${colors.background} ${colors.border}
        ${isMobile ? '' : 'hover:shadow-lg hover:scale-[1.02]'}
        ${isMobile ? 'p-3' : 'p-4'}
      `}
    >
      {/* Mobile: Horizontal Layout - 60px height */}
      {isMobile ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`
              p-1.5 rounded-md bg-white/10 flex-shrink-0
              ${colors.icon}
            `}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-medium uppercase tracking-wider ${colors.title} truncate`}>
                {title}
              </p>
              <p className={`text-sm font-bold ${colors.value} truncate`}>
                {value}
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Desktop: Vertical Layout with more space
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-xs font-semibold uppercase tracking-wider ${colors.title}`}>
                {title}
              </p>
              <p className={`text-xl font-bold mt-1 ${colors.value}`}>
                {value}
              </p>
            </div>
            <div className={`
              p-2 rounded-lg bg-white/10 
              ${colors.icon}
              transition-transform duration-300 hover:scale-110
            `}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}