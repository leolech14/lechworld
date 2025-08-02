// Central management for program icons
export interface ProgramIcon {
  id: number;
  programId: number;
  iconUrl: string | null;
  iconType: 'png' | 'color' | null;
  backgroundColor?: string;
}

// Default icon mappings by company name
const defaultIcons: Record<string, string> = {
  'LATAM': '/logos/latam-pass-logo.png',
  'LATAM Airlines': '/logos/latam-pass-logo.png',
  'LATAM Pass': '/logos/latam-pass-logo.png',
  'Azul': '/logos/azul-tudoazul-logo.png',
  'TudoAzul': '/logos/azul-tudoazul-logo.png',
  'GOL': '/logos/gol-smiles-logo.png',
  'Smiles': '/logos/gol-smiles-logo.png',
  'TAP': '/logos/tap-milesgo-logo.png',
  'TAP Miles&Go': '/logos/tap-milesgo-logo.png',
  'Avianca': '/logos/avianca-lifemiles-logo.png',
  'LifeMiles': '/logos/avianca-lifemiles-logo.png',
  'Accor': '/logos/accor-all-logo.png',
  'ALL - Accor Live Limitless': '/logos/accor-all-logo.png',
  'American Airlines': '/logos/AAdvantage-Logo.webp',
  'AAdvantage': '/logos/AAdvantage-Logo.webp',
  'Turkish Airlines': '/logos/tap-milesgo-logo.png',  // Using TAP logo as placeholder
  'Miles&Smiles': '/logos/tap-milesgo-logo.png',  // Using TAP logo as placeholder
  'Copa Airlines': '/logos/avianca-lifemiles-logo.png',  // Using Avianca logo as placeholder
  'ConnectMiles': '/logos/avianca-lifemiles-logo.png',  // Using Avianca logo as placeholder
};

export function getProgramIcon(program: any): { type: 'png' | 'color', value: string } {
  // Check if program has custom icon (supports both camelCase and snake_case)
  const customIcon = program.iconUrl || program.icon_url;
  if (customIcon) {
    return { type: 'png', value: customIcon };
  }
  
  // Check default icons by company name, program name, or programName
  const iconPath = defaultIcons[program.company] || 
                   defaultIcons[program.name] || 
                   defaultIcons[program.programName] ||
                   defaultIcons[program.airline?.name] ||
                   defaultIcons[program.airline?.programName];
  if (iconPath) {
    return { type: 'png', value: iconPath };
  }
  
  // Fallback to color (supports both camelCase and snake_case)
  const logoColor = program.logoColor || program.logo_color || '#3B82F6';
  return { type: 'color', value: logoColor };
}

export function getProgramIconUrl(program: any): string | null {
  const icon = getProgramIcon(program);
  return icon.type === 'png' ? icon.value : null;
}

export function getProgramColor(program: any): string {
  const icon = getProgramIcon(program);
  return icon.type === 'color' ? icon.value : 'transparent';
}