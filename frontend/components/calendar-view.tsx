"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Project, Task } from "@/lib/projectApi"
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

export default function CalendarView({ projects, onEditProject, onCreateTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Generate calendar events from projects and tasks
  const generateEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = []

    projects.forEach(project => {
      // Project start and end events
      if (project.start_date) {
        events.push({
          id: `project-start-${project.id}`,
          title: `${project.name} (Start)`,
          date: parseISO(project.start_date),
          type: 'project_start',
          status: project.status,
          projectId: project.id
        })
      }
      
      if (project.end_date) {
        events.push({
          id: `project-end-${project.id}`,
          title: `${project.name} (Due)`,
          date: parseISO(project.end_date),
          type: 'project_end',
          status: project.status,
          projectId: project.id
        })
      }

      // Task events
      if (project.tasks) {
        project.tasks.forEach(task => {
          if (task.start_date) {
            events.push({
              id: `task-start-${task.id}`,
              title: `${task.name} (Start)`,
              date: parseISO(task.start_date),
              type: 'task_start',
              status: task.status,
              priority: task.priority,
              projectId: project.id,
              taskId: task.id
            })
          }
          
          if (task.end_date) {
            events.push({
              id: `task-end-${task.id}`,
              title: `${task.name} (Due)`,
              date: parseISO(task.end_date),
              type: 'task_end',
              status: task.status,
              priority: task.priority,
              projectId: project.id,
              taskId: task.id
            })
          }
        })
      }
    })

    return events
  }

  const events = generateEvents()

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day))
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
    const project = projects.find(p => p.id === event.projectId)
    if (project) {
      if (event.type.includes('project')) {
        onEditProject(project)
      } else if (event.taskId) {
        // Could implement task editing here
        onEditProject(project)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Project Calendar
            </CardTitle>
            <CardDescription>
              Calendar view of project milestones and deadlines
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
        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No events to display on calendar</p>
            <p className="text-sm mt-2">Create projects and tasks with dates to see them here</p>
          </div>
        ) : (
          <div className="space-y-4">
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
                const dayEvents = getEventsForDay(day)
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isDayToday = isToday(day)

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-1 border border-border/20 ${
                      isCurrentMonth ? 'bg-background' : 'bg-muted/30'
                    } ${isDayToday ? 'bg-primary/5 border-primary/20' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                    } ${isDayToday ? 'text-primary font-bold' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <button
                          key={event.id}
                          onClick={() => handleEventClick(event)}
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
                      
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}