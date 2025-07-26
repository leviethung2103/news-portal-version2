"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Clock, Bookmark, Share2, TrendingUp } from "lucide-react"
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
}

export default function NewsCard({ article }: NewsCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

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

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
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
  )
}
