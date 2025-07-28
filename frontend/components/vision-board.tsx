"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Grid, Share2, Download, Plus, CheckCircle, Target } from "lucide-react"
import Image from "next/image"
import { visionBoardAPI, type VisionItem as APIVisionItem } from "@/lib/visionBoardApi"
import { useToast } from "@/hooks/use-toast"
import VisionItemDetailModal from "@/components/vision-item-detail-modal"
import VisionProjectUploadModal from "@/components/vision-project-upload-modal"
import html2canvas from "html2canvas"

export default function VisionBoard() {
  const [visionItems, setVisionItems] = useState<APIVisionItem[]>([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<APIVisionItem | null>(null)
  const [loading, setLoading] = useState(true)
  const boardRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Load vision items from API
  useEffect(() => {
    loadVisionItems()
  }, [])

  const loadVisionItems = async () => {
    try {
      setLoading(true)
      const items = await visionBoardAPI.getItems()
      setVisionItems(items)
    } catch (error) {
      console.error("Failed to load vision items:", error)
      toast({
        title: "Error",
        description: "Failed to load vision items. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportBoard = async () => {
    if (!boardRef.current) return

    try {
      const canvas = await html2canvas(boardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      })
      
      const link = document.createElement('a')
      link.download = `vision-board-${new Date().getFullYear()}.png`
      link.href = canvas.toDataURL()
      link.click()
      
      toast({
        title: "Success!",
        description: "Vision board exported successfully!",
      })
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export vision board. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleItemClick = (item: APIVisionItem) => {
    setSelectedItem(item)
  }

  const handleUploadComplete = () => {
    loadVisionItems()
  }

  const handleToggleComplete = async (id: number) => {
    try {
      const updatedItem = await visionBoardAPI.toggleItem(id)
      setVisionItems(visionItems.map((item) => (item.id === id ? updatedItem : item)))
      
      toast({
        title: "Success",
        description: `Project marked as ${updatedItem.is_completed ? 'completed' : 'pending'}!`,
      })
    } catch (error) {
      console.error("Failed to toggle vision item:", error)
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (id: number) => {
    try {
      await visionBoardAPI.deleteItem(id)
      setVisionItems(visionItems.filter((item) => item.id !== id))
      
      toast({
        title: "Success",
        description: "Project deleted successfully!",
      })
    } catch (error) {
      console.error("Failed to delete vision item:", error)
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Group items by year
  const itemsByYear = visionItems.reduce((acc, item) => {
    const year = item.year || new Date().getFullYear()
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(item)
    return acc
  }, {} as Record<number, APIVisionItem[]>)

  // Get available years
  const availableYears = Object.keys(itemsByYear)
    .map(Number)
    .sort((a, b) => b - a) // Latest years first

  // Calculate progress stats
  const totalCount = visionItems.length
  const completedCount = visionItems.filter((item) => item.is_completed).length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vision Board</h1>
          <p className="text-muted-foreground">Visualize your goals and track your progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Grid className="w-4 h-4 mr-2" />
            Grid
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportBoard}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Progress Overview</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{totalCount}</div>
              <div className="text-sm text-muted-foreground">Total Goals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{completedCount}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{progressPercentage.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Images
        </Button>
      </div>

      {/* Vision Board Content */}
      <div ref={boardRef} className="bg-background p-6 rounded-lg border">
        {visionItems.length === 0 ? (
          // Empty State
          <div className="text-center py-12">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Plus className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Start Your Vision Board</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add images that represent your dreams, goals, and aspirations. 
              Create a visual representation of the life you want to build.
            </p>
            <Button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Images
            </Button>
          </div>
        ) : (
          // Year-based Layout - Show all years
          <div className="space-y-12">
            {availableYears.map((year) => (
              <div key={year} className="space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2">{year}</h2>
                  <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {itemsByYear[year].map((item) => (
                    <Card 
                      key={item.id} 
                      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 relative"
                      onClick={() => handleItemClick(item)}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-square relative overflow-hidden rounded-lg">
                          {item.image_url ? (
                            <>
                              <Image
                                src={item.image_url}
                                alt={item.title}
                                fill
                                className="object-cover transition-all duration-300 group-hover:scale-110"
                                unoptimized
                              />
                              {item.is_completed && (
                                <div className="absolute top-2 left-2">
                                  <CheckCircle className="w-6 h-6 text-green-500 bg-white rounded-full" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <div className="bg-white/90 dark:bg-black/90 px-3 py-1 rounded-full">
                                  <span className="text-xs font-medium">View Details</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <span className="text-muted-foreground text-sm">Image</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-xs text-center text-muted-foreground line-clamp-2">
                            {item.description || "Description"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <VisionItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onEdit={() => {
          // For now, just close the modal since we don't have an edit modal in this simplified version
          setSelectedItem(null)
        }}
        onDelete={(id) => {
          setSelectedItem(null)
          handleDeleteItem(id)
        }}
        onToggleComplete={handleToggleComplete}
      />

      {/* Upload Modal */}
      <VisionProjectUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  )
}