---
description: 'Dependency management and virtual environment setup for Python projects'
applyTo: '**/pyproject.toml'
---

# Python Dependency Management

## Virtual Environment Setup

### 1. Creating a Virtual Environment

```bash
# Create a new virtual environment
python -m venv .venv

# Activate on Unix/macOS
source .venv/bin/activate

# Activate on Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Activate on Windows (Command Prompt)
.venv\Scripts\activate.bat
```

### 2. Using Poetry for Dependency Management

#### Installation
```bash
# Install Poetry (recommended way)
curl -sSL https://install.python-poetry.org | python3 -

# Verify installation
poetry --version
```

#### Basic Commands
```bash
# Initialize a new project
poetry new project-name

# Install dependencies
poetry install

# Add a production dependency
poetry add package-name

# Add a development dependency
poetry add --group dev package-name

# Update all dependencies
poetry update

# Run commands within the virtual environment
poetry run python script.py

# Start a shell within the virtual environment
poetry shell

# Export requirements.txt (if needed)
poetry export -f requirements.txt --output requirements.txt --without-hashes
```

## Project Structure

### Recommended `pyproject.toml` Structure

```toml
[tool.poetry]
name = "project-name"
version = "0.1.0"
description = "Project description"
authors = ["Your Name <your.email@example.com>"]
license = "MIT"
readme = "README.md"

[tool.poetry.dependencies]
python = "^3.12"
fastapi = "^0.104.0"
uvicorn = "^0.24.0"
pydantic = "^2.5.0"
sqlalchemy = {extras = ["asyncio"], version = "^2.0.23"}

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
pytest-asyncio = "^0.21.1"
black = "^23.7.0"
isort = "^5.12.0"
mypy = "^1.5.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.black]
line-length = 88
target-version = ['py312']
include = '\.pyi?$'

[tool.isort]
profile = "black"
line_length = 88

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = ["test_*.py"]
```

## Best Practices

### 1. Version Control
- Commit both `pyproject.toml` and `poetry.lock` to version control
- The `poetry.lock` file ensures reproducible builds across environments
- Never manually edit the `poetry.lock` file

### 2. Dependency Management
- Pin exact versions for production dependencies
- Use version constraints (e.g., `^` for compatible updates, `~` for patch updates)
- Group development dependencies appropriately
- Document any system dependencies in the README

### 3. Development Workflow
```bash
# Install all dependencies (including development)
poetry install

# Add a new dependency
poetry add package-name

# Update a specific package
poetry update package-name

# Check for outdated packages
poetry show --outdated

# Run tests
poetry run pytest

# Format code
poetry run black .
poetry run isort .

# Type checking
poetry run mypy .
```

### 4. CI/CD Integration

Example GitHub Actions workflow:

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.12"]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}
    
    - name: Install Poetry
      uses: snok/install-poetry@v1
      with:
        version: 1.6.1
    
    - name: Set up cache
      uses: actions/cache@v3
      with:
        path: ~/.cache/pypoetry/virtualenvs
        key: ${{ runner.os }}-poetry-${{ hashFiles('**/poetry.lock') }}
        restore-keys: |
          ${{ runner.os }}-poetry-
    
    - name: Install dependencies
      run: |
        poetry config virtualenvs.in-project true
        poetry install --no-interaction --no-root
        poetry install --no-interaction
    
    - name: Run tests
      run: |
        poetry run pytest tests/ -v --cov=app --cov-report=xml
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
        fail_ci_if_error: false
```

## Troubleshooting

### Common Issues

1. **Version Conflicts**
   ```bash
   # Show the dependency tree to identify conflicts
   poetry show --tree
   
   # Update all dependencies to their latest compatible versions
   poetry update
   ```

2. **Clearing Caches**
   ```bash
   # Clear Poetry's cache
   poetry cache clear --all pypi
   
   # Remove the virtual environment and reinstall
   rm -rf .venv
   poetry install
   ```

3. **Working Behind a Proxy**
   ```bash
   # Configure Poetry to use a proxy
   poetry config http-basic.pypi <username> <password>
   poetry config repositories.pypi https://pypi.org/simple/
   ```
