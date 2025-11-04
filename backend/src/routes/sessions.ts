import { Router, Request, Response } from 'express';
import { SessionManager } from '../services/SessionManager';
import { AccountManager } from '../services/AccountManager';
import { WebVMService } from '../services/WebVMService';
import { ResourceMonitor } from '../services/ResourceMonitor';

const router = Router();
const sessionManager = new SessionManager();
const accountManager = new AccountManager();
const webVMService = new WebVMService();
const resourceMonitor = new ResourceMonitor();

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

// Check resource usage
router.get('/:sessionId/resources', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionManager.getSession(sessionId);
    
    if (!session || !session.accountId) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const account = accountManager.getAccount(session.accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check if resources are exhausted
    const usage = await resourceMonitor.checkResources(sessionId, account);
    
    res.json({
      exhausted: usage.isExhausted,
      errorCode: usage.errorCode,
      runtimeHours: usage.runtimeHours,
    });
  } catch (error: any) {
    console.error('Error checking resources:', error);
    // Return not exhausted on error to avoid false positives
    res.json({ exhausted: false });
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
    
    // Register session with resource monitor
    const colabSession = await webVMService.getColabSession(vmId);
    if (colabSession) {
      resourceMonitor.registerSession(sessionId, colabSession);
    }
    
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

// Switch to a new account (when resources are exhausted)
router.post('/:sessionId/switch-account', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { email, password } = req.body;
    
    const session = await sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Create new account entry from credentials (already created in WebVM)
    const newAccount = await accountManager.createAccountFromCredentials(email, password);
    
    // Unregister old session from resource monitor
    resourceMonitor.unregisterSession(sessionId);
    
    // Create new Colab session with new account
    const vmId = await webVMService.createVM(newAccount);
    const vmUrl = webVMService.getVMUrl(vmId);
    
    // Register new session with resource monitor
    const colabSession = await webVMService.getColabSession(vmId);
    if (colabSession) {
      resourceMonitor.registerSession(sessionId, colabSession);
    }
    
    // Update session with new account (use session manager method)
    await sessionManager.switchAccount(sessionId, newAccount.id, newAccount.email, vmUrl);
    
    // Get updated session
    const updatedSession = await sessionManager.getSession(sessionId);
    
    res.json(updatedSession);
  } catch (error: any) {
    console.error('Error switching account:', error);
    res.status(500).json({ error: error.message || 'Failed to switch account' });
  }
});

// Delete session
router.delete('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    // Unregister from resource monitor
    resourceMonitor.unregisterSession(sessionId);
    
    await sessionManager.deleteSession(sessionId);
    res.json({ message: 'Session deleted' });
  } catch (error: any) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: error.message || 'Failed to delete session' });
  }
});

export { router as sessionRouter };
