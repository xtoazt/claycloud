import { v4 as uuidv4 } from 'uuid';
import { AccountManager } from './AccountManager';
import { WebVMService } from './WebVMService';

export interface Session {
  id: string;
  status: 'creating' | 'ready' | 'error';
  accountEmail?: string;
  accountId?: string;
  vmUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private accountManager: AccountManager;
  private webVMService: WebVMService;

  constructor() {
    this.accountManager = new AccountManager();
    this.webVMService = new WebVMService();
  }

  async createSession(): Promise<Session> {
    const sessionId = uuidv4();
    const session: Session = {
      id: sessionId,
      status: 'creating',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    // Start async setup process
    this.setupSession(sessionId).catch((error) => {
      console.error(`Error setting up session ${sessionId}:`, error);
      const session = this.sessions.get(sessionId);
      if (session) {
        session.status = 'error';
        session.error = error.message;
        session.updatedAt = new Date();
      }
    });

    return session;
  }

  private async setupSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      // Step 1: Create initial account structure (will be populated by WebVM)
      session.status = 'creating';
      session.updatedAt = new Date();
      const account = await this.accountManager.createAccount();
      
      session.accountId = account.id;
      session.accountEmail = account.email;
      session.updatedAt = new Date();

      // Step 2: Account generation happens in WebVM on client side
      // Wait for account to be created before setting up Colab
      // The frontend will call back when account is ready
      
      // For now, mark as creating - will be updated when account is created
      session.status = 'creating';
      session.updatedAt = new Date();

      this.sessions.set(sessionId, session);
    } catch (error: any) {
      session.status = 'error';
      session.error = error.message || 'Failed to set up session';
      session.updatedAt = new Date();
      this.sessions.set(sessionId, session);
      throw error;
    }
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Cleanup WebVM if exists
      // Note: vmUrl is now a Colab URL, not a VM ID
      // Cleanup account if exists
      if (session.accountId) {
        await this.accountManager.deleteAccount(session.accountId);
      }
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Update session with new account (for account switching)
   */
  async switchAccount(sessionId: string, accountId: string, accountEmail: string, vmUrl: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Update session with new account info
      session.accountId = accountId;
      session.accountEmail = accountEmail;
      session.vmUrl = vmUrl;
      session.status = 'ready';
      session.updatedAt = new Date();
      this.sessions.set(sessionId, session);
    }
  }
}

