# DataSuite - Cloud-First Code Execution IDE 🚀

A full-stack, cloud-ready web application for code execution (Python, JavaScript, R, SQL) that works on **desktop, tablet, and Android**.

## ✨ Key Features

### Code Execution
- **Python** - Full Python 3 support
- **JavaScript** - Node.js environment
- **R** - Statistical computing language
- **SQL** - Database queries with cloud support
- **Real-time output** - See results instantly
- **Error handling** - Capture stderr, exit codes

### Cloud-First Architecture
- **Fully cloud-based** - No local installations needed
- **Works on Android** - Open in any browser
- **Zero setup** - Just visit the URL
- **Auto-scaling** - Handles traffic automatically
- **Free tier** - Completely free to deploy

### Dashboard
- **Terminal-style IDE** with code editor
- **File explorer** with default templates
- **Real-time syntax highlighting** (Monaco editor)
- **Language picker** - Switch languages instantly
- **Execute/Save/Download** code files
- **Responsive design** - Mobile-optimized

## 🏗️ Architecture

```
┌─ Android/iOS/Web Browser ─┐
│    React Frontend (SPA)    │
└────────────┬────────────────┘
             │ (HTTPS/tRPC)
┌────────────▼─────────────────┐
│ Node.js Backend (Railway)    │
│  - Auth & API Routes         │
│  - Database Access           │
│  - Code Execution Router     │
└────────────┬─────────────────┘
             │
    ┌────────┴───────┬──────────┐
    │                │          │
┌───▼──┐      ┌─────▼──┐  ┌───▼───┐
│ Replit│      │Planet- │  │ Auth  │
│ API   │      │ Scale  │  │System │
│(Code  │      │(MySQL) │  │       │
│Exec)  │      └────────┘  └───────┘
└───────┘
```

## 🚀 Deployment Options

### Option 1: Cloud (Recommended for Android)
**5-minute setup, completely free**

```bash
# See QUICK_CLOUD_START.md for step-by-step guide
# Requires: PlanetScale account + Replit API key + Railway account
# Result: Works on Android instantly ✅
```

### Option 2: Docker (Local or VPS)
```bash
docker-compose up
# Runs locally at http://localhost:5000
# Database runs in Docker
# Code execution via Replit API
```

### Option 3: Local Development
```bash
npm install
npm run dev
# Runs on http://localhost:5173
# Uses SQLite database
# Code execution on local machine
```

## 📱 Works on Any Device

| Platform | Setup | Works? |
|----------|-------|--------|
| **Android** | Just visit URL | ✅ Yes |
| **iOS** | Just visit URL | ✅ Yes |
| **Desktop** | npm run dev | ✅ Yes |
| **Tablet** | Just visit URL | ✅ Yes |

## 📚 Documentation

1. **[QUICK_CLOUD_START.md](./QUICK_CLOUD_START.md)** - 5-minute cloud deployment
2. **[CLOUD_SETUP.md](./CLOUD_SETUP.md)** - Detailed cloud architecture guide
3. **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Full API documentation

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite 7.3** - Build tool
- **Monaco Editor** - Code editor
- **tRPC 11.8** - Type-safe API
- **Tailwind CSS** - Styling
- **shadcn/ui** - Components

### Backend
- **Hono 4.8** - Lightweight server
- **Node.js 20+** - Runtime
- **Drizzle ORM 0.45** - Database layer
- **tRPC 11.8** - RPC layer

### Database
- **SQLite** - Development (local)
- **MySQL** - Production (PlanetScale)

### Cloud Services
- **Railway** - Backend hosting
- **PlanetScale** - MySQL database
- **Replit API** - Code execution

## 🎯 Quick Start

### Local Development (2 min)
```bash
# Install dependencies
npm install

# Create .env (copy from .env.example)
cp .env.example .env

# Start dev server
npm run dev

# Open http://localhost:5173
```

### Cloud Deployment (5 min)
```bash
# 1. Read deployment guide
open QUICK_CLOUD_START.md

# 2. Get credentials (PlanetScale + Replit)
# Follow 4 simple steps in guide

# 3. Deploy to Railway
# Railway auto-deploys from GitHub

# 4. Done! Share your URL
# Works on Android instantly ✅
```

### Docker (3 min)
```bash
# Build image
npm run docker:build

# Run with database
npm run docker:run

# Open http://localhost:5000
```

## 🌐 Cloud Configuration

### Environment Variables

**Development (.env)**
```env
NODE_ENV=development
DATABASE_URL=sqlite::memory:
REPLIT_API_KEY=your_key  # Optional, uses local execution
```

