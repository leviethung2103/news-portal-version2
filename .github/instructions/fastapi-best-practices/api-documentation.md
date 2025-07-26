---
description: 'API documentation standards and best practices for FastAPI applications'
applyTo: '**/routers/**/*.py'
---

# API Documentation Standards

## Documentation Guidelines

### 1. Docstrings and Type Hints
- Use Google-style docstrings for all public functions and classes
- Include type hints for all function parameters and return values
- Document all route parameters, request bodies, and responses
- Include examples in docstrings where helpful

### 2. Pydantic Models
- Use descriptive field descriptions
- Add examples for complex fields
- Document validation rules in field descriptions
- Use proper field types and constraints

### 3. Route Documentation
- Use descriptive route summaries and descriptions
- Tag related routes for better organization in the docs
- Document all possible response status codes
- Include security requirements for protected routes

## Example Implementation

### Route with Documentation

```python
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel, EmailStr
from datetime import datetime

router = APIRouter(prefix="/users", tags=["users"])

class UserBase(BaseModel):
    """Base user model with common attributes."""
    email: EmailStr
    full_name: str | None = None

class UserCreate(UserBase):
    """Model for creating a new user."""
    password: str

class UserInDB(UserBase):
    """User model as stored in the database."""
    id: int
    is_active: bool = True
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        orm_mode = True

@router.post(
    "/",
    response_model=UserInDB,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user",
    description="Creates a new user with the provided information.",
    responses={
        201: {"description": "User created successfully"},
        400: {"description": "Invalid input data"},
        409: {"description": "User with this email already exists"}
    }
)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user in the system.
    
    Args:
        user: The user data to create
        db: Database session dependency
        
    Returns:
        UserInDB: The created user with system-generated fields
        
    Raises:
        HTTPException: If user with email already exists or validation fails
    """
    # Implementation here
    pass
```

### Pydantic Model with Documentation

```python
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class UserUpdate(BaseModel):
    """Model for updating user information."""
    email: Optional[EmailStr] = Field(
        None,
        description="User's email address. Must be unique across the platform.",
        example="user@example.com"
    )
    full_name: Optional[str] = Field(
        None,
        description="User's full name",
        example="John Doe"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Whether the user account is active. Inactive users cannot log in.",
        example=True
    )
    
    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "full_name": "John Doe",
                "is_active": True
            }
        }
```

## Documentation Best Practices

1. **Be Consistent**
   - Use consistent formatting across all docstrings and documentation
   - Follow the same structure for similar endpoints
   
2. **Be Descriptive**
   - Explain the purpose of each endpoint
   - Document all parameters and their constraints
   - Include examples for complex request/response structures
   
3. **Document Errors**
   - List all possible error responses
   - Include error codes and their meanings
   - Provide guidance on how to handle errors
   
4. **Keep it Updated**
   - Update documentation when making code changes
   - Remove or mark deprecated endpoints
   - Keep examples up to date with the current API

5. **Use Tags**
   - Group related endpoints using tags
   - Use consistent tag naming across the application
   - Document tag purposes in the main API description
