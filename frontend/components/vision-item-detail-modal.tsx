"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Target, Clock, Edit, Trash2, CheckCircle, Circle, Download, Share2 } from "lucide-react"
import Image from "next/image"
import { VisionItem } from "@/lib/visionBoardApi"

interface VisionItemDetailModalProps {
  item: VisionItem | null
  isOpen: boolean
  onClose: () => void
  onEdit: (item: VisionItem) => void
  onDelete: (id: number) => void
  onToggleComplete: (id: number) => void
}

const priorityColors = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
}

export default function VisionItemDetailModal({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
}: VisionItemDetailModalProps) {
  const [imageLoading, setImageLoading] = useState(true)

  if (!item) return null

  const handleDownloadImage = async () => {
    if (!item.image_url) return
    
    try {
      const response = await fetch(item.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: window.location.href,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `${item.title}\n${item.description}\n${window.location.href}`
      await navigator.clipboard.writeText(shareText)
    }
  }

  const targetDate = item.target_date ? new Date(item.target_date) : null
  const createdDate = new Date(item.created_at)
  const updatedDate = new Date(item.updated_at)
  const completedDate = item.completed_at ? new Date(item.completed_at) : null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className={`text-2xl font-bold ${item.is_completed ? "line-through text-muted-foreground" : ""}`}>
                {item.title}
              </DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{item.category}</Badge>
                <Badge className={priorityColors[item.priority]}>{item.priority}</Badge>
                {item.is_completed && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Completed
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(item.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Image Section */}
          {item.image_url && (
            <div className="space-y-4">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <Image
                  src={item.image_url}
                  alt={item.title}
                  width={500}
                  height={500}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={() => setImageLoading(false)}
                  unoptimized
                />
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                {item.is_completed && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <div className="bg-green-500 text-white rounded-full p-3">
                      <CheckCircle className="w-8 h-8 fill-current" />
                    </div>
                  </div>
                )}
              </div>
              <Button variant="outline" onClick={handleDownloadImage} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Image
              </Button>
            </div>
          )}

          {/* Details Section */}
          <div className={`space-y-6 ${!item.image_url ? 'lg:col-span-2' : ''}`}>
            {/* Description */}
            {item.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            )}

            <Separator />

            {/* Timeline Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Timeline</h3>
              
              <div className="space-y-3">
                {targetDate && (
                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Target Date</p>
                      <p className="text-sm text-muted-foreground">
                        {targetDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {createdDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {updatedDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {completedDate && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Completed</p>
                      <p className="text-sm text-muted-foreground">
                        {completedDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Progress Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Progress</h3>
              
              {targetDate && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Time Progress</span>
                    <span className="font-medium">
                      {(() => {
                        const now = new Date()
                        const start = createdDate
                        const end = targetDate
                        const total = end.getTime() - start.getTime()
                        const elapsed = now.getTime() - start.getTime()
                        const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100)
                        return `${Math.round(progress)}%`
                      })()}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(() => {
                          const now = new Date()
                          const start = createdDate
                          const end = targetDate
                          const total = end.getTime() - start.getTime()
                          const elapsed = now.getTime() - start.getTime()
                          return Math.min(Math.max((elapsed / total) * 100, 0), 100)
                        })()}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {targetDate > new Date() 
                      ? `${Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining`
                      : targetDate < new Date() 
                        ? `${Math.ceil((new Date().getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))} days overdue`
                        : 'Due today'
                    }
                  </p>
                </div>
              )}

              <Button
                onClick={() => onToggleComplete(item.id)}
                className="w-full"
                variant={item.is_completed ? "secondary" : "default"}
              >
                {item.is_completed ? (
                  <>
                    <Circle className="w-4 h-4 mr-2" />
                    Mark as Incomplete
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Complete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}