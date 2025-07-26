# Optimized FastAPI Project

A production-ready FastAPI project with performance optimizations, async support, and best practices.

## Features

- 🚀 **FastAPI** with Python 3.12
- ⚡ **Async** database operations with SQLAlchemy 2.0
- 🗃 **PostgreSQL** database with asyncpg
- 🔒 **JWT** authentication
- 🗄 **Redis** caching
- 📊 **Prometheus** metrics (optional)
- ✅ **Pydantic** for data validation
- 🧪 **Pytest** for testing
- 🧹 **Black** and **isort** for code formatting
- 📝 **OpenAPI** documentation

## Prerequisites

- Python 3.12+
- PostgreSQL 13+
- Redis 6+
- Poetry (for dependency management)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fastapi-optimized.git
   cd fastapi-optimized
   ```

2. **Set up a virtual environment and install dependencies**
   ```bash
   poetry install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create a PostgreSQL database
   createdb fastapi_optimized
   
   # Run migrations
   alembic upgrade head
   ```

5. **Run the application**
   ```bash
   # Development
   uvicorn app.main:app --reload
   
   # Production (with Gunicorn)
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
   ```

## Project Structure

```
fastapi-optimized/
├── app/
│   ├── api/                  # API routes
│   │   └── v1/               # API version
│   │       ├── endpoints/     # Route handlers
│   │       └── __init__.py   # API router
│   ├── core/                 # Core functionality
│   │   ├── config.py         # Configuration
│   │   └── security.py       # Authentication and security
│   ├── db/                   # Database models and sessions
│   ├── models/               # SQLAlchemy models
│   └── schemas/              # Pydantic models
├── tests/                    # Test files
├── .env                      # Environment variables
├── .gitignore
├── alembic.ini               # Database migrations
├── poetry.lock
├── pyproject.toml            # Project dependencies
└── README.md
```

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Development

### Code Formatting

```bash
# Auto-format code
black .
isort .

# Check code style
flake8
mypy .
```

### Testing

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=term-missing
```

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description of changes"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

## Deployment

### Docker

```bash
# Build the image
docker build -t fastapi-optimized .

# Run the container
docker run -d --name fastapi-optimized -p 8000:80 fastapi-optimized
```

### Kubernetes

See the `k8s/` directory for Kubernetes deployment files.

## Performance Tips

- Use `async`/`await` for I/O-bound operations
- Enable Redis caching for frequently accessed data
- Use connection pooling for database connections
- Implement rate limiting for public APIs
- Use Pydantic's `exclude_unset` for PATCH operations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- [Pydantic](https://pydantic-docs.helpmanual.io/)
- [Poetry](https://python-poetry.org/)
- [Alembic](https://alembic.sqlalchemy.org/)
