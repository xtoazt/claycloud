import { ColabService, ColabSession } from './ColabService';
import { Account } from './AccountManager';

export interface ResourceUsage {
  cpuUsage?: number;
  memoryUsage?: number;
  gpuUsage?: number;
  diskUsage?: number;
  runtimeHours?: number;
  isExhausted: boolean;
  errorCode?: string;
}

export class ResourceMonitor {
  private colabService: ColabService;
  private sessions: Map<string, ColabSession> = new Map();
  private usageCache: Map<string, ResourceUsage> = new Map();

  constructor() {
    this.colabService = new ColabService();
  }

  /**
   * Monitor resource usage for a session
   */
  async checkResources(sessionId: string, account: Account): Promise<ResourceUsage> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { isExhausted: false };
      }

      // Check Colab runtime status
      const runtimeInfo = await this.colabService.getRuntimeInfo(session);
      
      // Check for common resource exhaustion indicators
      const isExhausted = this.detectResourceExhaustion(runtimeInfo);

      const usage: ResourceUsage = {
        isExhausted,
        errorCode: runtimeInfo.errorCode,
        runtimeHours: runtimeInfo.runtimeHours,
      };

      this.usageCache.set(sessionId, usage);
      return usage;
    } catch (error: any) {
      // If we can't check resources, assume they're still available
      console.error('Error checking resources:', error);
      return { isExhausted: false };
    }
  }

  /**
   * Detect if resources are exhausted based on Colab response
   */
  private detectResourceExhaustion(runtimeInfo: any): boolean {
    // Check for common Colab resource exhaustion signals
    if (runtimeInfo.errorCode) {
      const exhaustedCodes = [
        'RESOURCE_EXHAUSTED',
        'QUOTA_EXCEEDED',
        'RUNTIME_LIMIT_REACHED',
        'SESSION_TIMEOUT',
        'OUT_OF_MEMORY',
        'GPU_QUOTA_EXCEEDED',
      ];
      
      return exhaustedCodes.some(code => 
        runtimeInfo.errorCode.includes(code) || 
        runtimeInfo.message?.includes(code)
      );
    }

    // Check runtime hours (Colab free tier has limits)
    if (runtimeInfo.runtimeHours && runtimeInfo.runtimeHours > 12) {
      return true;
    }

    // Check for specific error messages
    const errorMessages = [
      'runtime disconnected',
      'session expired',
      'quota exceeded',
      'resource limit',
      'out of resources',
    ];

    if (runtimeInfo.message) {
      const message = runtimeInfo.message.toLowerCase();
      return errorMessages.some(msg => message.includes(msg));
    }

    return false;
  }

  /**
   * Register a session for monitoring
   */
  registerSession(sessionId: string, colabSession: ColabSession): void {
    this.sessions.set(sessionId, colabSession);
  }

  /**
   * Unregister a session
   */
  unregisterSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.usageCache.delete(sessionId);
  }

  /**
   * Get cached usage for a session
   */
  getCachedUsage(sessionId: string): ResourceUsage | undefined {
    return this.usageCache.get(sessionId);
  }
}

