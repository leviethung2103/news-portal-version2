"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ImageIcon, Target, Calendar, Star, Edit, Trash2, Download, Share2, Eye, EyeOff, MousePointer, Grid, LayoutGrid, Upload } from "lucide-react"
import Image from "next/image"
import { visionBoardAPI, type VisionItem as APIVisionItem, type VisionItemCreate } from "@/lib/visionBoardApi"
import { useToast } from "@/hooks/use-toast"
import VisionItemDetailModal from "@/components/vision-item-detail-modal"
import VisionImageUploadModal from "@/components/vision-image-upload-modal"
import html2canvas from "html2canvas"

// Use API VisionItem type, but create a local interface for form data
interface VisionItemFormData {
  title: string
  description: string
  category: string
  targetDate: string
  priority: "high" | "medium" | "low"
  imageUrl: string
}

const categories = [
  "Career",
  "Health & Fitness",
  "Relationships",
  "Travel",
  "Education",
  "Finance",
  "Personal Growth",
  "Hobbies",
  "Family",
  "Other",
]

const priorityColors = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
}

export default function VisionBoard() {
  const [visionItems, setVisionItems] = useState<APIVisionItem[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<APIVisionItem | null>(null)
  const [selectedItem, setSelectedItem] = useState<APIVisionItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showCompleted, setShowCompleted] = useState(true)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"masonry" | "grid">("masonry")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const [newItem, setNewItem] = useState<VisionItemFormData>({
    title: "",
    description: "",
    category: "",
    targetDate: "",
    priority: "medium",
    imageUrl: "",
  })

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

  const handleAddItem = async () => {
    if (!newItem.title || !newItem.category) return

    try {
      const createData: VisionItemCreate = {
        title: newItem.title,
        description: newItem.description || undefined,
        category: newItem.category,
        target_date: newItem.targetDate || undefined,
        priority: newItem.priority,
        image_url: newItem.imageUrl || undefined,
      }

      const createdItem = await visionBoardAPI.createItem(createData)
      setVisionItems([...visionItems, createdItem])
      
      setNewItem({
        title: "",
        description: "",
        category: "",
        targetDate: "",
        priority: "medium",
        imageUrl: "",
      })
      setIsAddDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Vision item created successfully!",
      })
    } catch (error) {
      console.error("Failed to create vision item:", error)
      toast({
        title: "Error", 
        description: "Failed to create vision item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditItem = (item: APIVisionItem) => {
    setEditingItem(item)
    setNewItem({
      title: item.title,
      description: item.description || "",
      category: item.category,
      targetDate: item.target_date ? item.target_date.split('T')[0] : "",
      priority: item.priority,
      imageUrl: item.image_url || "",
    })
  }

  const handleUpdateItem = async () => {
    if (!editingItem || !newItem.title || !newItem.category) return

    try {
      const updateData = {
        title: newItem.title,
        description: newItem.description || undefined,
        category: newItem.category,
        target_date: newItem.targetDate || undefined,
        priority: newItem.priority,
        image_url: newItem.imageUrl || undefined,
      }

      const updatedItem = await visionBoardAPI.updateItem(editingItem.id, updateData)
      
      const updatedItems = visionItems.map((item) =>
        item.id === editingItem.id ? updatedItem : item
      )

      setVisionItems(updatedItems)
      setEditingItem(null)
      setNewItem({
        title: "",
        description: "",
        category: "",
        targetDate: "",
        priority: "medium",
        imageUrl: "",
      })
      
      toast({
        title: "Success",
        description: "Vision item updated successfully!",
      })
    } catch (error) {
      console.error("Failed to update vision item:", error)
      toast({
        title: "Error",
        description: "Failed to update vision item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (id: number) => {
    try {
      await visionBoardAPI.deleteItem(id)
      // Remove item from local state immediately for instant UI feedback
      setVisionItems(visionItems.filter((item) => item.id !== id))
      
      // Reload data from server to ensure consistency
      await loadVisionItems()
      
      toast({
        title: "Success",
        description: "Vision item deleted successfully!",
      })
    } catch (error) {
      console.error("Failed to delete vision item:", error)
      toast({
        title: "Error",
        description: "Failed to delete vision item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleComplete = async (id: number) => {
    try {
      const updatedItem = await visionBoardAPI.toggleItem(id)
      setVisionItems(visionItems.map((item) => (item.id === id ? updatedItem : item)))
      
      toast({
        title: "Success",
        description: `Vision item marked as ${updatedItem.is_completed ? 'completed' : 'pending'}!`,
      })
    } catch (error) {
      console.error("Failed to toggle vision item:", error)
      toast({
        title: "Error",
        description: "Failed to update vision item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In a real app, you would upload to a cloud service
      const imageUrl = URL.createObjectURL(file)
      setNewItem({ ...newItem, imageUrl })
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
      link.download = `vision-board-${new Date().toISOString().split('T')[0]}.png`
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

  const handleImageUploadComplete = () => {
    loadVisionItems()
  }

  const filteredItems = visionItems.filter((item) => {
    const categoryMatch = selectedCategory === "all" || item.category === selectedCategory
    const completedMatch = showCompleted || !item.is_completed
    return categoryMatch && completedMatch
  })

  const completedCount = visionItems.filter((item) => item.is_completed).length
  const totalCount = visionItems.length
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
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "masonry" ? "grid" : "masonry")}>
            {viewMode === "masonry" ? <Grid className="w-4 h-4 mr-2" /> : <LayoutGrid className="w-4 h-4 mr-2" />}
            {viewMode === "masonry" ? "Grid" : "Masonry"}
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalCount}</div>
              <div className="text-sm text-muted-foreground">Total Goals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{progressPercentage.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2"
          >
            {showCompleted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showCompleted ? "Hide" : "Show"} Completed
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setIsImageUploadOpen(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Upload className="w-4 h-4 mr-2" />
            Add Images
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Vision Item
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Vision Item</DialogTitle>
              <DialogDescription>Create a new goal or aspiration for your vision board.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Enter your goal title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Describe your goal in detail"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={newItem.targetDate}
                  onChange={(e) => setNewItem({ ...newItem, targetDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newItem.priority}
                  onValueChange={(value: "high" | "medium" | "low") => setNewItem({ ...newItem, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="image">Image</Label>
                <div className="flex gap-2">
                  <Input
                    value={newItem.imageUrl}
                    onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                    placeholder="Enter image URL"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddItem} className="flex-1">
                  Add Item
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vision Items Grid */}
      <div 
        ref={boardRef}
        className={viewMode === "masonry" 
          ? "columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6" 
          : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        }
      >
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className={`overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer group ${
              item.is_completed ? "opacity-75 bg-muted/50" : ""
            } ${viewMode === "masonry" ? "break-inside-avoid mb-6" : ""}`}
            onClick={() => handleItemClick(item)}
          >
            {item.image_url && (
              <div className={`relative overflow-hidden ${
                viewMode === "masonry" ? "aspect-auto" : "h-48"
              }`}>
                <Image
                  src={item.image_url || "/placeholder.svg"}
                  alt={item.title}
                  width={viewMode === "masonry" ? 400 : 800}
                  height={viewMode === "masonry" ? 300 : 400}
                  className="w-full object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 dark:bg-black/90 rounded-full p-1.5">
                    <MousePointer className="w-3 h-3" />
                  </div>
                </div>
                {item.is_completed && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <div className="bg-green-500 text-white rounded-full p-3 shadow-lg">
                      <Star className="w-6 h-6 fill-current" />
                    </div>
                  </div>
                )}
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className={`text-lg ${item.is_completed ? "line-through text-muted-foreground" : ""}`}>
                  {item.title}
                </CardTitle>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditItem(item)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteItem(item.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{item.category}</Badge>
                <Badge className={priorityColors[item.priority]}>{item.priority}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
              {item.target_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="w-4 h-4" />
                  Target: {new Date(item.target_date).toLocaleDateString()}
                </div>
              )}
              <Button
                variant={item.is_completed ? "secondary" : "default"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleComplete(item.id)
                }}
                className="w-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                {item.is_completed ? "Mark as Incomplete" : "Mark as Complete"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No vision items found</h3>
          <p className="text-muted-foreground mb-4">
            {selectedCategory !== "all" || !showCompleted
              ? "Try adjusting your filters or add new items to get started."
              : "Start by adding your first vision item to begin your journey."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setIsImageUploadOpen(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Upload className="w-4 h-4 mr-2" />
              Add Your First Images
            </Button>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vision Item
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Vision Item</DialogTitle>
            <DialogDescription>Update your goal or aspiration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                placeholder="Enter your goal title"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Describe your goal in detail"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-targetDate">Target Date</Label>
              <Input
                id="edit-targetDate"
                type="date"
                value={newItem.targetDate}
                onChange={(e) => setNewItem({ ...newItem, targetDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={newItem.priority}
                onValueChange={(value: "high" | "medium" | "low") => setNewItem({ ...newItem, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-image">Image</Label>
              <Input
                id="edit-image"
                value={newItem.imageUrl}
                onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                placeholder="Enter image URL"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateItem} className="flex-1">
                Update Item
              </Button>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <VisionItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onEdit={(item) => {
          setSelectedItem(null)
          handleEditItem(item)
        }}
        onDelete={(id) => {
          setSelectedItem(null)
          handleDeleteItem(id)
        }}
        onToggleComplete={handleToggleComplete}
      />

      {/* Image Upload Modal */}
      <VisionImageUploadModal
        isOpen={isImageUploadOpen}
        onClose={() => setIsImageUploadOpen(false)}
        onUploadComplete={handleImageUploadComplete}
      />
    </div>
  )
}
