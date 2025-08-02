# Guia de Programas de Milhagem

> Última Atualização: 2025-01-28
> Versão: 1.0.0
> Propósito: Referência completa para recursos de programas de fidelidade e capacidades de integração

## 📋 Índice

1. [Capacidades de Transferência de Milhas](#capacidades-de-transferência-de-milhas)
2. [Integração com Google Wallet](#integração-com-google-wallet)
3. [Tipos de Credenciais e Identificadores](#tipos-de-credenciais-e-identificadores)
4. [Opções de Integração em Tempo Real](#opções-de-integração-em-tempo-real)
5. [Referências de Documentação de API](#referências-de-documentação-de-api)

---

## 1. Capacidades de Transferência de Milhas

### LATAM Pass

- **Transferência Entre Contas**: ✅ SIM
- **Custo**: Taxa fixa de 1.000 pontos
- **Transferência Mínima**: 1.000 pontos
- **Transferência Máxima**: Sem limite
- **Compartilhamento Familiar**: Disponível para até 7 membros da família
- **Tempo de Transferência**: Imediato
- **Restrições**: 
  - Pode transferir apenas uma vez a cada 30 dias
  - Ambas as contas devem estar ativas há pelo menos 90 dias

### Smiles (GOL)

- **Transferência Entre Contas**: ✅ SIM
- **Custo**: 
  - Membros Diamond/Gold: Grátis
  - Membros Silver: R$ 0,01 por milha
  - Membros Basic: R$ 0,02 por milha
- **Transferência Mínima**: 1.000 milhas
- **Transferência Máxima**: 50.000 milhas por transação
- **Clube Família**: Compartilhe milhas com até 6 membros
- **Tempo de Transferência**: Até 72 horas
- **Limite Anual**: 200.000 milhas por ano

### TudoAzul (Azul)

- **Transferência Entre Contas**: ✅ SIM
- **Custo**: 
  - R$ 10 por 1.000 pontos para os primeiros 10.000 pontos
  - R$ 15 por 1.000 pontos acima de 10.000
- **Transferência Mínima**: 1.000 pontos
- **Transferência Máxima**: 100.000 pontos por ano
- **Conta Família**: Pode criar grupos familiares
- **Tempo de Transferência**: Até 48 horas
- **Requisitos**: Conta deve ter pelo menos 12 meses

### TAP Miles&Go

- **Transferência Entre Contas**: ✅ SIM
- **Custo**: €17 por transação + €2 por 1.000 milhas
- **Transferência Mínima**: 1.000 milhas
- **Transferência Máxima**: 50.000 milhas por transação
- **Compartilhamento Familiar**: Disponível com programa TAP Family
- **Tempo de Transferência**: Imediato

### United MileagePlus

- **Transferência Entre Contas**: ✅ SIM
- **Custo**: US$ 7,50 por 500 milhas + US$ 30 taxa de processamento
- **Transferência Mínima**: 500 milhas
- **Transferência Máxima**: 100.000 milhas por ano
- **Tempo de Transferência**: Imediato
- **Restrições**: Ambas as contas devem estar abertas há mais de 90 dias

### American Airlines AAdvantage

- **Transferência Entre Contas**: ✅ SIM
- **Custo**: US$ 15 por 1.000 milhas
- **Transferência Mínima**: 1.000 milhas
- **Transferência Máxima**: 200.000 milhas por ano
- **Tempo de Transferência**: Imediato
- **Restrições**: Limite de recebimento de 300.000 milhas por ano

---

## 2. Integração com Google Wallet

### LATAM Pass

- **Suporte Google Wallet**: ✅ SIM
- **Informações Necessárias**:
  - **Número de Sócio**: Número de 10 dígitos
  - Nome completo conforme cadastro
  - Endereço de e-mail
- **Recursos no Wallet**:
  - Saldo atual de milhas
  - Exibição do status elite
  - Cartão de membro digital
  - QR code para uso no aeroporto

### Smiles (GOL)

- **Suporte Google Wallet**: ✅ SIM
- **Informações Necessárias**:
  - **Número Smiles**: Número de membro de 10 dígitos
  - CPF (para membros brasileiros)
  - E-mail cadastrado
- **Recursos no Wallet**:
  - Saldo de milhas
  - Status da categoria
  - Cartão digital com código de barras

### TudoAzul (Azul)

- **Suporte Google Wallet**: ✅ SIM
- **Informações Necessárias**:
  - **Número TudoAzul**: ID do membro
  - CPF ou número do passaporte
  - Data de nascimento
- **Recursos no Wallet**:
  - Saldo de pontos
  - Status Safira/Topázio/Diamante
  - Cartão de membro digital

### TAP Miles&Go

- **Suporte Google Wallet**: ✅ SIM
- **Informações Necessárias**:
  - **Número de Membro**: Número TAP de 9 dígitos
  - PIN ou senha
  - Endereço de e-mail
- **Recursos no Wallet**:
  - Saldo de milhas
  - Nível de status
  - Cartão digital

### United MileagePlus

- **Suporte Google Wallet**: ✅ SIM
- **Informações Necessárias**:
  - **Número MileagePlus**: Número da conta
  - Sobrenome
  - Senha ou PIN
- **Recursos no Wallet**:
  - Saldo de milhas
  - Status Premier
  - Cartão digital com QR code

### American Airlines AAdvantage

- **Suporte Google Wallet**: ✅ SIM
- **Informações Necessárias**:
  - **Número AAdvantage**: Número de membro
  - Sobrenome
  - Senha
- **Recursos no Wallet**:
  - Saldo de milhas
  - Status elite
  - Cartão de membro digital

---

## 3. Tipos de Credenciais e Identificadores

### LATAM Pass

1. **Número de Sócio**
   - Formato: 10 dígitos (ex: 1234567890)
   - Localização: Cartão de membro, comunicações por e-mail, perfil do app
   - Propósito: Identificador principal para todas as transações

2. **RUT/CPF/DNI**
   - Formato: Varia por país
   - Propósito: Identificação fiscal, obrigatório para alguns países

3. **Credenciais de Login**
   - Endereço de e-mail
   - Senha (8+ caracteres, deve incluir números e letras)
   - Opcional: 2FA via SMS ou app

4. **PIN**
   - Formato: 4-6 dígitos
   - Propósito: Verificação em call center, alguns resgates

### Smiles (GOL)

1. **Número Smiles**
   - Formato: 10 dígitos
   - Localização: E-mail de boas-vindas, tela inicial do app, cartão físico
   - Gerado automaticamente no cadastro

2. **CPF (Identificação Fiscal Brasileira)**
   - Formato: XXX.XXX.XXX-XX
   - Obrigatório para residentes brasileiros
   - Usado como identificador secundário

3. **Credenciais de Login**
   - CPF ou e-mail
   - Senha
   - Perguntas de segurança para recuperação

4. **Número Cliente GOL**
   - Diferente do número Smiles
   - Usado para reservas de voos

### TudoAzul (Azul)

1. **Número TudoAzul**
   - Formato: Tamanho variável (geralmente 9-10 dígitos)
   - Fornecido no cadastro
   - Obrigatório para todas as transações de pontos

2. **CPF/Passaporte**
   - Documento principal para identificação
   - Deve corresponder aos registros de reserva

3. **Métodos de Login**
   - E-mail + senha
   - CPF + senha
   - Login social (Facebook/Google)

4. **Localizador de Reserva**
   - Formato: 6 caracteres (letras/números)
   - Vincula voos à conta

### Programas Adicionais

**ALL - Accor Live Limitless**
- Número de Membro: 9 dígitos
- PIN: 4 dígitos
- Nível do Cartão: Classic/Silver/Gold/Platinum/Diamond

**Marriott Bonvoy**
- Número de Membro: 9 dígitos
- Senha: Requisitos complexos
- Número de Status Elite: Separado para correspondência de status

**Hilton Honors**
- Número de Membro: 9 dígitos
- Senha + PIN opcional
- Código de acesso para chave digital

---

## 4. Opções de Integração em Tempo Real

### APIs Oficiais

1. **API LATAM Pass**
   - Status: Acesso limitado a parceiros
   - Requisitos: Acordo de parceria comercial
   - Recursos: Verificação de saldo, histórico de transações, verificação de status
   - Limites de taxa: Varia por nível de parceria

2. **API Smiles**
   - Status: Programa de parceiros disponível
   - Documentação: developers.smiles.com.br
   - Autenticação OAuth 2.0
   - Webhooks para mudanças de saldo

3. **United MileagePlus**
   - API empresarial disponível
   - API REST com respostas JSON
   - Atualizações de saldo em tempo real
   - Requer acordo comercial

### Alternativas Open Source

1. **Automação via Browser Headless**
   ```javascript
   // Abordagem Puppeteer/Playwright
   - Prós: Funciona com qualquer programa
   - Contras: Frágil, requer manutenção
   - Exemplo: github.com/loyalty-tracker/scrapers
   ```

2. **Extensões de Navegador**
   - Preenchimento automático de credenciais
   - Captura de atualizações de saldo
   - Exportação para webhook/API
   - Exemplos: 
     - AwardWallet Auto-Import
     - Extensão MileagePlus X

3. **Serviços de Parse de E-mail**
   - Monitorar e-mails de extrato
   - Extrair mudanças de saldo
   - Serviços:
     - Zapier Email Parser
     - Mailgun Routes
     - SendGrid Inbound Parse

4. **Agregadores de Terceiros**
   - **AwardWallet**: API REST para parceiros
   - **TripIt Pro**: Integração por encaminhamento de e-mail
   - **Points.com**: API de troca e rastreamento

### Arquitetura Recomendada

```yaml
Estratégia de Atualizações em Tempo Real:
  
  Primária:
    - APIs oficiais quando disponíveis
    - Tokens OAuth armazenados criptografados
    - Listeners de webhook para atualizações push
    
  Secundária:
    - Parse de e-mail para extratos
    - Padrão: airline@email.com → parser → webhook
    
  Fallback:
    - Automação de browser agendada
    - Executar em horários de baixo tráfego
    - Cache de resultados por 24 horas
    
  Stack Open Source:
    - Node.js + Puppeteer para scraping
    - Bull queue para gerenciamento de jobs  
    - Redis para caching
    - PostgreSQL para armazenamento de estado
```

---

## 5. Referências de Documentação de API

### Documentação Oficial

1. **Portal de Desenvolvedores LATAM**
   - URL: https://developer.latam.com (requer acesso de parceiro)
   - Contato: api-partners@latam.com

2. **Smiles Developers**
   - URL: https://developers.smiles.com.br
   - Documentação pública disponível após registro

3. **United MileagePlus**
   - URL: https://developer.united.com
   - Requer parceria comercial

4. **American Airlines**
   - URL: https://developer.aa.com
   - Aplicação para programa de parceiros necessária

### Melhores Práticas de Integração

1. **Segurança**
   - Nunca armazenar senhas em texto puro
   - Usar OAuth quando disponível
   - Implementar rate limiting
   - Registrar tentativas de acesso

2. **Confiabilidade**
   - Implementar lógica de retry
   - Cache de respostas apropriadamente
   - Lidar com downtime de API graciosamente
   - Monitorar mudanças de HTML (scrapers)

3. **Conformidade**
   - Respeitar robots.txt
   - Seguir termos de serviço de API
   - Implementar fluxos de consentimento do usuário
   - Lidar com solicitações de exclusão de dados

### Recursos da Comunidade

- **FlyerTalk Forums**: Discussões técnicas sobre APIs de companhias aéreas
- **MileagePlus Hacks GitHub**: Coleção de ferramentas open source
- **Reddit r/awardtravel**: Experiências e dicas de integração
- **Stack Overflow**: Perguntas marcadas para APIs de companhias aéreas

---

## 📝 Notas para Implementação

1. **Ordem de Prioridade de Integração**:
   - LATAM Pass (mais usuários, melhor documentação)
   - Smiles (boa disponibilidade de API)
   - TudoAzul (importante para mercado brasileiro)

2. **Abordagem MVP**:
   - Começar com parse de e-mail (mais confiável)
   - Adicionar Google Wallet para atualizações manuais
   - Implementar APIs conforme parcerias se desenvolvem

3. **Experiência do Usuário**:
   - Sempre permitir atualizações manuais de saldo
   - Mostrar timestamp da última sincronização
   - Fornecer mensagens de erro claras
   - Habilitar preferências de notificação

4. **Considerações Futuras**:
   - Programas de fidelidade baseados em blockchain emergindo
   - Regulamentações de open banking podem ajudar
   - Considerar participar de redes de parceiros de companhias aéreas