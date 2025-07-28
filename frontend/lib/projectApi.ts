const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Project {
  id: number
  name: string
  description?: string
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
  user_id: number
  tasks?: Task[]
}

export interface Task {
  id: number
  name: string
  description?: string
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'critical'
  start_date?: string
  end_date?: string
  progress: number
  estimated_hours?: number
  actual_hours?: number
  project_id: number
  assignee_id?: number
  created_at: string
  updated_at: string
}

export interface ProjectSummary {
  total_projects: number
  active_projects: number
  completed_projects: number
  total_tasks: number
  completed_tasks: number
  overdue_tasks: number
}

export interface TaskSummary {
  id: number
  name: string
  status: Task['status']
  priority: Task['priority']
  progress: number
  start_date?: string
  end_date?: string
  project_name: string
}

class ProjectAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/api/v1/projects${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getProjectSummary(): Promise<ProjectSummary> {
    return this.request<ProjectSummary>('/summary')
  }

  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/')
  }

  async getProject(id: number): Promise<Project> {
    return this.request<Project>(`/${id}`)
  }

  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Project> {
    return this.request<Project>('/', {
      method: 'POST',
      body: JSON.stringify(project),
    })
  }

  async updateProject(id: number, project: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    })
  }

  async deleteProject(id: number): Promise<void> {
    await this.request(`/${id}`, {
      method: 'DELETE',
    })
  }

  async getProjectTasks(projectId: number): Promise<Task[]> {
    return this.request<Task[]>(`/${projectId}/tasks`)
  }

  async createTask(projectId: number, task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_id'>): Promise<Task> {
    return this.request<Task>(`/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    })
  }

  async updateTask(taskId: number, task: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    })
  }

  async deleteTask(taskId: number): Promise<void> {
    await this.request(`/tasks/${taskId}`, {
      method: 'DELETE',
    })
  }

  async getRecentTasks(limit: number = 10): Promise<TaskSummary[]> {
    return this.request<TaskSummary[]>(`/tasks/recent?limit=${limit}`)
  }
}

export const projectApi = new ProjectAPI()