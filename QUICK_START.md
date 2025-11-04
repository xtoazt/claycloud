# Quick Start Guide 🚀

Get Clay Cloud running in 5 minutes!

## ⚡ Fast Setup (5 Steps)

### 1️⃣ Add GitHub Secret

Go to: **GitHub Repo** → **Settings** → **Secrets and variables** → **Actions**

Add secret named `API_KEY` with value:
```
driveApiKey,driveAnonApiKey,oneplatformApiKey,makersuiteApiKey,githubClientId
```

*(Get these from `backend/src/services/ColabAPIConfig.ts` or use the example values)*

### 2️⃣ Start GitHub Actions

Go to: **GitHub Repo** → **Actions** tab → Click **"Run workflow"**

Wait for it to complete and copy the backend URL (look for `✅ Backend is now accessible at:`)

### 3️⃣ Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. **New Project** → Import your repo
3. Set **Root Directory** to `frontend`
4. Click **Deploy**

### 4️⃣ Add Vercel Environment Variable

In Vercel: **Settings** → **Environment Variables**

Add:
- **Name**: `NEXT_PUBLIC_API_URL`
- **Value**: The backend URL from step 2
- **Environments**: All

### 5️⃣ Redeploy Frontend

In Vercel: Click **Redeploy** (or it auto-deploys after adding env var)

## ✅ Done!

Your app should now be live at: `https://your-project.vercel.app`

---

## 🔍 Quick Troubleshooting

**Backend not working?**
- Check GitHub Actions is running
- Verify `API_KEY` secret is set

**Frontend can't connect?**
- Check `NEXT_PUBLIC_API_URL` in Vercel matches backend URL
- Verify backend `/health` endpoint works

**Need more help?**
- See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions

