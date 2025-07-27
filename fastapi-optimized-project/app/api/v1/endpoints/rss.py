from fastapi import APIRouter, Query, HTTPException, Depends, BackgroundTasks
from typing import List, Dict, Optional
from pydantic import BaseModel, HttpUrl
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from ....db.session import get_db
from ....db.crud_rss import rss_feed, rss_article, cron_job, RssFeedCreate, RssFeedUpdate, CronJobCreate, CronJobUpdate
from ....services.rss_service import rss_service
from ....services.scheduler_service import scheduler_service
from ....services.content_crawler_service import content_crawler_service

router = APIRouter()

# Pydantic models for API
class RssFeedResponse(BaseModel):
    id: int
    name: str
    url: str
    category: str
    active: bool
    fetch_interval: int
    last_fetched: Optional[datetime] = None
    last_error: Optional[str] = None
    error_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RssArticleResponse(BaseModel):
    id: int
    title: str
    link: str
    description: Optional[str] = None
    content: Optional[str] = None
    published: Optional[datetime] = None
    author: Optional[str] = None
    category: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CronJobResponse(BaseModel):
    id: int
    name: str
    schedule: str
    active: bool
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    run_count: int
    error_count: int
    last_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RssFeedCreateRequest(BaseModel):
    name: str
    url: HttpUrl
    category: str = "General"
    active: bool = True
    fetch_interval: int = 3600

class RssFeedUpdateRequest(BaseModel):
    name: Optional[str] = None
    url: Optional[HttpUrl] = None
    category: Optional[str] = None
    active: Optional[bool] = None
    fetch_interval: Optional[int] = None

# RSS Feed Management Endpoints
@router.get("/feeds", response_model=List[RssFeedResponse])
async def get_rss_feeds(db: AsyncSession = Depends(get_db)):
    """Get all RSS feeds"""
    feeds = await rss_feed.get_multi(db)
    return feeds

