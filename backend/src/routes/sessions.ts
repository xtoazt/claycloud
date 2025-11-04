import { Router, Request, Response } from 'express';
import { SessionManager } from '../services/SessionManager';
import { AccountManager } from '../services/AccountManager';
import { WebVMService } from '../services/WebVMService';

const router = Router();
const sessionManager = new SessionManager();
const accountManager = new AccountManager();
const webVMService = new WebVMService();

// Create a new session
router.post('/create', async (req: Request, res: Response) => {
  try {
    const session = await sessionManager.createSession();
    res.json(session);
  } catch (error: any) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message || 'Failed to create session' });
  }
});

// Get session status
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionManager.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error: any) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: error.message || 'Failed to get session' });
  }
});

// Complete session setup after account is created in WebVM
router.post('/:sessionId/complete', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { email } = req.body;
    
    const session = await sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get account by email
    const account = accountManager.getAccount(session.accountId || '');
    if (!account || account.email !== email) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Now create Colab session for computing
    const vmId = await webVMService.createVM(account);
    const vmUrl = webVMService.getVMUrl(vmId);
    
    // Update session
    session.vmUrl = vmUrl;
    session.status = 'ready';
    session.updatedAt = new Date();
    
    res.json(session);
  } catch (error: any) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: error.message || 'Failed to complete session' });
  }
});

// Delete session
router.delete('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    await sessionManager.deleteSession(sessionId);
    res.json({ message: 'Session deleted' });
  } catch (error: any) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: error.message || 'Failed to delete session' });
  }
});

export { router as sessionRouter };
