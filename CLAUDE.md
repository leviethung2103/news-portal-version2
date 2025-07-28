# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **News Portal Dashboard** project with a FastAPI backend and Next.js frontend. The project includes RSS feed aggregation, AI-powered content summarization, project management features, vision boards, and comprehensive E2E testing.

## Commands

### Frontend (Next.js)
```bash
cd frontend
pnpm install          # Install dependencies 
pnpm dev              # Start development server (localhost:3000)
pnpm build            # Build for production
pnpm lint             # Run ESLint
npx playwright test   # Run E2E tests
```

### Backend (FastAPI)
```bash
cd fastapi-optimized-project
conda create -n news-portal python=3.12 && conda activate news-portal
pip install -r requirements.txt
python run.py         # Start development server (localhost:8000)
pytest               # Run backend tests
pytest --html=tests/reports/python-api-report.html  # Generate test report
black .              # Format code
isort .              # Sort imports
mypy .               # Type checking
flake8 .             # Linting
```

### Database Migrations
```bash
cd fastapi-optimized-project
alembic upgrade head     # Apply migrations
alembic revision --autogenerate -m "description"  # Create new migration
```

## Architecture

### Backend Structure
- **FastAPI** with async/await patterns and dependency injection
- **SQLAlchemy** with async drivers (asyncpg for PostgreSQL, aiosqlite for SQLite)
- **Alembic** for database migrations
- **Redis** caching layer via `app/core/cache.py`
- **APScheduler** for background task scheduling via `app/services/scheduler_service.py`
- **Pydantic** models for request/response validation

Key directories:
- `app/api/v1/endpoints/` - API route handlers
- `app/db/` - Database CRUD operations
- `app/models/` - SQLAlchemy models  
- `app/schemas/` - Pydantic schemas
- `app/services/` - Business logic (RSS service, content crawling, summarization)

### Frontend Structure
- **Next.js 15** with App Router and React 19
- **Tailwind CSS** + **shadcn/ui** components
- **React Hook Form** + **Zod** for form validation
- **AuthContext** for authentication state management
- **Playwright** for E2E testing

Key directories:
- `app/` - Next.js App Router pages and API routes
- `components/` - Reusable UI components (shadcn/ui)
- `contexts/` - React contexts (auth)
- `lib/` - Utility functions and API clients
- `tests/` - Playwright E2E tests with detailed documentation

## Key Features & Services

### RSS Feed Management
- Automatic RSS feed crawling and content extraction
- Content summarization using AI services
- Scheduled background processing via APScheduler

### Vision Board
- Personal goal tracking with categories, priorities, and target dates
- Image upload support
- CRUD operations with instant UI feedback

### Project Management
- Create/edit/delete projects and tasks
- Timeline (Gantt chart) and calendar views
- Drag-and-drop task management

### Authentication
- Client-side auth context with protected routes
- Placeholder auth dependency in `app/api/deps.py` (needs real implementation)

## Development Guidelines

### Database
- Always create Alembic migrations for schema changes
- Use async database operations throughout
- CRUD operations are centralized in `app/db/crud_*.py` files

### API Development
- Follow FastAPI dependency injection patterns
- Use Pydantic schemas for all request/response models
- Include proper error handling and status codes
- Add endpoints to `app/api/v1/endpoints/__init__.py`

### Frontend Development
- Use shadcn/ui components for consistent UI
- Implement proper TypeScript types
- Follow Next.js App Router conventions
- Use React Hook Form with Zod validation for forms

### Testing
- Write Playwright tests for new features in `frontend/tests/`
- Include test documentation in `frontend/tests/docs/`
- Backend tests use pytest with async support
- Maintain comprehensive test coverage

## Environment Setup

### Backend Dependencies
- Requires Python 3.12
- Uses conda environment management
- SQLite for development, supports PostgreSQL for production
- Redis for caching (optional, falls back gracefully)

### Frontend Dependencies
- Uses pnpm as package manager
- Next.js 15 with React 19
- Comprehensive Radix UI component library
- Playwright for E2E testing

## Important Notes

- The authentication system uses a placeholder dependency that needs production implementation
- RSS crawling includes content extraction via Crawl4AI and BeautifulSoup
- The project includes extensive Cursor rules and prompts in `awesome-cursorrules/` and `awesome-copilot/`
- All major features have corresponding Playwright tests with detailed documentation