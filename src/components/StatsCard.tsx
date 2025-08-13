import { LucideIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'amber' | 'emerald' | 'purple';
}

// Untitled UI color mappings for stats cards
const colorStyles = {
  blue: { 
    background: 'var(--color-blue-50)',
    border: 'var(--color-blue-200)',
    icon: 'var(--color-blue-600)',
    iconBg: 'var(--color-blue-100)',
    value: 'var(--color-gray-900)',
    title: 'var(--color-gray-600)',
    hoverBg: 'var(--color-blue-100)',
    hoverBorder: 'var(--color-blue-300)'
  },
  amber: { 
    background: 'var(--color-warning-50)',
    border: 'var(--color-warning-200)',
    icon: 'var(--color-warning-600)',
    iconBg: 'var(--color-warning-100)',
    value: 'var(--color-gray-900)',
    title: 'var(--color-gray-600)',
    hoverBg: 'var(--color-warning-100)',
    hoverBorder: 'var(--color-warning-300)'
  },
  emerald: { 
    background: 'var(--color-success-50)',
    border: 'var(--color-success-200)',
    icon: 'var(--color-success-600)',
    iconBg: 'var(--color-success-100)',
    value: 'var(--color-gray-900)',
    title: 'var(--color-gray-600)',
    hoverBg: 'var(--color-success-100)',
    hoverBorder: 'var(--color-success-300)'
  },
  purple: { 
    background: 'var(--color-primary-50)',
    border: 'var(--color-primary-200)',
    icon: 'var(--color-primary-600)',
    iconBg: 'var(--color-primary-100)',
    value: 'var(--color-gray-900)',
    title: 'var(--color-gray-600)',
    hoverBg: 'var(--color-primary-100)',
    hoverBorder: 'var(--color-primary-300)'
  },
};

export function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colors = colorStyles[color];
  const isMobile = useIsMobile();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: isMobile ? 1 : 1.02 }}
      className="relative overflow-hidden transition-all"
      style={{
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: isMobile ? 'var(--spacing-3)' : 'var(--spacing-4)',
        boxShadow: 'var(--shadow-sm)',
        transitionDuration: 'var(--duration-200)'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.backgroundColor = colors.hoverBg;
          e.currentTarget.style.borderColor = colors.hoverBorder;
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.backgroundColor = colors.background;
          e.currentTarget.style.borderColor = colors.border;
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }
      }}
    >
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          background: `linear-gradient(135deg, transparent 0%, ${colors.iconBg} 100%)`,
          pointerEvents: 'none'
        }}
      />
      
      {/* Mobile: Horizontal Layout */}
      {isMobile ? (
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div 
              className="p-2 rounded-lg flex-shrink-0"
              style={{ 
                backgroundColor: colors.iconBg,
                color: colors.icon
              }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate uppercase tracking-wider"
                style={{ 
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: colors.title,
                  letterSpacing: 'var(--letter-spacing-wide)'
                }}>
                {title}
              </p>
              <p className="truncate"
                style={{ 
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: colors.value,
                  lineHeight: 'var(--line-height-lg)'
                }}>
                {value}
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Desktop: Enhanced Layout with more visual hierarchy
        <div className="space-y-3 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="uppercase tracking-wider"
                style={{ 
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: colors.title,
                  letterSpacing: 'var(--letter-spacing-wide)',
                  marginBottom: 'var(--spacing-2)'
                }}>
                {title}
              </p>
              <p style={{ 
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: colors.value,
                lineHeight: 'var(--line-height-2xl)'
              }}>
                {value}
              </p>
            </div>
            <motion.div 
              className="p-3 rounded-lg"
              style={{ 
                backgroundColor: colors.iconBg,
                color: colors.icon
              }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Icon className="w-5 h-5" />
            </motion.div>
          </div>
          
          {/* Progress indicator or trend (placeholder for future enhancement) */}
          <div className="h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: colors.iconBg }}>
            <motion.div 
              className="h-full rounded-full"
              style={{ 
                backgroundColor: colors.icon,
                width: '65%'
              }}
              initial={{ width: 0 }}
              animate={{ width: '65%' }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}