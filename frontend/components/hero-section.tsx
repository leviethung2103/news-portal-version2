"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Clock, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface FeaturedArticle {
  id: string
  title: string
  description: string
  imageUrl: string
  category: string
  source: string
  publishedAt: string
  readTime: string
}

export default function HeroSection() {
  const [featuredArticle, setFeaturedArticle] = useState<FeaturedArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set())

  // Fetch read articles
  useEffect(() => {
    const fetchReadArticles = async () => {
      try {
        const token = localStorage.getItem('token')
        const user = localStorage.getItem('user')
        if (token && user) {
          const response = await fetch('/api/articles/read-articles', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (response.ok) {
            const readIds = await response.json()
            setReadArticles(new Set(readIds))
          } else if (response.status === 401) {
            // Token expired, clear auth data
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        }
      } catch (error) {
        console.error('Failed to fetch read articles:', error)
      }
    }
    fetchReadArticles()
  }, [])

  const fetchFeaturedArticle = useCallback(async () => {
    try {
      // Add authentication header if available
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch("/api/news/featured", { headers })
      const article = await response.json()
      
      // If the current featured article is read, fetch a new one
      if (article && readArticles.has(article.id)) {
        // Try to get another featured article
        const newsResponse = await fetch("/api/news?limit=5")
        const newsData = await newsResponse.json()
        
        // Find the first unread article
        const unreadArticle = newsData.articles.find((a: any) => !readArticles.has(a.id))
        
        if (unreadArticle) {
          setFeaturedArticle({
            ...unreadArticle,
            featured: true
          })
        } else {
          setFeaturedArticle(article) // Keep original if no unread articles
        }
      } else {
        setFeaturedArticle(article)
      }
    } catch (error) {
      console.error("Error fetching featured article:", error)
    } finally {
      setLoading(false)
    }
  }, [readArticles])

  useEffect(() => {
    if (readArticles.size >= 0) { // Only fetch when readArticles is loaded
      fetchFeaturedArticle()
    }
  }, [fetchFeaturedArticle, readArticles])

  if (loading) {
    return (
      <div className="relative h-96 bg-muted animate-pulse rounded-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">Loading featured article...</div>
        </div>
      </div>
    )
  }

  // Don't show featured article if it's been read
  if (!featuredArticle || readArticles.has(featuredArticle.id)) {
    return null
  }

  const timeAgo = new Date(featuredArticle.publishedAt).toLocaleString()

  return (
    <div className="relative overflow-hidden rounded-lg bg-card shadow-lg">
      <div className="grid lg:grid-cols-2 gap-0">
        <div className="relative h-64 lg:h-96">
          <Image
            src={featuredArticle.imageUrl || "/placeholder.svg"}
            alt={featuredArticle.title}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="p-6 lg:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">{featuredArticle.category}</Badge>
            <span className="text-sm text-muted-foreground">Featured</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-4 leading-tight">{featuredArticle.title}</h1>
          <p className="text-muted-foreground mb-6 line-clamp-3">{featuredArticle.description}</p>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-4">
              <span>{featuredArticle.source}</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{featuredArticle.readTime}</span>
              </div>
            </div>
            <span>{timeAgo}</span>
          </div>
          <Button asChild className="w-fit">
            <Link href={`/article/${featuredArticle.id}`}>
              Read Full Article
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
