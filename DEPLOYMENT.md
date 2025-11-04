# Deployment Guide

## Overview

Clay Cloud is designed to be deployed as two separate services:
- **Frontend**: Deployed to Vercel
- **Backend**: Deployed to GitHub Actions (runs continuously)

## Frontend Deployment (Vercel)

### Step 1: Prepare Vercel Project

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository

### Step 2: Configure Project Settings

1. **Root Directory**: Set to `frontend`
2. **Framework Preset**: Next.js
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`

### Step 3: Set Environment Variables

In Vercel project settings, add these environment variables:

**Important**: Do NOT use secrets with `@` prefix in vercel.json. Set them directly in Vercel dashboard.

1. Go to **Settings** > **Environment Variables** in your Vercel project
2. Add the following variables:

- `NEXT_PUBLIC_API_URL`: Your backend API URL
  - For GitHub Actions: Use a tunnel service (ngrok, Cloudflare Tunnel, etc.)
  - Example: `https://your-subdomain.ngrok.io` or `https://your-app.railway.app`
  - For local development: `http://localhost:3001` (default fallback)

- `NEXT_PUBLIC_GITHUB_REPO` (Optional): Your GitHub repository URL
  - Example: `https://github.com/yourusername/claycloud`

### Step 4: Deploy

Click "Deploy" and Vercel will build and deploy your frontend.

## Backend Deployment (GitHub Actions)

### Step 1: Set Up GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Add the following secrets:

   - `WEBVM_URL`: URL of your WebVM service (optional)
   - `SMS_ACTIVATE_API_KEY`: API key for SMS activation service (optional)

### Step 2: Configure GitHub Actions Workflow

The workflow file (`.github/workflows/deploy-backend.yml`) is already configured. It will:
- Run on pushes to `main` branch when `backend/**` files change
- Install dependencies
- Build the TypeScript code
- Start the server
- Keep it running

### Step 3: Make Backend Accessible

Since GitHub Actions runners are ephemeral, you have a few options:

#### Option A: Use a Reverse Proxy (Recommended)

1. Set up a service like:
   - [ngrok](https://ngrok.com) for tunneling
   - [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
   - [LocalTunnel](https://localtunnel.github.io/www/)

2. Update the workflow to start the tunnel:
```yaml
- name: Setup Tunnel
  run: |
    npx localtunnel --port 3001 --subdomain claycloud > tunnel.log &
    sleep 5
    TUNNEL_URL=$(grep -o 'https://.*' tunnel.log)
    echo "TUNNEL_URL=$TUNNEL_URL" >> $GITHUB_ENV
```

#### Option B: Use GitHub Pages with API Gateway

This requires a more complex setup with an API gateway service.

#### Option C: Use a Cloud Service

Instead of GitHub Actions, deploy to:
- Railway
- Render
- Fly.io
- Heroku

### Step 4: Update Frontend API URL

Once your backend is accessible, update the `NEXT_PUBLIC_API_URL` in Vercel to point to your backend URL.

## Alternative: Combined Deployment

If you prefer to deploy both services together:

### Using Vercel Serverless Functions

1. Move backend API routes to `frontend/app/api/`
2. Deploy everything to Vercel
3. Note: Selenium automation may not work in serverless environment

### Using Railway/Render

1. Deploy both frontend and backend to the same platform
2. Use internal networking between services
3. Expose frontend to the internet

## Environment Variables Summary

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL`: Backend API endpoint
- `NEXT_PUBLIC_GITHUB_REPO`: GitHub repository URL

### Backend (GitHub Actions Secrets)
- `WEBVM_URL`: WebVM service URL
- `SMS_ACTIVATE_API_KEY`: SMS activation API key
- `PORT`: Server port (default: 3001)

## Troubleshooting

### Backend Not Accessible

- Check GitHub Actions logs for errors
- Verify the server is actually running
- Test health endpoint: `curl http://localhost:3001/health`
- Ensure firewall/network allows connections

### Frontend Can't Connect to Backend

- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend
- Verify backend is accessible from internet
- Check browser console for errors

### Selenium Issues

- Ensure Chrome/Chromium is installed in GitHub Actions runner
- ChromeDriver must be compatible with Chrome version
- Headless mode may have limitations

## Production Considerations

1. **Security**: 
   - Use HTTPS for all connections
   - Implement rate limiting
   - Add authentication/authorization
   - Secure API keys and secrets

2. **Scalability**:
   - Consider using a database for session storage
   - Implement proper VM pooling
   - Add caching layer

3. **Monitoring**:
   - Set up error tracking (Sentry, etc.)
   - Add logging service
   - Monitor resource usage

4. **Legal**:
   - Ensure compliance with Google ToS
   - Review automated account creation policies
   - Consider alternative approaches

