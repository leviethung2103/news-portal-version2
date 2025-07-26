---
description: 'Database interaction patterns and best practices for FastAPI applications'
applyTo: '**/db/**/*.py'
---

# Database Interaction in FastAPI

## Recommended Database Libraries

### Core Libraries
- **Async Database Drivers**:
  - PostgreSQL: `asyncpg` (recommended) or `aiopg`
  - MySQL: `aiomysql`
  - SQLite: `aiosqlite` (for development/testing)

### ORM and Query Builders
- **SQLAlchemy 2.0+** (with async support)
- **Databases** (lightweight async database library)
- **Tortoise ORM** (async ORM inspired by Django)
- **SQLModel** (SQLAlchemy + Pydantic integration)

## SQLAlchemy Async Patterns

### Database Session Setup

```python
# db/session.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from ..core.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=settings.DEBUG,  # Enable SQL query logging in debug mode
    future=True,  # Enable SQLAlchemy 2.0 features
    pool_size=20,  # Adjust based on your needs
    max_overflow=10,
    pool_pre_ping=True,  # Check connection health
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for all models
Base = declarative_base()

# Dependency to get DB session
async def get_db() -> AsyncSession:
    """Dependency that provides a database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

### Async CRUD Operations

```python
# db/crud/base.py
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from .base import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, id: Any) -> Optional[ModelType]:
        result = await db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        result = await db.execute(
            select(self.model).offset(skip).limit(limit).order_by(self.model.id)
        )
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: CreateSchemaType) -> ModelType:
        db_obj = self.model(**obj_in.dict())  # type: ignore
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        obj_data = obj_in.dict(exclude_unset=True) if not isinstance(obj_in, dict) else obj_in
        
        for field, value in obj_data.items():
            setattr(db_obj, field, value)
            
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, *, id: int) -> ModelType:
        obj = await self.get(db, id)
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj
```

## Best Practices

### 1. Connection Management
- Use connection pooling with appropriate pool sizes
- Implement proper connection cleanup in exception handlers
- Use context managers for transaction management

### 2. Query Optimization
- Use `selectinload` or `joinedload` for eager loading relationships
- Avoid N+1 query problems
- Use `select` instead of `session.query` in SQLAlchemy 2.0+

### 3. Error Handling
- Implement proper error handling for database operations
- Use specific exception types for different error scenarios
- Log database errors with appropriate context

### 4. Performance
- Use `execution_options` for query timeouts
- Implement pagination for list endpoints
- Consider using read replicas for read-heavy operations

### 5. Testing
- Use transaction rollbacks in tests to isolate test data
- Consider using a separate test database
- Use fixtures for common test data setup
