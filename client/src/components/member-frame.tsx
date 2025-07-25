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

  return (
    <div 
      className={`member-frame ${variantClass} ${className} ${clickable ? 'cursor-pointer hover:shadow-lg transition-all' : ''}`}
      style={{ 
        backgroundColor: `${colors.bg}99`, // 60% opacity
        border: `2px solid ${colors.border}`,
        width: width || undefined,
        display: 'flex',
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