"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Project, Task } from "@/lib/projectApi"
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isWithinInterval, differenceInDays, isSameDay } from "date-fns"

interface TimelineViewProps {
  projects: Project[]
  onEditProject: (project: Project) => void
  onCreateTask: (projectId: number) => void
}

export default function TimelineView({ projects, onEditProject, onCreateTask }: TimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')

  // Calculate the date range for the timeline
  const getDateRange = () => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate)
      const end = endOfWeek(currentDate)
      return { start, end, days: eachDayOfInterval({ start, end }) }
    } else {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      return { start, end, days: eachDayOfInterval({ start, end }) }
    }
  }

  const { start: rangeStart, end: rangeEnd, days } = getDateRange()

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

  const calculateBarPosition = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return { left: 0, width: 0, visible: false }

    const itemStart = parseISO(startDate)
    const itemEnd = parseISO(endDate)
    
    // Check if the item overlaps with our view range
    const overlaps = isWithinInterval(itemStart, { start: rangeStart, end: rangeEnd }) ||
                    isWithinInterval(itemEnd, { start: rangeStart, end: rangeEnd }) ||
                    (itemStart <= rangeStart && itemEnd >= rangeEnd)

    if (!overlaps) return { left: 0, width: 0, visible: false }

    const totalDays = days.length
    const dayWidth = 100 / totalDays

    // Calculate start position
    const startDiff = Math.max(0, differenceInDays(itemStart, rangeStart))
    const left = Math.max(0, (startDiff / totalDays) * 100)

    // Calculate width
    const actualStart = itemStart > rangeStart ? itemStart : rangeStart
    const actualEnd = itemEnd < rangeEnd ? itemEnd : rangeEnd
    const durationDays = Math.max(1, differenceInDays(actualEnd, actualStart) + 1)
    const width = Math.min(100 - left, (durationDays / totalDays) * 100)

    return { left, width, visible: true }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') {
      setCurrentDate(prev => direction === 'prev' ? subDays(prev, 7) : addDays(prev, 7))
    } else {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + (direction === 'prev' ? -1 : 1), 1))
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Project Timeline
            </CardTitle>
            <CardDescription>
              Gantt chart view of project schedules and deadlines
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border">
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className="rounded-r-none"
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className="rounded-l-none"
              >
                Month
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {viewMode === 'week' 
                  ? `${format(rangeStart, 'MMM d')} - ${format(rangeEnd, 'MMM d, yyyy')}`
                  : format(currentDate, 'MMMM yyyy')
                }
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No projects to display on timeline</p>
            <p className="text-sm mt-2">Create projects with start and end dates to see them here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timeline Header */}
            <div className="flex border-b pb-2">
              <div className="w-64 font-medium text-sm text-muted-foreground">Project / Task</div>
              <div className="flex-1 grid grid-cols-7 gap-1 text-xs text-center text-muted-foreground">
                {days.slice(0, 7).map((day, index) => (
                  <div key={index} className="p-1">
                    <div className="font-medium">{format(day, 'EEE')}</div>
                    <div className={`${isSameDay(day, new Date()) ? 'text-primary font-bold' : ''}`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Content */}
            <div className="space-y-3">
              {projects.map((project) => {
                const projectBar = calculateBarPosition(project.start_date, project.end_date)
                
                return (
                  <div key={project.id} className="group">
                    {/* Project Row */}
                    <div className="flex items-center mb-2">
                      <div className="w-64 pr-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEditProject(project)}
                            className="text-left hover:bg-muted rounded p-1 flex-1"
                          >
                            <div className="font-medium text-sm truncate">{project.name}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge className={`${getStatusColor(project.status)} text-white text-xs`}>
                                {project.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCreateTask(project.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 relative h-8">
                        {projectBar.visible && (
                          <div
                            className={`absolute top-1 h-6 ${getStatusColor(project.status)} rounded opacity-80 border border-white/20`}
                            style={{
                              left: `${projectBar.left}%`,
                              width: `${projectBar.width}%`,
                            }}
                          >
                            <div className="h-full flex items-center justify-center text-white text-xs font-medium truncate px-1">
                              {project.name}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tasks Rows */}
                    {project.tasks && project.tasks.map((task) => {
                      const taskBar = calculateBarPosition(task.start_date, task.end_date)
                      
                      return (
                        <div key={task.id} className="flex items-center mb-1 ml-4">
                          <div className="w-60 pr-4">
                            <div className="text-sm text-muted-foreground truncate">{task.name}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                                {task.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{task.progress}%</span>
                            </div>
                          </div>
                          <div className="flex-1 relative h-6">
                            {taskBar.visible && (
                              <div
                                className={`absolute top-1 h-4 ${getPriorityColor(task.priority)} rounded opacity-70`}
                                style={{
                                  left: `${taskBar.left}%`,
                                  width: `${taskBar.width}%`,
                                }}
                              >
                                <div className="h-full flex items-center justify-center text-white text-xs truncate px-1">
                                  {task.progress}%
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
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