from datetime import datetime
from typing import List, Optional
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from ..models.rss import RssFeed, RssArticle, CronJob
from ..db.base import CRUDBase
from pydantic import BaseModel

class RssFeedCreate(BaseModel):
    name: str
    url: str
    category: str = "General"
    active: bool = True
    fetch_interval: int = 3600

class RssFeedUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    category: Optional[str] = None
    active: Optional[bool] = None
    fetch_interval: Optional[int] = None
    last_fetched: Optional[datetime] = None
    last_error: Optional[str] = None
    error_count: Optional[int] = None

class RssArticleCreate(BaseModel):
    feed_id: int
    title: str
    link: str
    description: Optional[str] = None
    content: Optional[str] = None
    published: Optional[datetime] = None
    guid: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None

class RssArticleUpdate(BaseModel):
    title: Optional[str] = None
    link: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    published: Optional[datetime] = None
    guid: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    crawled_content: Optional[str] = None
    crawled_html: Optional[str] = None
    crawled_title: Optional[str] = None
    is_crawled: Optional[bool] = None

class CronJobCreate(BaseModel):
    name: str
    schedule: str
    active: bool = True

class CronJobUpdate(BaseModel):
    name: Optional[str] = None
    schedule: Optional[str] = None
    active: Optional[bool] = None
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    run_count: Optional[int] = None
    error_count: Optional[int] = None
    last_error: Optional[str] = None

class CRUDRssFeed(CRUDBase[RssFeed, RssFeedCreate, RssFeedUpdate]):
    async def get_active_feeds(self, db: AsyncSession) -> List[RssFeed]:
        """Get all active RSS feeds."""
        result = await db.execute(
            select(self.model).where(self.model.active == True)
        )
        return result.scalars().all()

    async def get_by_url(self, db: AsyncSession, url: str) -> Optional[RssFeed]:
        """Get RSS feed by URL."""
        result = await db.execute(
            select(self.model).where(self.model.url == url)
        )
        return result.scalar_one_or_none()

    async def get_feeds_to_fetch(self, db: AsyncSession) -> List[RssFeed]:
        """Get feeds that need to be fetched based on their interval."""
        now = datetime.utcnow()
        result = await db.execute(
            select(self.model).where(
                and_(
                    self.model.active == True,
                    or_(
                        self.model.last_fetched.is_(None),
                        self.model.last_fetched < (now - self.model.fetch_interval)
                    )
                )
            )
        )
        return result.scalars().all()

    async def update_fetch_status(
        self, 
        db: AsyncSession, 
        feed_id: int, 
        last_fetched: datetime,
        error: Optional[str] = None
    ) -> Optional[RssFeed]:
        """Update fetch status of a feed."""
        feed = await self.get(db, feed_id)
        if not feed:
            return None
        
        feed.last_fetched = last_fetched
        if error:
            feed.last_error = error
            feed.error_count += 1
        else:
            feed.last_error = None
            feed.error_count = 0
        
        db.add(feed)
        await db.commit()
        await db.refresh(feed)
        return feed

class CRUDRssArticle(CRUDBase[RssArticle, RssArticleCreate, RssArticleUpdate]):
    async def get_by_feed(
        self, 
        db: AsyncSession, 
        feed_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[RssArticle]:
        """Get articles by feed ID."""
        result = await db.execute(
            select(self.model)
            .where(self.model.feed_id == feed_id)
            .order_by(desc(self.model.published), desc(self.model.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_recent_articles(
        self, 
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[RssArticle]:
        """Get recent articles from all feeds."""
        result = await db.execute(
            select(self.model)
            .options(selectinload(self.model.feed))
            .order_by(desc(self.model.published), desc(self.model.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_guid(self, db: AsyncSession, guid: str, feed_id: int) -> Optional[RssArticle]:
        """Get article by GUID and feed ID for deduplication."""
        result = await db.execute(
            select(self.model).where(
                and_(
                    self.model.guid == guid,
                    self.model.feed_id == feed_id
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_by_link(self, db: AsyncSession, link: str, feed_id: int) -> Optional[RssArticle]:
        """Get article by link and feed ID for deduplication."""
        result = await db.execute(
            select(self.model).where(
                and_(
                    self.model.link == link,
                    self.model.feed_id == feed_id
                )
            )
        )
        return result.scalar_one_or_none()

    async def create_if_not_exists(
        self, 
        db: AsyncSession, 
        article_data: RssArticleCreate
    ) -> Optional[RssArticle]:
        """Create article if it doesn't already exist (based on GUID or link)."""
        # Check by GUID first
        if article_data.guid:
            existing = await self.get_by_guid(db, article_data.guid, article_data.feed_id)
            if existing:
                return existing
        
        # Check by link
        existing = await self.get_by_link(db, article_data.link, article_data.feed_id)
        if existing:
            return existing
        
        # Create new article
        return await self.create(db, obj_in=article_data)
    
    async def get_uncrawled_articles(
        self, 
        db: AsyncSession, 
        limit: int = 10
    ) -> List[RssArticle]:
        """Get articles that haven't been crawled yet."""
        result = await db.execute(
            select(self.model)
            .where(self.model.is_crawled == False)
            .order_by(desc(self.model.created_at))
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_crawled_article_by_id(
        self, 
        db: AsyncSession, 
        article_id: int
    ) -> Optional[RssArticle]:
        """Get a specific article with its crawled content."""
        result = await db.execute(
            select(self.model)
            .options(selectinload(self.model.feed))
            .where(self.model.id == article_id)
        )
        return result.scalar_one_or_none()

class CRUDCronJob(CRUDBase[CronJob, CronJobCreate, CronJobUpdate]):
    async def get_active_jobs(self, db: AsyncSession) -> List[CronJob]:
        """Get all active cron jobs."""
        result = await db.execute(
            select(self.model).where(self.model.active == True)
        )
        return result.scalars().all()

    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[CronJob]:
        """Get cron job by name."""
        result = await db.execute(
            select(self.model).where(self.model.name == name)
        )
        return result.scalar_one_or_none()

    async def update_run_status(
        self, 
        db: AsyncSession, 
        job_id: int, 
        last_run: datetime,
        next_run: Optional[datetime] = None,
        error: Optional[str] = None
    ) -> Optional[CronJob]:
        """Update run status of a cron job."""
        job = await self.get(db, job_id)
        if not job:
            return None
        
        job.last_run = last_run
        job.run_count += 1
        
        if next_run:
            job.next_run = next_run
        
        if error:
            job.last_error = error
            job.error_count += 1
        else:
            job.last_error = None
        
        db.add(job)
        await db.commit()
        await db.refresh(job)
        return job

# Create instances
rss_feed = CRUDRssFeed(RssFeed)
rss_article = CRUDRssArticle(RssArticle)
cron_job = CRUDCronJob(CronJob)