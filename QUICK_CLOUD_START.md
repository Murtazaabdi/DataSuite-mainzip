# 🚀 5-Minute Cloud Deployment Guide

Get DataSuite running in cloud with Android support in 5 minutes.

## What You'll Get

✅ **Backend runs on Railway** (your code)  
✅ **Database on PlanetScale** (MySQL cloud)  
✅ **Code execution on Replit** (Python, R, JavaScript, SQL)  
✅ **Works on Android, iOS, desktop**  
✅ **Completely free**  

## Timeline

| Step | Service | Time | Cost |
|------|---------|------|------|
| 1 | PlanetScale | 1 min | Free |
| 2 | Replit | 1 min | Free |
| 3 | Railway | 2 min | Free |
| 4 | Test | 1 min | Free |
| **Total** | - | **5 min** | **$0** |

---

## Step 1️⃣: PlanetScale Database (1 min)

**Go to:** https://planetscale.com

1. Sign up (click "GitHub")
2. Create database called "datasuite"
3. Click "Connect"
4. Select "Node.js"
5. **Copy** the connection string
6. Save it - you'll need it in 2 minutes

✅ **Database ready!**

---

## Step 2️⃣: Replit API Key (1 min)

**Go to:** https://replit.com/account

1. Sign up (click "GitHub")  
2. Find "API Keys" section
3. Click "Create API key"
4. **Copy** the key
5. Save it - you'll need it in 1 minute

✅ **Code execution ready!**

---

## Step 3️⃣: Deploy to Railway (2 min)

**Go to:** https://railway.app

1. Sign up (click "GitHub")
2. Click "New Project"
3. Click "Deploy from GitHub"
4. Select your DataSuite repository
5. Railway auto-deploys! ✨
6. Wait for green checkmark...
7. Once deployed, go to "Settings"
8. Click "Variables"
9. **Add these variables** (copy-paste from your notes):

```
APP_ID=test_app_id
APP_SECRET=test_app_secret
DATABASE_URL=[PASTE PLANETSCALE CONNECTION STRING]
REPLIT_API_KEY=[PASTE YOUR REPLIT API KEY]
KIMI_AUTH_URL=https://kimi.moonshot.cn/auth
KIMI_OPEN_URL=https://kimi.moonshot.cn
OWNER_UNION_ID=email:test@example.com
NODE_ENV=production
```

10. Railway auto-redeploys
11. Get your URL from "Domains"
12. **Copy** this URL (looks like: `https://datasuite-prod.railway.app`)

✅ **Backend live!**

---

## Step 4️⃣: Test It (1 min)

1. **On Desktop:**
   - Open: `https://your-railway-url/dashboard/ide`
   - Write: `print("hello")`
   - Click Run
   - See: `hello` ✅

2. **On Android:**
   - Open Chrome on Android
   - Visit: `https://your-railway-url`
   - Same thing works ✅

✅ **Done!** 🎉

---

## What's Now Cloud-Powered

### Code Execution (Python, R, JavaScript, SQL)
```python
# Android users → Railway → Replit → Output
a = 2
b = 3
print(a + b)  # Output: 5
```

### Database Queries
```sql
-- Android users → Railway → PlanetScale → Results
SELECT * FROM users;
```

### Your Data
- Stored in PlanetScale (AWS servers globally)
- Accessible from anywhere
- Backed up automatically

---

## Free Tier Limits (Plenty for most cases)

| Service | Free Limit | Notes |
|---------|-----------|-------|
| **PlanetScale** | 5GB storage | Plus 10M query/month |
| **Replit** | 10 concurrent | Plus rate limits |
| **Railway** | $5 credit/month | Generous for 1-2 apps |

---

## Next: Share Your App

Once deployed, you can:

1. **Share URL** with anyone
   - `https://your-railway-url` works on any device

2. **Android Home Screen**
   - Visit URL
   - Menu → "Add to Home Screen"
   - Launches like native app

3. **Custom Domain**
   - In Railway: Add custom domain
   - `https://datasuite.com` (if you own it)

---

## Troubleshooting

### "Database connection failed"
1. Railway → Variables
2. Check `DATABASE_URL` is pasted correctly
3. No spaces before/after

### "Code execution failed"
1. Check `REPLIT_API_KEY` is set
2. Try: `print("test")` (simple code)
3. Check Replit quota at: replit.com/account

### "Page not loading"
1. Wait 2 minutes (Railway deploys)
2. Check deployment status: Railway → Deployments
3. Should show green checkmark

### "Slow on Android"
- Normal (network latency)
- Add images/static assets to Railway CDN
- Or use Cloudflare (free tier)

---

## You're All Set! 🚀

Your app is now:
- ✅ Running in cloud
- ✅ Accessible globally
- ✅ Works on Android
- ✅ No local setup needed
- ✅ Completely free

**Share your URL and let people use it!**

---

## Optional: Custom Domain

**Make it yours:**

1. Buy domain: `namecheap.com` ($1-2/year)
2. In Railway: Settings → Domains → Add Custom Domain
3. Follow Railway's DNS setup
4. Now: `https://yourdomain.com` ✨

---

## Extra: GitHub Pages for Frontend

Want super-fast frontend on CDN?

1. Create separate repo for frontend
2. Build: `npm run build`
3. Push to GitHub
4. Enable GitHub Pages
5. Point to your Railway backend
6. Now frontend = lightning fast ⚡

---

## Cost

| Month 1-6 | After 6 months | Notes |
|-----------|---|---|
| **$0** | $0-10 | Completely free tier |
| - | $0 | If under free tier limits |
| - | $10-50 | If you have thousands of users |

Most startups stay on free tier for years. 🎉

---

## Questions?

See full guide: [CLOUD_SETUP.md](./CLOUD_SETUP.md)

Enjoy! 🚀📱
