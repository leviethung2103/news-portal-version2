from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.crud_vision_board import (
    get_vision_items,
    get_vision_item,
    create_vision_item,
    update_vision_item,
    delete_vision_item,
    get_vision_stats,
    get_categories
)
from app.schemas.vision_board import (
    VisionItemCreate,
    VisionItemUpdate,
    VisionItemResponse,
    VisionItemStats,
    PriorityLevel
)

router = APIRouter()


def get_current_user_id() -> int:
    """
    Placeholder for user authentication.
    In a real application, this would extract the user ID from JWT token.
    For now, returning a default user ID for testing.
    """
    return 1  # Default user ID for testing


@router.get("/items", response_model=List[VisionItemResponse])
async def read_vision_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    priority: Optional[PriorityLevel] = Query(None),
    is_completed: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get vision items for the current user with optional filtering."""
    items = await get_vision_items(
        db=db,
        user_id=current_user_id,
        skip=skip,
        limit=limit,
        category=category,
        year=year,
        priority=priority,
        is_completed=is_completed
    )
    return items


@router.get("/items/{item_id}", response_model=VisionItemResponse)
async def read_vision_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get a specific vision item."""
    item = await get_vision_item(db=db, item_id=item_id, user_id=current_user_id)
    if not item:
        raise HTTPException(status_code=404, detail="Vision item not found")
    return item


@router.post("/items", response_model=VisionItemResponse)
async def create_new_vision_item(
    item: VisionItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Create a new vision item."""
    return await create_vision_item(db=db, item=item, user_id=current_user_id)


@router.put("/items/{item_id}", response_model=VisionItemResponse)
async def update_existing_vision_item(
    item_id: int,
    item_update: VisionItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Update a vision item."""
    updated_item = await update_vision_item(
        db=db, 
        item_id=item_id, 
        user_id=current_user_id, 
        item_update=item_update
    )
    if not updated_item:
        raise HTTPException(status_code=404, detail="Vision item not found")
    return updated_item


@router.delete("/items/{item_id}")
async def delete_existing_vision_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Delete a vision item."""
    success = await delete_vision_item(db=db, item_id=item_id, user_id=current_user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Vision item not found")
    return {"message": "Vision item deleted successfully"}


@router.get("/stats", response_model=VisionItemStats)
async def read_vision_stats(
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get statistics for user's vision items."""
    return await get_vision_stats(db=db, user_id=current_user_id)


@router.get("/categories", response_model=List[str])
async def read_categories(
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get unique categories for user's vision items."""
    return await get_categories(db=db, user_id=current_user_id)


@router.patch("/items/{item_id}/toggle", response_model=VisionItemResponse)
async def toggle_vision_item_completion(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Toggle the completion status of a vision item."""
    item = await get_vision_item(db=db, item_id=item_id, user_id=current_user_id)
    if not item:
        raise HTTPException(status_code=404, detail="Vision item not found")
    
    # Toggle completion status
    item_update = VisionItemUpdate(is_completed=not item.is_completed)
    updated_item = await update_vision_item(
        db=db, 
        item_id=item_id, 
        user_id=current_user_id, 
        item_update=item_update
    )
    return updated_item