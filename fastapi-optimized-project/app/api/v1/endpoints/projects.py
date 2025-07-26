from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.session import get_db
from app.db import crud_project
from app.schemas.project import (
    Project, ProjectCreate, ProjectUpdate, ProjectWithTasks,
    Task, TaskCreate, TaskUpdate, ProjectSummary, TaskSummary
)

router = APIRouter()

# Mock authentication - replace with actual authentication
def get_current_user_id() -> int:
    # This should be replaced with actual authentication logic
    return 1


@router.get("/summary", response_model=ProjectSummary)
async def get_project_summary(
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get project summary statistics for the current user."""
    return await crud_project.get_project_summary(db, current_user_id)


@router.get("/", response_model=List[Project])
async def get_projects(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get all projects for the current user."""
    return await crud_project.get_projects(db, current_user_id, skip, limit)


@router.post("/", response_model=Project)
async def create_project(
    project: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Create a new project."""
    return await crud_project.create_project(db, project, current_user_id)


@router.get("/{project_id}", response_model=ProjectWithTasks)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get a specific project with its tasks."""
    project = await crud_project.get_project_with_tasks(db, project_id, current_user_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project


@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Update a project."""
    project = await crud_project.update_project(db, project_id, current_user_id, project_update)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Delete a project."""
    success = await crud_project.delete_project(db, project_id, current_user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return {"message": "Project deleted successfully"}


# Task endpoints
@router.get("/{project_id}/tasks", response_model=List[Task])
async def get_project_tasks(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get all tasks for a specific project."""
    return await crud_project.get_tasks_by_project(db, project_id, current_user_id)


@router.post("/{project_id}/tasks", response_model=Task)
async def create_task(
    project_id: int,
    task: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Create a new task in a project."""
    # Ensure the task is assigned to the correct project
    task.project_id = project_id
    created_task = await crud_project.create_task(db, task, current_user_id)
    if not created_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return created_task


@router.get("/tasks/recent", response_model=List[TaskSummary])
async def get_recent_tasks(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get recent tasks for the current user."""
    return await crud_project.get_recent_tasks(db, current_user_id, limit)


@router.put("/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Update a task."""
    task = await crud_project.update_task(db, task_id, current_user_id, task_update)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return task


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Delete a task."""
    success = await crud_project.delete_task(db, task_id, current_user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return {"message": "Task deleted successfully"}