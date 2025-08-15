import asyncio
import logging
from typing import Optional, Dict, Any
from crawl4ai import AsyncWebCrawler
from sqlalchemy.ext.asyncio import AsyncSession
from ..db.crud_rss import rss_article
from ..models.rss import RssArticle

logger = logging.getLogger(__name__)

class ContentCrawlerService:
    """Service for crawling and extracting full article content from URLs"""
    
    def __init__(self):
        self.crawler = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.crawler = AsyncWebCrawler(
            headless=True,
            verbose=False,
            browser_type="chromium",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        )
        await self.crawler.__aenter__()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.crawler:
            await self.crawler.__aexit__(exc_type, exc_val, exc_tb)
    
    async def crawl_article_content(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Crawl and extract article content from a URL
        
        Args:
            url: The URL to crawl
            
        Returns:
            Dict containing extracted content or None if failed
        """
        try:
            if not self.crawler:
                raise RuntimeError("Crawler not initialized. Use async context manager.")
            
            # Crawl the URL
            result = await self.crawler.arun(
                url=url,
                word_count_threshold=10,  # Minimum word count for extraction
                bypass_cache=False,  # Use cache for efficiency
                process_iframes=False,  # Skip iframes for performance
                remove_overlay_elements=True,  # Remove popups/overlays
                simulate_user=True,  # Simulate user behavior
                magic=True,  # Enable smart content extraction
            )
            
            if not result.success:
                logger.error(f"Failed to crawl {url}: {result.error_message}")
                return None
            
            # Extract relevant content
            extracted_data = {
                "url": url,
                "title": result.title or "",
                "markdown_content": result.markdown or "",
                "cleaned_html": result.cleaned_html or "",
                "media": result.media or [],
                "links": result.links or [],
                "success": True,
                "word_count": len(result.markdown.split()) if result.markdown else 0
            }
            
            logger.info(f"Successfully crawled {url} - {extracted_data['word_count']} words")
            return extracted_data
            
        except Exception as e:
            logger.error(f"Error crawling {url}: {str(e)}")
            return None
    
    async def crawl_and_update_article(self, db: AsyncSession, article_id: int) -> bool:
        """
        Crawl content for a specific article and update the database
        
        Args:
            db: Database session
            article_id: ID of the article to crawl
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get the article from database
            article = await rss_article.get(db, article_id)
            if not article:
                logger.error(f"Article {article_id} not found")
                return False
            
            # Skip if already crawled
            if article.crawled_content:
                logger.info(f"Article {article_id} already has crawled content")
                return True
            
            # Crawl the content
            crawled_data = await self.crawl_article_content(article.link)
            if not crawled_data:
                return False
            
            # Update the article with crawled content
            update_data = {
                "crawled_content": crawled_data["markdown_content"],
                "crawled_html": crawled_data["cleaned_html"],
                "crawled_title": crawled_data["title"],
                "is_crawled": True
            }
            
            await rss_article.update(db, db_obj=article, obj_in=update_data)
            logger.info(f"Updated article {article_id} with crawled content")
            return True
            
        except Exception as e:
            logger.error(f"Error updating article {article_id}: {str(e)}")
            return False
    
    async def crawl_multiple_articles(self, db: AsyncSession, article_ids: list[int]) -> Dict[str, Any]:
        """
        Crawl content for multiple articles
        
        Args:
            db: Database session
            article_ids: List of article IDs to crawl
            
        Returns:
            Dict with success/failure counts
        """
        results = {
            "successful": 0,
            "failed": 0,
            "total": len(article_ids),
            "details": []
        }
        
        for article_id in article_ids:
            success = await self.crawl_and_update_article(db, article_id)
            if success:
                results["successful"] += 1
                results["details"].append({"article_id": article_id, "status": "success"})
            else:
                results["failed"] += 1
                results["details"].append({"article_id": article_id, "status": "failed"})
        
        logger.info(f"Crawled {len(article_ids)} articles: {results['successful']} successful, {results['failed']} failed")
        return results

# Global service instance
content_crawler_service = ContentCrawlerService()