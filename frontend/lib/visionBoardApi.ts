const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface VisionItem {
  id: number
  title: string
  description?: string
  category: string
  year: number
  target_date?: string
  priority: "high" | "medium" | "low"
  image_url?: string
  is_completed: boolean
  created_at: string
  updated_at: string
  completed_at?: string
  user_id: number
}

/* The line `title: string` in the TypeScript interface `VisionItem` is defining a property named
`title` with a type annotation of `string`. This means that any object that conforms to the
`VisionItem` interface must have a property named `title` that is of type `string`. This property
is required in the interface definition. */
export interface VisionItemCreate {
  title: string
  description?: string
  category: string
  year: number
  target_date?: string
  priority: "high" | "medium" | "low"
  image_url?: string
}

export interface VisionItemUpdate {
  title?: string
  description?: string
  category?: string
  year?: number
  target_date?: string
  priority?: "high" | "medium" | "low"
  image_url?: string
  is_completed?: boolean
}

export interface VisionItemStats {
  total_items: number
  completed_items: number
  pending_items: number
  completion_percentage: number
  items_by_category: Record<string, number>
  items_by_priority: Record<string, number>
}

class VisionBoardAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/v1/vision-board`
  }

  async getItems(params?: {
    skip?: number
    limit?: number
    category?: string
    year?: number
    priority?: "high" | "medium" | "low"
    is_completed?: boolean
  }): Promise<VisionItem[]> {
    const searchParams = new URLSearchParams()
    
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString())
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString())
    if (params?.category) searchParams.append('category', params.category)
    if (params?.year !== undefined) searchParams.append('year', params.year.toString())
    if (params?.priority) searchParams.append('priority', params.priority)
    if (params?.is_completed !== undefined) searchParams.append('is_completed', params.is_completed.toString())

    const url = `${this.baseUrl}/items?${searchParams.toString()}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch vision items: ${response.statusText}`)
    }
    
    return response.json()
  }

  async getItem(id: number): Promise<VisionItem> {
    const response = await fetch(`${this.baseUrl}/items/${id}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch vision item: ${response.statusText}`)
    }
    
    return response.json()
  }

  async createItem(item: VisionItemCreate): Promise<VisionItem> {
    const response = await fetch(`${this.baseUrl}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create vision item: ${response.statusText}`)
    }
    
    return response.json()
  }

  async updateItem(id: number, item: VisionItemUpdate): Promise<VisionItem> {
    const response = await fetch(`${this.baseUrl}/items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to update vision item: ${response.statusText}`)
    }
    
    return response.json()
  }

  async deleteItem(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/items/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`Failed to delete vision item: ${response.statusText}`)
    }
  }

  async toggleItem(id: number): Promise<VisionItem> {
    const response = await fetch(`${this.baseUrl}/items/${id}/toggle`, {
      method: 'PATCH',
    })
    
    if (!response.ok) {
      throw new Error(`Failed to toggle vision item: ${response.statusText}`)
    }
    
    return response.json()
  }

  async getStats(): Promise<VisionItemStats> {
    const response = await fetch(`${this.baseUrl}/stats`)
    if (!response.ok) {
      throw new Error(`Failed to fetch vision stats: ${response.statusText}`)
    }
    
    return response.json()
  }

  async getCategories(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/categories`)
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`)
    }
    
    return response.json()
  }
}

export const visionBoardAPI = new VisionBoardAPI()