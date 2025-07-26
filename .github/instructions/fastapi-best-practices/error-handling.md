---
description: 'Error handling patterns and best practices for FastAPI applications'
applyTo: '**/middleware.py'
---

# Error Handling in FastAPI

## Error Handling Strategy

### 1. HTTP Exception Handling
- Use `HTTPException` for expected error conditions
- Define custom exception handlers for specific error types
- Return consistent error response formats
- Include helpful error messages for API consumers

### 2. Global Exception Handler
- Catch unhandled exceptions
- Log detailed error information
- Return user-friendly error responses
- Sanitize error messages in production

### 3. Validation Errors
- Use Pydantic models for request validation
- Customize validation error responses
- Include field-level error details

## Implementation

### 1. Custom Exception Classes

```python
# app/core/exceptions.py
from fastapi import status
from fastapi.exceptions import HTTPException
from typing import Any, Dict, Optional

class AppExceptionCase(Exception):
    def __init__(self, status_code: int, context: Dict):
        self.exception_case = self.__class__.__name__
        self.status_code = status_code
        self.context = context

    def __str__(self):
        return (
            f"<{self.exception_case}: "
            + f"status_code={self.status_code}, context={self.context}>"
        )

class NotFoundException(AppExceptionCase):
    def __init__(self, context: Dict[str, Any]):
        super().__init__(status.HTTP_404_NOT_FOUND, context)

class UnauthorizedException(AppExceptionCase):
    def __init__(self, context: Dict[str, Any] = None):
        context = context or {"message": "Authentication required"}
        super().__init__(status.HTTP_401_UNAUTHORIZED, context)

# Add more custom exceptions as needed
```

### 2. Exception Handler

```python
# app/api/dependencies/exception_handlers.py
from fastapi import Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from app.core.exceptions import AppExceptionCase

async def app_exception_handler(request: Request, exc: AppExceptionCase) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.context.get("message", "An error occurred"),
                "details": exc.context,
            }
        },
    )

async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "details": {},
            }
        },
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": status.HTTP_422_UNPROCESSABLE_ENTITY,
                "message": "Validation Error",
                "details": {"errors": exc.errors()},
            }
        },
    )
```

### 3. Register Exception Handlers

```python
# app/main.py
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from .api.dependencies.exception_handlers import (
    app_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from .core.exceptions import AppExceptionCase

app = FastAPI()

# Register exception handlers
app.add_exception_handler(AppExceptionCase, app_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
```

## Best Practices

### 1. Error Response Format
- Use a consistent error response format across the API
- Include error codes for programmatic handling
- Provide human-readable error messages
- Include additional context when helpful

### 2. Logging
- Log all errors with appropriate severity levels
- Include request context in error logs
- Avoid logging sensitive information
- Use structured logging for better querying

### 3. Security
- Sanitize error messages in production
- Don't leak stack traces to clients
- Rate limit error responses to prevent information leakage
- Log security-related errors with higher severity

### 4. Client-Specific Errors
- Return appropriate HTTP status codes
- Include error codes for client-side handling
- Provide recovery suggestions when possible
- Document all possible error responses in API docs

## Example Usage

```python
from fastapi import APIRouter, Depends, HTTPException
from app.core.exceptions import NotFoundException

router = APIRouter()

@router.get("/items/{item_id}")
async def read_item(item_id: int):
    item = await get_item_from_db(item_id)
    if not item:
        raise NotFoundException({"item_id": item_id, "message": "Item not found"})
    return item
```
