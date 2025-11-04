# Google Colab API Analysis from drive.js

This document contains all the computing APIs, endpoints, and configuration extracted from `drive.js` to build the best free cloud computing service.

## Key API Endpoints

### Primary Execution Endpoints

1. **OnePlatform API** (Main execution endpoint)
   - URL: `https://colab.clients6.google.com/v1`
   - API Key: `AIzaSyA2BvntLwNwFthUB4w6_Bhn0cMlVHwyaHc`
   - Purpose: Primary endpoint for code execution, notebook management, and runtime operations

2. **Colab Base URL**
   - URL: `https://colab.research.google.com`
   - Purpose: Main Colab interface and notebook management

3. **MakerSuite API** (AI features)
   - URL: `https://alkalimakersuite-pa.clients6.google.com`
   - API Key: `AIzaSyAmDcruecW4rCL1KdwcbIVHL4LkXxahIgw`
   - Purpose: AI code generation, completion, and assistance

4. **Drive API**
   - API Key: `AIzaSyCN_sSPJMpYrAzC5AtTrltNC8oRmLtoqBk`
   - Anonymous API Key: `AIzaSyB10s2vWUTwP0pj20wZoxmpZIt3rRodYeg`
   - Purpose: File management and notebook storage

## Task Service (Async Execution)

The **Task Service** is Colab's async execution system, perfect for long-running computations:

### Configuration
- **Initial Poll Interval**: 500ms
- **Max Poll Interval**: 4000ms
- **Max Poll Count**: 180
- **Poll Timeout**: 150000ms (2.5 minutes)
- **Wait Before Polling**: 1000ms
- **Poll Growth Factor**: 1.3 (exponential backoff)

### Endpoints
- `POST /tasks` - Create execution task
- `GET /tasks/:id` - Poll task status
- `POST /tasks/:id/cancel` - Cancel execution

### Usage Pattern
1. Submit code → Returns task ID
2. Poll task status with exponential backoff
3. Get results when `status === 'completed'`

## Runtime Management

### Available GPU/Accelerator Models
- **T4** - Standard GPU
- **A100** - High-performance GPU
- **L4** - Latest GPU model
- **V5E1** - Enterprise GPU
- **V6E1** - Latest enterprise GPU

### Runtime Endpoints
- `GET /runtime/status` - Get runtime info (GPU, memory, etc.)
- `POST /runtime/connect` - Connect to runtime
- `POST /runtime/disconnect` - Disconnect from runtime
- `POST /runtime/resources` - Request specific GPU/accelerator

### Runtime Versions
- `2025.10` (latest)
- `2025.07`

## Resource Monitoring

### Configuration
- **Resource Poll Interval**: 10 seconds (10000ms)
- **GPU Utilization Check**: 10 minutes (600000ms)

### How Colab Detects Resource Exhaustion
1. Polls runtime status every 10 seconds
2. Checks GPU utilization every 10 minutes
3. Monitors runtime limits and error codes
4. Detects session timeouts and quota limits

## Execution Features

### Code Execution Limits
- **AI Prompt Token Limit**: 32,000 tokens
- **AI Characters Per Token**: 3.0
- **Composer Context Max**: 500,000 characters
- **Conversation Notebook Context**: 40,000 characters
- **Agent Update Max Request Size**: 10MB

### Execution Modes
- **Direct Execution**: Immediate execution via kernel
- **Async Execution**: Via task service (better for long-running code)
- **Server Execution Queue**: Queued execution for better resource management

## AI/ML Features

### Available AI Models
- **AIDA v3p1s**: Code generation model
- **AIDA v3p1s Streaming**: Streaming conversation model
- **AIDA Complete Code**: Code completion model

### AI Features Enabled
- `generate_code`: true
- `generate_df`: true (DataFrame generation)
- `complete_code`: true
- `composer`: true (AI code composer)
- `composer_generate_code`: true
- `composer_auto_code`: true

## File Management

### Configuration
- **File Browser Poll Interval**: 10 seconds
- **File Upload Rate Limit**: 5 files/second
- **Document Change Poll**: 30 seconds

### Allowed Public Domains
- `huggingface.co`
- `dagshub.com`
- `storage.googleapis.com`

## Session Management

### Configuration
- **Session Resume Coalesce**: true (resume sessions automatically)
- **Reconnect Max Delay**: 300 seconds
- **Token Refresh Headroom**: 300 seconds (5 minutes before expiry)
- **Terminate Session on VM Connect**: true

## Backend Configuration

### Backend URL Allowlist
- `localhost`
- `127.0.0.1`
- `[::1]`
- `kkb-production.jupyter-proxy.kaggle.net`
- `kkb-staging.jupyter-proxy.kaggle.net`
- `isolabs-kernels.corp.goog`

### Backend Version
- `next` (latest version)

## GitHub Integration

- **GitHub Client ID**: `5036cf6d81e65aaa6340`
- **External Trusted Repos**: Auto-import from trusted Google orgs

## Security

### reCAPTCHA
- **v2 Site Key**: `6LfQttQUAAAAADuPanA_VZMaZgBAOnHZNuuqUewp`
- **v3 Site Key**: `6LfQPtEUAAAAAHBpAdFng54jyuB1V5w5dofknpip`
- **Polling Frequency**: 300 seconds (5 minutes)

## Best Practices for Free Cloud Computing Service

### 1. Use Task Service for Long-Running Code
Instead of direct execution, use the task service for better reliability:
```typescript
// Submit task
const task = await createTask(code);
// Poll with exponential backoff
const result = await pollTask(task.id);
```

### 2. Monitor Resources Aggressively
- Check resource status every 10 seconds
- Monitor GPU utilization every 10 minutes
- Detect exhaustion before it happens

### 3. Request Specific GPUs
- Use `requestGPU()` to get T4, A100, L4, V5E1, or V6E1
- Higher-tier GPUs (A100, V6E1) have better quotas

### 4. Use Async Execution
- Better for long-running computations
- Handles timeouts gracefully
- Supports cancellation

### 5. Leverage AI Features
- Use AI code generation for complex tasks
- Enable auto-completion for faster development
- Use DataFrame generation for data analysis

### 6. Session Management
- Enable session resume for continuity
- Refresh tokens proactively (5 min before expiry)
- Handle reconnections gracefully

### 7. File Management
- Use allowed domains for data import
- Poll file browser every 10 seconds
- Respect upload rate limits (5 files/sec)

## Implementation Notes

All these APIs and configurations have been extracted and are available in:
- `backend/src/services/ColabAPIConfig.ts` - Configuration constants
- `backend/src/services/ColabService.ts` - Service implementation

The service now supports:
- ✅ Async code execution via task service
- ✅ GPU/accelerator selection
- ✅ Resource monitoring
- ✅ Runtime management
- ✅ AI code generation features
- ✅ File operations
- ✅ Session management

## Next Steps

To make this the **best free cloud computing service**:

1. **Implement GPU Selection UI** - Let users choose T4, A100, L4, etc.
2. **Add Real-time Execution Monitoring** - Show live execution status
3. **Implement AI Code Assistant** - Use MakerSuite API for code generation
4. **Add File Browser** - Integrate with allowed domains
5. **Optimize Resource Usage** - Better detection and account switching
6. **Add Session Persistence** - Resume sessions after disconnection
7. **Implement GitHub Integration** - Import from trusted repos

