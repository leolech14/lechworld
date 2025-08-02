# Mapa de Arquitetura - LechWorld

## Visão Geral

LechWorld é uma aplicação web full-stack para gerenciamento de programas de fidelidade familiar, construída com React, TypeScript, Express e PostgreSQL.

## Estrutura de Diretórios

```
lechworld/
├── client/                      # Frontend React
│   ├── public/                  # Assets estáticos
│   │   └── logo.svg
│   └── src/
│       ├── components/          # Componentes React
│       │   ├── ui/             # Componentes UI base (Radix UI)
│       │   ├── dashboard.tsx    # @purpose: UI/COMPONENT/dashboard
│       │   ├── members-table.tsx # @purpose: UI/COMPONENT/members-table
│       │   ├── add-member-dialog.tsx
│       │   ├── add-program-dialog.tsx
│       │   ├── edit-member-dialog.tsx
│       │   ├── member-frame.tsx
│       │   ├── mobile-dashboard.tsx
│       │   ├── mobile-whatsapp-button.tsx
│       │   ├── points-display.tsx
│       │   ├── settings-modal.tsx
│       │   ├── theme-toggle.tsx
│       │   └── whatsapp-share.tsx
│       ├── lib/                 # Utilitários
│       │   ├── cn.ts           # Utility para classes
│       │   ├── miles-values.ts  # Valores de milhas
│       │   ├── program-icons.tsx # Ícones dos programas
│       │   └── queryClient.ts   # @purpose: API/CLIENT
│       ├── pages/              # Páginas da aplicação
│       │   ├── Dashboard.tsx    # @purpose: UI/PAGE/dashboard
│       │   ├── Login.tsx       # @purpose: UI/PAGE/login
│       │   └── NotFound.tsx    # @purpose: UI/PAGE/404
│       ├── store/              # Estado global (Zustand)
│       │   └── auth-store.ts   # @purpose: STATE/STORE/auth
│       ├── App.tsx             # Componente raiz
│       ├── index.css           # Estilos globais
│       └── main.tsx            # Entry point
│
├── server/                      # Backend Express
│   ├── index.ts                # Entry point do servidor
│   ├── routes.ts               # @purpose: API/ROUTE
│   ├── storage.ts              # @purpose: DB/STORAGE
│   ├── storage-supabase.ts     # Implementação Supabase
│   ├── vite.ts                 # Dev server integration
│   └── miles-values.ts         # Valores de milhas (backend)
│
├── shared/                      # Código compartilhado
│   └── schema.ts               # @purpose: TYPE/DEFINITION
│
├── dist/                        # Build de produção
├── node_modules/               # Dependências
│
├── package.json                # Dependências e scripts
├── tsconfig.json              # Configuração TypeScript
├── vite.config.ts             # Configuração Vite
├── tailwind.config.js         # Configuração Tailwind
├── drizzle.config.ts          # Configuração Drizzle ORM
├── fly.toml                   # Deploy Fly.io
├── Dockerfile                 # Container config
├── PURPOSE_TAGS.md            # Documentação do sistema de tags
└── ARCHITECTURE_MAP.md        # Este arquivo
```

## Fluxo de Dados

### 1. Autenticação
```
Login.tsx → POST /api/auth/login → routes.ts → storage.ts → PostgreSQL
         ← JWT/Session ← auth-store.ts ← Response
```

### 2. Dashboard
```
Dashboard.tsx → GET /api/dashboard/stats/:userId → routes.ts → storage.ts
              → GET /api/members-with-programs/:userId → members data
              → GET /api/activity/:userId → activity log
```

### 3. Gerenciamento de Membros
```
members-table.tsx → DELETE /api/members/:id → routes.ts → storage.ts
add-member-dialog.tsx → POST /api/members → create member
edit-member-dialog.tsx → PUT /api/members/:id → update member
```

### 4. Programas de Fidelidade
```
add-program-dialog.tsx → POST /api/member-programs → routes.ts → storage.ts
                      → GET /api/programs/:userId → list programs
```

## Componentes Principais

### Frontend

#### Páginas
- **Dashboard.tsx** - Página principal com visão geral
- **Login.tsx** - Autenticação de usuários
- **NotFound.tsx** - Página 404

#### Componentes de Negócio
- **dashboard.tsx** - Container principal do dashboard
- **members-table.tsx** - Tabela de membros familiares
- **member-frame.tsx** - Card de exibição de membro
- **points-display.tsx** - Exibição de pontos/milhas

#### Modais/Diálogos
- **add-member-dialog.tsx** - Adicionar membro
- **edit-member-dialog.tsx** - Editar membro
- **add-program-dialog.tsx** - Adicionar programa
- **settings-modal.tsx** - Configurações do app

#### Mobile
- **mobile-dashboard.tsx** - Dashboard otimizado para mobile
- **mobile-whatsapp-button.tsx** - Botão WhatsApp mobile

#### Utilitários
- **theme-toggle.tsx** - Alternar tema claro/escuro
- **whatsapp-share.tsx** - Compartilhar via WhatsApp

### Backend

#### API Routes
- **routes.ts** - Todas as rotas da API
  - `/api/auth/*` - Autenticação
  - `/api/dashboard/*` - Estatísticas
  - `/api/members/*` - CRUD de membros
  - `/api/programs/*` - Programas disponíveis
  - `/api/member-programs/*` - Associação membro-programa
  - `/api/activity/*` - Log de atividades

#### Storage
- **storage.ts** - Camada de acesso a dados PostgreSQL
- **storage-supabase.ts** - Implementação alternativa Supabase

#### Configuração
- **index.ts** - Servidor Express
- **vite.ts** - Integração com Vite dev server

### Shared
- **schema.ts** - Definições de tipos e schemas Zod

## Tecnologias Utilizadas

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (estilos)
- Radix UI (componentes base)
- Zustand (estado global)
- React Query (cache e fetch)
- React Hook Form (formulários)
- Wouter (roteamento)
- Lucide React (ícones)

### Backend
- Express.js + TypeScript
- PostgreSQL (banco de dados)
- Drizzle ORM (queries)
- Supabase (opcional)
- JWT (autenticação)
- bcryptjs (hash de senhas)

### Ferramentas
- TypeScript
- ESBuild (build backend)
- Docker (containerização)
- Fly.io (deploy)

## Padrões de Desenvolvimento

### 1. Purpose Tags
Todos os arquivos devem conter tags indicando:
- `@purpose`: Categoria e função
- `@connects-to`: Arquivos relacionados
- `@api-endpoints`: Endpoints consumidos (frontend)
- `@handles-routes`: Rotas manipuladas (backend)

### 2. Estrutura de Componentes
- Componentes UI em `components/ui/`
- Componentes de negócio em `components/`
- Páginas em `pages/`
- Hooks personalizados em `lib/`

### 3. API Design
- RESTful endpoints
- Autenticação via JWT/Session
- Validação com Zod schemas
- Respostas padronizadas

### 4. Estado
- Estado global com Zustand (auth)
- Cache de API com React Query
- Estado local com React hooks

## Próximos Passos

1. Implementar funcionalidades pendentes:
   - Export/Import de dados
   - Sistema de busca/filtros
   - Gestão de perfil de usuário
   - Sistema de notificações

2. Melhorias técnicas:
   - Testes unitários e E2E
   - CI/CD pipeline
   - Monitoramento e logs
   - Rate limiting

3. Documentação:
   - API documentation (Swagger)
   - Guia de contribuição
   - Manual do usuário