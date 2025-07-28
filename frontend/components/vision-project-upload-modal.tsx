"use client"

import React, { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { visionBoardAPI, type VisionItemCreate } from "@/lib/visionBoardApi"
import { useToast } from "@/hooks/use-toast"

interface VisionProjectUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: () => void
}

interface ProjectFormData {
  title: string
  description: string
  year: number
  imageFile: File | null
  imagePreview: string
}

export default function VisionProjectUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
}: VisionProjectUploadModalProps) {
  const currentYear = new Date().getFullYear()
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    year: currentYear,
    imageFile: null,
    imagePreview: "",
  })

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      handleImageFile(imageFile)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageFile(file)
    }
  }

  const handleImageFile = (file: File) => {
    const preview = URL.createObjectURL(file)
    setFormData(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: preview,
      title: prev.title || file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
    }))
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const removeImage = () => {
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview)
    }
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: "",
    }))
  }

  const handleUpload = async () => {
    if (!formData.imageFile || !formData.title) {
      toast({
        title: "Missing Information",
        description: "Please provide both an image and a title for your project.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Convert image file to base64 for permanent storage
      const base64Image = await convertFileToBase64(formData.imageFile)
      
      const visionItem: VisionItemCreate = {
        title: formData.title,
        description: formData.description,
        year: formData.year,
        category: "Project",
        priority: "medium",
        image_url: base64Image,
      }

      console.log('Sending vision item:', visionItem)
      const result = await visionBoardAPI.createItem(visionItem)
      console.log('API response:', result)
      
      toast({
        title: "Success!",
        description: "Project added to your vision board successfully!",
      })
      
      handleModalClose()
      onUploadComplete()
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to add project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleModalClose = () => {
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview)
    }
    setFormData({
      title: "",
      description: "",
      year: currentYear,
      imageFile: null,
      imagePreview: "",
    })
    onClose()
  }

  // Generate year options (current year ± 10 years)
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Add Project to Vision Board
          </DialogTitle>
          <DialogDescription>
            Upload an image and describe your project or goal for the selected year.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Project Image</Label>
            
            {!formData.imagePreview ? (
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
                    <h3 className="text-lg font-semibold">Upload Project Image</h3>
                    <p className="text-muted-foreground mt-1">
                      Drag and drop an image here, or click to select
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Choose Image
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={formData.imagePreview}
                    alt="Project preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full p-0"
                  onClick={removeImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title" className="text-base font-semibold">
                Project Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter your project title"
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="year" className="text-base font-semibold">
                Target Year *
              </Label>
              <Select 
                value={formData.year.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, year: parseInt(value) }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description" className="text-base font-semibold">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your project, goals, or vision..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            * Required fields
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleModalClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!formData.imageFile || !formData.title || isUploading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Project...
                </>
              ) : (
                "Add to Vision Board"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}