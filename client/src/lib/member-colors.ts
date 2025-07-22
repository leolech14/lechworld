export interface MemberColors {
  bg: string;
  border: string;
}

export function getMemberColor(member: any): MemberColors {
  // Verifica camelCase primeiro, depois snake_case
  const frameColor = member.frameColor || member.frame_color;
  const frameBorderColor = member.frameBorderColor || member.frame_border_color;
  
  // Se o membro tem cores personalizadas, usa elas
  if (frameColor && frameBorderColor) {
    return { bg: frameColor, border: frameBorderColor };
  }
  
  // Senão, gera uma cor baseada no nome
  const colors: MemberColors[] = [
    { bg: '#FFD6EC', border: '#FFB3D9' }, // Rosa pastel
    { bg: '#D6ECFF', border: '#B3D9FF' }, // Azul pastel
    { bg: '#D6FFEC', border: '#B3FFD9' }, // Verde pastel
    { bg: '#ECD6FF', border: '#D9B3FF' }, // Roxo pastel
    { bg: '#FFF2D6', border: '#FFE6B3' }, // Amarelo pastel
    { bg: '#FFE6D6', border: '#FFD4B3' }, // Laranja pastel
  ];
  
  // Gerar índice baseado no nome para consistência
  let hash = 0;
  for (let i = 0; i < member.name.length; i++) {
    hash = member.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export function getMemberEmoji(member: any): string {
  // Verifica camelCase primeiro, depois snake_case
  return member.profileEmoji || member.profile_emoji || '👤';
}