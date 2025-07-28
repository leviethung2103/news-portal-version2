"use client"

import React, { useState, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Image as ImageIcon, Plus, Grid, LayoutGrid } from "lucide-react"
import Image from "next/image"
import { visionBoardAPI, type VisionItemCreate } from "@/lib/visionBoardApi"
import { useToast } from "@/hooks/use-toast"

interface ImageUpload {
  id: string
  file: File
  preview: string
  title: string
  description: string
  category: string
  priority: "high" | "medium" | "low"
}

interface VisionImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: () => void
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

export default function VisionImageUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
}: VisionImageUploadModalProps) {
  const [images, setImages] = useState<ImageUpload[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length > 0) {
      addImages(imageFiles)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    addImages(files)
  }

  const addImages = (files: File[]) => {
    const newImages: ImageUpload[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
      description: "",
      category: "Personal Growth",
      priority: "medium" as const,
    }))
    
    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id)
      if (image) {
        URL.revokeObjectURL(image.preview)
      }
      return prev.filter(img => img.id !== id)
    })
  }

  const updateImage = (id: string, field: keyof ImageUpload, value: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, [field]: value } : img
    ))
  }

  const handleUpload = async () => {
    if (images.length === 0) return

    setIsUploading(true)
    let successCount = 0
    let errorCount = 0

    try {
      for (const image of images) {
        try {
          // Convert file to base64 data URL for storage
          const imageUrl = image.preview

          const visionItem: VisionItemCreate = {
            title: image.title || "Untitled Vision",
            description: image.description,
            category: image.category,
            priority: image.priority,
            image_url: imageUrl,
          }

          await visionBoardAPI.createItem(visionItem)
          successCount++
        } catch (error) {
          console.error(`Failed to upload ${image.title}:`, error)
          errorCount++
        }
      }

      if (successCount > 0) {
        toast({
          title: "Success!",
          description: `${successCount} vision item${successCount > 1 ? 's' : ''} uploaded successfully${errorCount > 0 ? `. ${errorCount} failed.` : '.'}`,
        })
        
        // Clean up object URLs
        images.forEach(img => URL.revokeObjectURL(img.preview))
        setImages([])
        onUploadComplete()
        onClose()
      } else {
        toast({
          title: "Upload Failed",
          description: "Failed to upload any images. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "An error occurred during upload. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleModalClose = () => {
    // Clean up object URLs when closing
    images.forEach(img => URL.revokeObjectURL(img.preview))
    setImages([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Add Images to Your Vision Board
              </DialogTitle>
              <DialogDescription>
                Upload images that represent your dreams, goals, and aspirations.
              </DialogDescription>
            </div>
            {images.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                >
                  {viewMode === "grid" ? <LayoutGrid className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                </Button>
                <Badge variant="secondary" className="text-sm">
                  {images.length} image{images.length > 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              isDragOver 
                ? "border-purple-400 bg-purple-50 dark:bg-purple-950/20" 
                : "border-muted-foreground/25 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/10"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Upload Your Vision
                </h3>
                <p className="text-muted-foreground mt-1">
                  Drag and drop images here, or click to select files
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Choose Images
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Images Grid/List */}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Configure Your Vision Items</h3>
              </div>
              
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 gap-6" 
                : "space-y-4"
              }>
                {images.map((image) => (
                  <div key={image.id} className="border rounded-lg p-4 space-y-4 bg-card">
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={image.preview}
                          alt={image.title}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                          onClick={() => removeImage(image.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor={`title-${image.id}`} className="text-sm font-medium">
                            Title
                          </Label>
                          <Input
                            id={`title-${image.id}`}
                            value={image.title}
                            onChange={(e) => updateImage(image.id, 'title', e.target.value)}
                            placeholder="Enter vision title"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`description-${image.id}`} className="text-sm font-medium">
                            Description
                          </Label>
                          <Textarea
                            id={`description-${image.id}`}
                            value={image.description}
                            onChange={(e) => updateImage(image.id, 'description', e.target.value)}
                            placeholder="Describe your vision"
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`category-${image.id}`} className="text-sm font-medium">
                              Category
                            </Label>
                            <Select 
                              value={image.category} 
                              onValueChange={(value) => updateImage(image.id, 'category', value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
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
                            <Label htmlFor={`priority-${image.id}`} className="text-sm font-medium">
                              Priority
                            </Label>
                            <Select 
                              value={image.priority} 
                              onValueChange={(value: "high" | "medium" | "low") => updateImage(image.id, 'priority', value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {images.length > 0 && `${images.length} image${images.length > 1 ? 's' : ''} ready to upload`}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleModalClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={images.length === 0 || isUploading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Vision Board
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}