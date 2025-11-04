# Contributing to Clay Cloud

Thank you for your interest in contributing to Clay Cloud! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/claycloud.git
   cd claycloud
   ```

3. Install dependencies:
   ```bash
   npm run install:all
   ```

4. Set up environment variables:
   - Copy `.env.example` files in both `frontend/` and `backend/` directories
   - Fill in the required values

5. Start development servers:
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend

   # Terminal 2 - Frontend
   npm run dev:frontend
   ```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use ESLint and fix any linting errors
- Write meaningful commit messages

## Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "Add: description of your changes"
   ```

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a Pull Request on GitHub

## Project Structure

- `frontend/`: Next.js frontend application
- `backend/`: Express backend API
- `.github/workflows/`: GitHub Actions workflows

## Testing

Before submitting a PR, ensure:
- Code compiles without errors
- Linting passes
- Backend API endpoints work correctly
- Frontend connects to backend successfully

## Questions?

Open an issue on GitHub for any questions or clarifications.

