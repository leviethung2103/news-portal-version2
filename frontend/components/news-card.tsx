"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Clock, Bookmark, Share2, TrendingUp, X } from "lucide-react"
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
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)

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

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
    currentXRef.current = startXRef.current
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    currentXRef.current = e.touches[0].clientX
    const deltaX = currentXRef.current - startXRef.current
    
    // Only allow dragging to the left
    if (deltaX < 0) {
      setDragOffset(deltaX)
    }
  }

  const handleTouchEnd = async () => {
    if (!isDragging) return
    
    const deltaX = currentXRef.current - startXRef.current
    const threshold = -100 // Drag left 100px to remove
    
    if (deltaX < threshold && onRemove) {
      // Mark as removing and call remove handler
      setIsRemoving(true)
      try {
        // Call API to mark as read
        const token = localStorage.getItem('token')
        if (token) {
          await fetch('/api/articles/mark-read', {
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
        }
        
        onRemove(article.id)
      } catch (error) {
        console.error('Failed to mark article as read:', error)
        setIsRemoving(false)
        setDragOffset(0)
      }
    } else {
      // Snap back
      setDragOffset(0)
    }
    
    setIsDragging(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX
    currentXRef.current = startXRef.current
    setIsDragging(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      currentXRef.current = e.clientX
      const deltaX = currentXRef.current - startXRef.current
      
      // Only allow dragging to the left
      if (deltaX < 0) {
        setDragOffset(deltaX)
      }
    }
    
    const handleMouseUp = async () => {
      if (!isDragging) return
      
      const deltaX = currentXRef.current - startXRef.current
      const threshold = -100 // Drag left 100px to remove
      
      if (deltaX < threshold && onRemove) {
        // Mark as removing and call remove handler
        setIsRemoving(true)
        try {
          // Call API to mark as read
          const token = localStorage.getItem('token')
          if (token) {
            await fetch('/api/articles/mark-read', {
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
          }
          
          onRemove(article.id)
        } catch (error) {
          console.error('Failed to mark article as read:', error)
          setIsRemoving(false)
          setDragOffset(0)
        }
      } else {
        // Snap back
        setDragOffset(0)
      }
      
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  if (isRemoving) {
    return null
  }

  return (
    <div 
      ref={cardRef}
      className="relative"
      style={{
        transform: `translateX(${dragOffset}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {/* Remove indicator */}
      {dragOffset < -50 && (
        <div className="absolute right-0 top-0 h-full w-20 bg-red-500 flex items-center justify-center z-10">
          <X className="h-6 w-6 text-white" />
        </div>
      )}
      
      <Card className={cn(
        "group overflow-hidden transition-all duration-200",
        isDragging ? "cursor-grabbing" : "hover:shadow-lg hover:-translate-y-1",
        dragOffset < -50 && "shadow-lg shadow-red-500/20"
      )}>
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
          <div className="absolute top-3 right-3">
            <Badge variant="secondary">{article.category}</Badge>
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
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/article/${article.id}`}>Read More</Link>
        </Button>
      </CardFooter>
    </Card>
    </div>
  )
}
