# Backend Deployment Issue

## Problem
The backend API at `https://xtoazt.github.io/claycloud/api/sessions/create` is returning 404 and CORS errors.

## Root Cause
**GitHub Pages only serves static files** (HTML, CSS, JavaScript). It cannot run Node.js/Express backend servers.

## Solution Options

### Option 1: Use GitHub Actions (Recommended for your setup)
Your backend is already configured to run on GitHub Actions. However, GitHub Actions runners are ephemeral and not publicly accessible by default.

**To make it accessible:**
1. Use a tunnel service in your GitHub Actions workflow:
   ```yaml
   - name: Setup Tunnel
     run: |
       npx localtunnel --port 3001 --subdomain claycloud-backend &
       sleep 5
   ```
2. Or use ngrok/Cloudflare Tunnel
3. Update `NEXT_PUBLIC_API_URL` in Vercel with the tunnel URL

### Option 2: Deploy to Cloud Service
Deploy your backend to a service that supports Node.js:
- **Railway** (recommended): Easy setup, free tier available
- **Render**: Free tier with auto-deploy from GitHub
- **Fly.io**: Good performance, free tier
- **Heroku**: Requires credit card for verification

### Option 3: Use Vercel Serverless Functions
Move your API routes to `frontend/app/api/` and deploy everything to Vercel.

## CORS Fix Applied
I've updated the backend CORS configuration to allow all origins. Once the backend is deployed correctly, CORS errors will be resolved.

## Next Steps
1. Choose a deployment option above
2. Deploy the backend
3. Update `NEXT_PUBLIC_API_URL` in Vercel environment variables
4. Redeploy frontend

