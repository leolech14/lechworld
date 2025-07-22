// Valores médios das milhas por programa (em centavos para evitar problemas de float)
const MILES_VALUES_IN_CENTS: Record<string, number> = {
  // Accor
  'ALL': 4750, // R$ 47,50
  'Accor Live Limitless': 4750,
  'ALL Accor Live Limitless': 4750,
  
  // American Airlines
  'AAdvantage': 7500, // R$ 75,00
  'American Airlines': 7500,
  'AA': 7500,
  
  // Avianca
  'LifeMiles': 6500, // R$ 65,00
  'Avianca': 6500,
  'Avianca LifeMiles': 6500,
  
  // Azul
  'TudoAzul': 2750, // R$ 27,50
  'Azul': 2750,
  'Azul TudoAzul': 2750,
  
  // GOL
  'Smiles': 3500, // R$ 35,00
  'GOL': 3500,
  'Gol Smiles': 3500,
  'GOL Smiles': 3500,
  
  // LATAM
  'LATAM Pass': 3000, // R$ 30,00
  'LATAM': 3000,
  'Latam Pass': 3000,
  
  // TAP
  'TAP Miles&Go': 4750, // R$ 47,50
  'TAP': 4750,
  'TAP Portugal': 4750,
  'Miles&Go': 4750,
};

// Valor padrão para programas não mapeados (R$ 30,00 por mil)
const DEFAULT_VALUE_IN_CENTS = 3000;

export function getMilesValuePerThousand(programName: string): number {
  // Tenta encontrar o programa pelo nome exato
  const valueInCents = MILES_VALUES_IN_CENTS[programName] || 
                       MILES_VALUES_IN_CENTS[programName.toLowerCase()] ||
                       // Tenta encontrar por palavras-chave
                       Object.entries(MILES_VALUES_IN_CENTS).find(([key]) => 
                         programName.toLowerCase().includes(key.toLowerCase()) ||
                         key.toLowerCase().includes(programName.toLowerCase())
                       )?.[1] ||
                       DEFAULT_VALUE_IN_CENTS;
  
  // Retorna o valor em reais
  return valueInCents / 100;
}

export function calculateEstimatedValue(points: number, programName: string): number {
  const valuePerThousand = getMilesValuePerThousand(programName);
  return (points / 1000) * valuePerThousand;
}