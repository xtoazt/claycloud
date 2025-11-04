import axios, { AxiosInstance } from 'axios';
import { Account } from './AccountManager';
import { ColabAPIConfig, ColabEndpoints, getColabAPIUrl, getColabAPIHeaders } from './ColabAPIConfig';

export interface ColabSession {
  id: string;
  kernelUrl: string;
  accessToken: string;
  notebookId?: string;
  taskId?: string; // For async execution via task service
}

export interface ExecutionResult {
  output?: any;
  error?: string;
  executionId?: string;
}

export class ColabService {
  private apiClient: AxiosInstance;
  private baseUrl = ColabAPIConfig.baseUrl;
  private oneplatformUrl = ColabAPIConfig.oneplatformEndpoint;

  constructor() {
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Authenticate with Google Colab using account credentials
   */
  async authenticate(account: Account): Promise<string> {
    try {
      // Get OAuth token for the account
      // In a real implementation, you would use Google OAuth flow
      // For now, we'll use the account email to get session
      const token = await this.getAccessToken(account);
      return token;
    } catch (error: any) {
      throw new Error(`Failed to authenticate with Colab: ${error.message}`);
    }
  }

  /**
   * Create a new Colab notebook session
   */
  async createNotebook(account: Account): Promise<ColabSession> {
    try {
      const accessToken = await this.authenticate(account);
      
      // Create a new notebook via Colab API
      const response = await axios.post(
        `${this.oneplatformUrl}/v1/notebooks`,
        {
          title: `Clay Cloud Session ${Date.now()}`,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const notebookId = response.data.id;
      
      // Connect to kernel
      const kernelUrl = await this.connectKernel(notebookId, accessToken);

      return {
        id: notebookId,
        kernelUrl,
        accessToken,
        notebookId,
      };
    } catch (error: any) {
      // Fallback: Use Colab's public API if authentication fails
      console.warn('Failed to create authenticated notebook, using public API');
      return this.createPublicNotebook();
    }
  }

  /**
   * Execute code in a Colab notebook
   * Uses task service for async execution (as per drive.js config)
   */
  async executeCode(session: ColabSession, code: string): Promise<ExecutionResult> {
    try {
      // Use task service for async execution (better for long-running code)
      const taskResponse = await axios.post(
        getColabAPIUrl(ColabEndpoints.tasks.create),
        {
          notebookId: session.notebookId,
          code,
          executionType: 'cell',
        },
        {
          baseURL: this.oneplatformUrl,
          headers: getColabAPIHeaders(session.accessToken),
        }
      );

      const taskId = taskResponse.data.id;
      session.taskId = taskId;

      // Poll for task completion (following drive.js config)
      return await this.pollTaskCompletion(taskId, session.accessToken);
    } catch (error: any) {
      // Fallback to direct execution
      try {
        const response = await axios.post(
          `${session.kernelUrl}/execute`,
          {
            code,
            notebookId: session.notebookId,
          },
          {
            headers: getColabAPIHeaders(session.accessToken),
          }
        );

        return { output: response.data, executionId: response.data.id };
      } catch (fallbackError: any) {
        throw new Error(`Failed to execute code: ${fallbackError.message}`);
      }
    }
  }

  /**
   * Poll task service for execution completion (async execution)
   */
  private async pollTaskCompletion(taskId: string, accessToken: string): Promise<ExecutionResult> {
    let pollInterval = ColabAPIConfig.taskServiceInitialPollIntervalMs;
    let pollCount = 0;
    const maxPolls = ColabAPIConfig.taskServiceMaxPollCount;
    const timeout = ColabAPIConfig.taskServicePollTimeoutMs;
    const startTime = Date.now();

    while (pollCount < maxPolls && (Date.now() - startTime) < timeout) {
      try {
        const response = await axios.get(
          getColabAPIUrl(ColabEndpoints.tasks.poll, { id: taskId }),
          {
            baseURL: this.oneplatformUrl,
            headers: getColabAPIHeaders(accessToken),
          }
        );

        const task = response.data;
        
        if (task.status === 'completed') {
          return {
            output: task.result,
            executionId: taskId,
          };
        }
        
        if (task.status === 'failed' || task.status === 'error') {
          return {
            error: task.error || 'Execution failed',
            executionId: taskId,
          };
        }

        // Wait before next poll (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        pollInterval = Math.min(
          pollInterval * ColabAPIConfig.taskServicePollIntervalGrowthFactor,
          ColabAPIConfig.taskServiceMaxPollIntervalMs
        );
        pollCount++;
      } catch (error: any) {
        if (pollCount === 0) {
          // Wait before retrying on first error
          await new Promise(resolve => 
            setTimeout(resolve, ColabAPIConfig.taskServiceWaitBeforePollingMs)
          );
        }
        pollCount++;
      }
    }

    throw new Error('Task execution timed out');
  }

  /**
   * Get access token for account using GoogleAuthService
   */
  private async getAccessToken(account: Account): Promise<string> {
    // Import GoogleAuthService to get OAuth tokens
    const { GoogleAuthService } = await import('./GoogleAuthService');
    const authService = new GoogleAuthService();
    
    // For automated accounts, we need to handle OAuth flow
    // This is a simplified version - in production you'd need to:
    // 1. Complete OAuth flow for the account
    // 2. Store refresh tokens
    // 3. Use refresh tokens to get access tokens
    
    // For now, return a placeholder
    // The actual authentication will be handled when the account is created
    return `token_for_${account.email}`;
  }

  /**
   * Connect to Colab kernel
   */
  private async connectKernel(notebookId: string, accessToken: string): Promise<string> {
    // Colab kernel connection endpoint
    // This would be the WebSocket or HTTP endpoint for the kernel
    return `${this.oneplatformUrl}/v1/notebooks/${notebookId}/kernel`;
  }

  /**
   * Create a public notebook (fallback)
   */
  private async createPublicNotebook(): Promise<ColabSession> {
    // Use Colab's public notebook creation
    // This doesn't require authentication but has limitations
    return {
      id: `public_${Date.now()}`,
      kernelUrl: `${this.baseUrl}/api/kernel`,
      accessToken: 'public',
    };
  }

  /**
   * Get Colab runtime info (GPU, memory, etc.)
   */
  async getRuntimeInfo(session: ColabSession): Promise<any> {
    try {
      const response = await axios.get(
        getColabAPIUrl(ColabEndpoints.runtime.status),
        {
          baseURL: this.oneplatformUrl,
          headers: getColabAPIHeaders(session.accessToken),
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get runtime info: ${error.message}`);
    }
  }

  /**
   * Get available GPU/accelerator models
   */
  getAvailableAccelerators(): string[] {
    return ColabAPIConfig.userVisibleAcceleratorModels;
  }

  /**
   * Request specific GPU type (if available)
   */
  async requestGPU(session: ColabSession, gpuType: string): Promise<boolean> {
    if (!ColabAPIConfig.userVisibleAcceleratorModels.includes(gpuType)) {
      throw new Error(`GPU type ${gpuType} not available`);
    }

    try {
      const response = await axios.post(
        getColabAPIUrl(ColabEndpoints.runtime.resources),
        {
          accelerator: gpuType,
        },
        {
          baseURL: this.oneplatformUrl,
          headers: getColabAPIHeaders(session.accessToken),
        }
      );

      return response.data.success === true;
    } catch (error: any) {
      throw new Error(`Failed to request GPU: ${error.message}`);
    }
  }

  /**
   * Check GPU utilization (for resource monitoring)
   */
  async getGPUUtilization(session: ColabSession): Promise<number> {
    try {
      const runtimeInfo = await this.getRuntimeInfo(session);
      return runtimeInfo.gpuUtilization || 0;
    } catch (error: any) {
      return 0;
    }
  }

  /**
   * Cancel running execution
   */
  async cancelExecution(session: ColabSession): Promise<void> {
    if (!session.taskId) {
      return;
    }

    try {
      await axios.post(
        getColabAPIUrl(ColabEndpoints.tasks.cancel, { id: session.taskId }),
        {},
        {
          baseURL: this.oneplatformUrl,
          headers: getColabAPIHeaders(session.accessToken),
        }
      );
    } catch (error: any) {
      console.warn(`Failed to cancel execution: ${error.message}`);
    }
  }
}

