import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'amber' | 'emerald' | 'purple';
}

const colorStyles = {
  blue: { background: '#4CC2D7', shadow: 'rgba(76, 194, 215, 0.3)', iconColor: '#026E81' },
  amber: { background: '#FFD700', shadow: 'rgba(255, 215, 0, 0.3)', iconColor: '#026E81' },
  emerald: { background: '#AFF3FF', shadow: 'rgba(175, 243, 255, 0.3)', iconColor: '#026E81' },
  purple: { background: '#FFD700', shadow: 'rgba(255, 215, 0, 0.3)', iconColor: '#026E81' },
};

export function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colors = colorStyles[color];
  
  return (
    <div className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-3 sm:p-6 group hover:-translate-y-1" 
         style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider" style={{ color: '#4CC2D7' }}>{title}</p>
          <p className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2" style={{ color: '#026E81' }}>{value}</p>
        </div>
        <div className="p-2 sm:p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 self-start sm:self-auto"
             style={{ background: colors.background, boxShadow: `0 10px 25px ${colors.shadow}` }}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-sm" style={{ color: colors.iconColor }} />
        </div>
      </div>
    </div>
  );
}