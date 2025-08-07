# Basic App Example

This example demonstrates a simple full-stack application using all monorepo packages.

## Structure

```
examples/basic-app/
├── backend/          # Express API server
├── frontend/         # React application
├── shared/           # Shared utilities
└── docker-compose.yml # Local development setup
```

## Features

- User authentication
- Task management
- Real-time updates
- Responsive design
- Database integration
- API client usage

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development environment:
```bash
npm run dev
```

3. Open http://localhost:3000

## Architecture

This example uses:
- `@monorepo/api-client` for API communication
- `@monorepo/ui` for UI components
- `@monorepo/database` for data persistence
- `@monorepo/utils` for common utilities
- `@monorepo/config` for configuration