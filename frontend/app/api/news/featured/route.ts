import { NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function generateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(' ').length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

function extractImageFromDescription(description: string): string {
  // Extract image URL from HTML description
  const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : "/placeholder.svg?height=500&width=800";
}

export async function GET(request: Request) {
  try {
    // Get authentication header to fetch read articles
    const authHeader = request.headers.get('authorization')
    let readArticleIds: string[] = []
    
    // Fetch read articles if authenticated
    if (authHeader) {
      try {
        const readResponse = await fetch(`${API_BASE_URL}/api/v1/articles/read-articles`, {
          headers: { 'Authorization': authHeader }
        })
        if (readResponse.ok) {
          readArticleIds = await readResponse.json()
        }
      } catch (error) {
        console.log('Could not fetch read articles for featured:', error)
      }
    }

    // Fetch latest articles from backend RSS feeds
    const response = await fetch(`${API_BASE_URL}/api/v1/rss/items?limit=10`); // Fetch more to account for read articles
    
    if (!response.ok) {
      throw new Error('Failed to fetch RSS items');
    }
    
    const rssItems = await response.json();
    
    // Filter out read articles and select the most recent unread article as featured
    if (rssItems && rssItems.length > 0) {
      let unreadItems = rssItems
      if (authHeader && readArticleIds.length > 0) {
        unreadItems = rssItems.filter((item: any) => !readArticleIds.includes(String(item.id)))
      }
      
      if (unreadItems.length === 0) {
        // No unread articles, fall back to most recent
        unreadItems = rssItems
      }
      
      const latestItem = unreadItems[0]; // Get the most recent unread article
      
      const featuredArticle = {
        id: latestItem.id || "featured-1",
        title: latestItem.title,
        description: latestItem.description || latestItem.content.substring(0, 200) + "...",
        content: latestItem.content,
        imageUrl: extractImageFromDescription(latestItem.description || ""),
        category: latestItem.category || "General",
        source: new URL(latestItem.link).hostname.replace('www.', ''),
        publishedAt: latestItem.published || new Date().toISOString(),
        readTime: generateReadTime(latestItem.content),
        trending: false,
        featured: true,
        link: latestItem.link
      };
      
      return NextResponse.json(featuredArticle);
    }
    
    // Fallback if no articles available
    throw new Error('No articles available');
    
  } catch (error) {
    console.error('Error fetching featured article from backend:', error);
    
    // Fallback: return a message indicating no featured article is available
    const fallbackArticle = {
      id: "no-featured",
      title: "No Featured Article Available",
      description: "Connect RSS feeds to see featured articles here. Go to Settings to add RSS feeds.",
      content: "To see featured articles, please add RSS feeds in the Settings page. The most recent article from your feeds will appear here.",
      imageUrl: "/placeholder.svg?height=500&width=800",
      category: "System",
      source: "Dashboard",
      publishedAt: new Date().toISOString(),
      readTime: "1 min read",
      trending: false,
      featured: true,
      link: "/settings"
    };

    return NextResponse.json(fallbackArticle);
  }
}
