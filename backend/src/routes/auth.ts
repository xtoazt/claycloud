import { Router, Request, Response } from 'express';
import { GoogleAuthService } from '../services/GoogleAuthService';
import { AccountManager } from '../services/AccountManager';

const router = Router();
const authService = new GoogleAuthService();
const accountManager = new AccountManager();

// Get OAuth URL for account
router.get('/url/:accountId', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const account = accountManager.getAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const authUrl = authService.getAuthUrl(account);
    res.json({ authUrl });
  } catch (error: any) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({ error: error.message || 'Failed to get auth URL' });
  }
});

// OAuth callback
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    const tokens = await authService.getTokens(code as string);
    const accountId = state as string;
    
    // Store tokens with account (in production, use a database)
    res.json({ 
      message: 'Authentication successful',
      accountId,
      hasAccessToken: !!tokens.accessToken,
    });
  } catch (error: any) {
    console.error('Error in OAuth callback:', error);
    res.status(500).json({ error: error.message || 'Authentication failed' });
  }
});

export { router as authRouter };

