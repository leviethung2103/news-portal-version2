"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, FolderOpen, Clock, CheckCircle, AlertTriangle, BarChart3 } from "lucide-react"
import AuthWrapper from "@/components/auth-wrapper"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import { NewsProvider } from "@/components/news-provider"
import { useAuth } from "@/contexts/auth-context"
import { projectApi, Project, ProjectSummary, TaskSummary } from "@/lib/projectApi"
import { format, parseISO, differenceInDays, isAfter } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import TimelineView from "@/components/timeline-view"
import CalendarView from "@/components/calendar-view"
import ProjectEditDialog from "@/components/project-edit-dialog"

// Disable static optimization for this page
export const dynamic = 'force-dynamic'

export default function ProjectsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [summary, setSummary] = useState<ProjectSummary | null>(null)
  const [recentTasks, setRecentTasks] = useState<TaskSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'overview' | 'gantt' | 'calendar'>('overview')
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [projectFormData, setProjectFormData] = useState({
    name: "",
    description: "",
    status: "planning" as const,
    start_date: "",
    end_date: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [projectsData, summaryData, tasksData] = await Promise.all([
        projectApi.getProjects(),
        projectApi.getProjectSummary(),
        projectApi.getRecentTasks(5)
      ])
      setProjects(projectsData)
      setSummary(summaryData)
      setRecentTasks(tasksData)
    } catch (error) {
      console.error('Error loading project data:', error)
      toast({
        title: "Error",
        description: "Failed to load project data. Please check if the backend server is running.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const projectData = {
        ...projectFormData,
        start_date: projectFormData.start_date ? new Date(projectFormData.start_date).toISOString() : undefined,
        end_date: projectFormData.end_date ? new Date(projectFormData.end_date).toISOString() : undefined,
      }
      
      const newProject = await projectApi.createProject(projectData)
      setProjects([...projects, newProject])
      setIsProjectDialogOpen(false)
      setProjectFormData({
        name: "",
        description: "",
        status: "planning",
        start_date: "",
        end_date: ""
      })
      
      // Reload summary data
      loadData()
      
      toast({
        title: "Success",
        description: "Project created successfully!",
      })
    } catch (error) {
      console.error('Error creating project:', error)
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = () => {
    setIsProjectDialogOpen(false)
    setProjectFormData({
      name: "",
      description: "",
      status: "planning",
      start_date: "",
      end_date: ""
    })
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setIsEditDialogOpen(true)
  }

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
    setIsEditDialogOpen(false)
    setEditingProject(null)
    // Reload data to get updated summary
    loadData()
  }

  const handleProjectDeleted = (projectId: number) => {
    setProjects(projects.filter(p => p.id !== projectId))
    setIsEditDialogOpen(false)
    setEditingProject(null)
    // Reload data to get updated summary
    loadData()
  }

  const handleCreateTask = (projectId: number) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      handleEditProject(project)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'planning': return 'bg-yellow-500'
      case 'on_hold': return 'bg-orange-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const calculateProgress = (project: Project) => {
    if (!project.tasks || project.tasks.length === 0) return 0
    const completedTasks = project.tasks.filter(task => task.status === 'completed').length
    return Math.round((completedTasks / project.tasks.length) * 100)
  }

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null
    const days = differenceInDays(parseISO(endDate), new Date())
    return days
  }

  const isOverdue = (endDate?: string) => {
    if (!endDate) return false
    return isAfter(new Date(), parseISO(endDate))
  }

  if (loading) {
    return (
      <AuthWrapper requireAuth={true}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthWrapper>
    )
  }

  return (
    <AuthWrapper requireAuth={true}>
      <div className="min-h-screen bg-background">
        <NewsProvider>
          <Header />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 lg:ml-64">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Project Management</h1>
            </div>
            <div className="flex gap-2">
              <Button variant={selectedView === 'overview' ? 'default' : 'outline'} onClick={() => setSelectedView('overview')}>
                Overview
              </Button>
              <Button variant={selectedView === 'gantt' ? 'default' : 'outline'} onClick={() => setSelectedView('gantt')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Timeline
              </Button>
              <Button variant={selectedView === 'calendar' ? 'default' : 'outline'} onClick={() => setSelectedView('calendar')}>
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
              <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleProjectSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="project-name">Project Name</Label>
                      <Input
                        id="project-name"
                        value={projectFormData.name}
                        onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                        placeholder="e.g., Website Redesign"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="project-description">Description</Label>
                      <Textarea
                        id="project-description"
                        value={projectFormData.description}
                        onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                        placeholder="Brief description of the project..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="project-status">Status</Label>
                      <Select value={projectFormData.status} onValueChange={(value: any) => setProjectFormData({ ...projectFormData, status: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={projectFormData.start_date}
                          onChange={(e) => setProjectFormData({ ...projectFormData, start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={projectFormData.end_date}
                          onChange={(e) => setProjectFormData({ ...projectFormData, end_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        Create Project
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Project Summary */}
          {summary && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.total_projects}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{summary.active_projects}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{summary.completed_projects}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.total_tasks}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasks Done</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{summary.completed_tasks}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{summary.overdue_tasks}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedView === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Projects List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Projects</CardTitle>
                    <CardDescription>Overview of all your projects</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {projects.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No projects yet. Create your first project to get started!</p>
                      </div>
                    ) : (
                      projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => handleEditProject(project)}
                          className="border rounded-lg p-4 space-y-3 text-left hover:bg-muted/50 transition-colors w-full"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">{project.name}</h3>
                            <Badge className={`${getStatusColor(project.status)} text-white`}>
                              {project.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          {project.description && (
                            <p className="text-sm text-muted-foreground">{project.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {project.start_date && (
                              <span>Started: {format(parseISO(project.start_date), 'MMM dd, yyyy')}</span>
                            )}
                            {project.end_date && (
                              <span className={isOverdue(project.end_date) ? 'text-red-600 font-medium' : ''}>
                                Due: {format(parseISO(project.end_date), 'MMM dd, yyyy')}
                                {(() => {
                                  const days = getDaysRemaining(project.end_date)
                                  if (days !== null) {
                                    if (days < 0) return ' (Overdue)'
                                    if (days === 0) return ' (Due today)'
                                    if (days === 1) return ' (1 day left)'
                                    return ` (${days} days left)`
                                  }
                                  return ''
                                })()}
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{calculateProgress(project)}%</span>
                            </div>
                            <Progress value={calculateProgress(project)} className="h-2" />
                          </div>
                        </button>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Tasks */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Tasks</CardTitle>
                    <CardDescription>Latest task updates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recentTasks.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent tasks</p>
                      </div>
                    ) : (
                      recentTasks.map((task) => (
                        <div key={task.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{task.name}</h4>
                            <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{task.project_name}</p>
                          <div className="flex items-center gap-2">
                            <Progress value={task.progress} className="h-1 flex-1" />
                            <span className="text-xs text-muted-foreground">{task.progress}%</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {selectedView === 'gantt' && (
            <TimelineView 
              projects={projects}
              onEditProject={handleEditProject}
              onCreateTask={handleCreateTask}
            />
          )}

          {selectedView === 'calendar' && (
            <CalendarView 
              projects={projects}
              onEditProject={handleEditProject}
              onCreateTask={handleCreateTask}
            />
          )}
              </div>
            </main>
          </div>
        </NewsProvider>
      </div>

      <ProjectEditDialog
        project={editingProject}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setEditingProject(null)
        }}
        onProjectUpdated={handleProjectUpdated}
        onProjectDeleted={handleProjectDeleted}
      />
    </AuthWrapper>
  )
}