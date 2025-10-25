# Telegram Groups Manager

A full-stack web application for managing Telegram group creation and payments.

## Features

- 🔐 User authentication and admin panel
- 💰 Balance management and crypto payment tracking
- 📱 Telegram integration for group creation
- 📊 Order tracking and history
- 👥 Admin dashboard for user management
- 💳 Multiple cryptocurrency wallet support

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB Atlas account (free tier available)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd <your-repo-name>
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up MongoDB Atlas**
   - Follow the detailed guide in [DEPLOYMENT.md](DEPLOYMENT.md)
   - **IMPORTANT**: Add `0.0.0.0/0` to Network Access in MongoDB Atlas

4. **Configure environment variables**
```bash
# Create .env file (or use Replit Secrets)
MONGODB_URL=your_mongodb_connection_string
```

5. **Run the development server**
```bash
npm run dev
```

Visit `http://localhost:5000` to see the app.

## Default Login

After first run, use these credentials:
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Change this password immediately after first login!**

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for:
- Render.com
- MongoDB Atlas configuration
- Environment variable setup

## Tech Stack

### Frontend
- React 18
- TypeScript
- TailwindCSS
- shadcn/ui components
- TanStack Query (React Query)
- Wouter (routing)

### Backend
- Express.js
- TypeScript
- Mongoose (MongoDB ODM)
- Passport.js (authentication)
- bcrypt (password hashing)

### Database
- MongoDB (via MongoDB Atlas)

## Project Structure

```
.
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utilities and helpers
│   │   └── hooks/       # Custom React hooks
├── server/              # Backend Express application
│   ├── auth.ts          # Authentication logic
│   ├── db.ts            # Database connection
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Data access layer
│   └── telegram.ts      # Telegram integration
├── shared/              # Shared types and schemas
│   └── schema.ts        # MongoDB schemas and Zod validations
└── DEPLOYMENT.md        # Deployment guide
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/auth/user` - Get current user

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create transaction

### Admin (requires admin role)
- `GET /api/admin/users` - List all users
- `GET /api/admin/transactions` - List all transactions
- `POST /api/admin/add-balance` - Add balance to user
- `POST /api/admin/approve-payment` - Approve payment
- `POST /api/admin/payment-settings` - Update payment settings
- `GET /api/admin/wallet-addresses` - Manage wallet addresses

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type check
npm run check
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URL` | MongoDB connection string | Yes |
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment (development/production) | No |

## Security Notes

1. Always use HTTPS in production
2. Change default admin password immediately
3. Keep MongoDB credentials secure
4. MongoDB Atlas Network Access should allow `0.0.0.0/0` for cloud deployments
5. Use strong passwords for database users

## Troubleshooting

### MongoDB Connection Issues
- Ensure `0.0.0.0/0` is in MongoDB Atlas Network Access
- Verify connection string format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
- Check database user has correct permissions

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node -v` (should be 20+)

### Runtime Errors
- Check environment variables are set
- Review application logs
- Verify MongoDB is accessible

## License

MIT

## Support

For deployment help, see [DEPLOYMENT.md](DEPLOYMENT.md)
