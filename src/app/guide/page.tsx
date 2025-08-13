'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Navigation } from '@/components/Navigation';
import { 
  Plane, CreditCard, Wallet, Link, Info, CheckCircle2, XCircle, Clock,
  ChevronRight, Globe, Shield, Star, ArrowRight, Users, Smartphone,
  AlertTriangle, Download, Eye, Settings, Camera, HelpCircle
} from 'lucide-react';
import { t } from '@/lib/translations';

interface AirlineProgram {
  name: string;
  airline: string;
  color: string;
  alliance?: string;
  googleWalletStatus: 'full' | 'partial' | 'generic' | 'none';
  transfer: {
    enabled: boolean;
    cost: string;
    minimum: string;
    maximum: string;
    time: string;
    restrictions: string[];
  };
  googleWallet: {
    supported: 'full' | 'partial' | 'no' | 'generic' | 'unknown';
    requirements: string[];
    features: string[];
    limitations?: string[];
    alternatives?: string[];
  };
  credentials: {
    memberNumber: {
      name: string;
      format: string;
      location: string;
    };
    additionalIds: string[];
    loginMethods: string[];
  };
  api: {
    available: boolean;
    type: string;
    documentation?: string;
  };
  tips?: string[];
}

const getAirlinePrograms = (language: 'pt' | 'en'): AirlineProgram[] => [
  {
    name: "LATAM Pass",
    airline: "LATAM",
    color: "#FF0080",
    alliance: "oneworld",
    googleWalletStatus: 'partial',
    transfer: {
      enabled: true,
      cost: t('fixedFee1000Points', language),
      minimum: t('points1000', language),
      maximum: t('noLimit', language),
      time: t('immediate', language),
      restrictions: [
        t('transferOnce30Days', language),
        t('bothAccountsActive90Days', language),
        t('familySharing7Members', language)
      ]
    },
    googleWallet: {
      supported: 'partial',
      requirements: [
        t('memberNumber10Digits', language),
        t('fullNameRegistered', language),
        t('emailAddress', language)
      ],
      features: [
        language === 'pt' ? 'Cartões de embarque digitais' : 'Digital boarding passes',
        language === 'pt' ? 'Saldo de milhas básico' : 'Basic miles balance'
      ],
      limitations: [
        language === 'pt' ? 'Apenas passes de embarque suportados' : 'Only boarding passes supported',
        t('noAutomaticUpdates', language)
      ],
      alternatives: [
        t('screenshotMethod', language),
        t('genericPassOption', language)
      ]
    },
    credentials: {
      memberNumber: {
        name: t('memberNumberLabel', language),
        format: t('digits10Example', language),
        location: t('memberCardEmailsProfile', language)
      },
      additionalIds: [t('rutCpfDni', language), t('pin46Digits', language)],
      loginMethods: [t('emailPassword', language), t('optional2faViaSmsApp', language)]
    },
    api: {
      available: true,
      type: t('limitedPartnerAccess', language),
      documentation: "developer.latam.com"
    },
    tips: [
      t('bestSouthAmericanTravel', language),
      t('goodOneworldConnections', language),
      t('familyPoolingAvailable', language)
    ]
  },
  {
    name: "Smiles",
    airline: "GOL",
    color: "#FF9933",
    googleWalletStatus: 'generic',
    transfer: {
      enabled: true,
      cost: language === 'pt' ? "Grátis para Diamond/Gold | Silver: R$ 0,01/milha | Basic: R$ 0,02/milha" : "Free for Diamond/Gold | Silver: R$ 0.01/mile | Basic: R$ 0.02/mile",
      minimum: t('points1000', language),
      maximum: language === 'pt' ? "50.000 milhas por transação" : "50,000 miles per transaction",
      time: language === 'pt' ? "Até 72 horas" : "Up to 72 hours",
      restrictions: [
        language === 'pt' ? "Smiles Club: compartilhar com até 6 membros" : "Smiles Club: share with up to 6 members",
        language === 'pt' ? "Limite anual: 200.000 milhas" : "Annual limit: 200,000 miles"
      ]
    },
    googleWallet: {
      supported: 'generic',
      requirements: [
        language === 'pt' ? "Número Smiles (10 dígitos)" : "Smiles Number (10 digits)",
        language === 'pt' ? "CPF (para membros brasileiros)" : "CPF (for Brazilian members)",
        language === 'pt' ? "E-mail registrado" : "Registered email"
      ],
      features: [
        t('milesBalanceLabel', language),
        language === 'pt' ? "Status da categoria" : "Category status",
        language === 'pt' ? "Cartão digital básico" : "Basic digital card"
      ],
      limitations: [
        t('noOfficialSupport', language),
        t('manualUpdatesRequired', language)
      ],
      alternatives: [
        t('genericPassOption', language),
        t('screenshotMethod', language)
      ]
    },
    credentials: {
      memberNumber: {
        name: language === 'pt' ? "Número Smiles" : "Smiles Number",
        format: t('digits10Example', language),
        location: language === 'pt' ? "E-mail de boas-vindas, tela inicial do app" : "Welcome email, app home screen"
      },
      additionalIds: ["CPF", language === 'pt' ? "Número de Cliente GOL" : "GOL Customer Number"],
      loginMethods: [language === 'pt' ? "CPF ou e-mail + senha" : "CPF or email + password", language === 'pt' ? "Perguntas de segurança" : "Security questions"]
    },
    api: {
      available: true,
      type: language === 'pt' ? "Programa de parceiros disponível" : "Partner program available",
      documentation: "developers.smiles.com.br"
    },
    tips: [
      language === 'pt' ? "Melhor custo-benefício para voos domésticos no Brasil" : "Best value for domestic Brazil flights",
      language === 'pt' ? "Promoções frequentes" : "Frequent promotions",
      language === 'pt' ? "Bons parceiros de transferência" : "Good transfer partners"
    ]
  },
  {
    name: "TudoAzul",
    airline: "Azul",
    color: "#0099DD",
    googleWalletStatus: 'generic',
    transfer: {
      enabled: true,
      cost: language === 'pt' ? "R$ 10 por 1.000 pontos (primeiros 10.000) | R$ 15 por 1.000 pontos (acima)" : "R$ 10 per 1,000 points (first 10,000) | R$ 15 per 1,000 points (above)",
      minimum: t('points1000', language),
      maximum: language === 'pt' ? "100.000 pontos por ano" : "100,000 points per year",
      time: language === 'pt' ? "Até 48 horas" : "Up to 48 hours",
      restrictions: [
        language === 'pt' ? "Conta deve ter pelo menos 12 meses" : "Account must be at least 12 months old",
        language === 'pt' ? "Pode criar grupos familiares" : "Can create family groups"
      ]
    },
    googleWallet: {
      supported: 'generic',
      requirements: [
        language === 'pt' ? "Número TudoAzul" : "TudoAzul Number",
        language === 'pt' ? "CPF ou número do passaporte" : "CPF or passport number",
        language === 'pt' ? "Data de nascimento" : "Date of birth"
      ],
      features: [
        language === 'pt' ? "Saldo de pontos" : "Points balance",
        language === 'pt' ? "Status básico" : "Basic status",
        t('digitalMemberCard', language)
      ],
      limitations: [
        t('noOfficialSupport', language),
        t('manualUpdatesRequired', language)
      ],
      alternatives: [
        t('genericPassOption', language),
        t('screenshotMethod', language)
      ]
    },
    credentials: {
      memberNumber: {
        name: language === 'pt' ? "Número TudoAzul" : "TudoAzul Number",
        format: language === 'pt' ? "Comprimento variável (geralmente 9-10 dígitos)" : "Variable length (usually 9-10 digits)",
        location: language === 'pt' ? "Fornecido no registro" : "Provided at registration"
      },
      additionalIds: ["CPF/Passport", language === 'pt' ? "Localizador de reserva" : "Booking locator"],
      loginMethods: [t('emailPassword', language), language === 'pt' ? "CPF + senha" : "CPF + password", language === 'pt' ? "Login social (Facebook/Google)" : "Social login (Facebook/Google)"]
    },
    api: {
      available: false,
      type: t('noPublicApi', language)
    },
    tips: [
      language === 'pt' ? "Forte rede doméstica no Brasil" : "Strong domestic Brazil network",
      language === 'pt' ? "Bom para conexões EUA via Fort Lauderdale" : "Good for US connections via Fort Lauderdale",
      language === 'pt' ? "Opções pontos + dinheiro disponíveis" : "Points + cash options available"
    ]
  },
  {
    name: "TAP Miles&Go",
    airline: "TAP Air Portugal",
    color: "#026E81",
    alliance: "Star Alliance",
    googleWalletStatus: 'generic',
    transfer: {
      enabled: true,
      cost: language === 'pt' ? "€17 por transação + €2 por 1.000 milhas" : "€17 per transaction + €2 per 1,000 miles",
      minimum: t('points1000', language),
      maximum: language === 'pt' ? "50.000 milhas por transação" : "50,000 miles per transaction",
      time: t('immediate', language),
      restrictions: [
        language === 'pt' ? "Compartilhamento familiar disponível com TAP Family" : "Family sharing available with TAP Family"
      ]
    },
    googleWallet: {
      supported: 'generic',
      requirements: [
        language === 'pt' ? "Número do membro (9 dígitos)" : "Member number (9 digits)",
        language === 'pt' ? "PIN ou senha" : "PIN or password",
        t('emailAddress', language)
      ],
      features: [
        t('milesBalanceLabel', language),
        language === 'pt' ? "Nível de status" : "Status level",
        language === 'pt' ? "Cartão digital básico" : "Basic digital card"
      ],
      limitations: [
        t('noOfficialSupport', language),
        language === 'pt' ? 'Suporte limitado na Europa' : 'Limited support in Europe'
      ],
      alternatives: [
        t('genericPassOption', language),
        t('screenshotMethod', language)
      ]
    },
    credentials: {
      memberNumber: {
        name: language === 'pt' ? "Número TAP" : "TAP Number",
        format: language === 'pt' ? "9 dígitos" : "9 digits",
        location: t('cardEmails', language) + ", app"
      },
      additionalIds: ["PIN"],
      loginMethods: [t('numberPassword', language) + "/PIN"]
    },
    api: {
      available: false,
      type: t('noPublicApi', language)
    },
    tips: [
      language === 'pt' ? "Melhor para conexões na Europa" : "Best for Europe connections",
      language === 'pt' ? "Benefícios Star Alliance" : "Star Alliance benefits",
      language === 'pt' ? "Boa disponibilidade de prêmios" : "Good award availability"
    ]
  },
  {
    name: "MileagePlus",
    airline: "United Airlines",
    color: "#002F6C",
    alliance: "Star Alliance",
    googleWalletStatus: 'generic',
    transfer: {
      enabled: true,
      cost: language === 'pt' ? "US$ 7,50 por 500 milhas + US$ 30 taxa de processamento" : "US$ 7.50 per 500 miles + US$ 30 processing fee",
      minimum: language === 'pt' ? "500 milhas" : "500 miles",
      maximum: language === 'pt' ? "100.000 milhas por ano" : "100,000 miles per year",
      time: t('immediate', language),
      restrictions: [
        t('bothAccountsActive90Days', language)
      ]
    },
    googleWallet: {
      supported: 'generic',
      requirements: [
        language === 'pt' ? "Número MileagePlus" : "MileagePlus Number",
        t('lastName', language),
        language === 'pt' ? "Senha ou PIN" : "Password or PIN"
      ],
      features: [
        t('milesBalanceLabel', language),
        language === 'pt' ? "Status Premier" : "Premier status",
        language === 'pt' ? "Cartão digital básico" : "Basic digital card"
      ],
      limitations: [
        t('noOfficialSupport', language),
        t('manualUpdatesRequired', language)
      ],
      alternatives: [
        t('genericPassOption', language),
        t('screenshotMethod', language)
      ]
    },
    credentials: {
      memberNumber: {
        name: language === 'pt' ? "Número MileagePlus" : "MileagePlus Number",
        format: language === 'pt' ? "Número da conta" : "Account number",
        location: language === 'pt' ? "Cartão, perfil online" : "Card, online profile"
      },
      additionalIds: ["PIN"],
      loginMethods: [t('numberPassword', language) + "/PIN"]
    },
    api: {
      available: true,
      type: language === 'pt' ? "API empresarial disponível" : "Enterprise API available",
      documentation: "developer.united.com"
    },
    tips: [
      language === 'pt' ? "Ampla rede nacional e internacional dos EUA" : "Extensive US and international network",
      t('noExpirationMiles', language),
      language === 'pt' ? "Boas conexões Star Alliance" : "Good Star Alliance connections"
    ]
  },
  {
    name: "AAdvantage",
    airline: "American Airlines",
    color: "#D92332",
    alliance: "oneworld",
    googleWalletStatus: 'none',
    transfer: {
      enabled: true,
      cost: language === 'pt' ? "US$ 15 por 1.000 milhas" : "US$ 15 per 1,000 miles",
      minimum: t('points1000', language),
      maximum: language === 'pt' ? "200.000 milhas por ano" : "200,000 miles per year",
      time: t('immediate', language),
      restrictions: [
        t('receivingLimit300kYear', language)
      ]
    },
    googleWallet: {
      supported: 'no',
      requirements: [],
      features: [],
      limitations: [
        language === 'pt' ? 'Oficialmente não suportado' : 'Officially not supported',
        language === 'pt' ? 'American Airlines bloqueia Google Wallet' : 'American Airlines blocks Google Wallet'
      ],
      alternatives: [
        t('screenshotMethod', language),
        language === 'pt' ? 'Use o app oficial AA' : 'Use official AA app'
      ]
    },
    credentials: {
      memberNumber: {
        name: t('aadvantageNumber', language),
        format: language === 'pt' ? "Número do membro" : "Member number",
        location: t('cardEmails', language)
      },
      additionalIds: [],
      loginMethods: [t('numberPassword', language)]
    },
    api: {
      available: true,
      type: t('requiresCommercialPartnership', language),
      documentation: "developer.aa.com"
    },
    tips: [
      t('largestUsCarrier', language),
      t('goodOneworldPartnerships', language),
      t('dynamicPricingAwards', language)
    ]
  },
  {
    name: "SkyMiles",
    airline: "Delta Air Lines",
    color: "#003366",
    alliance: "SkyTeam",
    googleWalletStatus: 'none',
    transfer: {
      enabled: false,
      cost: t('notAvailable', language),
      minimum: t('notApplicable', language),
      maximum: t('notApplicable', language),
      time: t('notApplicable', language),
      restrictions: [
        t('deltaNoTransfers', language)
      ]
    },
    googleWallet: {
      supported: 'no',
      requirements: [],
      features: [],
      limitations: [
        language === 'pt' ? 'Sem acesso à API pública' : 'No public API access',
        language === 'pt' ? 'Delta bloqueia integrações de terceiros' : 'Delta blocks third-party integrations'
      ],
      alternatives: [
        t('screenshotMethod', language),
        language === 'pt' ? 'Use o app oficial Delta' : 'Use official Delta app'
      ]
    },
    credentials: {
      memberNumber: {
        name: t('skymilesNumber', language),
        format: language === 'pt' ? "Número do membro" : "Member number",
        location: language === 'pt' ? "Cartão, perfil" : "Card, profile"
      },
      additionalIds: [],
      loginMethods: [t('numberPassword', language)]
    },
    api: {
      available: false,
      type: t('noPublicApi', language)
    },
    tips: [
      t('noExpirationMiles', language),
      t('goodUsDomesticTravel', language),
      t('skyteamAllianceBenefits', language)
    ]
  },
  {
    name: "Emirates Skywards",
    airline: "Emirates",
    color: "#C8102E",
    googleWalletStatus: 'generic',
    transfer: {
      enabled: true,
      cost: t('aed100PerTransaction', language),
      minimum: t('points1000', language),
      maximum: t('miles50kPerYear', language),
      time: t('upTo7Days', language),
      restrictions: [
        t('familyMembershipRequired', language),
        t('max3TransfersPerYear', language)
      ]
    },
    googleWallet: {
      supported: 'generic',
      requirements: [
        language === 'pt' ? 'Número Skywards' : 'Skywards Number',
        language === 'pt' ? 'Emirates ID' : 'Emirates ID',
        language === 'pt' ? 'Senha' : 'Password'
      ],
      features: [
        t('milesBalanceLabel', language),
        language === 'pt' ? "Status básico" : "Basic status",
        t('digitalMemberCard', language)
      ],
      limitations: [
        t('noOfficialSupport', language),
        language === 'pt' ? 'Suporte limitado no Oriente Médio' : 'Limited support in Middle East'
      ],
      alternatives: [
        t('genericPassOption', language),
        t('screenshotMethod', language)
      ]
    },
    credentials: {
      memberNumber: {
        name: language === 'pt' ? 'Número Skywards' : 'Skywards Number',
        format: language === 'pt' ? "Número do membro" : "Member number",
        location: t('cardEmails', language)
      },
      additionalIds: [language === 'pt' ? 'Emirates ID' : 'Emirates ID'],
      loginMethods: [t('numberPassword', language)]
    },
    api: {
      available: false,
      type: t('noPublicApi', language)
    },
    tips: [
      t('premiumCabinAwards', language),
      t('goodMiddleEastAsiaRoutes', language),
      t('milesExpire3Years', language)
    ]
  }
];

