---
description: 'Performance optimization techniques for FastAPI applications'
applyTo: '**/api/**/*.py'
---

# Performance Optimization in FastAPI

## Asynchronous Programming

### 1. Use `async/await` for I/O-Bound Operations
- Database queries
- External API calls
- File I/O operations
- Network requests

### 2. Avoid Blocking Operations
- Use thread pools for CPU-bound tasks
- Offload heavy processing to background tasks
- Use `asyncio.to_thread` for legacy synchronous code

## Caching Strategies

### 1. Response Caching
```python
from fastapi import FastAPI
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache
from redis import asyncio as aioredis

app = FastAPI()

# Initialize Redis cache
@app.on_event("startup")
async def startup():
    redis = aioredis.from_url("redis://localhost", encoding="utf8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")

# Cache response for 5 minutes (300 seconds)
@cache(expire=300)
@app.get("/expensive-query")
async def expensive_query():
    # Your expensive operation here
    return {"data": "result"}
```

### 2. In-Memory Caching
```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_expensive_data():
    # CPU-intensive operation
    return result
```

## Database Optimization

### 1. Query Optimization
- Use `selectinload` for eager loading of relationships
- Use `defer` to load only necessary columns
- Implement pagination for large result sets

### 2. Connection Pooling
```python
# In your database configuration
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,  # Adjust based on your needs
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,  # Recycle connections after 1 hour
)
```

## Request/Response Optimization

### 1. Response Models
- Use Pydantic's `response_model` for automatic validation
- Exclude unset fields with `response_model_exclude_unset=True`
- Use `response_model_include` to return only necessary fields

### 2. Compression
```python
from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI()
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,  # Only compress responses larger than 1KB
)
```

## Background Tasks

### 1. Offload Non-Critical Work
```python
from fastapi import BackgroundTasks, FastAPI

app = FastAPI()

def process_data_in_background(data: dict):
    # Process data asynchronously
    pass

@app.post("/process")
async def process_data(data: dict, background_tasks: BackgroundTasks):
    background_tasks.add_task(process_data_in_background, data)
    return {"status": "processing in background"}
```

### 2. Task Queues
- Use Celery with Redis/RabbitMQ for distributed task processing
- Implement retry mechanisms for failed tasks
- Monitor task progress and status

## Performance Monitoring

### 1. Middleware for Request Timing
```python
import time
from fastapi import Request

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

### 2. Monitoring Tools
- Prometheus for metrics collection
- Grafana for visualization
- Sentry for error tracking
- OpenTelemetry for distributed tracing

## Best Practices

1. **Minimize Payload Size**
   - Compress responses
   - Use pagination
   - Limit response fields

2. **Connection Management**
   - Reuse connections
   - Implement connection pooling
   - Set appropriate timeouts

3. **Caching Strategy**
   - Cache at multiple levels (CDN, application, database)
   - Set appropriate TTLs
   - Invalidate cache on data changes

4. **Asynchronous Processing**
   - Use background tasks for non-critical operations
   - Implement task queues for heavy processing
   - Monitor background task performance

5. **Database Access**
   - Optimize queries with indexes
   - Use read replicas for read-heavy workloads
   - Implement connection pooling
