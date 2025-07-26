from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.db.crud_project import project_crud, task_crud
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
def get_project_summary(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get project summary statistics for the current user."""
    return project_crud.get_project_summary(db, current_user_id)


@router.get("/", response_model=List[Project])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get all projects for the current user."""
    return project_crud.get_projects(db, current_user_id, skip, limit)


@router.post("/", response_model=Project)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Create a new project."""
    return project_crud.create_project(db, project, current_user_id)


@router.get("/{project_id}", response_model=ProjectWithTasks)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get a specific project with its tasks."""
    project = project_crud.get_project_with_tasks(db, project_id, current_user_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project


@router.put("/{project_id}", response_model=Project)
def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Update a project."""
    project = project_crud.update_project(db, project_id, current_user_id, project_update)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Delete a project."""
    success = project_crud.delete_project(db, project_id, current_user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return {"message": "Project deleted successfully"}


# Task endpoints
@router.get("/{project_id}/tasks", response_model=List[Task])
def get_project_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get all tasks for a specific project."""
    return task_crud.get_tasks_by_project(db, project_id, current_user_id)


@router.post("/{project_id}/tasks", response_model=Task)
def create_task(
    project_id: int,
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Create a new task in a project."""
    # Ensure the task is assigned to the correct project
    task.project_id = project_id
    created_task = task_crud.create_task(db, task, current_user_id)
    if not created_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return created_task


@router.get("/tasks/recent", response_model=List[TaskSummary])
def get_recent_tasks(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get recent tasks for the current user."""
    return task_crud.get_recent_tasks(db, current_user_id, limit)


@router.put("/tasks/{task_id}", response_model=Task)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Update a task."""
    task = task_crud.update_task(db, task_id, current_user_id, task_update)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return task


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Delete a task."""
    success = task_crud.delete_task(db, task_id, current_user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return {"message": "Task deleted successfully"}