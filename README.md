# Clay Cloud

Free cloud computing system using Google Colab APIs. Account generation runs in WebVM (client-side), then uses Colab for free computing. **Automatically regenerates accounts when resources are exhausted.**

## Architecture

### Flow:
1. **User requests session** → Frontend creates session on backend
2. **Account generation in WebVM** → Runs client-side in browser using WebVM (from https://github.com/leaningtech/webvm)
3. **Account created** → Python/Selenium script creates Google account inside WebVM
4. **Colab authentication** → Backend authenticates with created account
5. **Colab session ready** → User gets free computing via Google Colab API
6. **Resource monitoring** → System monitors resource usage
7. **Auto-regeneration** → When resources exhausted, silently generates new account and switches

### Key Features:
- **Silent Account Regeneration**: When resources are exhausted, automatically creates new account in background
- **User Warning**: Popup warns user to save work before account switch
- **Seamless Switching**: Account switch happens automatically without showing account details
- **Resource Monitoring**: Continuously monitors Colab resource usage

## How Account Regeneration Works

1. **Resource Detection**: System checks Colab resources every 30 seconds
2. **Exhaustion Detection**: Detects when account hits limits (quota, runtime, etc.)
3. **Warning Popup**: Shows modal warning user to save work
4. **Background Generation**: Silently generates new account in WebVM (not visible to user)
5. **Account Switch**: Seamlessly switches to new account
6. **Continue Computing**: User continues with new account without interruption

## Setup

### Prerequisites

- Node.js 20+
- npm or yarn
- Google Cloud credentials (OAuth client ID/secret)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd claycloud
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:

**Backend (.env)**:
```env
PORT=3001
NODE_ENV=production
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback
```

**Frontend (Vercel environment variables)**:
- `NEXT_PUBLIC_API_URL`: Your backend API URL
- `NEXT_PUBLIC_GITHUB_REPO`: Your GitHub repository URL

## Development

### Run Frontend Locally
```bash
npm run dev:frontend
```

### Run Backend Locally
```bash
npm run dev:backend
```

## API Endpoints

### Sessions
- `POST /api/sessions/create` - Create session
- `GET /api/sessions/:sessionId` - Get session status
- `GET /api/sessions/:sessionId/resources` - Check resource usage
- `POST /api/sessions/:sessionId/complete` - Complete setup after account created
- `POST /api/sessions/:sessionId/switch-account` - Switch to new account (auto-called)
- `DELETE /api/sessions/:sessionId` - Delete session

### Accounts
- `POST /api/accounts/create` - Create account structure
- `GET /api/accounts/:accountId` - Get account status

### Authentication
- `GET /api/auth/url/:accountId` - Get OAuth URL
- `GET /api/auth/callback` - OAuth callback

## Technical Details

### Resource Monitoring
- Checks Colab resources every 30 seconds
- Detects exhaustion via error codes and runtime limits
- Automatically triggers account regeneration

### Account Regeneration
- Runs silently in WebVM (client-side)
- No UI shown during generation
- User only sees warning popup
- Account details hidden from user

### Colab API Integration
- Uses endpoints from `drive.js`:
  - `https://colab.research.google.com`
  - `https://colab.clients6.google.com`
- Authenticates with created accounts
- Provides free computing resources

## Security Notes

⚠️ **Important**: 
- Automated account creation may violate Google's Terms of Service
- Use at your own risk
- Ensure compliance with all applicable terms and regulations
- Account details are hidden from users for security

## License

MIT
