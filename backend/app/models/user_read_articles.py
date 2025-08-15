from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from ..db.session import Base

class UserReadArticle(Base):
    __tablename__ = "user_read_articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    article_id: Mapped[str] = mapped_column(String(255), nullable=False)
    article_title: Mapped[str] = mapped_column(String(500), nullable=False)
    article_link: Mapped[str] = mapped_column(String(1000), nullable=False)
    read_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Ensure one read record per user-article combination
    __table_args__ = (UniqueConstraint('user_id', 'article_id', name='unique_user_article'),)

    # Relationships
    user = relationship("User", back_populates="read_articles")

    def __repr__(self):
        return f"<UserReadArticle {self.user_id}:{self.article_id}>"