# 🚀 Cloud Deployment Guide for DataSuite

This guide enables **fully cloud-based execution** so Android users and everyone can use your app without local installations.

## Architecture Overview

```
┌─────────────────────┐
│  Frontend (React)   │  ← Works on Android/iOS/Web
│  (Browser-based)    │
└──────────┬──────────┘
           │ (HTTP/tRPC)
┌──────────▼──────────┐
│ Backend (Hono/Node) │  ← Deployed on Railway
└──────────┬──────────┘
           │
    ┌──────┴──────┬────────────┐
    │             │            │
┌───▼──┐  ┌──────▼─┐  ┌──────▼──┐
│Cloud │  │ Replit │  │ Planet- │
│ SQL  │  │  API   │  │ Scale   │
│      │  │(Code   │  │(MySQL)  │
└──────┘  │Exec)   │  └─────────┘
          └────────┘
```

## Step 1: Cloud Database (PlanetScale)

**PlanetScale** provides free MySQL hosting with no credit card required.

### Setup:

1. **Create Account**
   - Go to https://planetscale.com
   - Sign up (GitHub recommended)

2. **Create Database**
   - Click "Create a database"
   - Name: `datasuite`
   - Region: Closest to you
   - Click "Create database"

3. **Get Connection String**
   - Go to "Connect" button
   - Select "Node.js"
   - Copy the connection string (looks like):
     ```
     mysql://[user]:[password]@[host]/datasuite?sslaccept=skip
     ```

4. **Update .env**
   ```env
   DATABASE_URL=mysql://[your-planetscale-connection-string]
   NODE_ENV=production
   ```

✅ **Your database is now cloud-hosted and accessible from anywhere!**

---

## Step 2: Code Execution (Replit API)

**Replit** provides cloud code execution for Python, JavaScript, R, and SQL - no local installation needed.

### Setup:

1. **Create Replit Account**
   - Go to https://replit.com
   - Sign up (GitHub recommended)

2. **Get API Key**
   - Go to account settings: https://replit.com/account
   - Scroll to "API keys"
   - Click "Create API key"
   - Copy the key

3. **Add to .env**
   ```env
   REPLIT_API_KEY=your_replit_api_key_here
   ```

✅ **Code execution now works in cloud!**

### How it works:
- Python code → executes on Replit servers
- JavaScript code → executes on Replit servers  
- R code → executes on Replit servers
- SQL code → executes on Replit servers
- Android users get instant code execution anywhere

---

## Step 3: Deploy Backend (Railway)

**Railway** makes deploying Node.js apps trivial - it auto-deploys on git push.

### Setup:

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Connect Repository**
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Select your DataSuite repository
   - Click "Deploy"

3. **Add Environment Variables**
   - Go to Project Settings
   - Click "Variables"
   - Add each variable:
     ```
     APP_ID=your_app_id
     APP_SECRET=your_app_secret
     DATABASE_URL=mysql://[planetscale-connection]
     REPLIT_API_KEY=your_replit_api_key
     KIMI_AUTH_URL=your_kimi_auth_url
     KIMI_OPEN_URL=your_kimi_open_url
     OWNER_UNION_ID=your_owner_union_id
     NODE_ENV=production
     ```

4. **Get Public URL**
   - Railway auto-generates a URL like: `https://datasuite-prod.railway.app`
   - This is your backend URL

5. **Update Frontend Config**
   - Update `src/config.ts` or environment variable with backend URL
   - Frontend now connects to cloud backend

✅ **Your backend is live and accessible globally!**

---

## Step 4: Frontend (Already Cloud-Ready)

Your React frontend is **already optimized for mobile**:

1. **No Local Installation Needed**
   - Users just visit: `https://your-railway-url` in any browser
   - Works on Android, iOS, desktop, tablet

2. **PWA Features** (Optional enhancement)
   - Add to home screen on Android
   - Works offline with service workers

---

## Complete .env Configuration

```env
# Required
APP_ID=your_app_id
APP_SECRET=your_app_secret
DATABASE_URL=mysql://user:password@region.psdb.cloud/datasuite?sslaccept=skip
NODE_ENV=production

# Cloud Code Execution
REPLIT_API_KEY=your_replit_api_key

# Auth URLs
KIMI_AUTH_URL=https://kimi.moonshot.cn/auth
KIMI_OPEN_URL=https://kimi.moonshot.cn
OWNER_UNION_ID=email:owner@example.com

# Optional: OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
YANDEX_CLIENT_ID=your_yandex_client_id
YANDEX_CLIENT_SECRET=your_yandex_client_secret
```

---

## Testing Cloud Setup

### From Browser:
1. Open `https://your-railway-url/dashboard/ide`
2. Write Python code: `print("Hello Cloud!")`
3. Click Run
4. See output from Replit servers ✅

### From Android:
1. Open Chrome on Android
2. Visit `https://your-railway-url`
3. Code executes on Replit (no local tools needed) ✅

### SQL Query:
```sql
SELECT COUNT(*) FROM users;
```
Runs against cloud PlanetScale database ✅

---

## Cost Breakdown

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| **PlanetScale** | Free | $0/mo | 5GB storage, 10M requests/mo |
| **Replit** | Free | $0/mo | 10 concurrent executions, rate-limited |
| **Railway** | Free | $0/mo | Generous free tier ($5 credit/mo) |
| **Frontend** | Various | $0-10 | GitHub Pages, Vercel, Netlify |
| **Total** | - | **$0-10/mo** | Fully functional for startups |

---

## Upgrading Later

When you have paying users:

| Service | Pro Tier | Cost | Benefits |
|---------|----------|------|----------|
| **PlanetScale** | Pro | $42/mo | Unlimited storage, better performance |
| **Replit** | Pro | $7/mo | More concurrent executions, priority |
| **Railway** | Pay-as-you-go | $5-100/mo | More resources, custom domains |

---

## Deployment Checklist

- [ ] PlanetScale account created
- [ ] PlanetScale database created
- [ ] MySQL connection string copied to .env
- [ ] Replit API key generated
- [ ] Replit API key added to .env
- [ ] Railway account created
- [ ] GitHub repo connected to Railway
- [ ] Environment variables added to Railway
- [ ] Railway deployment successful
- [ ] Backend URL noted
- [ ] Frontend config updated with backend URL
- [ ] Test from Android device
- [ ] ✅ Cloud-first deployment complete!

---

## Troubleshooting

### "REPLIT_API_KEY not configured"
→ Add `REPLIT_API_KEY` to Railway environment variables

### "Cannot connect to database"
→ Check PlanetScale connection string in Railway
→ Verify MySQL credentials are URL-encoded

### "Code execution timeout"
→ Replit free tier has rate limits
→ Upgrade to Replit Pro or use different service

### Android app slow
→ Check network speed
→ Consider CDN for static assets (Cloudflare free tier)

---

## Next Steps

1. **Email Verification** - Add email notifications when running code
2. **Code History** - Save executed code to database
3. **Sharing** - Let users share code snippets
4. **Monitoring** - Track code execution metrics
5. **Analytics** - See which languages users prefer

All these are easy additions now that infrastructure is cloud-based! 🚀
