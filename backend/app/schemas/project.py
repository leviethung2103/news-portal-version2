from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.project import ProjectStatus, TaskStatus, TaskPriority


# Project schemas
class ProjectBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = ProjectStatus.PLANNING
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ProjectInDBBase(ProjectBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Project(ProjectInDBBase):
    pass


class ProjectWithTasks(ProjectInDBBase):
    tasks: List["Task"] = []


# Task schemas
class TaskBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.NOT_STARTED
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    progress: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    estimated_hours: Optional[float] = Field(None, ge=0.0)
    actual_hours: Optional[float] = Field(None, ge=0.0)
    assignee_id: Optional[int] = None


class TaskCreate(TaskBase):
    project_id: int


class TaskUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    progress: Optional[float] = Field(None, ge=0.0, le=100.0)
    estimated_hours: Optional[float] = Field(None, ge=0.0)
    actual_hours: Optional[float] = Field(None, ge=0.0)
    assignee_id: Optional[int] = None


class TaskInDBBase(TaskBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Task(TaskInDBBase):
    pass


# Dashboard schemas
class ProjectSummary(BaseModel):
    total_projects: int
    active_projects: int
    completed_projects: int
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int


class TaskSummary(BaseModel):
    id: int
    name: str
    status: TaskStatus
    priority: TaskPriority
    progress: float
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    project_name: str