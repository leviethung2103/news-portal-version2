from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from ..db.session import Base

class RssFeed(Base):
    __tablename__ = "rss_feeds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), default="General")
    active: Mapped[bool] = mapped_column(Boolean(), default=True)
    fetch_interval: Mapped[int] = mapped_column(Integer, default=3600)  # seconds, default 1 hour
    last_fetched: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationship to articles
    articles = relationship("RssArticle", back_populates="feed", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<RssFeed {self.name} - {self.url}>"

class RssArticle(Base):
    __tablename__ = "rss_articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    feed_id: Mapped[int] = mapped_column(Integer, ForeignKey("rss_feeds.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    link: Mapped[str] = mapped_column(String(1000), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    published: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    guid: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # RSS guid for deduplication
    author: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Crawled content fields
    crawled_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Markdown content
    crawled_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Cleaned HTML
    crawled_title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Title from crawled page
    is_crawled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationship to feed
    feed = relationship("RssFeed", back_populates="articles")

    def __repr__(self):
        return f"<RssArticle {self.title}>"

class CronJob(Base):
    __tablename__ = "cron_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    schedule: Mapped[str] = mapped_column(String(100), nullable=False)  # cron expression
    active: Mapped[bool] = mapped_column(Boolean(), default=True)
    last_run: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_run: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    run_count: Mapped[int] = mapped_column(Integer, default=0)
    error_count: Mapped[int] = mapped_column(Integer, default=0)
    last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<CronJob {self.name} - {self.schedule}>"