/**
 * Colab API Configuration extracted from drive.js
 * This file contains all the API endpoints, keys, and configuration
 * discovered from analyzing Google Colab's drive.js file
 */

export const ColabAPIConfig = {
  // Base URLs
  baseUrl: 'https://colab.research.google.com',
  oneplatformEndpoint: 'https://colab.clients6.google.com',
  makersuiteServiceUrl: 'https://alkalimakersuite-pa.clients6.google.com',
  
  // API Keys - loaded from environment variables
  // Supports both comma-separated API_KEY or individual env vars
  // Format: API_KEY="driveApiKey,driveAnonApiKey,oneplatformApiKey,makersuiteApiKey,githubClientId"
  get driveApiKey(): string {
    if (process.env.DRIVE_API_KEY) {
      return process.env.DRIVE_API_KEY;
    }
    // Try parsing from comma-separated API_KEY
    const apiKeys = this.parseAPIKeys();
    return apiKeys.driveApiKey || '';
  },
  
  get driveAnonApiKey(): string {
    if (process.env.DRIVE_ANON_API_KEY) {
      return process.env.DRIVE_ANON_API_KEY;
    }
    const apiKeys = this.parseAPIKeys();
    return apiKeys.driveAnonApiKey || '';
  },
  
  get oneplatformApiKey(): string {
    if (process.env.ONEPLATFORM_API_KEY) {
      return process.env.ONEPLATFORM_API_KEY;
    }
    const apiKeys = this.parseAPIKeys();
    return apiKeys.oneplatformApiKey || '';
  },
  
  get makersuiteApiKey(): string {
    if (process.env.MAKERSUITE_API_KEY) {
      return process.env.MAKERSUITE_API_KEY;
    }
    const apiKeys = this.parseAPIKeys();
    return apiKeys.makersuiteApiKey || '';
  },
  
  // Helper to parse comma-separated API_KEY env var
  parseAPIKeys(): {
    driveApiKey?: string;
    driveAnonApiKey?: string;
    oneplatformApiKey?: string;
    makersuiteApiKey?: string;
    githubClientId?: string;
  } {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return {};
    }
    
    const keys = apiKey.split(',').map(k => k.trim());
    return {
      driveApiKey: keys[0],
      driveAnonApiKey: keys[1],
      oneplatformApiKey: keys[2],
      makersuiteApiKey: keys[3],
      githubClientId: keys[4],
    };
  },
  
  // Project Numbers
  driveBackgroundSaveProjectNumber: '948411933973',
  driveRealtimeProjectNumber: '903414543955',
  
  // Runtime Configuration
  runtimeVersionNames: ['2025.10', '2025.07'],
  runtimeEnvOverrides: '[["ENABLE_DIRECTORYPREFETCHER", "1"]]',
  
  // GPU/Accelerator Models
  userVisibleAcceleratorModels: ['T4', 'A100', 'L4', 'V5E1', 'V6E1'],
  deprecatedAcceleratorModels: ['V28'],
  
  // Resource Monitoring
  resourcePollIntervalMs: 10000,
  gpuUtilizationCheckIntervalMs: 600000,
  
  // Task Service (for async execution)
  taskServiceInitialPollIntervalMs: 500,
  taskServiceMaxPollIntervalMs: 4000,
  taskServiceMaxPollCount: 180,
  taskServicePollTimeoutMs: 150000,
  taskServiceWaitBeforePollingMs: 1000,
  taskServicePollIntervalGrowthFactor: 1.3,
  
  // Session Management
  sessionResumeCoalesce: true,
  reconnectMaxDelaySeconds: 300,
  rpTokenRefreshHeadroomMillis: 300000,
  
  // Backend Configuration
  backendVersion: 'next',
  backendUrlAllowlist: [
    'localhost',
    '127.0.0.1',
    '[::1]',
    'kkb-production.jupyter-proxy.kaggle.net',
    'kkb-staging.jupyter-proxy.kaggle.net',
    'isolabs-kernels.corp.goog'
  ],
  
  // Execution Configuration
  serverExecutionQueue: true,
  executionStatusPropagation: true,
  terminateSessionOnConnectToNewVm: true,
  
  // Kernel Configuration
  rpServeKernelPort: true,
  rpSocketioFallback: true,
  rpKxhrSkipFallback: false,
  
  // File Management
  fileBrowserPollIntervalMillis: 10000,
  fileUploadRateLimit: 5,
  
  // Allowed Domains
  allowedPublicUrlDomains: [
    'huggingface.co',
    'dagshub.com',
    'storage.googleapis.com'
  ],
  
  // GitHub Integration
  get githubClientId(): string {
    if (process.env.GITHUB_CLIENT_ID) {
      return process.env.GITHUB_CLIENT_ID;
    }
    const apiKeys = this.parseAPIKeys();
    return apiKeys.githubClientId || '';
  },
  
  // reCAPTCHA
  recaptchaV2SiteKey: '6LfQttQUAAAAADuPanA_VZMaZgBAOnHZNuuqUewp',
  recaptchaV3SiteKey: '6LfQPtEUAAAAAHBpAdFng54jyuB1V5w5dofknpip',
  recaptchaPollingFrequencyMs: 300000,
  
  // Code Execution Limits
  composerContextMaxVariableLength: 500000,
  aiPromptTokenLimit: 32000,
  aiCharactersPerToken: 3.0,
  converseNotebookContextLength: 40000,
  
  // AI/ML Features
  useAiService: true,
  generateCode: true,
  generateDf: true,
  completeCode: true,
  composer: true,
  composerGenerateCode: true,
  
  // External Services
  kaggleBackendRuntimeSelector: false,
  kaggleIntegrations: false,
};

/**
 * API Endpoints for Colab operations
 */
export const ColabEndpoints = {
  // OnePlatform API (main execution endpoint)
  oneplatform: `${ColabAPIConfig.oneplatformEndpoint}/v1`,
  
  // Drive API
  drive: 'https://www.googleapis.com/drive/v3',
  driveRealtime: `https://firestore.googleapis.com/v1/projects/${ColabAPIConfig.driveRealtimeProjectNumber}/databases/(default)/documents`,
  
  // MakerSuite API (for AI features)
  makersuite: `${ColabAPIConfig.makersuiteServiceUrl}/v1`,
  
  // Runtime Management
  runtime: {
    connect: '/runtime/connect',
    disconnect: '/runtime/disconnect',
    status: '/runtime/status',
    resources: '/runtime/resources',
  },
  
  // Notebook Operations
  notebook: {
    create: '/notebooks',
    get: '/notebooks/:id',
    update: '/notebooks/:id',
    delete: '/notebooks/:id',
    execute: '/notebooks/:id/execute',
  },
  
  // Task Service (async execution)
  tasks: {
    create: '/tasks',
    poll: '/tasks/:id',
    cancel: '/tasks/:id/cancel',
  },
  
  // File Operations
  files: {
    upload: '/files/upload',
    download: '/files/:id',
    list: '/files',
  },
};

/**
 * Helper function to construct API URLs
 */
export function getColabAPIUrl(endpoint: string, params?: Record<string, string>): string {
  let url = endpoint;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }
  return url;
}

/**
 * Get headers for Colab API requests
 */
export function getColabAPIHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Only add API key if it's available
  const apiKey = ColabAPIConfig.oneplatformApiKey;
  if (apiKey) {
    headers['X-Goog-Api-Key'] = apiKey;
  }
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
}

