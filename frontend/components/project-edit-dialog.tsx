"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Edit, Plus, Trash2, CheckCircle, Clock } from "lucide-react"
import { Project, Task, projectApi } from "@/lib/projectApi"
import { format, parseISO } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface ProjectEditDialogProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onProjectUpdated: (project: Project) => void
  onProjectDeleted: (projectId: number) => void
}

export default function ProjectEditDialog({ 
  project, 
  isOpen, 
  onClose, 
  onProjectUpdated, 
  onProjectDeleted 
}: ProjectEditDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [projectFormData, setProjectFormData] = useState({
    name: "",
    description: "",
    status: "planning" as const,
    start_date: "",
    end_date: ""
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [taskFormData, setTaskFormData] = useState({
    name: "",
    description: "",
    status: "not_started" as const,
    priority: "medium" as const,
    start_date: "",
    end_date: "",
    progress: 0,
    estimated_hours: 0
  })

  // Load project data when dialog opens
  useEffect(() => {
    if (project) {
      setProjectFormData({
        name: project.name,
        description: project.description || "",
        status: project.status,
        start_date: project.start_date ? format(parseISO(project.start_date), 'yyyy-MM-dd') : "",
        end_date: project.end_date ? format(parseISO(project.end_date), 'yyyy-MM-dd') : ""
      })
      loadProjectTasks()
    }
  }, [project])

  const loadProjectTasks = async () => {
    if (!project) return
    
    try {
      const projectTasks = await projectApi.getProjectTasks(project.id)
      setTasks(projectTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return

    try {
      setLoading(true)
      const updateData = {
        ...projectFormData,
        start_date: projectFormData.start_date ? new Date(projectFormData.start_date).toISOString() : undefined,
        end_date: projectFormData.end_date ? new Date(projectFormData.end_date).toISOString() : undefined,
      }
      
      const updatedProject = await projectApi.updateProject(project.id, updateData)
      onProjectUpdated(updatedProject)
      
      toast({
        title: "Success",
        description: "Project updated successfully!",
      })
    } catch (error) {
      console.error('Error updating project:', error)
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!project) return
    
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return
    }

    try {
      setLoading(true)
      await projectApi.deleteProject(project.id)
      onProjectDeleted(project.id)
      onClose()
      
      toast({
        title: "Success",
        description: "Project deleted successfully!",
      })
    } catch (error) {
      console.error('Error deleting project:', error)
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return

    try {
      const taskData = {
        ...taskFormData,
        start_date: taskFormData.start_date ? new Date(taskFormData.start_date).toISOString() : undefined,
        end_date: taskFormData.end_date ? new Date(taskFormData.end_date).toISOString() : undefined,
        project_id: project.id
      }
      
      const newTask = await projectApi.createTask(project.id, taskData)
      setTasks([...tasks, newTask])
      setIsTaskDialogOpen(false)
      setTaskFormData({
        name: "",
        description: "",
        status: "not_started",
        priority: "medium",
        start_date: "",
        end_date: "",
        progress: 0,
        estimated_hours: 0
      })
      
      toast({
        title: "Success",
        description: "Task created successfully!",
      })
    } catch (error) {
      console.error('Error creating task:', error)
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleTaskDelete = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      await projectApi.deleteTask(taskId)
      setTasks(tasks.filter(task => task.id !== taskId))
      
      toast({
        title: "Success",
        description: "Task deleted successfully!",
      })
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'planning': return 'bg-yellow-500'
      case 'on_hold': return 'bg-orange-500'
      case 'cancelled': return 'bg-red-500'
      case 'not_started': return 'bg-gray-500'
      case 'blocked': return 'bg-red-500'
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

  const calculateProgress = () => {
    if (tasks.length === 0) return 0
    const completedTasks = tasks.filter(task => task.status === 'completed').length
    return Math.round((completedTasks / tasks.length) * 100)
  }

  if (!project) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Project: {project.name}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <form onSubmit={handleProjectSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-project-name">Project Name</Label>
                    <Input
                      id="edit-project-name"
                      value={projectFormData.name}
                      onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                      placeholder="e.g., Website Redesign"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-project-status">Status</Label>
                    <Select value={projectFormData.status} onValueChange={(value: any) => setProjectFormData({ ...projectFormData, status: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-project-description">Description</Label>
                  <Textarea
                    id="edit-project-description"
                    value={projectFormData.description}
                    onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                    placeholder="Brief description of the project..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-start-date">Start Date</Label>
                    <Input
                      id="edit-start-date"
                      type="date"
                      value={projectFormData.start_date}
                      onChange={(e) => setProjectFormData({ ...projectFormData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-end-date">End Date</Label>
                    <Input
                      id="edit-end-date"
                      type="date"
                      value={projectFormData.end_date}
                      onChange={(e) => setProjectFormData({ ...projectFormData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Project Progress</Label>
                  <div className="flex items-center gap-2">
                    <Progress value={calculateProgress()} className="flex-1" />
                    <span className="text-sm text-muted-foreground">{calculateProgress()}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tasks.filter(t => t.status === 'completed').length} of {tasks.length} tasks completed
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteProject}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Project
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Project Tasks</h3>
                <Button onClick={() => setIsTaskDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks in this project yet</p>
                  <p className="text-sm mt-2">Add tasks to break down your project into manageable pieces</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{task.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(task.status)} text-white`}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                            {task.priority}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTaskDelete(task.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {task.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Start: {format(parseISO(task.start_date), 'MMM dd, yyyy')}
                          </span>
                        )}
                        {task.end_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Due: {format(parseISO(task.end_date), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Task Creation Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div>
              <Label htmlFor="task-name">Task Name</Label>
              <Input
                id="task-name"
                value={taskFormData.name}
                onChange={(e) => setTaskFormData({ ...taskFormData, name: e.target.value })}
                placeholder="e.g., Design homepage"
                required
              />
            </div>
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                placeholder="Task description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-status">Status</Label>
                <Select value={taskFormData.status} onValueChange={(value: any) => setTaskFormData({ ...taskFormData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={taskFormData.priority} onValueChange={(value: any) => setTaskFormData({ ...taskFormData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-start-date">Start Date</Label>
                <Input
                  id="task-start-date"
                  type="date"
                  value={taskFormData.start_date}
                  onChange={(e) => setTaskFormData({ ...taskFormData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="task-end-date">End Date</Label>
                <Input
                  id="task-end-date"
                  type="date"
                  value={taskFormData.end_date}
                  onChange={(e) => setTaskFormData({ ...taskFormData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}