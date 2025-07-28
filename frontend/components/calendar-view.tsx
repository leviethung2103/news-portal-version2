"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react"
import { Project, projectApi } from "@/lib/projectApi"
import { useToast } from "@/hooks/use-toast"
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  parseISO
} from "date-fns"

interface CalendarViewProps {
  projects: Project[]
  onEditProject: (project: Project) => void
  onCreateTask: (projectId: number) => void
  onTaskCreated?: () => void
  onProjectsUpdate?: (projects: Project[]) => void
}

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: 'project_start' | 'project_end' | 'task_start' | 'task_end'
  status: string
  priority?: string
  projectId?: number
  taskId?: number
}

export default function CalendarView({ projects, onEditProject, onCreateTask, onTaskCreated, onProjectsUpdate }: CalendarViewProps) {
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [localProjects, setLocalProjects] = useState<Project[]>(projects)
  
  // Sync local projects with props
  useEffect(() => {
    setLocalProjects(projects)
  }, [projects])

  const [taskFormData, setTaskFormData] = useState({
    name: "",
    description: "",
    status: "not_started" as const,
    priority: "medium" as const,
    project_id: "",
    progress: 0,
    estimated_hours: 0
  })

  // Generate calendar events for a specific project (tasks only)
  const generateEventsForProject = (project: Project): CalendarEvent[] => {
    // Since we removed dates from tasks and project events,
    // the calendar is now primarily for task creation
    // No events will be displayed on the calendar
    return []
  }

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDay = (day: Date, projectEvents: CalendarEvent[]) => {
    return projectEvents.filter(event => isSameDay(event.date, day))
  }

  const getEventColor = (event: CalendarEvent) => {
    if (event.type.includes('project')) {
      switch (event.status) {
        case 'completed': return 'bg-green-500'
        case 'in_progress': return 'bg-blue-500'
        case 'planning': return 'bg-yellow-500'
        case 'on_hold': return 'bg-orange-500'
        case 'cancelled': return 'bg-red-500'
        default: return 'bg-gray-500'
      }
    } else {
      // Task events use priority colors
      switch (event.priority) {
        case 'critical': return 'bg-red-500'
        case 'high': return 'bg-orange-500'
        case 'medium': return 'bg-yellow-500'
        case 'low': return 'bg-green-500'
        default: return 'bg-gray-500'
      }
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1))
  }

  const handleEventClick = (event: CalendarEvent) => {
    const project = localProjects.find(p => p.id === event.projectId)
    if (project && event.taskId) {
      // When clicking on a task, edit the specific task, not the project
      onEditProject(project)
    }
  }

  const handleDayClick = (day: Date, project: Project) => {
    setSelectedDate(day)
    setSelectedProject(project)
    setTaskFormData({
      ...taskFormData,
      project_id: project.id.toString()
    })
    setIsTaskDialogOpen(true)
  }

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskFormData.name || !taskFormData.project_id) return

    try {
      const projectId = parseInt(taskFormData.project_id)
      const taskData = {
        name: taskFormData.name,
        description: taskFormData.description || undefined,
        status: taskFormData.status,
        priority: taskFormData.priority,
        progress: taskFormData.progress,
        estimated_hours: taskFormData.estimated_hours || undefined,
        project_id: projectId
      }
      
      const newTask = await projectApi.createTask(projectId, taskData)
      
      // Update local state immediately without full page reload
      const updatedProjects = localProjects.map(project => {
        if (project.id === projectId) {
          return {
            ...project,
            tasks: [...(project.tasks || []), newTask]
          }
        }
        return project
      })
      
      setLocalProjects(updatedProjects)
      
      // Optionally notify parent of the update
      if (onProjectsUpdate) {
        onProjectsUpdate(updatedProjects)
      }
      
      setIsTaskDialogOpen(false)
      setSelectedProject(null)
      setTaskFormData({
        name: "",
        description: "",
        status: "not_started",
        priority: "medium",
        project_id: "",
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

  const renderProjectCalendar = (project: Project) => {
    const projectEvents = generateEventsForProject(project)
    const hasEvents = projectEvents.length > 0
    
    return (
      <Card key={project.id} className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${project.status === 'completed' ? 'bg-green-500' : 
                  project.status === 'in_progress' ? 'bg-blue-500' : 
                  project.status === 'planning' ? 'bg-yellow-500' : 
                  project.status === 'on_hold' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                {project.name}
              </CardTitle>
              <CardDescription>
                {project.description || 'No description'} • {project.tasks?.length || 0} tasks
              </CardDescription>
            </div>
            <Badge variant="outline" className="capitalize">
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!hasEvents && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No events for this project. Click on calendar days to add tasks.</p>
              </div>
            )}
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {/* Header */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendarDays.map((day, index) => {
                  const dayEvents = getEventsForDay(day, projectEvents)
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isDayToday = isToday(day)

                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-1 border border-border/20 cursor-pointer hover:bg-muted/20 transition-colors ${
                        isCurrentMonth ? 'bg-background' : 'bg-muted/30'
                      } ${isDayToday ? 'bg-primary/5 border-primary/20' : ''}`}
                      onClick={() => handleDayClick(day, project)}
                    >
                      <div className={`text-sm font-medium mb-1 flex items-center justify-between ${
                        isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                      } ${isDayToday ? 'text-primary font-bold' : ''}`}>
                        <span>{format(day, 'd')}</span>
                        {isCurrentMonth && (
                          <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <button
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEventClick(event)
                            }}
                            className={`w-full text-left text-xs p-1 rounded ${getEventColor(event)} text-white hover:opacity-80 transition-opacity truncate`}
                          >
                            <div className="flex items-center gap-1">
                              {event.type.includes('start') ? (
                                <div className="w-1 h-1 bg-white rounded-full flex-shrink-0"></div>
                              ) : (
                                <Clock className="w-2 h-2 flex-shrink-0" />
                              )}
                              <span className="truncate">{event.title}</span>
                            </div>
                          </button>
                        ))}
                        
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with global navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Project Calendars
              </CardTitle>
              <CardDescription>
                Individual calendar view for each project
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Project Events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>High Priority Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Medium Priority Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Low Priority Tasks</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Project Calendars */}
      {localProjects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No projects found</p>
            <p className="text-sm mt-2">Create a project to see its calendar</p>
          </CardContent>
        </Card>
      ) : (
        localProjects.map(project => renderProjectCalendar(project))
      )}

      {/* Task Creation Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={(open) => {
        setIsTaskDialogOpen(open)
        if (!open) {
          setSelectedProject(null)
          setTaskFormData({
            name: "",
            description: "",
            status: "not_started",
            priority: "medium",
            project_id: "",
            progress: 0,
            estimated_hours: 0
          })
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add Task for {selectedDate && format(selectedDate, 'MMM dd, yyyy')}
              {selectedProject && (
                <div className="text-sm font-normal text-muted-foreground mt-1">
                  Project: {selectedProject.name}
                </div>
              )}
            </DialogTitle>
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
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!taskFormData.name}>
                Create Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}