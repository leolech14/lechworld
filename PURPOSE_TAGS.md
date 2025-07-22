# Purpose Tags System - LechWorld

Este documento define o sistema de tags obrigatório para todos os componentes do projeto LechWorld. Cada arquivo deve conter uma tag que identifica seu propósito e sua conexão com outros componentes.

## Formato das Tags

```typescript
/**
 * @purpose: [CATEGORIA]/[FUNCIONALIDADE]
 * @connects-to: [ARQUIVO_RELACIONADO]
 * @api-endpoints: [ENDPOINTS] (apenas para componentes frontend)
 * @handles-routes: [ROTAS] (apenas para arquivos backend)
 */
```

## Categorias de Tags

### Frontend (Client)
- `UI/COMPONENT` - Componente visual reutilizável
- `UI/PAGE` - Página completa da aplicação
- `UI/LAYOUT` - Componente de layout
- `STATE/STORE` - Gerenciamento de estado (Zustand)
- `STATE/HOOK` - Custom React Hook
- `API/CLIENT` - Cliente de API/fetch calls
- `UTIL/HELPER` - Funções utilitárias
- `THEME/STYLE` - Temas e estilos

### Backend (Server)
- `API/ROUTE` - Definição de rotas Express
- `API/MIDDLEWARE` - Middleware Express
- `DB/STORAGE` - Camada de acesso a dados
- `DB/SCHEMA` - Definições de schema
- `AUTH/HANDLER` - Autenticação e autorização
- `UTIL/HELPER` - Funções utilitárias
- `CONFIG/SETUP` - Configuração do servidor

### Shared
- `TYPE/DEFINITION` - Definições de tipos TypeScript
- `VALIDATION/SCHEMA` - Schemas de validação Zod

## Exemplos de Tags

### Componente Frontend
```typescript
/**
 * @purpose: UI/COMPONENT/members-table
 * @connects-to: server/routes.ts
 * @api-endpoints: GET /api/members/:userId, DELETE /api/members/:memberId
 */
```

### Rota Backend
```typescript
/**
 * @purpose: API/ROUTE/members
 * @connects-to: client/src/components/members-table.tsx
 * @handles-routes: GET /api/members/:userId, POST /api/members, DELETE /api/members/:memberId
 */
```

### Storage Layer
```typescript
/**
 * @purpose: DB/STORAGE/members
 * @connects-to: server/routes.ts
 * @handles-routes: members CRUD operations
 */
```

## Regras Obrigatórias

1. **Todo arquivo novo** deve ter tags antes de ser commitado
2. **Componentes frontend** devem listar todos os endpoints que consomem
3. **Arquivos backend** devem listar todas as rotas que manipulam
4. **Conexões bidirecionais** - se A conecta com B, B deve conectar com A
5. **Atualizações em cascata** - ao modificar um arquivo, verificar e atualizar tags relacionadas

## Validação

Use o seguinte comando para verificar tags ausentes:
```bash
# Encontrar arquivos sem tags
grep -L "@purpose:" $(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules)
```

## Benefícios

1. **Rastreabilidade** - Fácil identificar dependências
2. **Manutenção** - Evita arquivos órfãos
3. **Documentação** - Auto-documentação do código
4. **Refatoração** - Identifica impactos de mudanças
5. **Onboarding** - Novos desenvolvedores entendem a arquitetura rapidamente