export default function AirlineGuidePage() {
  const { currentUser, language } = useStore();
  const router = useRouter();
  const [selectedProgram, setSelectedProgram] = useState<AirlineProgram | null>(null);
  const [activeTab, setActiveTab] = useState<'transfer' | 'wallet' | 'credentials' | 'integration' | 'googleWallet'>('transfer');

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at top right, rgba(76, 194, 215, 0.08), transparent)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at bottom left, rgba(2, 110, 129, 0.08), transparent)' }} />
      </div>
      <div className="relative z-10">
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#026E81' }}>
              {t('airlineProgramGuide', language)}
            </h2>
            <p style={{ color: '#4CC2D7' }}>{t('completeReference', language)}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
              <Plane className="w-8 h-8 mb-2" style={{ color: '#4CC2D7' }} />
              <div className="text-2xl font-bold" style={{ color: '#026E81' }}>{getAirlinePrograms(language).length}</div>
              <div className="text-sm" style={{ color: '#4CC2D7' }}>{t('programs', language)}</div>
            </div>
            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
              <Users className="w-8 h-8 mb-2" style={{ color: '#FFD700' }} />
              <div className="text-2xl font-bold" style={{ color: '#026E81' }}>
                {getAirlinePrograms(language).filter(p => p.transfer.enabled).length}
              </div>
              <div className="text-sm" style={{ color: '#4CC2D7' }}>{t('allowTransfers', language)}</div>
            </div>
            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
              <Smartphone className="w-8 h-8 mb-2" style={{ color: '#AFF3FF' }} />
              <div className="text-2xl font-bold" style={{ color: '#026E81' }}>
                {getAirlinePrograms(language).filter(p => p.googleWalletStatus === 'full' || p.googleWalletStatus === 'partial').length}
              </div>
              <div className="text-sm" style={{ color: '#4CC2D7' }}>Google Wallet</div>
            </div>
            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
              <Link className="w-8 h-8 mb-2" style={{ color: '#026E81' }} />
              <div className="text-2xl font-bold" style={{ color: '#026E81' }}>
                {getAirlinePrograms(language).filter(p => p.api.available).length}
              </div>
              <div className="text-sm" style={{ color: '#4CC2D7' }}>{t('apiAvailable', language)}</div>
            </div>
            <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
              <Wallet className="w-8 h-8 mb-2" style={{ color: '#FFD700' }} />
              <div className="flex items-center gap-1">
                <div className="text-lg font-bold" style={{ color: '#22c55e' }}>
                  {getAirlinePrograms(language).filter(p => p.googleWalletStatus === 'partial').length}
                </div>
                <div className="text-sm" style={{ color: '#999' }}>/</div>
                <div className="text-lg font-bold" style={{ color: '#FFD700' }}>
                  {getAirlinePrograms(language).filter(p => p.googleWalletStatus === 'generic').length}
                </div>
                <div className="text-sm" style={{ color: '#999' }}>/</div>
                <div className="text-lg font-bold" style={{ color: '#ef4444' }}>
                  {getAirlinePrograms(language).filter(p => p.googleWalletStatus === 'none').length}
                </div>
              </div>
              <div className="text-xs" style={{ color: '#4CC2D7' }}>
                {language === 'pt' ? 'Parcial/Genérico/Sem' : 'Partial/Generic/None'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Program List */}
            <div className="lg:col-span-1">
              <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: '#026E81' }}>{t('availablePrograms', language)}</h3>
                <div className="space-y-2">
                  {getAirlinePrograms(language).map((program) => (
                    <button
                      key={program.name}
                      onClick={() => setSelectedProgram(program)}
                      className={`w-full p-3 rounded-xl transition-all duration-200 text-left ${
                        selectedProgram?.name === program.name 
                          ? 'shadow-md' 
                          : 'hover:shadow-md'
                      }`}
                      style={{ 
                        backgroundColor: selectedProgram?.name === program.name ? 'rgba(76, 194, 215, 0.15)' : 'rgba(76, 194, 215, 0.08)',
                        border: selectedProgram?.name === program.name ? '2px solid #4CC2D7' : '1px solid rgba(76, 194, 215, 0.2)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: program.color }}
                          >
                            <Plane className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold" style={{ color: '#026E81' }}>{program.name}</div>
                            <div className="text-sm" style={{ color: '#4CC2D7' }}>{program.airline}</div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {program.transfer.enabled && (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 215, 0, 0.2)' }}>
                              <CheckCircle2 className="w-4 h-4" style={{ color: '#FFD700' }} />
                            </div>
                          )}
                          {(program.googleWalletStatus === 'full' || program.googleWalletStatus === 'partial' || program.googleWalletStatus === 'generic') && (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ 
                              backgroundColor: program.googleWalletStatus === 'full' ? 'rgba(34, 197, 94, 0.2)' : 
                                              program.googleWalletStatus === 'partial' ? 'rgba(255, 215, 0, 0.2)' : 
                                              'rgba(175, 243, 255, 0.3)' 
                            }}>
                              <Smartphone className="w-4 h-4" style={{ 
                                color: program.googleWalletStatus === 'full' ? '#22c55e' : 
                                       program.googleWalletStatus === 'partial' ? '#FFD700' : 
                                       '#026E81' 
                              }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Program Details */}
            <div className="lg:col-span-2">
              {selectedProgram ? (
                <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
                  <div className="flex items-center gap-4 mb-6">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: selectedProgram.color }}
                    >
                      <Plane className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold" style={{ color: '#026E81' }}>{selectedProgram.name}</h3>
                      <p style={{ color: '#4CC2D7' }}>{selectedProgram.airline}</p>
                      {selectedProgram.alliance && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold" 
                              style={{ backgroundColor: 'rgba(255, 215, 0, 0.2)', color: '#026E81' }}>
                          {selectedProgram.alliance}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-6 overflow-x-auto">
                    {(['transfer', 'wallet', 'credentials', 'integration', 'googleWallet'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap`}
                        style={{
                          backgroundColor: activeTab === tab ? '#4CC2D7' : 'rgba(76, 194, 215, 0.1)',
                          color: activeTab === tab ? '#FFFFFF' : '#026E81',
                          fontWeight: activeTab === tab ? 'bold' : 'normal'
                        }}
                      >
                        {t(tab, language)}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'transfer' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        {selectedProgram.transfer.enabled ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                style={{ backgroundColor: 'rgba(255, 215, 0, 0.2)', color: '#026E81' }}>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            {t('transferAvailable', language)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}>
                            <XCircle className="w-4 h-4 mr-1" />
                            {t('transferNotAvailable', language)}
                          </span>
                        )}
                      </div>

                      {selectedProgram.transfer.enabled && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(76, 194, 215, 0.08)' }}>
                              <div className="text-sm mb-1" style={{ color: '#4CC2D7' }}>{t('cost', language)}</div>
                              <div className="font-semibold" style={{ color: '#026E81' }}>{selectedProgram.transfer.cost}</div>
                            </div>
                            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(76, 194, 215, 0.08)' }}>
                              <div className="text-sm mb-1" style={{ color: '#4CC2D7' }}>{t('processingTime', language)}</div>
                              <div className="font-semibold flex items-center gap-2" style={{ color: '#026E81' }}>
                                <Clock className="w-4 h-4" style={{ color: '#4CC2D7' }} />
                                {selectedProgram.transfer.time}
                              </div>
                            </div>
                            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}>
                              <div className="text-sm mb-1" style={{ color: '#FFD700' }}>{t('minimum', language)}</div>
                              <div className="font-semibold" style={{ color: '#026E81' }}>{selectedProgram.transfer.minimum}</div>
                            </div>
                            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}>
                              <div className="text-sm mb-1" style={{ color: '#FFD700' }}>{t('maximum', language)}</div>
                              <div className="font-semibold" style={{ color: '#026E81' }}>{selectedProgram.transfer.maximum}</div>
                            </div>
                          </div>

                          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(175, 243, 255, 0.15)' }}>
                            <div className="text-sm mb-3" style={{ color: '#026E81', fontWeight: 'bold' }}>{t('restrictions', language)}</div>
                            <ul className="space-y-2">
                              {selectedProgram.transfer.restrictions.map((restriction, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#4CC2D7' }} />
                                  <span className="text-sm" style={{ color: '#026E81' }}>{restriction}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === 'wallet' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        {selectedProgram.googleWallet.supported === 'full' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#15803d' }}>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            {t('officialSupport', language)}
                          </span>
                        ) : selectedProgram.googleWallet.supported === 'partial' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                style={{ backgroundColor: 'rgba(255, 215, 0, 0.2)', color: '#d97706' }}>
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {t('partialSupport', language)}
                          </span>
                        ) : selectedProgram.googleWallet.supported === 'generic' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                style={{ backgroundColor: 'rgba(175, 243, 255, 0.3)', color: '#026E81' }}>
                            <Info className="w-4 h-4 mr-1" />
                            {t('viaGenericPass', language)}
                          </span>
                        ) : selectedProgram.googleWallet.supported === 'no' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}>
                            <XCircle className="w-4 h-4 mr-1" />
                            {t('noSupport', language)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                style={{ backgroundColor: 'rgba(156, 163, 175, 0.2)', color: '#6b7280' }}>
                            <HelpCircle className="w-4 h-4 mr-1" />
                            {t('unknown', language)}
                          </span>
                        )}
                      </div>

                      {(selectedProgram.googleWallet.supported !== 'no') && (
                        <>
                          {selectedProgram.googleWallet.requirements.length > 0 && (
                            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(76, 194, 215, 0.08)' }}>
                              <div className="text-sm mb-3" style={{ color: '#026E81', fontWeight: 'bold' }}>{t('requirements', language)}</div>
                              <ul className="space-y-2">
                                {selectedProgram.googleWallet.requirements.map((req, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" style={{ color: '#4CC2D7' }} />
                                    <span className="text-sm" style={{ color: '#026E81' }}>{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {selectedProgram.googleWallet.features.length > 0 && (
                            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}>
                              <div className="text-sm mb-3" style={{ color: '#026E81', fontWeight: 'bold' }}>{t('featuresInWallet', language)}</div>
                              <ul className="space-y-2">
                                {selectedProgram.googleWallet.features.map((feature, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <Wallet className="w-4 h-4" style={{ color: '#FFD700' }} />
                                    <span className="text-sm" style={{ color: '#026E81' }}>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}

                      {selectedProgram.googleWallet.limitations && selectedProgram.googleWallet.limitations.length > 0 && (
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 107, 107, 0.08)' }}>
                          <div className="text-sm mb-3" style={{ color: '#026E81', fontWeight: 'bold' }}>{t('limitations', language)}</div>
                          <ul className="space-y-2">
                            {selectedProgram.googleWallet.limitations.map((limitation, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
                                <span className="text-sm" style={{ color: '#026E81' }}>{limitation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedProgram.googleWallet.alternatives && selectedProgram.googleWallet.alternatives.length > 0 && (
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
                          <div className="text-sm mb-3" style={{ color: '#026E81', fontWeight: 'bold' }}>{t('alternativeSolutions', language)}</div>
                          <ul className="space-y-2">
                            {selectedProgram.googleWallet.alternatives.map((alternative, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <ArrowRight className="w-4 h-4" style={{ color: '#22c55e' }} />
                                <span className="text-sm" style={{ color: '#026E81' }}>{alternative}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'googleWallet' && (
                    <div className="space-y-6">
                      {/* Overview Section */}
                      <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(76, 194, 215, 0.05)', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
                        <div className="flex items-center gap-3 mb-4">
                          <Smartphone className="w-6 h-6" style={{ color: '#026E81' }} />
                          <h4 className="text-lg font-bold" style={{ color: '#026E81' }}>{t('googleWalletIntegration', language)}</h4>
                        </div>
                        <p className="text-sm mb-4" style={{ color: '#4CC2D7' }}>
                          {t('googleWalletDescription', language)}
                        </p>
                        
                        {/* Support Status */}
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-sm font-semibold" style={{ color: '#026E81' }}>{t('supportStatus', language)}:</span>
                          {selectedProgram.googleWallet.supported === 'full' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#15803d' }}>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              {t('officialSupport', language)}
                            </span>
                          ) : selectedProgram.googleWallet.supported === 'partial' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                  style={{ backgroundColor: 'rgba(255, 215, 0, 0.2)', color: '#d97706' }}>
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              {t('partialSupport', language)}
                            </span>
                          ) : selectedProgram.googleWallet.supported === 'generic' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                  style={{ backgroundColor: 'rgba(175, 243, 255, 0.3)', color: '#026E81' }}>
                              <Info className="w-4 h-4 mr-1" />
                              {t('viaGenericPass', language)}
                            </span>
                          ) : selectedProgram.googleWallet.supported === 'no' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                  style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}>
                              <XCircle className="w-4 h-4 mr-1" />
                              {t('noSupport', language)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                  style={{ backgroundColor: 'rgba(156, 163, 175, 0.2)', color: '#6b7280' }}>
                              <HelpCircle className="w-4 h-4 mr-1" />
                              {t('unknown', language)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* How to Add Section */}
                      {selectedProgram.googleWallet.supported !== 'no' && (
                        <div className="p-6 rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
                          <div className="flex items-center gap-3 mb-4">
                            <Download className="w-5 h-5" style={{ color: '#4CC2D7' }} />
                            <h4 className="text-lg font-bold" style={{ color: '#026E81' }}>{t('howToAdd', language)}</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                   style={{ backgroundColor: '#4CC2D7', color: '#FFFFFF' }}>1</div>
                              <span className="text-sm" style={{ color: '#026E81' }}>{t('step1GoogleWallet', language)}</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                   style={{ backgroundColor: '#4CC2D7', color: '#FFFFFF' }}>2</div>
                              <span className="text-sm" style={{ color: '#026E81' }}>{t('step2GoogleWallet', language)}</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                   style={{ backgroundColor: '#4CC2D7', color: '#FFFFFF' }}>3</div>
                              <span className="text-sm" style={{ color: '#026E81' }}>{t('step3GoogleWallet', language)}</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                   style={{ backgroundColor: '#4CC2D7', color: '#FFFFFF' }}>4</div>
                              <span className="text-sm" style={{ color: '#026E81' }}>{t('step4GoogleWallet', language)}</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                   style={{ backgroundColor: '#4CC2D7', color: '#FFFFFF' }}>5</div>
                              <span className="text-sm" style={{ color: '#026E81' }}>{t('step5GoogleWallet', language)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Benefits and Features */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Benefits */}
                        <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                          <div className="flex items-center gap-3 mb-4">
                            <CheckCircle2 className="w-5 h-5" style={{ color: '#22c55e' }} />
                            <h4 className="text-lg font-bold" style={{ color: '#026E81' }}>{t('benefits', language)}</h4>
                          </div>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <Star className="w-4 h-4" style={{ color: '#22c55e' }} />
                              <span className="text-sm" style={{ color: '#026E81' }}>{t('offlineAccess', language)}</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Star className="w-4 h-4" style={{ color: '#22c55e' }} />
                              <span className="text-sm" style={{ color: '#026E81' }}>{t('automaticBackup', language)}</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Star className="w-4 h-4" style={{ color: '#22c55e' }} />
                              <span className="text-sm" style={{ color: '#026E81' }}>{t('locationNotifications', language)}</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Star className="w-4 h-4" style={{ color: '#22c55e' }} />
                              <span className="text-sm" style={{ color: '#026E81' }}>{t('nativeInterface', language)}</span>
                            </li>
                          </ul>
                        </div>

                        {/* Limitations */}
                        <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(255, 107, 107, 0.05)', border: '1px solid rgba(255, 107, 107, 0.2)' }}>
                          <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-5 h-5" style={{ color: '#ef4444' }} />
                            <h4 className="text-lg font-bold" style={{ color: '#026E81' }}>{t('limitations', language)}</h4>
                          </div>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                              <span className="text-sm" style={{ color: '#026E81' }}>{t('notAllAirlinesSupported', language)}</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                              <span className="text-sm" style={{ color: '#026E81' }}>{t('manualUpdates', language)}</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                              <span className="text-sm" style={{ color: '#026E81' }}>{t('androidOnly', language)}</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                              <span className="text-sm" style={{ color: '#026E81' }}>{t('apiRequiresPartnership', language)}</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Alternative Solutions */}
                      <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.05)', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                        <div className="flex items-center gap-3 mb-4">
                          <Settings className="w-5 h-5" style={{ color: '#FFD700' }} />
                          <h4 className="text-lg font-bold" style={{ color: '#026E81' }}>{t('alternativeSolutions', language)}</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Generic Pass */}
                          <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFFFFF' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Wallet className="w-4 h-4" style={{ color: '#FFD700' }} />
                              <span className="text-sm font-semibold" style={{ color: '#026E81' }}>{t('genericPassSolution', language)}</span>
                            </div>
                            <p className="text-xs" style={{ color: '#4CC2D7' }}>
                              {t('genericPassDescription', language)}
                            </p>
                          </div>

                          {/* Screenshot Method */}
                          <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFFFFF' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Camera className="w-4 h-4" style={{ color: '#FFD700' }} />
                              <span className="text-sm font-semibold" style={{ color: '#026E81' }}>{t('screenshotMethod', language)}</span>
                            </div>
                            <p className="text-xs" style={{ color: '#4CC2D7' }}>
                              {t('screenshotDescription', language)}
                            </p>
                          </div>

                          {/* PWA Option */}
                          <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFFFFF' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Smartphone className="w-4 h-4" style={{ color: '#FFD700' }} />
                              <span className="text-sm font-semibold" style={{ color: '#026E81' }}>{t('pwaOption', language)}</span>
                            </div>
                            <p className="text-xs" style={{ color: '#4CC2D7' }}>
                              {t('pwaDescription', language)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Technical Implementation */}
                      <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(175, 243, 255, 0.05)', border: '1px solid rgba(175, 243, 255, 0.3)' }}>
                        <div className="flex items-center gap-3 mb-4">
                          <Globe className="w-5 h-5" style={{ color: '#4CC2D7' }} />
                          <h4 className="text-lg font-bold" style={{ color: '#026E81' }}>{t('technicalDetails', language)}</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-semibold mb-2" style={{ color: '#026E81' }}>{t('apiComponents', language)}</h5>
                            <ul className="space-y-1 text-sm" style={{ color: '#4CC2D7' }}>
                              <li>• {t('passesClass', language)}</li>
                              <li>• {t('passesObject', language)}</li>
                              <li>• {t('jwtToken', language)}</li>
                              <li>• {t('restApi', language)}</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold mb-2" style={{ color: '#026E81' }}>{t('securityConsiderations', language)}</h5>
                            <ul className="space-y-1 text-sm" style={{ color: '#4CC2D7' }}>
                              <li>• {t('neverExposeKeys', language)}</li>
                              <li>• {t('useEnvironmentVars', language)}</li>
                              <li>• {t('implementRateLimiting', language)}</li>
                              <li>• {t('validateAllData', language)}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'credentials' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(76, 194, 215, 0.08)' }}>
                        <div className="text-sm mb-1" style={{ color: '#4CC2D7' }}>{t('primaryIdentifier', language)}</div>
                        <div className="font-bold text-lg" style={{ color: '#026E81' }}>{selectedProgram.credentials.memberNumber.name}</div>
                        <div className="text-sm mt-2" style={{ color: '#026E81' }}>
                          <span style={{ fontWeight: '600' }}>{t('format', language)}:</span> {selectedProgram.credentials.memberNumber.format}
                        </div>
                        <div className="text-sm" style={{ color: '#026E81' }}>
                          <span style={{ fontWeight: '600' }}>{t('location', language)}:</span> {selectedProgram.credentials.memberNumber.location}
                        </div>
                      </div>

                      {selectedProgram.credentials.additionalIds.length > 0 && (
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}>
                          <div className="text-sm mb-3" style={{ color: '#026E81', fontWeight: 'bold' }}>{t('additionalIds', language)}</div>
                          <div className="space-y-2">
                            {selectedProgram.credentials.additionalIds.map((id, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" style={{ color: '#FFD700' }} />
                                <span className="text-sm" style={{ color: '#026E81' }}>{id}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(175, 243, 255, 0.15)' }}>
                        <div className="text-sm mb-3" style={{ color: '#026E81', fontWeight: 'bold' }}>{t('loginMethods', language)}</div>
                        <div className="space-y-2">
                          {selectedProgram.credentials.loginMethods.map((method, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Shield className="w-4 h-4" style={{ color: '#4CC2D7' }} />
                              <span className="text-sm" style={{ color: '#026E81' }}>{method}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'integration' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        {selectedProgram.api.available ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                style={{ backgroundColor: 'rgba(76, 194, 215, 0.2)', color: '#026E81' }}>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            {t('apiAvailable', language)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}>
                            <XCircle className="w-4 h-4 mr-1" />
                            {t('noPublicApi', language)}
                          </span>
                        )}
                      </div>

                      {selectedProgram.api.available && (
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(76, 194, 215, 0.08)' }}>
                          <div className="text-sm mb-1" style={{ color: '#4CC2D7' }}>{t('accessType', language)}</div>
                          <div className="font-semibold" style={{ color: '#026E81' }}>{selectedProgram.api.type}</div>
                          {selectedProgram.api.documentation && (
                            <div className="mt-2">
                              <div className="text-sm" style={{ color: '#4CC2D7' }}>{t('documentation', language)}</div>
                              <div className="font-mono text-sm" style={{ color: '#026E81' }}>{selectedProgram.api.documentation}</div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}>
                        <div className="text-sm mb-3" style={{ color: '#026E81', fontWeight: 'bold' }}>{t('integrationOptions', language)}</div>
                        <ul className="space-y-2 text-sm" style={{ color: '#026E81' }}>
                          <li className="flex items-start gap-2">
                            <Globe className="w-4 h-4 mt-0.5" style={{ color: '#FFD700' }} />
                            {t('browserAutomation', language)}
                          </li>
                          <li className="flex items-start gap-2">
                            <Info className="w-4 h-4 mt-0.5" style={{ color: '#FFD700' }} />
                            {t('emailParsing', language)}
                          </li>
                          <li className="flex items-start gap-2">
                            <Link className="w-4 h-4 mt-0.5" style={{ color: '#FFD700' }} />
                            {t('thirdPartyAggregators', language)}
                          </li>
                        </ul>
                      </div>

                      {selectedProgram.tips && (
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(175, 243, 255, 0.15)' }}>
                          <div className="text-sm mb-3" style={{ color: '#026E81', fontWeight: 'bold' }}>{t('proTips', language)}</div>
                          <ul className="space-y-2">
                            {selectedProgram.tips.map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Star className="w-4 h-4 mt-0.5" style={{ color: '#4CC2D7' }} />
                                <span className="text-sm" style={{ color: '#026E81' }}>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl shadow-lg p-12 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(76, 194, 215, 0.2)' }}>
                  <Plane className="w-16 h-16 mx-auto mb-4" style={{ color: '#4CC2D7' }} />
                  <p style={{ color: '#026E81', fontSize: '1.125rem' }}>{t('selectProgram', language)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}