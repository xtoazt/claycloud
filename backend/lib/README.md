# Backend Library Directory

This directory is for shared utilities and helper functions that can be used across the backend services.

## Structure

```
lib/
├── utils/        # Utility functions
├── types/        # TypeScript type definitions
└── constants/    # Constants and configuration
```

## Usage

Import from this directory in your services:

```typescript
import { someUtility } from '../lib/utils/helpers';
```