@router.post("/feeds", response_model=RssFeedResponse)
async def create_rss_feed(
    feed_data: RssFeedCreateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Create a new RSS feed and immediately fetch content"""
    # Check if URL already exists
    existing_feed = await rss_feed.get_by_url(db, str(feed_data.url))
    if existing_feed:
        raise HTTPException(status_code=400, detail="RSS feed URL already exists")
    
    # Create feed
    feed_create = RssFeedCreate(
        name=feed_data.name,
        url=str(feed_data.url),
        category=feed_data.category,
        active=feed_data.active,
        fetch_interval=feed_data.fetch_interval
    )
    
    new_feed = await rss_feed.create(db, obj_in=feed_create)
    
    # Trigger immediate fetch in background if feed is active
    if new_feed.active:
        background_tasks.add_task(rss_service.fetch_and_store_feed, new_feed)
    
    return new_feed

@router.put("/feeds/{feed_id}", response_model=RssFeedResponse)
async def update_rss_feed(
    feed_id: int,
    feed_data: RssFeedUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing RSS feed"""
    existing_feed = await rss_feed.get(db, feed_id)
    if not existing_feed:
        raise HTTPException(status_code=404, detail="RSS feed not found")
    
    # Check URL uniqueness if URL is being updated
    if feed_data.url and str(feed_data.url) != existing_feed.url:
        url_exists = await rss_feed.get_by_url(db, str(feed_data.url))
        if url_exists:
            raise HTTPException(status_code=400, detail="RSS feed URL already exists")
    
    # Update feed
    update_data = feed_data.model_dump(exclude_unset=True)
    if feed_data.url:
        update_data["url"] = str(feed_data.url)
    
    updated_feed = await rss_feed.update(db, db_obj=existing_feed, obj_in=update_data)
    return updated_feed

@router.delete("/feeds/{feed_id}")
async def delete_rss_feed(feed_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an RSS feed and all its articles"""
    existing_feed = await rss_feed.get(db, feed_id)
    if not existing_feed:
        raise HTTPException(status_code=404, detail="RSS feed not found")
    
    await rss_feed.remove(db, id=feed_id)
    return {"message": "RSS feed deleted successfully"}

@router.post("/feeds/{feed_id}/fetch")
async def fetch_rss_feed_immediately(
    feed_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Trigger immediate fetch for a specific RSS feed"""
    existing_feed = await rss_feed.get(db, feed_id)
    if not existing_feed:
        raise HTTPException(status_code=404, detail="RSS feed not found")
    
    # Trigger fetch in background
    background_tasks.add_task(rss_service.fetch_and_store_feed, existing_feed)
    
    return {"message": f"Fetch triggered for {existing_feed.name}"}

# RSS Content Endpoints
@router.get("/feeds/{feed_id}/articles", response_model=List[RssArticleResponse])
async def get_rss_feed_articles(
    feed_id: int,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get articles from a specific RSS feed"""
    existing_feed = await rss_feed.get(db, feed_id)
    if not existing_feed:
        raise HTTPException(status_code=404, detail="RSS feed not found")
    
    articles = await rss_article.get_by_feed(db, feed_id, skip=skip, limit=limit)
    return articles

@router.get("/articles", response_model=List[RssArticleResponse])
async def get_all_rss_articles(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get recent articles from all feeds"""
    articles = await rss_article.get_recent_articles(db, skip=skip, limit=limit)
    return articles

# Legacy endpoint for backward compatibility with pagination
@router.get("/items")
async def get_all_rss_items(
    skip: int = 0,
    limit: int = 10,
    category: str = None,
    search: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Get items from all RSS feeds (legacy format) with pagination and filtering"""
    articles = await rss_article.get_recent_articles(db, skip=skip, limit=limit)
    
    # Apply category filter if specified
    if category and category.lower() != "all":
        articles = [a for a in articles if (a.category and a.category.lower() == category.lower()) or 
                   (hasattr(a, 'feed') and a.feed and a.feed.category and a.feed.category.lower() == category.lower())]
    
    # Apply search filter if specified
    if search:
        articles = [a for a in articles if search.lower() in a.title.lower() or 
                   (a.description and search.lower() in a.description.lower())]
    
    # Convert to legacy format
    items = []
    for article in articles:
        items.append({
            "id": article.id,  # Include database ID
            "title": article.title,
            "link": article.link,
            "content": article.content or "",
            "description": article.description or "",
            "published": article.published.isoformat() if article.published else "",
            "category": article.category or (article.feed.category if hasattr(article, 'feed') else "")
        })
    
    return items

# Cron Job Management Endpoints
@router.get("/cron-jobs", response_model=List[CronJobResponse])
async def get_cron_jobs(db: AsyncSession = Depends(get_db)):
    """Get all cron jobs"""
    jobs = await cron_job.get_multi(db)
    return jobs

@router.post("/cron-jobs", response_model=CronJobResponse)
async def create_cron_job(
    job_data: CronJobCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new cron job"""
    # Check if job name already exists
    existing_job = await cron_job.get_by_name(db, job_data.name)
    if existing_job:
        raise HTTPException(status_code=400, detail="Cron job name already exists")
    
    # Create and schedule job
    new_job = await scheduler_service.create_and_schedule_job(job_data)
    if not new_job:
        raise HTTPException(status_code=500, detail="Failed to create cron job")
    
    return new_job

@router.put("/cron-jobs/{job_id}", response_model=CronJobResponse)
async def update_cron_job(
    job_id: int,
    job_data: CronJobUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a cron job"""
    updated_job = await scheduler_service.update_and_reschedule_job(job_id, job_data)
    if not updated_job:
        raise HTTPException(status_code=404, detail="Cron job not found")
    
    return updated_job

@router.delete("/cron-jobs/{job_id}")
async def delete_cron_job(job_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a cron job"""
    success = await scheduler_service.delete_and_unschedule_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Cron job not found")
    
    return {"message": "Cron job deleted successfully"}

@router.post("/cron-jobs/trigger-fetch")
async def trigger_immediate_fetch():
    """Trigger immediate RSS fetch for all feeds"""
    result = await scheduler_service.trigger_immediate_fetch()
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result["results"]

@router.get("/scheduler/status")
async def get_scheduler_status():
    """Get scheduler status and job information"""
    return scheduler_service.get_job_status()

# Content Crawling Endpoints
@router.post("/articles/{article_id}/crawl")
async def crawl_article_content(
    article_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Crawl full content for a specific article"""
    # Check if article exists
    article = await rss_article.get(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Trigger crawling in background
    async def crawl_task():
        async with content_crawler_service as crawler:
            await crawler.crawl_and_update_article(db, article_id)
    
    background_tasks.add_task(crawl_task)
    
    return {"message": f"Content crawling initiated for article {article_id}"}

@router.get("/articles/{article_id}/content")
async def get_article_content(
    article_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get full article content (crawled if available)"""
    article = await rss_article.get_crawled_article_by_id(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # If not crawled yet, trigger crawling and return basic content
    if not article.is_crawled:
        async def crawl_task():
            async with content_crawler_service as crawler:
                await crawler.crawl_and_update_article(db, article_id)
        
        # Return basic content for now
        return {
            "id": article.id,
            "title": article.title,
            "content": article.content or article.description,
            "is_crawled": False,
            "message": "Content crawling initiated. Refresh to get full content."
        }
    
    # Return crawled content
    return {
        "id": article.id,
        "title": article.crawled_title or article.title,
        "content": article.crawled_content or article.content,
        "html_content": article.crawled_html,
        "is_crawled": True,
        "original_link": article.link,
        "source": article.feed.name if article.feed else None
    }

@router.post("/crawl/batch")
async def crawl_batch_articles(
    background_tasks: BackgroundTasks,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Crawl content for multiple uncrawled articles"""
    # Get uncrawled articles
    uncrawled_articles = await rss_article.get_uncrawled_articles(db, limit=limit)
    
    if not uncrawled_articles:
        return {"message": "No uncrawled articles found"}
    
    article_ids = [article.id for article in uncrawled_articles]
    
    # Trigger batch crawling in background
    async def batch_crawl_task():
        async with content_crawler_service as crawler:
            results = await crawler.crawl_multiple_articles(db, article_ids)
            return results
    
    background_tasks.add_task(batch_crawl_task)
    
    return {
        "message": f"Batch crawling initiated for {len(article_ids)} articles",
        "article_ids": article_ids
    }

# Validate RSS URL endpoint
@router.post("/validate")
async def validate_rss_url(request: dict):
    """Validate an RSS URL to check if it's accessible and contains valid RSS content"""
    rss_url = request.get("url")
    if not rss_url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    try:
        validation_result = await rss_service.validate_rss_url(rss_url)
        return validation_result
    except Exception as e:
        return {
            "valid": False,
            "error": f"Validation failed: {str(e)}"
        }

# Legacy endpoint for backward compatibility
@router.get("/rss")
async def get_rss_items_by_url(rss_url: str = Query(..., description="RSS feed URL")):
    """Fetch RSS feed items directly from URL (legacy endpoint)"""
    try:
        items = await rss_service.fetch_rss_content(rss_url)
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
