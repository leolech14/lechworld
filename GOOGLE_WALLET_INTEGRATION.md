# 📱 Integração com Google Wallet para Programas de Milhas Aéreas

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Como Funciona o Google Wallet API](#como-funciona-o-google-wallet-api)
3. [Arquitetura da Solução](#arquitetura-da-solução)
4. [Status Atual das Companhias Aéreas](#status-atual-das-companhias-aéreas)
5. [Implementação Técnica](#implementação-técnica)
6. [Alternativas e Soluções](#alternativas-e-soluções)
7. [Roadmap de Implementação](#roadmap-de-implementação)

---

## 🌟 Visão Geral

O Google Wallet é uma plataforma digital que permite aos usuários armazenar e gerenciar diversos tipos de passes digitais, incluindo:
- 🎫 Ingressos de eventos
- ✈️ Cartões de embarque
- 💳 Cartões de fidelidade
- 🎁 Vale-presentes
- 🚌 Passes de transporte
- 📱 Passes genéricos customizados

### Por que integrar com Google Wallet?

**Vantagens:**
- ✅ Acesso offline aos cartões
- ✅ Notificações push baseadas em localização
- ✅ Atualizações em tempo real dos saldos
- ✅ Interface nativa e familiar para usuários Android
- ✅ Backup automático na conta Google
- ✅ Segurança com criptografia end-to-end

**Limitações Atuais:**
- ❌ Nem todas as companhias aéreas suportam oficialmente
- ❌ API requer aprovação e parceria comercial
- ❌ Algumas funcionalidades são limitadas a parceiros oficiais

---

## 🔧 Como Funciona o Google Wallet API

### Componentes Principais

```mermaid
graph TD
    A[Passes Class] --> C[JWT Token]
    B[Passes Object] --> C
    C --> D[Google Wallet API]
    D --> E[Cartão Digital no Google Wallet]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style E fill:#bfb,stroke:#333,stroke-width:2px
```

### 1. **Passes Class (Template)**
Define propriedades comuns a todos os cartões do mesmo tipo:
- Nome do programa
- Logo da companhia
- Cores e tema visual
- Campos padrão

### 2. **Passes Object (Instância)**
Define dados únicos de cada cartão:
- Número do membro
- Saldo de milhas
- Status/Nível
- Código de barras/QR Code
- Validade

### 3. **JWT (JSON Web Token)**
Encapsula e assina digitalmente os dados para segurança

---

## 🏗️ Arquitetura da Solução

```mermaid
flowchart TB
    subgraph "LechWorld System"
        A[Frontend React/Next.js]
        B[Backend API]
        C[Database]
    end
    
    subgraph "Google Wallet Integration"
        D[Google Wallet REST API]
        E[Service Account]
        F[JWT Signer]
    end
    
    subgraph "User Device"
        G[Google Wallet App]
        H[Digital Card]
    end
    
    A --> B
    B --> C
    B --> F
    F --> D
    E --> D
    D --> G
    G --> H
    
    style A fill:#61dafb,stroke:#333,stroke-width:2px
    style D fill:#4285f4,stroke:#333,stroke-width:2px
    style H fill:#34a853,stroke:#333,stroke-width:2px
```

---

## ✈️ Status Atual das Companhias Aéreas

### 🟢 Suporte Confirmado

| Companhia | Suporte | Funcionalidades |
|-----------|---------|-----------------|
| **LATAM Pass** | ⚠️ Parcial | - Cartões de embarque via screenshot<br>- Sem integração oficial do programa de fidelidade |
| **TAP Miles&Go** | ❓ Não confirmado | - Possivelmente via pass genérico |
| **United MileagePlus** | ⚠️ Limitado | - Suporte Apple Wallet confirmado<br>- Google Wallet não oficial |
| **American AAdvantage** | ❌ Não suportado | - Explicitamente não integrado<br>- Apenas Apple Wallet |

### 🔴 Limitações Encontradas

1. **American Airlines**: Decidiu explicitamente NÃO integrar com Google Wallet
2. **Delta SkyMiles**: Não permite transferências entre contas, sem API pública
3. **Emirates Skywards**: Sem suporte para Google Wallet confirmado

---

## 💻 Implementação Técnica

### Passo 1: Configuração Inicial

```javascript
// 1. Instalar dependências
npm install googleapis jsonwebtoken uuid

// 2. Configurar credenciais
const serviceAccount = {
  type: "service_account",
  project_id: "lechworld-wallet",
  private_key_id: "xxx",
  private_key: "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  client_email: "wallet-service@lechworld.iam.gserviceaccount.com",
  client_id: "xxx"
};
```

### Passo 2: Criar Classe de Cartão de Fidelidade

```javascript
async function createLoyaltyClass() {
  const classObject = {
    id: `${issuerId}.${classId}`,
    issuerName: 'LechWorld Airlines Manager',
    programName: 'LATAM Pass',
    programLogo: {
      sourceUri: {
        uri: 'https://lechworld.com/logos/latam.png'
      }
    },
    reviewStatus: 'UNDER_REVIEW',
    hexBackgroundColor: '#FF0080',
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [
          {
            twoItems: {
              startItem: {
                firstValue: {
                  fields: [{
                    fieldPath: 'object.textModulesData["points"]'
                  }]
                }
              },
              endItem: {
                firstValue: {
                  fields: [{
                    fieldPath: 'object.textModulesData["status"]'
                  }]
                }
              }
            }
          }
        ]
      }
    }
  };
  
  // Enviar para Google Wallet API
  const response = await walletClient.loyaltyclass.insert({
    requestBody: classObject
  });
  
  return response.data;
}
```

### Passo 3: Criar Objeto do Cartão (Individual)

```javascript
async function createLoyaltyObject(memberData) {
  const objectSuffix = uuid.v4();
  
  const loyaltyObject = {
    id: `${issuerId}.${objectSuffix}`,
    classId: `${issuerId}.${classId}`,
    accountId: memberData.memberNumber,
    accountName: memberData.name,
    state: 'ACTIVE',
    loyaltyPoints: {
      label: 'Milhas',
      balance: {
        int: memberData.miles
      }
    },
    barcode: {
      type: 'QR_CODE',
      value: memberData.memberNumber,
      alternateText: memberData.memberNumber
    },
    textModulesData: [
      {
        id: 'points',
        header: 'Saldo Total',
        body: `${memberData.miles.toLocaleString()} milhas`
      },
      {
        id: 'status',
        header: 'Status',
        body: memberData.status || 'CLASSIC'
      },
      {
        id: 'lastUpdate',
        header: 'Última Atualização',
        body: new Date().toLocaleDateString('pt-BR')
      }
    ],
    linksModuleData: {
      uris: [
        {
          uri: 'https://lechworld.com/dashboard',
          description: 'Ver no LechWorld'
        },
        {
          uri: 'https://latampass.latam.com',
          description: 'Site oficial LATAM Pass'
        }
      ]
    }
  };
  
  return loyaltyObject;
}
```

### Passo 4: Gerar Link "Add to Google Wallet"

```javascript
function generateAddToWalletLink(loyaltyObject) {
  // Criar JWT
  const claims = {
    iss: serviceAccount.client_email,
    aud: 'google',
    origins: ['https://lechworld.com'],
    typ: 'savetowallet',
    payload: {
      loyaltyObjects: [loyaltyObject]
    }
  };
  
  // Assinar JWT
  const token = jwt.sign(claims, serviceAccount.private_key, {
    algorithm: 'RS256'
  });
  
  // Gerar URL
  return `https://pay.google.com/gp/v/save/${token}`;
}
```

### Passo 5: Implementar no Frontend

```tsx
// components/AddToWalletButton.tsx
import { useState } from 'react';
import { Wallet } from 'lucide-react';

export function AddToWalletButton({ member, program, account }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAddToWallet = async () => {
    setIsLoading(true);
    
    try {
      // Chamar API backend para gerar link
      const response = await fetch('/api/wallet/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member,
          program,
          memberNumber: account.memberNumber,
          miles: account.miles,
          status: account.status
        })
      });
      
      const { walletLink } = await response.json();
      
      // Abrir link do Google Wallet
      window.open(walletLink, '_blank');
    } catch (error) {
      console.error('Erro ao adicionar ao Google Wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleAddToWallet}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50"
    >
      <Wallet className="w-5 h-5" />
      <span>Adicionar ao Google Wallet</span>
    </button>
  );
}
```

---

## 🔄 Alternativas e Soluções

### Opção 1: Pass Genérico (Recomendado)
✅ **Vantagens:**
- Funciona para qualquer programa
- Não requer parceria oficial
- Totalmente customizável

❌ **Desvantagens:**
- Menos integração nativa
- Sem atualizações automáticas da companhia

### Opção 2: Screenshot + OCR
✅ **Vantagens:**
- Funciona com qualquer cartão existente
- Simples de implementar

❌ **Desvantagens:**
- Não atualiza automaticamente
- Qualidade visual limitada

### Opção 3: PWA + Web Share API
✅ **Vantagens:**
- Funciona em qualquer dispositivo
- Atualizações em tempo real

❌ **Desvantagens:**
- Não integra nativamente com Google Wallet
- Requer conexão internet

---

## 📅 Roadmap de Implementação

### Fase 1: MVP (2 semanas)
- [ ] Configurar conta Google Cloud
- [ ] Implementar geração de passes genéricos
- [ ] Criar botão "Add to Wallet" básico
- [ ] Testar com LATAM Pass e TAP Miles&Go

### Fase 2: Integração Completa (1 mês)
- [ ] Backend API para gerenciar passes
- [ ] Sistema de atualização de saldos
- [ ] Suporte para múltiplos programas
- [ ] Notificações push

### Fase 3: Recursos Avançados (2 meses)
- [ ] Geolocalização para aeroportos
- [ ] Alertas de expiração de milhas
- [ ] Integração com calendário
- [ ] Analytics e tracking

---

## 🛠️ Recursos e Ferramentas

### Documentação Oficial
- [Google Wallet API Documentation](https://developers.google.com/wallet)
- [Loyalty Cards Guide](https://developers.google.com/wallet/retail/loyalty-cards)
- [REST API Reference](https://developers.google.com/wallet/reference/rest)

### Ferramentas de Desenvolvimento
- [Pass Builder Visual Tool](https://developers.google.com/wallet/tools/pass-builder)
- [Google Wallet Console](https://pay.google.com/business/console/)
- [JWT.io - Debugger de Tokens](https://jwt.io/)

### Bibliotecas Úteis
```json
{
  "dependencies": {
    "googleapis": "^118.0.0",
    "jsonwebtoken": "^9.0.0",
    "uuid": "^9.0.0",
    "qrcode": "^1.5.1"
  }
}
```

---

## ⚠️ Considerações Importantes

### Segurança
- **NUNCA** exponha chaves privadas no frontend
- Use variáveis de ambiente para credenciais
- Implemente rate limiting nas APIs
- Valide todos os dados antes de criar passes

### Compliance
- Respeite os termos de uso de cada companhia aérea
- Não faça scraping sem permissão
- Informe claramente que é um serviço não-oficial
- Implemente LGPD/GDPR compliance

### Performance
- Cache os templates de classes
- Use batch operations quando possível
- Implemente retry logic para falhas
- Monitore uso de cotas da API

---

## 💡 Conclusão

A integração com Google Wallet oferece uma experiência premium para usuários Android gerenciarem seus cartões de fidelidade. Embora nem todas as companhias aéreas suportem oficialmente, é possível criar uma solução robusta usando passes genéricos e a API REST do Google Wallet.

**Próximos Passos:**
1. Avaliar viabilidade técnica para cada companhia
2. Criar protótipo com pass genérico
3. Testar com usuários reais
4. Iterar baseado em feedback

---

*Última atualização: Janeiro 2025*
*Autor: LechWorld Development Team*