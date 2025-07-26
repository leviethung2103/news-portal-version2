from fastapi import APIRouter

from . import users  # Import all your endpoint modules here
from . import rss
from . import vision_board
from . import projects


# Main API router
api_router = APIRouter()


# Include all your routers here
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(rss.router, prefix="/rss", tags=["rss"])
api_router.include_router(vision_board.router, prefix="/vision-board", tags=["vision-board"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])

# Export as 'router' for main.py import
router = api_router

# You can add more routers like this:
# api_router.include_router(items.router, prefix="/items", tags=["items"])
