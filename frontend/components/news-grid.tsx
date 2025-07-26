"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useNews } from "@/components/news-provider"
import NewsCard from "@/components/news-card"
import LoadingSpinner from "@/components/loading-spinner"

interface Article {
  id: string
  title: string
  description: string
  imageUrl: string
  category: string
  source: string
  publishedAt: string
  readTime: string
  trending: boolean
}

interface NewsResponse {
  articles: Article[]
  totalCount: number
  hasMore: boolean
  currentPage: number
}

export default function NewsGrid() {
  const { selectedCategory, searchTerm } = useNews()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const observer = useRef<IntersectionObserver>()

  const fetchNews = useCallback(async (page = 1, reset = false) => {
    try {
      if (page === 1) setLoading(true)
      else setLoadingMore(true)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "6",
      })

      if (selectedCategory && selectedCategory !== "all") {
        params.append("category", selectedCategory)
      }

      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await fetch(`/api/news?${params}`)
      const data: NewsResponse = await response.json()

      if (reset || page === 1) {
        setArticles(data.articles)
      } else {
        setArticles((prev) => [...prev, ...data.articles])
      }

      setHasMore(data.hasMore)
      setCurrentPage(data.currentPage)
    } catch (error) {
      console.error("Error fetching news:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [selectedCategory, searchTerm])

  const lastArticleElementRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchNews(currentPage + 1)
      }
    })
    if (node) observer.current.observe(node)
  }, [loadingMore, hasMore, currentPage, fetchNews])

  useEffect(() => {
    fetchNews(1, true)
  }, [fetchNews])


  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No articles found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => {
              if (articles.length === index + 1) {
                return (
                  <div ref={lastArticleElementRef} key={article.id}>
                    <NewsCard article={article} />
                  </div>
                )
              } else {
                return <NewsCard key={article.id} article={article} />
              }
            })}
          </div>

          {loadingMore && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading more articles...</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
