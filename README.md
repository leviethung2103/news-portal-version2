
# News Portal Dashboard

## How to Run the Frontend

1. **Install dependencies** (using pnpm):
   ```sh
   pnpm install
   ```

2. **Run the development server:**
   ```sh
   pnpm dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

3. **Build for production:**
   ```sh
   pnpm build
   pnpm start
   ```

---

## Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```sh
   cd fastapi-optimized-project
   ```

2. Install dependencies with Poetry:
   ```sh
   poetry install
   ```

3. Activate the virtual environment:
   ```sh
   poetry shell
   ```

4. Start the backend server:
   ```sh
   python run.py
   ```

The backend will be available at [http://localhost:8000](http://localhost:8000)

---


---

## End-to-End Testing (Playwright)

This project uses [Playwright](https://playwright.dev/) for E2E testing of all major frontend features.

### Running E2E Tests

1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Install dependencies (if not already done):
   ```sh
   npm install
   ```
3. Run the tests:
   ```sh
   npx playwright test
   ```
   - Test specs are located in `frontend/tests/*.spec.ts`.
   - Test documentation is in `frontend/tests/docs/`.
   - Test results and error context snapshots are in `frontend/test-results/` and `frontend/tests/reports/`.

### Notes
- Playwright tests cover authentication, article, dashboard, home, login, news, settings, and vision board features.
- All tests use accessible, user-facing locators and web-first assertions.
- See the Markdown docs in `frontend/tests/docs/` for detailed test case descriptions.

---

## Authentication Context

The frontend now includes a client-side authentication context and wrapper for protected routes:
- `frontend/contexts/auth-context.tsx`: Provides authentication state and methods.
- `frontend/components/auth-wrapper.tsx`: Protects pages/components based on authentication status.

---

For more details, see the project documentation or contact the maintainer.
