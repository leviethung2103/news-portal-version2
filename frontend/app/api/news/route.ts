import { NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function generateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(' ').length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

function generateId(title: string, link: string): string {
  // Use crypto-based hash for consistent IDs that handle unicode
  const text = title + link;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

function extractImageFromDescription(description: string): string {
  // Extract image URL from HTML description
  const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : "/placeholder.svg?height=400&width=600";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "10")

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
        console.log('Could not fetch read articles:', error)
      }
    }

    // Build query parameters for backend - fetch more to account for filtering
    const fetchLimit = limit + readArticleIds.length + 20 // Fetch extra to account for read articles
    const backendParams = new URLSearchParams({
      skip: ((page - 1) * limit).toString(),
      limit: fetchLimit.toString(),
    });

    if (category && category !== "all") {
      backendParams.append("category", category);
    }

    if (search) {
      backendParams.append("search", search);
    }

    // Fetch news from backend RSS feeds with pagination
    const response = await fetch(`${API_BASE_URL}/api/v1/rss/items?${backendParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch RSS items');
    }
    
    const rssItems = await response.json();
    
    // Transform RSS items to match frontend news format
    const transformedNews = rssItems.map((item: any) => ({
      id: item.id || generateId(item.title, item.link), // Use database ID if available
      title: item.title,
      description: item.description || item.content.substring(0, 200) + "...",
      content: item.content,
      imageUrl: extractImageFromDescription(item.description || ""),
      category: item.category || "General",
      source: new URL(item.link).hostname.replace('www.', ''),
      publishedAt: item.published || new Date().toISOString(),
      readTime: generateReadTime(item.content),
      trending: false, // Trending removed
      featured: Math.random() > 0.8, // Random featured status
      link: item.link
    }));

    // Filter out read articles if user is authenticated
    let finalNews = transformedNews
    if (authHeader && readArticleIds.length > 0) {
      finalNews = transformedNews.filter(article => !readArticleIds.includes(String(article.id)))
    }
    
    // Take only the requested limit after filtering
    finalNews = finalNews.slice(0, limit);

    return NextResponse.json({
      articles: finalNews,
      totalCount: finalNews.length,
      hasMore: finalNews.length === limit, // If we got full page, assume there might be more
      currentPage: page,
    });

  } catch (error) {
    console.error('Error fetching news from backend:', error);
    
    // Fallback to mock data if backend is unavailable
    const mockNews = [
      {
        id: "1",
        title: "Backend Connection Error - Using Mock Data",
        description: "Could not connect to RSS backend. Please check if the FastAPI server is running.",
        content: "To resolve this issue, ensure the FastAPI server is running on http://localhost:8000",
        imageUrl: "/placeholder.svg?height=400&width=600",
        category: "System",
        source: "Frontend",
        publishedAt: new Date().toISOString(),
        readTime: "1 min read",
        trending: false,
        featured: true,
      }
    ];

    return NextResponse.json({
      articles: mockNews,
      totalCount: mockNews.length,
      hasMore: false,
      currentPage: 1,
    });
  }
}
