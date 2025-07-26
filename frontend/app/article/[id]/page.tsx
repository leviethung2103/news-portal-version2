import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Clock, Share2, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/header"
import { NewsProvider } from "@/components/news-provider"

// Function to get article content from API
async function getArticle(id: string) {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${API_BASE_URL}/api/v1/rss/articles/${id}/content`);
    
    if (!response.ok) {
      throw new Error('Article not found');
    }
    
    const articleData = await response.json();
    
    // Transform the data to match our component expectations
    return {
      id: articleData.id,
      title: articleData.title,
      description: articleData.content ? articleData.content.substring(0, 200) + "..." : "",
      content: articleData.content || "",
      imageUrl: "/placeholder.svg?height=500&width=800", // Could extract from crawled content
      category: "General", // Could be enhanced with category detection
      source: articleData.source || "Unknown",
      publishedAt: new Date().toISOString(), // Could be enhanced with publication date
      readTime: calculateReadTime(articleData.content || ""),
      trending: false,
      is_crawled: articleData.is_crawled,
      original_link: articleData.original_link,
      html_content: articleData.html_content
    };
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

// Helper function to calculate read time
function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(' ').length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = await getArticle(id)

  if (!article) {
    notFound()
  }

  const timeAgo = new Date(article.publishedAt).toLocaleString()

  return (
    <div className="min-h-screen bg-background">
      <NewsProvider>
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to News
            </Link>
          </Button>
        </div>

        <article className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{article.category}</Badge>
              {article.trending && <Badge variant="destructive">Trending</Badge>}
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold leading-tight">{article.title}</h1>

            <p className="text-xl text-muted-foreground">{article.description}</p>

            <div className="flex items-center justify-between py-4 border-y">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-medium">{article.source}</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{article.readTime}</span>
                </div>
                <span>{timeAgo}</span>
                {article.is_crawled && (
                  <Badge variant="default" className="text-xs">
                    Full Content
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                {article.original_link && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={article.original_link} target="_blank" rel="noopener noreferrer">
                      <ArrowLeft className="h-4 w-4 mr-2 rotate-180" />
                      Original
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          <div className="relative h-64 lg:h-96 rounded-lg overflow-hidden">
            <Image
              src={article.imageUrl || "/placeholder.svg"}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            {article.is_crawled ? (
              // Render crawled markdown content
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {article.content}
              </div>
            ) : (
              // Render basic content as HTML
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            )}
          </div>
        </article>
        </main>
      </NewsProvider>
    </div>
  )
}
