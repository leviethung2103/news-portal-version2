# News Portal Dashboard - System Architecture Overview

This document provides a high-level overview of the system architecture for the News Portal Dashboard project.

## System Components

```mermaid
graph TD
    A[User Browser]
    B[Frontend (Next.js)]
    C[Backend API (FastAPI)]
    D[Database (SQLite)]
    E[Playwright Test Suite]

    A -- HTTP/HTTPS --> B
    B -- REST API --> C
    C -- SQL Queries --> D
    E -- Automated UI/API Tests --> B
    E -- Automated API Tests --> C
```

## Component Descriptions

- **User Browser**: Interacts with the application via a web interface.
- **Frontend (Next.js)**: Provides the user interface, handles routing, and communicates with the backend API. Located in the `frontend/` directory.
- **Backend API (FastAPI)**: Serves as the main API layer, handling business logic, authentication, and data processing. Located in the `backend/` directory.
- **Database (SQLite)**: Stores news articles, user data, and other persistent information. Managed by the backend.
- **Playwright Test Suite**: Automated end-to-end and integration tests for both frontend and backend, located in `frontend/tests/`.

## Data Flow

1. **User Interaction**: Users interact with the frontend via their browser.
2. **Frontend Requests**: The frontend sends API requests to the backend for data (e.g., news articles, authentication).
3. **Backend Processing**: The backend processes requests, interacts with the database, and returns responses to the frontend.
4. **Testing**: Playwright tests simulate user actions and verify both frontend and backend functionality.

## Directory Structure (Key Parts)

- `frontend/` - Next.js app, UI components, hooks, contexts, tests
- `backend/` - FastAPI backend, database, migrations, backend tests
- `docs/` - Documentation
- `awesome-copilot/`, `awesome-cursorrules/` - Project meta, rules, and prompts

---

*This architecture ensures a clear separation of concerns, scalability, and maintainability for the News Portal Dashboard project.*
