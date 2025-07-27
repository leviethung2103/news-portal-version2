from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, func, select, delete
from typing import List, Optional
from datetime import datetime, timezone
from app.models.project import Project, Task, ProjectStatus, TaskStatus
from app.schemas.project import ProjectCreate, ProjectUpdate, TaskCreate, TaskUpdate, ProjectSummary, TaskSummary


async def get_project(db: AsyncSession, project_id: int, user_id: int) -> Optional[Project]:
    """Get a single project by ID for a specific user."""
    query = select(Project).where(and_(Project.id == project_id, Project.user_id == user_id))
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_projects(db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100) -> List[Project]:
    """Get all projects for a user with pagination."""
    query = select(Project).where(Project.user_id == user_id).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_project(db: AsyncSession, project: ProjectCreate, user_id: int) -> Project:
    """Create a new project."""
    db_project = Project(**project.dict(), user_id=user_id)
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    return db_project


async def update_project(
    db: AsyncSession, project_id: int, user_id: int, project_update: ProjectUpdate
) -> Optional[Project]:
    """Update an existing project."""
    db_project = await get_project(db, project_id, user_id)
    if db_project:
        update_data = project_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_project, field, value)
        await db.commit()
        await db.refresh(db_project)
    return db_project


async def delete_project(db: AsyncSession, project_id: int, user_id: int) -> bool:
    """Delete a project."""
    db_project = await get_project(db, project_id, user_id)
    if db_project:
        db.delete(db_project)
        await db.commit()
        return True
    return False


async def get_project_with_tasks(db: AsyncSession, project_id: int, user_id: int) -> Optional[Project]:
    """Get a project with its tasks loaded."""
    query = select(Project).where(and_(Project.id == project_id, Project.user_id == user_id))
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_project_summary(db: AsyncSession, user_id: int) -> ProjectSummary:
    """Get project summary statistics for a user."""
    # Count total projects
    total_projects_query = select(func.count(Project.id)).where(Project.user_id == user_id)
    total_projects_result = await db.execute(total_projects_query)
    total_projects = total_projects_result.scalar() or 0

    # Count active projects
    active_projects_query = select(func.count(Project.id)).where(
        and_(Project.user_id == user_id, Project.status.in_([ProjectStatus.PLANNING, ProjectStatus.IN_PROGRESS]))
    )
    active_projects_result = await db.execute(active_projects_query)
    active_projects = active_projects_result.scalar() or 0

    # Count completed projects
    completed_projects_query = select(func.count(Project.id)).where(
        and_(Project.user_id == user_id, Project.status == ProjectStatus.COMPLETED)
    )
    completed_projects_result = await db.execute(completed_projects_query)
    completed_projects = completed_projects_result.scalar() or 0

    # Count total tasks
    total_tasks_query = select(func.count(Task.id)).join(Project).where(Project.user_id == user_id)
    total_tasks_result = await db.execute(total_tasks_query)
    total_tasks = total_tasks_result.scalar() or 0

    # Count completed tasks
    completed_tasks_query = (
        select(func.count(Task.id))
        .join(Project)
        .where(and_(Project.user_id == user_id, Task.status == TaskStatus.COMPLETED))
    )
    completed_tasks_result = await db.execute(completed_tasks_query)
    completed_tasks = completed_tasks_result.scalar() or 0

    # Count overdue tasks
    now = datetime.utcnow()
    overdue_tasks_query = (
        select(func.count(Task.id))
        .join(Project)
        .where(and_(Project.user_id == user_id, Task.end_date < now, Task.status != TaskStatus.COMPLETED))
    )
    overdue_tasks_result = await db.execute(overdue_tasks_query)
    overdue_tasks = overdue_tasks_result.scalar() or 0

    return ProjectSummary(
        total_projects=total_projects,
        active_projects=active_projects,
        completed_projects=completed_projects,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        overdue_tasks=overdue_tasks,
    )


async def get_task(db: AsyncSession, task_id: int, user_id: int) -> Optional[Task]:
    """Get a single task by ID for a specific user."""
    query = select(Task).join(Project).where(and_(Task.id == task_id, Project.user_id == user_id))
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_tasks_by_project(db: AsyncSession, project_id: int, user_id: int) -> List[Task]:
    """Get all tasks for a specific project."""
    query = select(Task).join(Project).where(and_(Task.project_id == project_id, Project.user_id == user_id))
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_user_tasks(db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100) -> List[Task]:
    """Get all tasks for a user with pagination."""
    query = select(Task).join(Project).where(Project.user_id == user_id).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_task(db: AsyncSession, task: TaskCreate, user_id: int) -> Optional[Task]:
    """Create a new task."""
    # Verify project belongs to user
    project_query = select(Project).where(and_(Project.id == task.project_id, Project.user_id == user_id))
    project_result = await db.execute(project_query)
    project = project_result.scalar_one_or_none()

    if not project:
        return None

    # Convert start_date and end_date to naive datetimes if they are timezone-aware
    task_data = task.dict()
    for field in ["start_date", "end_date"]:
        dt = task_data.get(field)
        if dt is not None and hasattr(dt, "tzinfo") and dt.tzinfo is not None:
            # Convert to naive in UTC
            task_data[field] = dt.astimezone(timezone.utc).replace(tzinfo=None)
    db_task = Task(**task_data)
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    return db_task


async def update_task(db: AsyncSession, task_id: int, user_id: int, task_update: TaskUpdate) -> Optional[Task]:
    """Update an existing task."""
    db_task = await get_task(db, task_id, user_id)
    if db_task:
        update_data = task_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_task, field, value)
        await db.commit()
        await db.refresh(db_task)
    return db_task


async def delete_task(db: AsyncSession, task_id: int, user_id: int) -> bool:
    """Delete a task."""
    db_task = await get_task(db, task_id, user_id)
    if db_task:
        db.delete(db_task)
        await db.commit()
        return True
    return False


async def get_recent_tasks(db: AsyncSession, user_id: int, limit: int = 10) -> List[TaskSummary]:
    """Get recent tasks for a user."""
    query = (
        select(Task, Project.name.label("project_name"))
        .join(Project)
        .where(Project.user_id == user_id)
        .order_by(Task.updated_at.desc())
        .limit(limit)
    )

    result = await db.execute(query)
    tasks = result.all()

    return [
        TaskSummary(
            id=task.Task.id,
            name=task.Task.name,
            status=task.Task.status,
            priority=task.Task.priority,
            progress=task.Task.progress,
            start_date=task.Task.start_date,
            end_date=task.Task.end_date,
            project_name=task.project_name,
        )
        for task in tasks
    ]
