from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, and_, select
from app.models.vision_board import VisionItem, PriorityLevel
from app.schemas.vision_board import VisionItemCreate, VisionItemUpdate, VisionItemStats


async def get_vision_items(
    db: AsyncSession, 
    user_id: int, 
    skip: int = 0, 
    limit: int = 100,
    category: Optional[str] = None,
    year: Optional[int] = None,
    priority: Optional[PriorityLevel] = None,
    is_completed: Optional[bool] = None
) -> List[VisionItem]:
    """Get vision items for a user with optional filtering."""
    query = select(VisionItem).where(VisionItem.user_id == user_id)
    
    if category:
        query = query.where(VisionItem.category == category)
    
    if year:
        query = query.where(VisionItem.year == year)
    
    if priority:
        query = query.where(VisionItem.priority == priority)
    
    if is_completed is not None:
        query = query.where(VisionItem.is_completed == is_completed)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_vision_item(db: AsyncSession, item_id: int, user_id: int) -> Optional[VisionItem]:
    """Get a specific vision item by ID for a user."""
    query = select(VisionItem).where(
        and_(VisionItem.id == item_id, VisionItem.user_id == user_id)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_vision_item(db: AsyncSession, item: VisionItemCreate, user_id: int) -> VisionItem:
    """Create a new vision item."""
    db_item = VisionItem(**item.model_dump(), user_id=user_id)
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item


async def update_vision_item(
    db: AsyncSession, 
    item_id: int, 
    user_id: int, 
    item_update: VisionItemUpdate
) -> Optional[VisionItem]:
    """Update a vision item."""
    db_item = await get_vision_item(db, item_id, user_id)
    if not db_item:
        return None
    
    update_data = item_update.model_dump(exclude_unset=True)
    
    # If marking as completed and it wasn't completed before, set completed_at
    if update_data.get("is_completed") and not db_item.is_completed:
        update_data["completed_at"] = datetime.utcnow()
    # If marking as not completed, clear completed_at
    elif update_data.get("is_completed") is False:
        update_data["completed_at"] = None
    
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    await db.commit()
    await db.refresh(db_item)
    return db_item


async def delete_vision_item(db: AsyncSession, item_id: int, user_id: int) -> bool:
    """Delete a vision item."""
    db_item = await get_vision_item(db, item_id, user_id)
    if not db_item:
        return False
    
    db.delete(db_item)
    await db.commit()
    return True


async def get_vision_stats(db: AsyncSession, user_id: int) -> VisionItemStats:
    """Get statistics for user's vision items."""
    # Total counts
    total_query = select(func.count(VisionItem.id)).where(VisionItem.user_id == user_id)
    total_result = await db.execute(total_query)
    total_items = total_result.scalar()
    
    completed_query = select(func.count(VisionItem.id)).where(
        and_(VisionItem.user_id == user_id, VisionItem.is_completed == True)
    )
    completed_result = await db.execute(completed_query)
    completed_items = completed_result.scalar()
    
    pending_items = total_items - completed_items
    
    # Completion percentage
    completion_percentage = (completed_items / total_items * 100) if total_items > 0 else 0
    
    # Items by category
    category_query = select(
        VisionItem.category, 
        func.count(VisionItem.id).label('count')
    ).where(VisionItem.user_id == user_id).group_by(VisionItem.category)
    
    category_result = await db.execute(category_query)
    category_stats = category_result.all()
    items_by_category = {category: count for category, count in category_stats}
    
    # Items by priority
    priority_query = select(
        VisionItem.priority, 
        func.count(VisionItem.id).label('count')
    ).where(VisionItem.user_id == user_id).group_by(VisionItem.priority)
    
    priority_result = await db.execute(priority_query)
    priority_stats = priority_result.all()
    items_by_priority = {priority.value: count for priority, count in priority_stats}
    
    return VisionItemStats(
        total_items=total_items,
        completed_items=completed_items,
        pending_items=pending_items,
        completion_percentage=round(completion_percentage, 2),
        items_by_category=items_by_category,
        items_by_priority=items_by_priority
    )


async def get_categories(db: AsyncSession, user_id: int) -> List[str]:
    """Get unique categories for a user's vision items."""
    query = select(VisionItem.category).where(
        VisionItem.user_id == user_id
    ).distinct()
    
    result = await db.execute(query)
    categories = result.scalars().all()
    
    return list(categories)