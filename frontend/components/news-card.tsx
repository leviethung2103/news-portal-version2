"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Clock, Bookmark, Share2, TrendingUp, Check, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

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

interface NewsCardProps {
  article: Article
  onRemove?: (articleId: string) => void
}

export default function NewsCard({ article, onRemove }: NewsCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [isMarking, setIsMarking] = useState(false)

  const timeAgo = new Date(article.publishedAt).toLocaleString()
  
  // Strip HTML tags from description
  const cleanDescription = article.description.replace(/<[^>]*>/g, '').trim()

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsBookmarked(!isBookmarked)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.description,
        url: `/article/${article.id}`,
      })
    }
  }

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isMarking || !onRemove) return
    
    setIsMarking(true)
    try {
      // Call API to mark as read
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      console.log('Marking article as read, token:', token ? 'exists' : 'missing')
      console.log('Marking article as read, user:', user ? 'exists' : 'missing')
      
      if (token && user) {
        const response = await fetch('/api/articles/mark-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            article_id: article.id,
            article_title: article.title,
            article_link: `/article/${article.id}`
          })
        })
        console.log('Mark as read response status:', response.status)
        
        if (response.ok) {
          onRemove(article.id)
        } else if (response.status === 401) {
          // Token expired or invalid
          console.warn('Authentication failed when marking article as read')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          alert('Your session has expired. Please log in again to mark articles as read.')
          setIsMarking(false)
        } else {
          console.error('Failed to mark article as read:', response.status, await response.text())
          setIsMarking(false)
        }
      } else {
        console.warn('No authentication credentials found')
        alert('Please log in to mark articles as read.')
        setIsMarking(false)
      }
    } catch (error) {
      console.error('Failed to mark article as read:', error)
      setIsMarking(false)
    }
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 relative">
      <Link href={`/article/${article.id}`}>
        <div className="relative h-48 overflow-hidden">
          {imageLoading && <div className="absolute inset-0 bg-muted animate-pulse" />}
          <Image
            src={article.imageUrl || "/placeholder.svg"}
            alt={article.title}
            fill
            className={cn(
              "object-cover transition-transform duration-200 group-hover:scale-105",
              imageLoading ? "opacity-0" : "opacity-100",
            )}
            onLoad={() => setImageLoading(false)}
          />
          {article.trending && (
            <div className="absolute top-3 left-3">
              <Badge variant="destructive" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Trending
              </Badge>
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge variant="secondary">{article.category}</Badge>
            <Button
              variant="secondary"
              size="sm"
              className="h-6 w-6 p-0 bg-background/80 hover:bg-background"
              onClick={handleMarkAsRead}
              disabled={isMarking}
              title="Mark as read"
            >
              {isMarking ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-current" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/article/${article.id}`}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-3 mb-3">{cleanDescription}</p>
        </Link>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="font-medium">{article.source}</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{article.readTime}</span>
            </div>
          </div>
          <span>{timeAgo}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className={cn("h-8 w-8 p-0", isBookmarked && "text-primary")}
          >
            <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare} className="h-8 w-8 p-0">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAsRead}
            disabled={isMarking}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            title="Mark as read"
          >
            {isMarking ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b border-current" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/article/${article.id}`}>Read More</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
