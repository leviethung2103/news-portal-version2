#!/usr/bin/env python3
"""
Run the FastAPI application.

This script provides commands to run the application in different modes.
"""
import os
import subprocess
import sys
import uvicorn
from pathlib import Path

def print_help():
    """Print help message."""
    print("""
Usage: python run.py [command]

Available commands:
    dev         Run the development server with auto-reload
    prod        Run the production server
    test        Run tests
    lint        Run code linters
    format      Format code with Black and isort
    shell       Open a Python shell with the app context
    db-create   Create database tables
    db-drop     Drop all database tables
    help        Show this help message
    """)

def run_dev():
    """Run the development server."""
    print("Starting development server...")
    os.environ["APP_ENV"] = "development"
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["app"],
        log_level="info",
        workers=1,
    )

def run_prod():
    """Run the production server."""
    print("Starting production server...")
    os.environ["APP_ENV"] = "production"
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        workers=4,
        loop="uvloop",
        http="httptools",
    )

def run_tests():
    """Run tests."""
    print("Running tests...")
    os.environ["TESTING"] = "1"
    subprocess.run(["pytest", "tests/", "-v"], check=True)

def run_lint():
    """Run code linters."""
    print("Running linters...")
    subprocess.run(["flake8", "app", "tests"], check=True)
    subprocess.run(["mypy", "app", "tests"], check=True)
    print("✅ Linting passed!")

def run_format():
    """Format code with Black and isort."""
    print("Formatting code...")
    subprocess.run(["black", "app", "tests"], check=True)
    subprocess.run(["isort", "app", "tests"], check=True)
    print("✅ Code formatted!")

def run_shell():
    """Open a Python shell with the app context."""
    print("Starting Python shell with app context...")
    import IPython
    from app.db.session import AsyncSessionLocal
    from app.models.user import User
    from app.core.security import get_password_hash
    from app.core.config import settings
    
    # Initialize async session
    db = AsyncSessionLocal()
    
    # Make objects available in the shell
    user_ctx = {
        "db": db,
        "User": User,
        "settings": settings,
        "get_password_hash": get_password_hash,
    }
    
    IPython.start_ipython(argv=[], user_ns=user_ctx)

def run_db_create():
    """Create database tables."""
    print("Creating database tables...")
    from app.db.session import engine, Base
    import asyncio
    
    async def create_tables():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Database tables created!")
    
    asyncio.run(create_tables())

def run_db_drop():
    """Drop all database tables."""
    print("Dropping all database tables...")
    from app.db.session import engine, Base
    import asyncio
    
    async def drop_tables():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        print("✅ Database tables dropped!")
    
    asyncio.run(drop_tables())

def main():
    """Main entry point for the script."""
    if len(sys.argv) < 2:
        print_help()
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    commands = {
        "dev": run_dev,
        "prod": run_prod,
        "test": run_tests,
        "lint": run_lint,
        "format": run_format,
        "shell": run_shell,
        "db-create": run_db_create,
        "db-drop": run_db_drop,
        "help": print_help,
    }
    
    if command not in commands:
        print(f"Unknown command: {command}\n")
        print_help()
        sys.exit(1)
    
    try:
        commands[command]()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(0)
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed with exit code {e.returncode}")
        sys.exit(e.returncode)
    except Exception as e:
        print(f"❌ An error occurred: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
