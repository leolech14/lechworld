import { getMemberColor, getMemberEmoji } from "@/lib/member-colors";

interface MemberFrameProps {
  member: any;
  variant?: 'default' | 'compact' | 'settings';
  className?: string;
  width?: string;
}

export default function MemberFrame({ member, variant = 'default', className = '', width }: MemberFrameProps) {
  const colors = getMemberColor(member);
  const emoji = getMemberEmoji(member);
  
  const variantClass = variant === 'compact' ? 'member-frame-compact' : 
                       variant === 'settings' ? 'settings-member-frame' : '';
  
  return (
    <div 
      className={`member-frame ${variantClass} ${className}`}
      style={{ 
        backgroundColor: `${colors.bg}99`, // 60% opacity
        border: `2px solid ${colors.border}`,
        width: width || undefined,
        display: 'flex',
      }}
    >
      <span className="member-frame-emoji">{emoji}</span>
      <span className="member-frame-name">{member.name}</span>
    </div>
  );
}