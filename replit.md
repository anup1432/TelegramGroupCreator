# TeleGroup - Telegram Group Automation Platform

## Overview

TeleGroup is a SaaS platform that automates the creation and management of Telegram groups at scale. The application enables users to create hundreds of Telegram groups instantly through a professional dashboard interface. The platform includes user authentication, payment processing via cryptocurrency, Telegram API integration, and administrative controls for managing users and system settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**UI Component System**: Built on shadcn/ui (Radix UI primitives) with Tailwind CSS for styling. The design follows a modern SaaS dashboard aesthetic inspired by Linear, Vercel, and Stripe dashboards, emphasizing clarity, professionalism, and operational efficiency.

**Routing**: Client-side routing implemented with Wouter, a lightweight alternative to React Router. Routes are protected based on authentication state, redirecting unauthenticated users to landing/login pages.

**State Management**: 
- TanStack Query (React Query) for server state management, data fetching, and caching
- React hooks for local component state
- Session-based authentication state managed through API queries

**Design System**:
- Typography: Inter font for UI, JetBrains Mono for technical data
- Color scheme: CSS custom properties for theme consistency with light/dark mode support
- Layout: Sidebar navigation with responsive collapsible behavior on mobile
- Component library: Comprehensive set of pre-built components (buttons, cards, forms, dialogs, tables)

### Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript.

**API Design**: RESTful API endpoints organized by resource:
- `/api/auth/*` - Authentication (login, register, logout, user session)
- `/api/telegram-connections/*` - Telegram account management
- `/api/orders/*` - Group creation orders
- `/api/payment-settings/*` - Cryptocurrency payment configuration
- `/api/transactions/*` - User balance and transaction history
- `/api/stats` - Dashboard statistics
- `/api/admin/*` - Administrative functions

**Session Management**: Express-session with MongoDB session store (connect-mongo) for persistent, secure session handling. Sessions expire after 7 days and use secure, HTTP-only cookies.

**Authentication Strategy**: Username/password authentication with bcrypt for password hashing. Role-based access control differentiates regular users from administrators. Middleware functions (`isAuthenticated`, `isAdmin`) protect routes requiring authentication or admin privileges.

**Database Layer**: 
- Mongoose ODM for type-safe MongoDB operations
- Schema-first approach with TypeScript types and interfaces
- Centralized storage layer (`storage.ts`) providing abstraction over direct database calls
- Type conversion between MongoDB's `_id` and application's `id` field for consistency

### Data Storage

**Database**: MongoDB (via Mongoose ODM for schema modeling and data validation).

**Schema Design**:
- `users` - User accounts with balance tracking, admin flags, profile information
- `sessions` - Express session storage (managed by connect-mongo)
- `telegramconnections` - User's connected Telegram accounts with API credentials
- `orders` - Group creation orders with status tracking and metadata
- `groups` - Individual groups created from orders, with Telegram group IDs and invite links
- `transactions` - Financial transactions for balance credits/debits
- `walletaddresses` - Cryptocurrency wallet addresses for payments
- `paymentsettings` - System-wide payment configuration (pricing, limits)
- `automessages` - Auto-sent messages to groups

**Data Relationships**:
- Users have many Telegram connections, orders, and transactions (referenced via userId)
- Orders have many groups (referenced via orderId)
- One-to-many relationships enforced through ObjectId references

### External Dependencies

**Telegram Integration**: 
- Users connect their Telegram accounts by providing API ID, API hash, phone number, and optional 2FA password
- The platform uses these credentials to automate group creation through the Telegram API
- Connections are stored securely in the database

**Cryptocurrency Payment Processing**:
- Platform supports cryptocurrency payments (specifically USDT mentioned in design)
- Admin configures wallet addresses and pricing through payment settings
- Manual verification workflow (users submit payment proof, admins credit balances)
- No automated payment gateway integration - relies on blockchain transaction verification

**Third-Party UI Libraries**:
- Radix UI primitives for accessible, unstyled components
- Lucide React for icon system
- date-fns for date formatting
- react-day-picker for calendar/date selection
- cmdk for command palette functionality

**Development Tools**:
- Replit-specific plugins for development (runtime error modal, cartographer, dev banner)
- ESBuild for production server bundling
- Drizzle Kit for database migrations

**Design Assets**: 
- Google Fonts (Inter, DM Sans, Geist Mono, Fira Code, Architects Daughter)
- Custom favicon expected at `/favicon.png`

### Key Architectural Decisions

**Monorepo Structure**: Single repository with client, server, and shared code organized in separate directories. Shared schema and types ensure consistency between frontend and backend.

**Type Safety**: End-to-end TypeScript with Zod for runtime validation. Database schema generates TypeScript types, and Zod schemas validate API requests/responses.

**Development vs Production**: Vite middleware mode in development for HMR; static file serving in production with separate server build.

**Error Handling**: Centralized error handling with user-friendly toast notifications on the frontend. Backend returns structured error messages with appropriate HTTP status codes.

**Security Considerations**:
- Password hashing with bcrypt
- Secure session cookies (httpOnly, secure, sameSite)
- CSRF protection through session configuration
- Environment variable protection for secrets (SESSION_SECRET, MONGODB_URL)
- Proxy trust configuration for deployment behind reverse proxies

**Scalability Approach**: MongoDB with connection pooling, stateless session storage, and potential for horizontal scaling of the Express application.