**Production (.env on Railway)**
```env
NODE_ENV=production
DATABASE_URL=mysql://user:password@host/datasuite
REPLIT_API_KEY=your_replit_key
APP_ID=your_app_id
APP_SECRET=your_app_secret
```

### Services

| Service | Free Tier | Cost | Setup |
|---------|-----------|------|-------|
| **PlanetScale** | 5GB storage | $0 | 1 min |
| **Replit API** | 10 concurrent | $0 | 1 min |
| **Railway** | $5/mo credit | $0 | 2 min |
| **Total** | - | **$0** | **4 min** |

## 📊 Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| **Python** | ✅ Working | Real execution on Replit |
| **JavaScript** | ✅ Working | Real execution on Replit |
| **R** | ✅ Framework Ready | Needs R installed or Replit |
| **SQL** | ✅ Working | Executes on cloud database |
| **Authentication** | ✅ Working | Google, Yandex OAuth |
| **Dashboard** | ✅ Working | Analytics & project mgmt |
| **IDE** | ✅ Working | Full code editor |
| **Mobile** | ✅ Working | Responsive design |
| **Android** | ✅ Ready | Via cloud deployment |

## 🔧 Development

### Project Structure
```
DataSuite-main/
├── api/                 # Backend (Hono + tRPC)
│   ├── code-router.ts   # Code execution API
│   ├── auth-router.ts   # Authentication
│   └── context.ts       # tRPC context
├── src/                 # Frontend (React)
│   ├── pages/           # Page components
│   ├── components/      # Reusable components
│   └── lib/             # Utilities
├── db/                  # Database
│   ├── schema.ts        # Drizzle ORM schema
│   └── migrations/      # DB migrations
└── public/              # Static assets
```

### Available Scripts

```bash
npm run dev           # Start dev server
npm run build         # Build for production
npm run start         # Run production build
npm run lint          # Run ESLint
npm run format        # Format code with Prettier
npm run test          # Run tests (Vitest)
npm run docker:build  # Build Docker image
npm run docker:run    # Run with Docker Compose
npm run cloud:setup   # Show cloud setup guide
```

## 📱 Mobile Optimization

### Android
- Open in Chrome: `https://your-domain.com`
- Responsive design adapts to screen size
- Add to home screen for app-like experience

### iOS
- Same as Android
- Optional PWA installation

## 🐛 Troubleshooting

### "Cannot connect to database"
```bash
# Check CONNECTION_STRING in .env
# Test: npm run db:push
```

### "Code execution failed"
```bash
# Check REPLIT_API_KEY is set
# Verify Replit account has quota
# Check Replit API status
```

### "Port already in use"
```bash
# Change PORT in .env
# Or kill existing process
```

### "CORS errors"
```bash
# Check backend URL in frontend config
# Verify Railway URL is correct
# Clear browser cache
```

## 📈 Performance

| Metric | Value | Notes |
|--------|-------|-------|
| **Frontend Load** | < 2s | Vite optimized |
| **Code Execution** | 1-5s | Replit latency |
| **Database Query** | < 100ms | PlanetScale optimized |
| **Mobile** | Responsive | Optimized for touch |

## 🔐 Security

- **Authentication** - OAuth 2.0 (Google, Yandex)
- **Database** - Encrypted connections (SSL/TLS)
- **Code Execution** - Sandboxed (Replit)
- **API** - Type-safe with tRPC
- **Environment** - Secrets in Railway vault

## 💰 Cost Analysis

### Free Forever
- Up to 100 daily active users
- < 1 GB database storage
- < 1M code executions/month

### Estimated Costs (Scale)
- **1,000 users/month**: $0 (free tier)
- **10,000 users/month**: $5-20
- **100,000 users/month**: $50-200

## 🚀 Next Steps

1. **Deploy to cloud** - Follow [QUICK_CLOUD_START.md](./QUICK_CLOUD_START.md)
2. **Share your URL** - Send to Android users
3. **Add features** - Extend API with more endpoints
4. **Monitor** - Set up Railway alerts
5. **Scale** - Upgrade tiers as needed

## 📝 License

MIT License - Use freely for any project

## 🤝 Contributing

Issues and PRs welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📞 Support

- **Issues**: GitHub Issues
- **Docs**: See [DOCUMENTATION.md](./DOCUMENTATION.md)
- **Cloud Help**: See [CLOUD_SETUP.md](./CLOUD_SETUP.md)

---

**Built for cloud. Optimized for mobile. Free to deploy. 🚀**
