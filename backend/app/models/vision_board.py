from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum


class PriorityLevel(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class VisionItem(Base):
    __tablename__ = "vision_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    target_date = Column(DateTime, nullable=True)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM, nullable=False)
    image_url = Column(String(500), nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Foreign key to user
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Relationship
    user = relationship("User", back_populates="vision_items")

    def __repr__(self):
        return f"<VisionItem(id={self.id}, title='{self.title}', user_id={self.user_id})>"