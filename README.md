


# News Portal Dashboard


## Documentation

- **Product Requirements Document:** See [`prd.md`](./prd.md) for a detailed product overview, goals, user stories, and technical requirements.
- **Project Management:** Task breakdown and progress tracking are in [`tasks/README.md`](./tasks/README.md) and [`tasks/project-tracking.md`](./tasks/project-tracking.md).




## Running the Project

### Frontend (Next.js)

1. **Navigate to the frontend directory:**
   ```sh
   cd frontend
   ```

2. **Install dependencies** (using pnpm):
   ```sh
   pnpm install
   ```

3. **Run the development server:**
   ```sh
   pnpm dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

4. **Build for production:**
   ```sh
   pnpm build
   pnpm start
   ```

#### OpenAI Config Page

- Access the OpenAI Config page from the sidebar to securely store your OpenAI API key in the browser (local storage).
- This enables AI-powered features in the app (e.g., chatbot, content generation).

---




### Backend (FastAPI)

> **Note:**
> The backend uses a dependency in `app/api/deps.py` for user authentication (`get_current_user`). This is currently a placeholder and should be replaced with real authentication logic (e.g., OAuth2, JWT) for production use.

1. **Navigate to the backend directory:**
   ```sh
   cd fastapi-optimized-project
   ```

2. **Create and activate a conda environment:**
   ```sh
   conda create -n news-portal python=3.12
   conda activate news-portal
   ```

3. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   # OR install conda packages where available
   conda install fastapi uvicorn
   pip install -r requirements.txt  # for packages not available in conda
   ```

4. **Start the backend server:**
   ```sh
   python run.py
   ```
   The backend will be available at [http://localhost:8000](http://localhost:8000)

---


---


## Project Management Features

- Create, edit, and delete projects and tasks.
- Visualize project timelines with a Gantt chart and calendar view.
- Click on projects or tasks in the timeline/calendar to edit details.
- All project data is managed via the FastAPI backend.

## Vision Board

- Organize and track your goals visually.
- Add, edit, and delete vision items with categories, priorities, and target dates.
- Improved feedback and instant UI updates on item deletion.

## Sidebar Navigation

- Quickly access News, Projects, Vision Board, AI Chatbot, Settings, and OpenAI Config from the sidebar.
- Sidebar is responsive and optimized for both desktop and mobile.

This project uses [Playwright](https://playwright.dev/) for E2E testing of all major frontend features.

#### Example: Projects Page E2E Test
- The file `frontend/tests/projects.spec.ts` contains comprehensive Playwright tests for the Projects management page, including UI, dialog, and view switching coverage.


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
- Projects page E2E tests are in `frontend/tests/projects.spec.ts`.
- All tests use accessible, user-facing locators and web-first assertions.
- See the Markdown docs in `frontend/tests/docs/` for detailed test case descriptions.

---


## Authentication Context

The frontend now includes a client-side authentication context and wrapper for protected routes:
- `frontend/contexts/auth-context.tsx`: Provides authentication state and methods.
- `frontend/components/auth-wrapper.tsx`: Protects pages/components based on authentication status.

---


---

For more details, see the project documentation or contact the maintainer.
