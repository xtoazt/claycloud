# Backend Deployment with GitHub Actions + Tunnel ✅

## Overview

The backend is fully configured to run on GitHub Actions with automatic tunneling. This setup:
- ✅ Runs Express.js backend on GitHub Actions
- ✅ Uses localtunnel to expose the backend publicly
- ✅ Loads all API keys from environment variables (no hardcoded keys)
- ✅ Automatically verifies tunnel connectivity
- ✅ Monitors backend health continuously

## Quick Setup

See **[QUICK_START.md](./QUICK_START.md)** for a 5-minute setup guide.

For detailed instructions, see **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**.

## Configuration Summary

### GitHub Secrets Required

**Option 1: Single Secret (Recommended)**
- Secret name: `API_KEY`
- Value: `driveApiKey,driveAnonApiKey,oneplatformApiKey,makersuiteApiKey,githubClientId`
- Example: `AIzaSyCN_xxx,AIzaSyB10s_xxx,AIzaSyA2B_xxx,AIzaSyAmD_xxx,5036cf6d81e65aaa6340`

**Option 2: Individual Secrets**
- `DRIVE_API_KEY`
- `DRIVE_ANON_API_KEY`
- `ONEPLATFORM_API_KEY`
- `MAKERSUITE_API_KEY`
- `GITHUB_CLIENT_ID`

### Optional Secrets
- `WEBVM_URL` - External WebVM service URL
- `SMS_ACTIVATE_API_KEY` - SMS activation service

### Vercel Environment Variables

**Required:**
- `NEXT_PUBLIC_API_URL` - Backend tunnel URL from GitHub Actions

**Optional:**
- `API_KEY` - If frontend needs API keys (same format as GitHub)

## How It Works

### 1. GitHub Actions Workflow

The workflow (`.github/workflows/deploy-backend.yml`) automatically:
1. Builds the TypeScript backend
2. Sets up Chrome/ChromeDriver for Selenium
3. Starts the Express server on port 3001
4. Creates a public tunnel using localtunnel
5. Verifies tunnel connectivity
6. Monitors backend health every 60 seconds

### 2. Tunnel Service

- **Service**: Localtunnel
- **Subdomain**: `claycloud-backend` (configurable)
- **URL Format**: `https://claycloud-backend.loca.lt`
- **Port**: 3001 (backend server)

### 3. API Keys

All API keys are loaded from environment variables:
- Checks individual env vars first (`DRIVE_API_KEY`, etc.)
- Falls back to parsing comma-separated `API_KEY`
- No hardcoded keys in the codebase

## Getting the Backend URL

After the workflow runs:

1. Go to **GitHub Repo** → **Actions** tab
2. Click the latest workflow run
3. Find the **"Setup Tunnel"** step
4. Look for this output:
   ```
   ✅ Backend is now accessible at:
      https://claycloud-backend.loca.lt
   ```
5. Copy the URL and add it to Vercel as `NEXT_PUBLIC_API_URL`

## Workflow Features

### Automatic Verification
- Verifies tunnel is accessible before continuing
- Tests backend health endpoint through tunnel
- Provides clear error messages if setup fails

### Health Monitoring
- Checks backend health every 60 seconds
- Verifies tunnel accessibility every 5 minutes
- Logs all health check results

### Error Handling
- Graceful handling of tunnel connection failures
- Clear error messages in logs
- Automatic retry logic for tunnel connection

## Important Notes

### ⏰ Time Limits
- GitHub Actions free tier: **6 hours max** per workflow run
- After 6 hours, the workflow stops
- You need to restart it manually

### 🔄 Tunnel URLs
- Tunnel URLs may change when workflow restarts
- Update `NEXT_PUBLIC_API_URL` in Vercel if URL changes
- Subdomain may be taken - change it in workflow if needed

### 🔁 Restarting Backend
1. Go to GitHub Actions
2. Click **"Run workflow"**
3. Wait for completion
4. Update Vercel env var if URL changed

## Troubleshooting

### Tunnel Not Connecting
- **Issue**: Tunnel can't connect to backend
- **Solution**: 
  - Check backend is running (look for "Backend server started" in logs)
  - Verify port 3001 is not blocked
  - Try changing subdomain in workflow

### Backend Health Check Fails
- **Issue**: `/health` endpoint not responding
- **Solution**:
  - Check backend logs for errors
  - Verify all dependencies are installed
  - Check API keys are set correctly

### CORS Errors
- **Issue**: Frontend can't connect to backend
- **Solution**:
  - Verify `NEXT_PUBLIC_API_URL` matches backend URL
  - Check CORS is configured (already set to allow all origins)
  - Ensure backend is accessible via tunnel URL

### API Key Errors
- **Issue**: API calls failing
- **Solution**:
  - Verify secrets are set in GitHub
  - Check format (comma-separated if using `API_KEY`)
  - Ensure env vars are passed to workflow

## Production Considerations

For production use, consider:

1. **Stable Tunnel URLs**
   - Use ngrok paid plan for fixed subdomains
   - Or use Cloudflare Tunnel for free static URLs
   - Or deploy to Railway/Render/Fly.io

2. **Database**
   - Current setup uses in-memory storage
   - For production, add Vercel Postgres or similar
   - Update `SessionManager` and `AccountManager` to use database

3. **Monitoring**
   - Set up error tracking (Sentry, etc.)
   - Add logging service
   - Monitor resource usage

4. **Security**
   - Restrict CORS to specific origins
   - Add rate limiting
   - Implement authentication

## Next Steps

- ✅ Backend is configured and ready
- 📖 See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete setup
- ⚡ See [QUICK_START.md](./QUICK_START.md) for quick setup
- 🚀 Deploy and test!

