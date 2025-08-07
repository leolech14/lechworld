import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Plane, CreditCard, Wallet, Link, Info, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

interface AirlineProgram {
  name: string;
  airline: string;
  color: string;
  transfer: {
    enabled: boolean;
    cost: string;
    minimum: string;
    maximum: string;
    time: string;
    restrictions: string[];
  };
  googleWallet: {
    supported: boolean;
    requirements: string[];
    features: string[];
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
}

const airlinePrograms: AirlineProgram[] = [
  {
    name: "LATAM Pass",
    airline: "LATAM",
    color: "#FF0080",
    transfer: {
      enabled: true,
      cost: "Taxa fixa de 1.000 pontos",
      minimum: "1.000 pontos",
      maximum: "Sem limite",
      time: "Imediato",
      restrictions: [
        "Transferência apenas uma vez a cada 30 dias",
        "Ambas as contas devem estar ativas há pelo menos 90 dias",
        "Compartilhamento familiar para até 7 membros"
      ]
    },
    googleWallet: {
      supported: true,
      requirements: [
        "Número de Sócio (10 dígitos)",
        "Nome completo conforme cadastro",
        "Endereço de e-mail"
      ],
      features: [
        "Saldo atual de milhas",
        "Exibição do status elite",
        "Cartão de membro digital",
        "QR code para uso no aeroporto"
      ]
    },
    credentials: {
      memberNumber: {
        name: "Número de Sócio",
        format: "10 dígitos (ex: 1234567890)",
        location: "Cartão de membro, e-mails, perfil do app"
      },
      additionalIds: ["RUT/CPF/DNI", "PIN (4-6 dígitos)"],
      loginMethods: ["E-mail + senha", "2FA opcional via SMS ou app"]
    },
    api: {
      available: true,
      type: "Acesso limitado a parceiros",
      documentation: "developer.latam.com"
    }
  },
  {
    name: "Smiles",
    airline: "GOL",
    color: "#F97316",
    transfer: {
      enabled: true,
      cost: "Grátis para Diamond/Gold | Silver: R$ 0,01/milha | Basic: R$ 0,02/milha",
      minimum: "1.000 milhas",
      maximum: "50.000 milhas por transação",
      time: "Até 72 horas",
      restrictions: [
        "Clube Smiles: compartilhe com até 6 membros",
        "Limite anual: 200.000 milhas"
      ]
    },
    googleWallet: {
      supported: true,
      requirements: [
        "Número Smiles (10 dígitos)",
        "CPF (para membros brasileiros)",
        "E-mail cadastrado"
      ],
      features: [
        "Saldo de milhas",
        "Status da categoria",
        "Cartão digital com código de barras"
      ]
    },
    credentials: {
      memberNumber: {
        name: "Número Smiles",
        format: "10 dígitos",
        location: "E-mail de boas-vindas, tela inicial do app"
      },
      additionalIds: ["CPF", "Número Cliente GOL"],
      loginMethods: ["CPF ou e-mail + senha", "Perguntas de segurança"]
    },
    api: {
      available: true,
      type: "Programa de parceiros disponível",
      documentation: "developers.smiles.com.br"
    }
  },
  {
    name: "TudoAzul",
    airline: "Azul",
    color: "#0EA5E9",
    transfer: {
      enabled: true,
      cost: "R$ 10 por 1.000 pontos (primeiros 10.000) | R$ 15 por 1.000 pontos (acima)",
      minimum: "1.000 pontos",
      maximum: "100.000 pontos por ano",
      time: "Até 48 horas",
      restrictions: [
        "Conta deve ter pelo menos 12 meses",
        "Pode criar grupos familiares"
      ]
    },
    googleWallet: {
      supported: true,
      requirements: [
        "Número TudoAzul",
        "CPF ou número do passaporte",
        "Data de nascimento"
      ],
      features: [
        "Saldo de pontos",
        "Status Safira/Topázio/Diamante",
        "Cartão de membro digital"
      ]
    },
    credentials: {
      memberNumber: {
        name: "Número TudoAzul",
        format: "Tamanho variável (geralmente 9-10 dígitos)",
        location: "Fornecido no cadastro"
      },
      additionalIds: ["CPF/Passaporte", "Localizador de reserva"],
      loginMethods: ["E-mail + senha", "CPF + senha", "Login social (Facebook/Google)"]
    },
    api: {
      available: false,
      type: "Sem API pública"
    }
  },
  {
    name: "TAP Miles&Go",
    airline: "TAP",
    color: "#00A859",
    transfer: {
      enabled: true,
      cost: "€17 por transação + €2 por 1.000 milhas",
      minimum: "1.000 milhas",
      maximum: "50.000 milhas por transação",
      time: "Imediato",
      restrictions: [
        "Compartilhamento familiar disponível com TAP Family"
      ]
    },
    googleWallet: {
      supported: true,
      requirements: [
        "Número de membro (9 dígitos)",
        "PIN ou senha",
        "Endereço de e-mail"
      ],
      features: [
        "Saldo de milhas",
        "Nível de status",
        "Cartão digital"
      ]
    },
    credentials: {
      memberNumber: {
        name: "Número TAP",
        format: "9 dígitos",
        location: "Cartão, e-mails, app"
      },
      additionalIds: ["PIN"],
      loginMethods: ["Número + senha/PIN"]
    },
    api: {
      available: false,
      type: "Sem API pública"
    }
  },
  {
    name: "MileagePlus",
    airline: "United Airlines",
    color: "#002F6C",
    transfer: {
      enabled: true,
      cost: "US$ 7,50 por 500 milhas + US$ 30 taxa de processamento",
      minimum: "500 milhas",
      maximum: "100.000 milhas por ano",
      time: "Imediato",
      restrictions: [
        "Ambas as contas devem estar abertas há mais de 90 dias"
      ]
    },
    googleWallet: {
      supported: true,
      requirements: [
        "Número MileagePlus",
        "Sobrenome",
        "Senha ou PIN"
      ],
      features: [
        "Saldo de milhas",
        "Status Premier",
        "Cartão digital com QR code"
      ]
    },
    credentials: {
      memberNumber: {
        name: "Número MileagePlus",
        format: "Número da conta",
        location: "Cartão, perfil online"
      },
      additionalIds: ["PIN"],
      loginMethods: ["Número + senha/PIN"]
    },
    api: {
      available: true,
      type: "API empresarial disponível",
      documentation: "developer.united.com"
    }
  },
  {
    name: "AAdvantage",
    airline: "American Airlines",
    color: "#D92332",
    transfer: {
      enabled: true,
      cost: "US$ 15 por 1.000 milhas",
      minimum: "1.000 milhas",
      maximum: "200.000 milhas por ano",
      time: "Imediato",
      restrictions: [
        "Limite de recebimento: 300.000 milhas por ano"
      ]
    },
    googleWallet: {
      supported: true,
      requirements: [
        "Número AAdvantage",
        "Sobrenome",
        "Senha"
      ],
      features: [
        "Saldo de milhas",
        "Status elite",
        "Cartão de membro digital"
      ]
    },
    credentials: {
      memberNumber: {
        name: "Número AAdvantage",
        format: "Número de membro",
        location: "Cartão, e-mails"
      },
      additionalIds: [],
      loginMethods: ["Número + senha"]
    },
    api: {
      available: true,
      type: "Requer parceria comercial",
      documentation: "developer.aa.com"
    }
  }
];

const integrationMethods = [
  {
    name: "APIs Oficiais",
    icon: Link,
    description: "Integração direta com as companhias aéreas",
    pros: ["Dados em tempo real", "Alta confiabilidade", "Suporte oficial"],
    cons: ["Requer parceria comercial", "Documentação limitada", "Custos elevados"]
  },
  {
    name: "Automação via Browser",
    icon: Info,
    description: "Puppeteer/Playwright para coleta automatizada",
    pros: ["Funciona com qualquer programa", "Código aberto", "Flexível"],
    cons: ["Manutenção frequente", "Pode quebrar com mudanças", "Performance limitada"]
  },
  {
    name: "Parse de E-mails",
    icon: CreditCard,
    description: "Monitoramento de extratos por e-mail",
    pros: ["Muito confiável", "Baixa manutenção", "Dados oficiais"],
    cons: ["Atraso nas atualizações", "Requer acesso ao e-mail", "Nem sempre em tempo real"]
  },
  {
    name: "Agregadores",
    icon: Wallet,
    description: "Serviços como AwardWallet e Points.com",
    pros: ["Múltiplos programas", "APIs prontas", "Suporte profissional"],
    cons: ["Custos mensais", "Dados de terceiros", "Limitações de API"]
  }
];

export default function AirlineGuide() {
  const [, navigate] = useLocation();
  const [selectedProgram, setSelectedProgram] = useState<AirlineProgram | null>(null);
  const [activeTab, setActiveTab] = useState("transfer");

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="glass-button mb-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>

          <div className="glass-card p-6 md:p-8 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <Plane className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Guia de Programas de Milhagem
                </h1>
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  Manual completo para gerenciar seus programas de fidelidade
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card className="glass-card border-blue-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{airlinePrograms.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Programas</div>
                </CardContent>
              </Card>
              <Card className="glass-card border-green-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {airlinePrograms.filter(p => p.transfer.enabled).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Com Transferência</div>
                </CardContent>
              </Card>
              <Card className="glass-card border-purple-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {airlinePrograms.filter(p => p.googleWallet.supported).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Google Wallet</div>
                </CardContent>
              </Card>
              <Card className="glass-card border-orange-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {airlinePrograms.filter(p => p.api.available).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Com API</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Programas Disponíveis</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Clique para ver detalhes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {airlinePrograms.map((program) => (
                  <motion.button
                    key={program.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedProgram(program)}
                    className={`w-full p-4 rounded-lg border transition-all ${
                      selectedProgram?.name === program.name
                        ? "bg-blue-500/20 border-blue-500"
                        : "glass-card border-white/10 hover:border-blue-500/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: program.color }}
                        >
                          <Plane className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900 dark:text-white">{program.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{program.airline}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {program.transfer.enabled && (
                          <Badge variant="outline" className="border-green-500/50 text-green-400">
                            <CheckCircle2 className="h-3 w-3" />
                          </Badge>
                        )}
                        {program.googleWallet.supported && (
                          <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                            <Wallet className="h-3 w-3" />
                          </Badge>
                        )}
                        {program.api.available && (
                          <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                            <Link className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedProgram ? (
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: selectedProgram.color }}
                      >
                        <Plane className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-gray-900 dark:text-white text-2xl">
                          {selectedProgram.name}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          {selectedProgram.airline}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4 glass-card">
                      <TabsTrigger value="transfer">Transferências</TabsTrigger>
                      <TabsTrigger value="wallet">Google Wallet</TabsTrigger>
                      <TabsTrigger value="credentials">Credenciais</TabsTrigger>
                      <TabsTrigger value="integration">Integração</TabsTrigger>
                    </TabsList>

                    <TabsContent value="transfer" className="mt-6 space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={selectedProgram.transfer.enabled ? "default" : "destructive"}
                            className={selectedProgram.transfer.enabled ? "bg-green-500" : ""}
                          >
                            {selectedProgram.transfer.enabled ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Transferência Disponível
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Transferência Indisponível
                              </>
                            )}
                          </Badge>
                        </div>

                        {selectedProgram.transfer.enabled && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="glass-card p-4 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Custo</div>
                                <div className="text-gray-900 dark:text-white font-medium">
                                  {selectedProgram.transfer.cost}
                                </div>
                              </div>
                              <div className="glass-card p-4 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tempo</div>
                                <div className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-blue-400" />
                                  {selectedProgram.transfer.time}
                                </div>
                              </div>
                              <div className="glass-card p-4 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mínimo</div>
                                <div className="text-gray-900 dark:text-white font-medium">
                                  {selectedProgram.transfer.minimum}
                                </div>
                              </div>
                              <div className="glass-card p-4 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Máximo</div>
                                <div className="text-gray-900 dark:text-white font-medium">
                                  {selectedProgram.transfer.maximum}
                                </div>
                              </div>
                            </div>

                            <div className="glass-card p-4 rounded-lg">
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Restrições</div>
                              <ul className="space-y-2">
                                {selectedProgram.transfer.restrictions.map((restriction, index) => (
                                  <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                    <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{restriction}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="wallet" className="mt-6 space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={selectedProgram.googleWallet.supported ? "default" : "destructive"}
                            className={selectedProgram.googleWallet.supported ? "bg-blue-500" : ""}
                          >
                            {selectedProgram.googleWallet.supported ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Google Wallet Compatível
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Google Wallet Não Suportado
                              </>
                            )}
                          </Badge>
                        </div>

                        {selectedProgram.googleWallet.supported && (
                          <>
                            <div className="glass-card p-4 rounded-lg">
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Informações Necessárias</div>
                              <ul className="space-y-2">
                                {selectedProgram.googleWallet.requirements.map((req, index) => (
                                  <li key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                                    <span className="text-sm">{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="glass-card p-4 rounded-lg">
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Recursos no Wallet</div>
                              <ul className="space-y-2">
                                {selectedProgram.googleWallet.features.map((feature, index) => (
                                  <li key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <Wallet className="h-4 w-4 text-blue-400" />
                                    <span className="text-sm">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="credentials" className="mt-6 space-y-4">
                      <div className="space-y-4">
                        <div className="glass-card p-4 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Identificador Principal</div>
                          <div className="text-gray-900 dark:text-white font-medium text-lg">
                            {selectedProgram.credentials.memberNumber.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Formato: {selectedProgram.credentials.memberNumber.format}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Localização: {selectedProgram.credentials.memberNumber.location}
                          </div>
                        </div>

                        {selectedProgram.credentials.additionalIds.length > 0 && (
                          <div className="glass-card p-4 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Identificadores Adicionais</div>
                            <div className="space-y-2">
                              {selectedProgram.credentials.additionalIds.map((id, index) => (
                                <div key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                  <CreditCard className="h-4 w-4 text-purple-400" />
                                  <span className="text-sm">{id}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="glass-card p-4 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Métodos de Login</div>
                          <div className="space-y-2">
                            {selectedProgram.credentials.loginMethods.map((method, index) => (
                              <div key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                <Info className="h-4 w-4 text-green-400" />
                                <span className="text-sm">{method}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="integration" className="mt-6 space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={selectedProgram.api.available ? "default" : "destructive"}
                            className={selectedProgram.api.available ? "bg-purple-500" : ""}
                          >
                            {selectedProgram.api.available ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                API Disponível
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Sem API Pública
                              </>
                            )}
                          </Badge>
                        </div>

                        {selectedProgram.api.available && (
                          <div className="glass-card p-4 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tipo de Acesso</div>
                            <div className="text-gray-900 dark:text-white font-medium">{selectedProgram.api.type}</div>
                            {selectedProgram.api.documentation && (
                              <div className="mt-2">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Documentação</div>
                                <div className="text-blue-400 text-sm">
                                  {selectedProgram.api.documentation}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="glass-card p-4 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Alternativas de Integração
                          </div>
                          <div className="text-gray-700 dark:text-gray-300 text-sm space-y-2">
                            <p>• Automação via browser (Puppeteer/Playwright)</p>
                            <p>• Parse de e-mails de extrato</p>
                            <p>• Extensões de navegador</p>
                            <p>• Agregadores como AwardWallet</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-12 text-center">
                  <Plane className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Selecione um programa para ver os detalhes
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white text-2xl">Métodos de Integração</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Opções para automatizar a coleta de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {integrationMethods.map((method) => (
                  <motion.div
                    key={method.name}
                    whileHover={{ scale: 1.02 }}
                    className="glass-card p-6 rounded-lg"
                  >
                    <method.icon className="h-8 w-8 text-blue-400 mb-4" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{method.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{method.description}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-green-400 mb-1">Vantagens</div>
                        <ul className="space-y-1">
                          {method.pros.map((pro, index) => (
                            <li key={index} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <div className="text-xs text-red-400 mb-1">Desvantagens</div>
                        <ul className="space-y-1">
                          {method.cons.map((con, index) => (
                            <li key={index} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1">
                              <XCircle className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 glass-card p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <Info className="h-6 w-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dicas de Implementação</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Ordem de Prioridade</h4>
              <ol className="space-y-1 list-decimal list-inside">
                <li>LATAM Pass (mais usuários, melhor documentação)</li>
                <li>Smiles (boa disponibilidade de API)</li>
                <li>TudoAzul (importante para mercado brasileiro)</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Abordagem MVP</h4>
              <ul className="space-y-1">
                <li>• Começar com parse de e-mail (mais confiável)</li>
                <li>• Adicionar Google Wallet para atualizações manuais</li>
                <li>• Implementar APIs conforme parcerias se desenvolvem</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}