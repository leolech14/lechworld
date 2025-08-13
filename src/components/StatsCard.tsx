import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'amber' | 'emerald' | 'purple';
}

const colorStyles = {
  blue: { 
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
    shadow: 'rgba(59, 130, 246, 0.4)', 
    iconColor: '#ffffff',
    textColor: '#ffffff',
    titleColor: '#e0f2fe'
  },
  amber: { 
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
    shadow: 'rgba(245, 158, 11, 0.4)', 
    iconColor: '#ffffff',
    textColor: '#ffffff',
    titleColor: '#fef3c7'
  },
  emerald: { 
    background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', 
    shadow: 'rgba(16, 185, 129, 0.4)', 
    iconColor: '#ffffff',
    textColor: '#ffffff',
    titleColor: '#d1fae5'
  },
  purple: { 
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
    shadow: 'rgba(139, 92, 246, 0.4)', 
    iconColor: '#ffffff',
    textColor: '#ffffff',
    titleColor: '#ede9fe'
  },
};

export function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colors = colorStyles[color];
  
  return (
    <div 
      className="rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 p-3 sm:p-4 group hover:-translate-y-1 hover:scale-[1.02] transform-gpu relative overflow-hidden backdrop-blur-sm"
      style={{ 
        background: colors.background,
        boxShadow: `0 8px 32px ${colors.shadow}`
      }}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-xl" />
      
      {/* Floating orb for depth */}
      <div className="absolute -top-2 -right-2 w-16 h-16 bg-white/20 rounded-full blur-xl" />
      
      {/* Content */}
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider opacity-90" 
             style={{ color: colors.titleColor }}>
            {title}
          </p>
          <p className="text-lg sm:text-xl font-bold mt-1 drop-shadow-sm" 
             style={{ color: colors.textColor }}>
            {value}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300 backdrop-blur-sm self-start sm:self-auto">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-sm" style={{ color: colors.iconColor }} />
        </div>
      </div>
    </div>
  );
}