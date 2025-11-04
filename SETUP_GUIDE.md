# Clay Cloud - Complete Setup Guide 🚀

This guide will walk you through setting up Clay Cloud from scratch. Follow these steps in order.

## 📋 Prerequisites

- A GitHub account
- A Vercel account (free tier works)
- Google API keys (see below for how to get them)

## 🎯 Quick Start Checklist

- [ ] Step 1: Clone and prepare repository
- [ ] Step 2: Set up GitHub Secrets
- [ ] Step 3: Configure GitHub Actions
- [ ] Step 4: Get backend URL from GitHub Actions
- [ ] Step 5: Configure Vercel
- [ ] Step 6: Test the deployment

---

## Step 1: Clone and Prepare Repository

1. **Clone your repository** (if you haven't already):
   ```bash
   git clone https://github.com/YOUR_USERNAME/claycloud.git
   cd claycloud
   ```

2. **Verify the structure**:
   ```
   claycloud/
   ├── frontend/          # Next.js frontend
   ├── backend/           # Express.js backend
   └── .github/
       └── workflows/
           └── deploy-backend.yml  # GitHub Actions workflow
   ```

3. **Push to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Initial setup"
   git push origin main
   ```

---

## Step 2: Set Up GitHub Secrets

GitHub Secrets store your API keys securely. You need to add them to your repository.

### 2.1 Navigate to GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### 2.2 Add Required Secrets

You have two options for API keys:

#### Option A: Single Comma-Separated Secret (Easier)

Add one secret named `API_KEY` with this format:
```
driveApiKey,driveAnonApiKey,oneplatformApiKey,makersuiteApiKey,githubClientId
```

**Example:**
```
AIzaSyCN_sSPJMpYrAzC5AtTrltNC8oRmLtoqBk,AIzaSyB10s2vWUTwP0pj20wZoxmpZIt3rRodYeg,AIzaSyA2BvntLwNwFthUB4w6_Bhn0cMlVHwyaHc,AIzaSyAmDcruecW4rCL1KdwcbIVHL4LkXxahIgw,5036cf6d81e65aaa6340
```

#### Option B: Individual Secrets (More Flexible)

Add these secrets separately:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DRIVE_API_KEY` | Google Drive API key | `AIzaSyCN_...` |
| `DRIVE_ANON_API_KEY` | Google Drive anonymous API key | `AIzaSyB10s...` |
| `ONEPLATFORM_API_KEY` | OnePlatform API key | `AIzaSyA2Bv...` |
| `MAKERSUITE_API_KEY` | MakerSuite API key | `AIzaSyAmDc...` |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | `5036cf6d81e65aaa6340` |

### 2.3 Optional Secrets

Add these if you need them:

- **`WEBVM_URL`**: External WebVM service URL (usually not needed)
- **`SMS_ACTIVATE_API_KEY`**: SMS activation service API key (for phone verification)

### 📝 How to Get API Keys

The API keys are extracted from Google Colab's `drive.js` file. You can find them in:
- `backend/src/services/ColabAPIConfig.ts` (for reference, but they're loaded from env vars now)

**Note**: These are public API keys used by Google Colab. They don't require authentication to obtain.

---

## Step 3: Configure GitHub Actions

The GitHub Actions workflow is already configured. You just need to trigger it.

### 3.1 Trigger the Workflow

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. You should see "Deploy Backend to GitHub Actions" workflow
4. Click **Run workflow** → **Run workflow**

Or, push a change to the `backend/` directory:
```bash
# Make a small change to trigger the workflow
touch backend/.gitkeep
git add backend/.gitkeep
git commit -m "Trigger backend deployment"
git push origin main
```

### 3.2 Monitor the Workflow

1. Click on the running workflow
2. Watch the logs as it:
   - ✅ Installs dependencies
   - ✅ Builds the backend
   - ✅ Sets up Chrome/ChromeDriver
   - ✅ Starts the backend server
   - ✅ Sets up the tunnel

### 3.3 Get the Backend URL

After the "Setup Tunnel" step completes, look for this output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Backend is now accessible at:
   https://claycloud-backend.loca.lt
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Copy this URL** - you'll need it for Vercel!

---

## Step 4: Configure Vercel

### 4.1 Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **New Project**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### 4.2 Add Environment Variables

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Click **Add New**

#### Required Variable:

**Name**: `NEXT_PUBLIC_API_URL`  
**Value**: The tunnel URL from GitHub Actions (Step 3.3)  
**Example**: `https://claycloud-backend.loca.lt`

**Important**: 
- Make sure to select **Production**, **Preview**, and **Development**
- Click **Save**

#### Optional Variable (if frontend needs API keys):

**Name**: `API_KEY`  
**Value**: Same format as GitHub Secrets (comma-separated)  
**Environments**: All

### 4.3 Deploy

1. Click **Deploy** (or it will auto-deploy after adding env vars)
2. Wait for deployment to complete
3. Your frontend will be live at: `https://your-project.vercel.app`

---

## Step 5: Test the Deployment

### 5.1 Test Backend

1. Open the backend URL from GitHub Actions:
   ```
   https://claycloud-backend.loca.lt/health
   ```

2. You should see:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-..."
   }
   ```

### 5.2 Test Frontend

1. Open your Vercel deployment URL
2. Click **Start Free Session**
3. The frontend should:
   - Create a session
   - Generate account info
   - Set up WebVM (client-side)
   - Connect to Colab

### 5.3 Troubleshooting

If something doesn't work:

1. **Check GitHub Actions logs** for backend errors
2. **Check Vercel deployment logs** for frontend errors
3. **Verify environment variables** are set correctly
4. **Check browser console** for CORS or API errors

---

## 🔄 Keeping the Backend Running

### Important Notes:

1. **GitHub Actions workflows have time limits**:
   - Free tier: 6 hours max
   - After 6 hours, the workflow will stop
   - You'll need to restart it

2. **Tunnel URLs are temporary**:
   - Each time the workflow runs, the tunnel URL may change
   - Update `NEXT_PUBLIC_API_URL` in Vercel if the URL changes

3. **To restart the backend**:
   - Go to GitHub Actions
   - Click "Run workflow" again
   - Update Vercel env vars if URL changed

---

## 📊 Monitoring

### Backend Health

- **Local**: `http://localhost:3001/health` (in GitHub Actions)
- **Public**: `https://claycloud-backend.loca.lt/health`

### GitHub Actions Logs

The workflow will show:
- ✅ Health check status every 60 seconds
- ❌ Errors if the server crashes
- ⚠️ Warnings if tunnel is unavailable

---

## 🎉 You're Done!

Your Clay Cloud deployment is now complete:

- ✅ Backend running on GitHub Actions
- ✅ Frontend deployed on Vercel
- ✅ Tunnel connecting them together

**Next Steps:**
- Test creating a session
- Monitor the logs
- Customize as needed

---

## 🆘 Need Help?

### Common Issues:

1. **CORS Errors**
   - Check that `NEXT_PUBLIC_API_URL` is correct in Vercel
   - Verify backend CORS is allowing your frontend origin

2. **404 Errors**
   - Ensure GitHub Actions workflow is running
   - Check that tunnel URL is correct

3. **API Key Errors**
   - Verify secrets are set in GitHub
   - Check the format (comma-separated if using `API_KEY`)

4. **Tunnel Not Working**
   - The subdomain might be taken
   - Try changing `claycloud-backend` to something unique in the workflow

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Localtunnel Documentation](https://github.com/localtunnel/localtunnel)

---

**Last Updated**: 2024
**Version**: 1.0

