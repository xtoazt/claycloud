# Clay Cloud ☁️

Free cloud computing with automated account management. Powered by WebVM and Google Colab.

## 🚀 Quick Start

**Get started in 5 minutes!** → See [QUICK_START.md](./QUICK_START.md)

**Need detailed instructions?** → See [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## ✨ Features

- ⚡ **Instant Setup** - Automated account creation and configuration
- 🔄 **Auto-Recovery** - Seamless account switching when resources are exhausted
- 💰 **100% Free** - No credit card, no hidden fees
- 🎨 **Beautiful UI** - Modern, responsive design
- 🔒 **Secure** - API keys stored as environment variables

## 🏗️ Architecture

- **Frontend**: Next.js (deployed on Vercel)
- **Backend**: Express.js (runs on GitHub Actions)
- **Tunnel**: Localtunnel (exposes backend publicly)
- **Account Generation**: WebVM (client-side)
- **Compute**: Google Colab

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[BACKEND_DEPLOYMENT_NOTE.md](./BACKEND_DEPLOYMENT_NOTE.md)** - Backend deployment details

## 🛠️ Setup Overview

1. **GitHub Secrets** - Add API keys to GitHub repository secrets
2. **GitHub Actions** - Start the workflow to deploy backend
3. **Vercel** - Deploy frontend and configure environment variables
4. **Done!** - Your app is live

## 🔧 Configuration

### GitHub Secrets

Add `API_KEY` secret with comma-separated values:
```
driveApiKey,driveAnonApiKey,oneplatformApiKey,makersuiteApiKey,githubClientId
```

Or use individual secrets:
- `DRIVE_API_KEY`
- `DRIVE_ANON_API_KEY`
- `ONEPLATFORM_API_KEY`
- `MAKERSUITE_API_KEY`
- `GITHUB_CLIENT_ID`

### Vercel Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend tunnel URL from GitHub Actions

## 📖 How It Works

1. **Frontend** creates a session request
2. **Backend** generates account info
3. **WebVM** (client-side) creates Google account
4. **Backend** sets up Colab session
5. **User** gets free cloud computing resources

When resources are exhausted:
- System automatically generates new account
- User gets warning to save work
- Seamless transition to new account

## 🐛 Troubleshooting

### Backend not accessible?
- Check GitHub Actions workflow is running
- Verify tunnel URL is correct
- Check backend health: `https://your-tunnel-url.loca.lt/health`

### Frontend can't connect?
- Verify `NEXT_PUBLIC_API_URL` in Vercel matches backend URL
- Check CORS settings (already configured to allow all origins)
- Check browser console for errors

### API keys not working?
- Verify secrets are set in GitHub
- Check format (comma-separated if using `API_KEY`)
- Ensure environment variables are passed to workflow

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for more troubleshooting tips.

## ⚠️ Important Notes

- **GitHub Actions** free tier: 6 hours max per workflow run
- **Tunnel URLs** may change when workflow restarts
- **Update Vercel** env vars if backend URL changes

## 🎯 Production Considerations

For production use:
- Use paid tunnel service (ngrok, Cloudflare Tunnel) for stable URLs
- Or deploy to cloud service (Railway, Render, Fly.io)
- Add database for session persistence
- Set up monitoring and error tracking

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Need help?** Check the [SETUP_GUIDE.md](./SETUP_GUIDE.md) or open an issue.
