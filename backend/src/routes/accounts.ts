import { Router, Request, Response } from 'express';
import { AccountManager } from '../services/AccountManager';

const router = Router();
const accountManager = new AccountManager();

// Create a new Google account
router.post('/create', async (req: Request, res: Response) => {
  try {
    const account = await accountManager.createAccount();
    res.json(account);
  } catch (error: any) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: error.message || 'Failed to create account' });
  }
});

// Get account status
router.get('/:accountId', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const account = await accountManager.getAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json(account);
  } catch (error: any) {
    console.error('Error getting account:', error);
    res.status(500).json({ error: error.message || 'Failed to get account' });
  }
});

export { router as accountRouter };

