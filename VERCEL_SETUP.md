# Vercel Deployment Setup

## Environment Variables

When deploying to Vercel, you need to set these environment variables in the Vercel dashboard:

### Required Environment Variables

1. **NEXT_PUBLIC_API_URL**
   - Description: URL of your backend API
   - Example: `https://your-backend-url.com` or `https://your-username.github.io` (if using GitHub Pages)
   - For local development: `http://localhost:3001`

2. **NEXT_PUBLIC_GITHUB_REPO** (Optional)
   - Description: Your GitHub repository URL
   - Example: `https://github.com/yourusername/claycloud`
   - Used for displaying repository information

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add each variable:
   - Click "Add New"
   - Enter variable name (e.g., `NEXT_PUBLIC_API_URL`)
   - Enter variable value (e.g., `https://your-backend-url.com`)
   - Select environments (Production, Preview, Development)
   - Click "Save"
4. Redeploy your application for changes to take effect

## Important Notes

- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Make sure your backend URL is accessible from the internet
- For GitHub Actions backend, you may need a tunnel service (ngrok, Cloudflare Tunnel, etc.)
- The frontend will use `http://localhost:3001` as fallback if `NEXT_PUBLIC_API_URL` is not set

## Backend URL Options

### Option 1: GitHub Actions with Tunnel
If your backend runs on GitHub Actions, use a tunnel service:
- ngrok: `https://your-subdomain.ngrok.io`
- Cloudflare Tunnel: `https://your-tunnel.trycloudflare.com`
- LocalTunnel: `https://your-subdomain.loca.lt`

### Option 2: Cloud Hosting
Deploy backend to:
- Railway: `https://your-app.railway.app`
- Render: `https://your-app.onrender.com`
- Fly.io: `https://your-app.fly.dev`

### Option 3: Vercel Serverless Functions
Move backend API routes to `frontend/app/api/` and deploy everything to Vercel.

