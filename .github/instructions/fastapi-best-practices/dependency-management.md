---
description: 'Dependency management and virtual environment setup for Python projects'
applyTo: '**/pyproject.toml'
---

# Python Dependency Management

## Virtual Environment Setup

### 1. Creating a Virtual Environment

```bash
- Commit your `requirements.txt` (and optionally `pyproject.toml` if using) to version control
- Use `requirements.txt` to ensure reproducible builds across environments
# Activate on Unix/macOS
source .venv/bin/activate

conda create -n myenv python=3.12
conda activate myenv

# Install all dependencies (including development)
pip install -r requirements.txt

# Add a new dependency
pip install package-name
pip freeze > requirements.txt

# Update all dependencies (manually update requirements.txt as needed)
pip install --upgrade -r requirements.txt

# Check for outdated packages
pip list --outdated

# Run tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=term-missing

# Format code
black .
isort .

# Type checking
mypy .
.venv\Scripts\Activate.ps1

# Activate on Windows (Command Prompt)
.venv\Scripts\activate.bat
```


### 2. Using Conda and pip for Dependency Management

#### Installation and Environment Setup
```bash
# Create a new conda environment
conda create -n myenv python=3.12
conda activate myenv

# (Optional) Create a virtual environment with venv
python -m venv .venv
source .venv/bin/activate  # On Unix/macOS
# .venv\Scripts\activate.bat  # On Windows (Command Prompt)
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
```bash
# Install dependencies from requirements.txt
pip install -r requirements.txt

# Add a new dependency
pip install package-name
# (Optional) Add to requirements.txt
pip freeze > requirements.txt

# Update all dependencies (manually update requirements.txt as needed)
pip install --upgrade -r requirements.txt

# Run your application
python script.py

# Export current environment to requirements.txt
pip freeze > requirements.txt
```

## Project Structure

## Best Practices

### 1. Version Control

### 2. Dependency Management
- Pin exact versions for production dependencies
- Use version constraints (e.g., `^` for compatible updates, `~` for patch updates)
- Group development dependencies appropriately
- Document any system dependencies in the README

### 3. Development Workflow
```bash
# Create and activate your environment (if not already active)
conda create -n myenv python=3.12
conda activate myenv

# Install all dependencies (including development)
pip install -r requirements.txt

# Add a new dependency
pip install package-name
pip freeze > requirements.txt

# Update all dependencies (manually update requirements.txt as needed)
pip install --upgrade -r requirements.txt

# Check for outdated packages
pip list --outdated

# Run tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=term-missing

# Format code
black .
isort .

# Type checking
mypy .
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
