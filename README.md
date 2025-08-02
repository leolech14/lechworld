# 🌍 lechworld - Family Loyalty Program Manager

A comprehensive web application for managing airline miles, hotel points, and credit card rewards for the whole family. Track, optimize, and never lose your loyalty points again!

![lechworld Dashboard](https://img.shields.io/badge/Status-Production%20Ready-green)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)

## 🌟 Features

### Core Functionality
- **Family Member Management**: Add, edit, and manage family members with role-based access
- **Loyalty Program Tracking**: Support for airline miles, hotel points, and credit card rewards
- **Secure Credential Storage**: Encrypted storage of login credentials for each program
- **Real-time Analytics**: Dashboard with statistics, point balances, and estimated values
- **Activity Logging**: Comprehensive audit trail of all user actions

### User Experience
- **Glassmorphism UI**: Beautiful liquid glass effects with blue color scheme
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Auto-save Functionality**: Automatic saving with 1-second debouncing
- **WhatsApp Integration**: Share family reports via WhatsApp
- **Custom Fields**: Add and manage custom fields for each loyalty program

### Technical Features
- **Type-safe Architecture**: Full TypeScript implementation from database to frontend
- **Real-time Updates**: Automatic data refresh and cache invalidation
- **Session Management**: PostgreSQL-backed secure sessions
- **Form Validation**: Comprehensive validation with error handling
- **Toast Notifications**: Styled notifications with glassmorphism effects

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Environment variables configured

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/leolech14/lechworld.git
cd lechworld
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Copy and configure your environment variables
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session management

4. **Run database migrations**
```bash
npm run db:migrate
```

5. **Start the development server**
```bash
npm run dev
```

6. **Access the application**
- Frontend: [http://localhost:4445](http://localhost:4445)
- Backend API: [http://localhost:4444](http://localhost:4444)

### Default Login
- **Username**: lech
- **Password**: lechworld

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: Zustand + TanStack Query
- **Build Tool**: Vite
- **Routing**: Wouter
- **Forms**: React Hook Form + Zod validation

### Project Structure
```
milhaslech/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # Zustand state management
│   │   └── lib/           # Utility functions
├── server/                # Backend Express application
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data storage interface
│   └── index.ts           # Server entry point
├── shared/                # Shared TypeScript schemas
│   └── schema.ts          # Database schema and types
└── package.json           # Dependencies and scripts
```

### Database Schema
- **Users**: Core user accounts with authentication
- **Family Members**: Extended family members linked to primary users
- **Loyalty Programs**: Different loyalty programs (airlines, hotels, etc.)
- **Member Programs**: Junction table linking members to programs
- **Activity Log**: Audit trail of user actions

## 🎨 Design System

### Color Palette
- **Primary**: Various shades of blue (#1e40af, #3b82f6, #60a5fa)
- **Background**: Navy and dark tones for glassmorphism
- **Accent**: Orange (#f97316) for highlights
- **Text**: White and powder blue for contrast

### UI Components
- Glassmorphism cards with backdrop blur
- Animated buttons with hover effects
- Responsive form components
- Toast notifications with custom styling
- Mobile-optimized modals and dialogs

## 📱 Mobile Features

- Pull-up gesture for WhatsApp sharing
- Floating action buttons
- Touch-optimized form inputs
- Native blue animations with spring effects
- Responsive table layouts

## 🔐 Security

- Session-based authentication with PostgreSQL storage
- Encrypted credential storage
- Role-based access control
- Input validation and sanitization
- CSRF protection via secure sessions

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

### Adding New Features
1. Define database schema in `shared/schema.ts`
2. Update storage interface in `server/storage.ts`
3. Add API routes in `server/routes.ts`
4. Create frontend components in `client/src/components/`
5. Add pages to `client/src/pages/`

### Environment Setup
The project uses in-memory storage by default for development. For production, configure a PostgreSQL database using the `DATABASE_URL` environment variable.

## 📊 Family Data

The application includes realistic family data:
- **Osvandré**: Primary account holder with LATAM Pass Gold status
- **Marilise**: Secondary member with hotel program focus
- **Graciela**: Extended family member with balanced portfolios
- **Leonardo**: Young adult member with basic tier status

Each member has accounts across multiple loyalty programs:
- LATAM Pass (Airlines)
- Smiles (Gol Airlines)
- TudoAzul (Azul Airlines)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Future Roadmap

- [ ] Mobile app with React Native
- [ ] Real-time notifications
- [ ] Advanced analytics and reporting
- [ ] Integration with airline APIs
- [ ] Multi-language support
- [ ] Dark/light theme toggle
- [ ] Export functionality (PDF, Excel)
- [ ] Family sharing permissions

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact: support@lech.world

---

**Built with ❤️ for families who love to travel**

**Live Demo**: [https://lech.world](https://lech.world)