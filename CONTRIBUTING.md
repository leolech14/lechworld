# Contributing to MilhasLech

Thank you for your interest in contributing to MilhasLech! This document provides guidelines for contributing to the project.

## Development Setup

1. **Fork and Clone**
```bash
git clone https://github.com/yourusername/milhaslech.git
cd milhaslech
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Configure your DATABASE_URL and SESSION_SECRET
```

3. **Run Development Server**
```bash
npm run dev
```

## Code Style Guidelines

### TypeScript
- Use TypeScript for all new code
- Follow existing type definitions in `shared/schema.ts`
- Use proper interfaces and type annotations

### React Components
- Use functional components with hooks
- Follow the existing component structure
- Use Tailwind CSS for styling
- Implement proper accessibility

### Database
- All database changes must include proper migrations
- Update the storage interface when adding new operations
- Use the existing Drizzle ORM patterns

### API Design
- Follow RESTful conventions
- Include proper error handling
- Validate input using Zod schemas
- Document new endpoints

## Project Structure

```
client/src/
├── components/     # Reusable UI components
├── pages/         # Application pages
├── hooks/         # Custom React hooks
├── store/         # Zustand state management
└── lib/           # Utility functions

server/
├── routes.ts      # API route definitions
├── storage.ts     # Data storage interface
└── index.ts       # Server entry point

shared/
└── schema.ts      # Database schema and types
```

## Adding New Features

1. **Database Changes**
   - Update schema in `shared/schema.ts`
   - Create proper insert/select types
   - Update storage interface in `server/storage.ts`

2. **API Endpoints**
   - Add routes in `server/routes.ts`
   - Include proper validation
   - Handle errors appropriately

3. **Frontend Components**
   - Create reusable components
   - Follow glassmorphism design system
   - Include proper TypeScript types
   - Add responsive design

4. **State Management**
   - Use TanStack Query for server state
   - Use Zustand for client state when needed
   - Implement proper cache invalidation

## Design System

### Colors
- Primary: Blue shades (#1e40af, #3b82f6, #60a5fa)
- Background: Navy tones for glassmorphism
- Accent: Orange (#f97316) for highlights
- Text: White and powder blue

### Components
- Use glassmorphism effects with backdrop blur
- Implement hover animations and transitions
- Follow mobile-first responsive design
- Use proper loading and error states

## Testing

- Test new features thoroughly
- Ensure mobile responsiveness
- Verify accessibility compliance
- Test with different screen sizes

## Pull Request Process

1. **Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**
   - Follow code style guidelines
   - Include proper TypeScript types
   - Add appropriate error handling

3. **Test Changes**
   - Test functionality thoroughly
   - Check mobile responsiveness
   - Verify no console errors

4. **Commit Changes**
```bash
git add .
git commit -m "feat: add your feature description"
```

5. **Push and Create PR**
```bash
git push origin feature/your-feature-name
```

## Commit Message Format

Use conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## Bug Reports

When reporting bugs, please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/device information
- Console error messages (if any)

## Feature Requests

When requesting features:
- Describe the use case
- Explain the expected behavior
- Consider how it fits with existing features
- Provide mockups or examples if helpful

## Questions?

Feel free to open an issue for any questions about contributing to the project.