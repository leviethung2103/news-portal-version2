# Enhanced RSS News Portal - Setup Guide

This project integrates a FastAPI backend with a Next.js frontend to create an advanced news portal that fetches content from RSS feeds with database storage, scheduled cron jobs, and comprehensive management features.

## Project Structure

```
news-portal-dashboard/
├── fastapi-optimized-project/    # Backend (FastAPI)
├── frontend/                     # Frontend (Next.js)
├── test_integration.py          # Integration test script
└── SETUP.md                     # This file
```

## Prerequisites

- Python 3.12+
- Node.js 18+
- Poetry (for Python dependency management)
- npm or yarn

## Backend Setup (FastAPI)

1. Navigate to the backend directory:
```bash
cd fastapi-optimized-project
```

2. Install dependencies with Poetry:
```bash
poetry install
```

3. Activate the virtual environment:
```bash
poetry shell
```

4. Start the backend server:
```bash
python run.py
```

The backend will be available at `http://localhost:8000`

### Backend API Endpoints

#### Core Endpoints
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation

#### RSS Feed Management
- `GET /api/v1/rss/feeds` - Get all RSS feeds
- `POST /api/v1/rss/feeds` - Create new RSS feed (triggers immediate fetch)
- `PUT /api/v1/rss/feeds/{id}` - Update RSS feed
- `DELETE /api/v1/rss/feeds/{id}` - Delete RSS feed
- `POST /api/v1/rss/feeds/{id}/fetch` - Trigger immediate fetch for specific feed

#### RSS Content
- `GET /api/v1/rss/articles` - Get articles from database (with pagination)
- `GET /api/v1/rss/feeds/{id}/articles` - Get articles from specific feed
- `GET /api/v1/rss/items` - Legacy endpoint for backward compatibility

#### Cron Job Management
- `GET /api/v1/rss/cron-jobs` - Get all cron jobs
- `POST /api/v1/rss/cron-jobs` - Create new cron job
- `PUT /api/v1/rss/cron-jobs/{id}` - Update cron job
- `DELETE /api/v1/rss/cron-jobs/{id}` - Delete cron job
- `POST /api/v1/rss/cron-jobs/trigger-fetch` - Trigger immediate global fetch
- `GET /api/v1/rss/scheduler/status` - Get scheduler status

## Frontend Setup (Next.js)

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Testing the Integration

1. Make sure both backend and frontend are running
2. Run the integration test script:
```bash
python test_integration.py
```

This script will:
- Check if the backend is running
- Create sample RSS feeds if none exist
- Test all API endpoints
- Provide setup verification

## Using the Application

### Enhanced RSS Settings Page

Navigate to `http://localhost:3000/settings` for comprehensive RSS management with three main tabs:

#### 1. RSS Feeds Tab
- **Add RSS Feed**: Create new feeds with immediate content fetching
- **Edit Feed**: Modify feed settings including fetch intervals
- **Delete Feed**: Remove feeds and all associated articles
- **Immediate Fetch**: Trigger instant content retrieval for any feed
- **Fetch All**: Trigger global fetch for all active feeds

Feed configuration options:
- **Name**: Display name for the feed
- **URL**: RSS feed URL  
- **Category**: News category for filtering
- **Fetch Interval**: How often to check for new content (15 minutes to 24 hours)
- **Active**: Whether to include in scheduled fetches

#### 2. Cron Jobs Tab
- **Add Cron Job**: Create scheduled tasks for automatic RSS fetching
- **Edit Job**: Modify cron schedules and settings
- **Delete Job**: Remove scheduled tasks
- **Preset Schedules**: Quick selection for common intervals (15min, 1hour, daily, etc.)
- **Custom Cron**: Advanced cron expression support

#### 3. Status Tab
- **Scheduler Status**: Real-time view of the cron job scheduler
- **System Overview**: Statistics on feeds, jobs, and system health
- **Active Jobs**: List of currently scheduled tasks with next run times

### Viewing News

1. Go to the main news page at `http://localhost:3000`
2. News articles are automatically fetched from configured RSS feeds and stored in the database
3. Use the sidebar to filter by category
4. Articles include full content extraction, publication dates, and source information
5. Content is continuously updated based on your cron job schedules

## Configuration

### Environment Variables

Create a `.env` file in the frontend directory:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Database Configuration

The backend uses SQLite for development (stored in `news_portal.db`). All data is persisted including:
- RSS feed configurations
- Fetched articles with full content
- Cron job schedules and execution history
- Error tracking and statistics

For production, update the `DATABASE_URL` in `.env` to use PostgreSQL.

## Sample RSS Feeds

The integration test script adds these sample feeds:
- BBC News (World)
- TechCrunch (Technology) 
- Reuters Business (Business)

You can add more feeds through the settings page.

## Troubleshooting

### Backend Issues

1. **Cannot connect to backend**: Make sure FastAPI server is running on port 8000
2. **Import errors**: Ensure you're in the Poetry virtual environment
3. **RSS parsing errors**: Check that RSS URLs are valid and accessible

### Frontend Issues

1. **API connection errors**: Verify backend is running and CORS is configured
2. **Build errors**: Check Next.js configuration and dependencies
3. **Component errors**: Ensure all required UI components are installed

### Common Solutions

1. **CORS errors**: The backend is configured to allow all origins in development
2. **API proxy**: Next.js is configured to proxy `/api/v1/*` requests to the backend
3. **Error handling**: Both frontend and backend include comprehensive error handling

## Production Deployment

### Backend
- Use a production WSGI server like Gunicorn
- Configure proper database instead of JSON file storage
- Set up environment-specific configurations
- Enable proper logging and monitoring

### Frontend
- Build the application: `npm run build`
- Use a production server or deploy to Vercel/Netlify
- Configure environment variables for production API URL
- Enable proper error tracking

## Architecture

### Backend Components
- **FastAPI**: RESTful API with automatic documentation
- **SQLAlchemy**: Async ORM for database operations
- **APScheduler**: Cron job scheduling with persistent storage
- **RSS Processing**: Content extraction with BeautifulSoup
- **Database**: SQLite (dev) / PostgreSQL (prod) for all data persistence

### Frontend Components  
- **Next.js**: React framework with TypeScript
- **Tailwind CSS + shadcn/ui**: Modern component library
- **Tabbed Interface**: Organized settings with RSS feeds, cron jobs, and status
- **Real-time Updates**: Live scheduler status and job monitoring

### Data Flow
1. **RSS Feeds** → **Scheduler** → **Content Processing** → **Database Storage**
2. **Database** → **API Endpoints** → **Frontend Display**
3. **User Actions** → **Immediate Processing** + **Future Scheduling**

### Key Features
- **Immediate Fetch**: New feeds trigger instant content retrieval
- **Scheduled Fetching**: Configurable cron jobs for automated updates
- **Deduplication**: Articles identified by GUID/URL to prevent duplicates
- **Error Handling**: Comprehensive error tracking and retry mechanisms
- **Content Extraction**: Full article text extraction from RSS links