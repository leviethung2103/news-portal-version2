"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface NewsContextType {
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  sidebarOpen: boolean
  toggleSidebar: () => void
}

const NewsContext = createContext<NewsContextType | undefined>(undefined)

export function NewsProvider({ children }: { children: ReactNode }) {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <NewsContext.Provider
      value={{
        selectedCategory,
        setSelectedCategory,
        searchTerm,
        setSearchTerm,
        sidebarOpen,
        toggleSidebar,
      }}
    >
      {children}
    </NewsContext.Provider>
  )
}

export function useNews() {
  const context = useContext(NewsContext)
  if (context === undefined) {
    throw new Error("useNews must be used within a NewsProvider")
  }
  return context
}
