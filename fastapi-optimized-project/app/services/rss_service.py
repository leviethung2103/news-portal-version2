import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional
import feedparser
import requests
from bs4 import BeautifulSoup
from sqlalchemy.ext.asyncio import AsyncSession
from ..db.session import async_session_factory
from ..db.crud_rss import rss_feed, rss_article, RssArticleCreate
from ..models.rss import RssFeed

logger = logging.getLogger(__name__)

class RssService:
    def __init__(self):
        self.session_timeout = 10
        self.max_articles_per_feed = 100

    async def fetch_rss_content(self, rss_url: str) -> List[dict]:
        """Fetch and parse RSS content from a URL."""
        try:
            # Use requests to fetch RSS content
            response = requests.get(rss_url, timeout=self.session_timeout)
            response.raise_for_status()
            
            # Parse RSS feed
            feed = feedparser.parse(response.content)
            
            if feed.bozo:
                logger.warning(f"RSS feed has issues: {rss_url} - {feed.bozo_exception}")
            
            articles = []
            for entry in feed.entries[:self.max_articles_per_feed]:
                # Extract content
                content = ""
                link = entry.get("link", "")
                
                if link:
                    try:
                        # Fetch full article content
                        article_response = requests.get(link, timeout=self.session_timeout)
                        article_response.raise_for_status()
                        soup = BeautifulSoup(article_response.text, "html.parser")
                        
                        # Try to find main content
                        main_content = (
                            soup.find("article") or 
                            soup.find("main") or 
                            soup.find("div", class_="content") or
                            soup.body
                        )
                        
                        if main_content:
                            content = main_content.get_text(separator="\n", strip=True)
                    except Exception as e:
                        logger.warning(f"Failed to fetch article content from {link}: {e}")
                        content = entry.get("summary", entry.get("description", ""))
                
                # Parse published date
                published = None
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    try:
                        published = datetime(*entry.published_parsed[:6])
                    except Exception:
                        pass
                
                articles.append({
                    "title": entry.get("title", ""),
                    "link": link,
                    "description": entry.get("summary", entry.get("description", "")),
                    "content": content,
                    "published": published,
                    "guid": entry.get("id", entry.get("guid", "")),
                    "author": entry.get("author", ""),
                })
            
            return articles
            
        except Exception as e:
            logger.error(f"Failed to fetch RSS content from {rss_url}: {e}")
            raise

    async def fetch_and_store_feed(self, feed: RssFeed) -> int:
        """Fetch RSS content and store articles in database."""
        stored_count = 0
        error_message = None
        
        try:
            # Fetch RSS content
            articles = await self.fetch_rss_content(feed.url)
            
            async with async_session_factory() as db:
                for article_data in articles:
                    try:
                        # Create article data
                        article_create = RssArticleCreate(
                            feed_id=feed.id,
                            title=article_data["title"],
                            link=article_data["link"],
                            description=article_data["description"],
                            content=article_data["content"],
                            published=article_data["published"],
                            guid=article_data["guid"],
                            author=article_data["author"],
                            category=feed.category
                        )
                        
                        # Create article if it doesn't exist
                        article = await rss_article.create_if_not_exists(db, article_create)
                        if article:
                            stored_count += 1
                            
                    except Exception as e:
                        logger.error(f"Failed to store article {article_data.get('title', 'Unknown')}: {e}")
                        continue
                
                # Update feed status
                await rss_feed.update_fetch_status(
                    db, feed.id, datetime.utcnow(), error_message
                )
                
        except Exception as e:
            error_message = str(e)
            logger.error(f"Failed to fetch feed {feed.name}: {e}")
            
            async with async_session_factory() as db:
                await rss_feed.update_fetch_status(
                    db, feed.id, datetime.utcnow(), error_message
                )
        
        return stored_count

    async def fetch_all_due_feeds(self) -> dict:
        """Fetch all feeds that are due for update."""
        results = {
            "total_feeds": 0,
            "successful_feeds": 0,
            "failed_feeds": 0,
            "total_articles": 0,
            "errors": []
        }
        
        try:
            async with async_session_factory() as db:
                # Get feeds that need fetching
                feeds = await rss_feed.get_feeds_to_fetch(db)
                results["total_feeds"] = len(feeds)
                
                for feed in feeds:
                    try:
                        logger.info(f"Fetching feed: {feed.name}")
                        article_count = await self.fetch_and_store_feed(feed)
                        results["total_articles"] += article_count
                        results["successful_feeds"] += 1
                        logger.info(f"Successfully fetched {article_count} articles from {feed.name}")
                        
                    except Exception as e:
                        results["failed_feeds"] += 1
                        error_msg = f"Failed to fetch {feed.name}: {str(e)}"
                        results["errors"].append(error_msg)
                        logger.error(error_msg)
                        
        except Exception as e:
            logger.error(f"Failed to fetch due feeds: {e}")
            results["errors"].append(f"Database error: {str(e)}")
        
        return results

    async def fetch_single_feed_by_id(self, feed_id: int) -> dict:
        """Fetch a single feed by ID immediately."""
        try:
            async with async_session_factory() as db:
                feed = await rss_feed.get(db, feed_id)
                if not feed:
                    return {"success": False, "error": "Feed not found"}
                
                article_count = await self.fetch_and_store_feed(feed)
                
                return {
                    "success": True,
                    "feed_name": feed.name,
                    "articles_stored": article_count
                }
                
        except Exception as e:
            logger.error(f"Failed to fetch feed {feed_id}: {e}")
            return {"success": False, "error": str(e)}

# Global RSS service instance
rss_service = RssService()