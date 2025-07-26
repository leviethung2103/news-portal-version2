from fastapi import APIRouter

from . import users  # Import all your endpoint modules here
from . import rss


# Main API router
api_router = APIRouter()


# Include all your routers here
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(rss.router, prefix="/rss", tags=["rss"])

# Export as 'router' for main.py import
router = api_router

# You can add more routers like this:
# api_router.include_router(items.router, prefix="/items", tags=["items"])
