# Clay Cloud

Free cloud computing system using Google Colab APIs. Account generation runs in WebVM (client-side), then uses Colab for free computing.

## Architecture

### Flow:
1. **User requests session** → Frontend creates session on backend
2. **Account generation in WebVM** → Runs client-side in browser using WebVM (from https://github.com/leaningtech/webvm)
3. **Account created** → Python/Selenium script creates Google account inside WebVM
4. **Colab authentication** → Backend authenticates with created account
5. **Colab session ready** → User gets free computing via Google Colab API

### Components:
- **Frontend**: Next.js with WebVM integration (runs account generator client-side)
- **Backend**: Express API that sets up Colab sessions after account creation
- **WebVM**: Client-side virtual machine (runs in browser) for account generation
- **Colab API**: Google Colab endpoints extracted from `drive.js` for free computing

## Why This Approach?

- **Can't use Colab without authentication** → Need to create accounts first
- **WebVM runs account generator** → Client-side isolation, no server resources needed
- **After authentication** → Use Colab APIs for free computing

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

## How It Works

### Step 1: Session Creation
- User clicks "Start Free Session"
- Backend creates session structure
- Frontend generates account info

### Step 2: Account Generation (WebVM)
- WebVM loads in browser (client-side)
- Python script with Selenium runs inside WebVM
- Creates Google account automatically
- Returns account credentials

### Step 3: Colab Setup
- Frontend sends account email to backend
- Backend authenticates with Google Colab API
- Creates Colab notebook session
- Returns Colab notebook URL

### Step 4: Free Computing
- User accesses Colab notebook
- Can run code, use GPU, etc.
- All free via Google Colab API

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
- `POST /api/sessions/create` - Create session (triggers account generation)
- `GET /api/sessions/:sessionId` - Get session status
- `POST /api/sessions/:sessionId/complete` - Complete setup after account created
- `DELETE /api/sessions/:sessionId` - Delete session

### Accounts
- `POST /api/accounts/create` - Create account structure
- `GET /api/accounts/:accountId` - Get account status

### Authentication
- `GET /api/auth/url/:accountId` - Get OAuth URL
- `GET /api/auth/callback` - OAuth callback

## Technical Details

### WebVM Integration
- WebVM runs **client-side in the browser**
- Uses Debian Linux image from WebVM
- Runs Python/Selenium for account generation
- No server resources needed for account creation

### Colab API Integration
- Uses endpoints from `drive.js`:
  - `https://colab.research.google.com`
  - `https://colab.clients6.google.com`
- Authenticates with created accounts
- Provides free computing resources

### Account Generation Script
Python script runs inside WebVM:
- Uses Selenium WebDriver
- Automates Google signup flow
- Handles form filling and navigation
- Returns account credentials

## Security Notes

⚠️ **Important**: 
- Automated account creation may violate Google's Terms of Service
- Use at your own risk
- Ensure compliance with all applicable terms and regulations
- Consider implementing rate limiting and CAPTCHA handling

## License

MIT
