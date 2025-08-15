import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional
import feedparser
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from bs4 import BeautifulSoup
from ..db.session import async_session_factory
from ..db.crud_rss import rss_feed, rss_article, RssArticleCreate
from ..models.rss import RssFeed
from .jina_reader import fetch_jina_reader_content
from .summarize_service import summarize_content
import time

logger = logging.getLogger(__name__)


class RssService:
    def __init__(self):
        self.session_timeout = 30  # Increased timeout for DNS resolution
        self.max_articles_per_feed = 100
        self.session = self._create_session()

    def _create_session(self):
        """Create a requests session with retry strategy and proper headers."""
        session = requests.Session()

        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS"],
            backoff_factor=1,
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        # Set proper headers to avoid blocking
        session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept": "application/rss+xml, application/xml, text/xml, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate",
                "Connection": "keep-alive",
                "Cache-Control": "no-cache",
            }
        )

        return session

    async def crawl_article_with_jina(self, article_id: int) -> bool:
        """Crawl article content using Jina Reader and update the database."""
        try:
            async with async_session_factory() as db:
                # Get the article
                article = await rss_article.get(db, article_id)
                if not article:
                    logger.error(f"Article {article_id} not found")
                    return False

                if article.is_crawled:
                    logger.info(f"Article {article_id} already crawled")
                    return True

                logger.info(f"Starting Jina Reader crawling for article {article_id}: {article.title}")

                # Fetch content using Jina Reader
                crawled_content = await fetch_jina_reader_content(article.link)

                if not crawled_content:
                    logger.warning(f"Failed to crawl content for article {article_id}")
                    return False

                # Generate summary if content is available
                summary = None
                try:
                    summary = await summarize_content(crawled_content) if crawled_content else None
                except Exception as e:
                    logger.warning(f"Failed to generate summary for article {article_id}: {e}")

                # Update article with crawled content
                update_data = {
                    "crawled_content": crawled_content,
                    "crawled_html": crawled_content,  # For now, store the same content
                    "is_crawled": True,
                }

                # If summary is available, use it as the content
                if summary:
                    update_data["content"] = summary
                    logger.info(f"Generated summary for article {article_id}")

                await rss_article.update(db, db_obj=article, obj_in=update_data)
                logger.info(f"Successfully crawled and updated article {article_id}")

                return True

        except Exception as e:
            logger.error(f"Error crawling article {article_id} with Jina Reader: {e}")
            return False

    async def validate_rss_url(self, rss_url: str) -> dict:
        """Validate an RSS URL by attempting to fetch and parse it."""
        try:
            logger.info(f"Validating RSS URL: {rss_url}")

            # First, try a HEAD request to check if the URL is accessible
            try:
                head_response = self.session.head(rss_url, timeout=10, allow_redirects=True)
                logger.info(f"HEAD request status: {head_response.status_code}")
            except Exception as e:
                logger.warning(f"HEAD request failed, continuing with GET: {e}")

            # Fetch the RSS content
            response = self.session.get(rss_url, timeout=self.session_timeout)
            response.raise_for_status()

            # Try to parse as RSS
            feed = feedparser.parse(response.content)

            if feed.bozo and feed.bozo_exception:
                return {
                    "valid": False,
                    "error": f"RSS parsing error: {feed.bozo_exception}",
                    "status_code": response.status_code,
                }

            if not feed.entries:
                return {"valid": False, "error": "RSS feed contains no entries", "status_code": response.status_code}

            return {
                "valid": True,
                "title": feed.feed.get("title", "Unknown"),
                "description": feed.feed.get("description", ""),
                "entries_count": len(feed.entries),
                "status_code": response.status_code,
            }

        except requests.exceptions.ConnectionError as e:
            if "Failed to resolve" in str(e) or "nodename nor servname" in str(e):
                return {
                    "valid": False,
                    "error": f"DNS resolution failed: Cannot resolve domain name. Please check the URL.",
                }
            else:
                return {"valid": False, "error": f"Connection failed: {str(e)}"}
        except requests.exceptions.Timeout:
            return {"valid": False, "error": "Request timed out. The server may be slow or unresponsive."}
        except requests.exceptions.HTTPError as e:
            return {
                "valid": False,
                "error": f"HTTP error {e.response.status_code}: {e}",
                "status_code": e.response.status_code,
            }
        except Exception as e:
            return {"valid": False, "error": f"Validation failed: {str(e)}"}

    async def fetch_rss_content(self, rss_url: str) -> List[dict]:
        """Fetch and parse RSS content from a URL."""
        try:
            logger.info(f"Fetching RSS content from: {rss_url}")

            # Use session to fetch RSS content with improved error handling
            response = self.session.get(rss_url, timeout=self.session_timeout)
            response.raise_for_status()

            logger.info(f"Successfully fetched RSS content: {len(response.content)} bytes")

            # Parse RSS feed
            feed = feedparser.parse(response.content)

            if feed.bozo:
                logger.warning(f"RSS feed has issues: {rss_url} - {feed.bozo_exception}")

            articles = []
            for entry in feed.entries[: self.max_articles_per_feed]:
                # Extract content
                content = ""
                link = entry.get("link", "")

                if link:
                    try:
                        # Fetch full article content with session
                        article_response = self.session.get(link, timeout=self.session_timeout)
                        article_response.raise_for_status()
                        soup = BeautifulSoup(article_response.text, "html.parser")

                        # Try to find main content
                        main_content = (
                            soup.find("article") or soup.find("main") or soup.find("div", class_="content") or soup.body
                        )

                        if main_content:
                            content = main_content.get_text(separator="\n", strip=True)
                    except Exception as e:
                        logger.warning(f"Failed to fetch article content from {link}: {e}")
                        content = entry.get("summary", entry.get("description", ""))

                # Parse published date
                published = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    try:
                        published = datetime(*entry.published_parsed[:6])
                    except Exception:
                        pass

                articles.append(
                    {
                        "title": entry.get("title", ""),
                        "link": link,
                        "description": entry.get("summary", entry.get("description", "")),
                        "content": content,
                        "published": published,
                        "guid": entry.get("id", entry.get("guid", "")),
                        "author": entry.get("author", ""),
                    }
                )

            return articles

        except requests.exceptions.ConnectionError as e:
            if "Failed to resolve" in str(e) or "nodename nor servname" in str(e):
                logger.error(f"DNS resolution failed for {rss_url}: {e}")
                raise Exception(
                    f"DNS resolution failed for {rss_url}. Please check the URL and your network connection."
                )
            else:
                logger.error(f"Connection error for {rss_url}: {e}")
                raise Exception(f"Failed to connect to {rss_url}. The server may be down or unreachable.")
        except requests.exceptions.Timeout as e:
            logger.error(f"Timeout error for {rss_url}: {e}")
            raise Exception(f"Request timed out for {rss_url}. The server may be slow or unresponsive.")
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error for {rss_url}: {e}")
            raise Exception(f"HTTP error {e.response.status_code} for {rss_url}: {e}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error for {rss_url}: {e}")
            raise Exception(f"Request failed for {rss_url}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error fetching RSS content from {rss_url}: {e}")
            raise Exception(f"Failed to fetch RSS content from {rss_url}: {e}")

    async def fetch_and_store_feed(self, feed: RssFeed) -> int:
        """Fetch RSS content and store articles in database."""
        stored_count = 0
        error_message = None
        new_article_ids = []  # Track new articles for auto-crawling

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
                            category=feed.category,
                        )

                        # Create article if it doesn't exist
                        article = await rss_article.create_if_not_exists(db, article_create)
                        if article:
                            stored_count += 1
                            new_article_ids.append(article.id)
                            logger.info(f"Stored new article {article.id}: {article.title}")

                    except Exception as e:
                        logger.error(f"Failed to store article {article_data.get('title', 'Unknown')}: {e}")
                        continue

                # Update feed status
                await rss_feed.update_fetch_status(db, feed.id, datetime.utcnow(), error_message)

            # Auto-crawl new articles in background
            if new_article_ids:
                logger.info(f"Starting auto-crawling for {len(new_article_ids)} new articles from {feed.name}")
                # Schedule crawling tasks without awaiting them (fire and forget)
                for article_id in new_article_ids:
                    asyncio.create_task(self.crawl_article_with_jina(article_id))
                    await asyncio.sleep(5)

        except Exception as e:
            error_message = str(e)
            logger.error(f"Failed to fetch feed {feed.name}: {e}")

            async with async_session_factory() as db:
                await rss_feed.update_fetch_status(db, feed.id, datetime.utcnow(), error_message)

        return stored_count

    async def fetch_all_due_feeds(self) -> dict:
        """Fetch all feeds that are due for update."""
        results = {"total_feeds": 0, "successful_feeds": 0, "failed_feeds": 0, "total_articles": 0, "errors": []}

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

                return {"success": True, "feed_name": feed.name, "articles_stored": article_count}

        except Exception as e:
            logger.error(f"Failed to fetch feed {feed_id}: {e}")
            return {"success": False, "error": str(e)}


# Global RSS service instance
rss_service = RssService()
