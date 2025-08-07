import { getMemberColor, getMemberEmoji } from "@/lib/member-colors";

interface MemberFrameProps {
  member: any;
  variant?: 'default' | 'compact' | 'settings';
  className?: string;
  width?: string;
  onClick?: () => void;
  clickable?: boolean;
}

export default function MemberFrame({ member, variant = 'default', className = '', width, onClick, clickable = false }: MemberFrameProps) {
  const colors = getMemberColor(member);
  const emoji = getMemberEmoji(member);
  
  const variantClass = variant === 'compact' ? 'member-frame-compact' : 
                       variant === 'settings' ? 'settings-member-frame' : '';
  
  const handleClick = () => {
    if (onClick && clickable) {
      onClick();
    }
  };
  
  // Determine text color based on background brightness
  const getBrightness = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  };
  
  const textColor = getBrightness(colors.bg) > 128 ? '#1a1a1a' : '#ffffff';

  return (
    <div 
      className={`member-frame ${variantClass} ${className} ${clickable ? 'cursor-pointer hover:shadow-lg transition-all' : ''}`}
      style={{ 
        backgroundColor: `${colors.bg}99`, // 60% opacity
        border: `2px solid ${colors.border}`,
        width: width || undefined,
        display: 'flex',
        color: textColor,
      }}
      onClick={handleClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      title={clickable ? `Clique para editar ${member.name}` : undefined}
      onKeyDown={(e) => {
        if (clickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <span className="member-frame-emoji">{emoji}</span>
      <span className="member-frame-name">{member.name}</span>
    </div>
  );
}