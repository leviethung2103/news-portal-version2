from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum


class PriorityLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class VisionItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., min_length=1, max_length=100)
    year: int = Field(..., ge=1900, le=2100)
    target_date: Optional[datetime] = None
    priority: PriorityLevel = PriorityLevel.MEDIUM
    image_url: Optional[str] = Field(None, max_length=500)


class VisionItemCreate(VisionItemBase):
    pass


class VisionItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    year: Optional[int] = Field(None, ge=1900, le=2100)
    target_date: Optional[datetime] = None
    priority: Optional[PriorityLevel] = None
    image_url: Optional[str] = Field(None, max_length=500)
    is_completed: Optional[bool] = None


class VisionItemResponse(VisionItemBase):
    id: int
    is_completed: bool
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    user_id: int

    class Config:
        from_attributes = True


class VisionItemStats(BaseModel):
    total_items: int
    completed_items: int
    pending_items: int
    completion_percentage: float
    items_by_category: dict[str, int]
    items_by_priority: dict[str, int]