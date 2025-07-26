---
description: 'FastAPI application structure and component usage guidelines'
applyTo: '**/main.py'
---

# FastAPI Application Structure

## Recommended Project Structure

```
project/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application entry point
│   ├── api/                 # API routes
│   │   ├── __init__.py
│   │   └── v1/              # API versioning
│   │       ├── __init__.py
│   │       ├── endpoints/    # Route handlers
│   │       ├── models/       # Pydantic models
│   │       └── deps.py       # Dependencies
│   ├── core/                # Core functionality
│   │   ├── __init__.py
│   │   ├── config.py        # Configuration
│   │   └── security.py      # Authentication/authorization
│   ├── db/                  # Database models and session
│   │   ├── __init__.py
│   │   ├── models/          # SQLAlchemy models
│   │   └── session.py       # Database session
│   └── schemas/             # Pydantic schemas
│       └── __init__.py
├── tests/                   # Test files
├── alembic/                 # Database migrations
├── static/                  # Static files
└── requirements/            # Dependency files
```

## Key Guidelines

### 1. Application Entry Point (`main.py`)
- Keep the main application file clean and minimal
- Configure CORS, middleware, and exception handlers
- Include API router mounting
- Implement lifespan context managers for startup/shutdown events

### 2. Route Organization
- Use API versioning (e.g., `/api/v1/...`)
- Group related routes in separate router modules
- Keep route handlers focused and delegate business logic to service layers

### 3. Component Usage
- **Pydantic Models**: Use for request/response validation
- **Dependency Injection**: Leverage FastAPI's dependency injection system
- **Async/Sync**: Use `async def` for I/O-bound operations, `def` for CPU-bound operations

### 4. Best Practices
- Use environment variables for configuration
- Implement proper error handling and logging
- Include health check endpoints
- Document API endpoints with docstrings and OpenAPI tags
- Use type hints consistently

### Example main.py
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1.api import api_router
from .core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize resources
    print("Starting up...")
    yield
    # Shutdown: Clean up resources
    print("Shutting down..."

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
```
