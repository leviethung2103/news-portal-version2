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

## Installation (Conda Only)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fastapi-optimized.git
   cd fastapi-optimized
   ```

2. **Create and activate a conda environment**
   ```bash
   conda create -n news-portal python=3.12
   conda activate news-portal
   ```

3. **Install dependencies**
   ```bash
   # Install pip dependencies in conda environment
   pip install -r requirements.txt

   # OR install conda packages where available
   conda install fastapi uvicorn
   pip install -r requirements.txt  # for packages not available in conda
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Set up the database**
   ```bash
   # Create a PostgreSQL database
   createdb fastapi_optimized

   # Run migrations
   alembic upgrade head
   ```

6. **Run the application**
   ```bash
   # Development
   uvicorn app.main:app --reload

   # Production (with Gunicorn)
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
   ```

## Running with Conda

You can use conda to manage your environment and dependencies for this project. Poetry is not required.

### Using the built-in run.py script (Recommended)

This project includes a convenient `run.py` script that handles uvicorn startup with pre-configured settings.

```bash
# Navigate to the project directory
cd fastapi-optimized-project

# For development (with auto-reload)
python run.py dev

# For production
python run.py prod

# Other available commands
python run.py test      # Run tests
python run.py lint      # Run code linters
python run.py format    # Format code
python run.py shell     # Open Python shell with app context
python run.py db-create # Create database tables
python run.py db-drop   # Drop all database tables
python run.py help      # Show help message
```

### Direct uvicorn commands with conda

```bash
# Development mode (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Using conda's python specifically
$(which python) -m uvicorn app.main:app --reload
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


### API Testing & Reporting Workflow

#### Prerequisites
- Python 3.12+
- Conda installed (or venv for virtual environments)
- All backend dependencies installed (`pip install -r requirements.txt`)
- FastAPI backend running (see above)
- (Optional) PostgreSQL and Redis running for full integration tests

#### Workflow Steps

1. **Prepare the Environment**
   ```sh
   conda create -n news-portal python=3.12
   conda activate news-portal
   pip install -r requirements.txt
   ```
   Ensure the backend is running:
   ```sh
   uvicorn app.main:app --reload --port 8000
   ```

2. **Run API Tests**
   - To run all tests:
     ```sh
     pytest
     ```
   - To run with coverage:
     ```sh
     pytest --cov=app --cov-report=term-missing
     ```
   - To run integration tests (if present):
     ```sh
     python ../../test_integration.py
     ```

3. **Generate Test Reports**
   - Pytest will output results to the terminal by default.
   - To generate a JUnit XML report:
     ```sh
     pytest --junitxml=tests/reports/python-api-report.xml
     ```
   - To generate an HTML report (requires `pytest-html`):
     ```sh
     pytest --html=tests/reports/python-api-report.html
     ```

4. **Review and Interpret Results**
   - Review the summary for passed/failed tests.
   - For integration tests, check the printed summary and any error messages.
   - Reports are saved in `tests/reports/` for CI/CD and manual review.

5. **Success Criteria**
   - ✅ All critical API endpoints are covered by tests.
   - ✅ All tests pass (or failures are documented and triaged).
   - ✅ Reports are generated and stored in `tests/reports/`.
   - ✅ Code follows Python best practices and project conventions.

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
