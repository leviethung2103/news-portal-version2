from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from datetime import datetime
from app.models.project import Project, Task, ProjectStatus, TaskStatus
from app.schemas.project import ProjectCreate, ProjectUpdate, TaskCreate, TaskUpdate, ProjectSummary, TaskSummary


class CRUDProject:
    def get_project(self, db: Session, project_id: int, user_id: int) -> Optional[Project]:
        return db.query(Project).filter(
            and_(Project.id == project_id, Project.user_id == user_id)
        ).first()

    def get_projects(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Project]:
        return db.query(Project).filter(Project.user_id == user_id).offset(skip).limit(limit).all()

    def create_project(self, db: Session, project: ProjectCreate, user_id: int) -> Project:
        db_project = Project(**project.dict(), user_id=user_id)
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        return db_project

    def update_project(self, db: Session, project_id: int, user_id: int, project_update: ProjectUpdate) -> Optional[Project]:
        db_project = self.get_project(db, project_id, user_id)
        if db_project:
            update_data = project_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_project, field, value)
            db.commit()
            db.refresh(db_project)
        return db_project

    def delete_project(self, db: Session, project_id: int, user_id: int) -> bool:
        db_project = self.get_project(db, project_id, user_id)
        if db_project:
            db.delete(db_project)
            db.commit()
            return True
        return False

    def get_project_with_tasks(self, db: Session, project_id: int, user_id: int) -> Optional[Project]:
        return db.query(Project).filter(
            and_(Project.id == project_id, Project.user_id == user_id)
        ).first()

    def get_project_summary(self, db: Session, user_id: int) -> ProjectSummary:
        # Count projects by status
        total_projects = db.query(Project).filter(Project.user_id == user_id).count()
        active_projects = db.query(Project).filter(
            and_(
                Project.user_id == user_id,
                Project.status.in_([ProjectStatus.PLANNING, ProjectStatus.IN_PROGRESS])
            )
        ).count()
        completed_projects = db.query(Project).filter(
            and_(Project.user_id == user_id, Project.status == ProjectStatus.COMPLETED)
        ).count()

        # Count tasks
        total_tasks = db.query(Task).join(Project).filter(Project.user_id == user_id).count()
        completed_tasks = db.query(Task).join(Project).filter(
            and_(Project.user_id == user_id, Task.status == TaskStatus.COMPLETED)
        ).count()
        
        # Count overdue tasks
        now = datetime.utcnow()
        overdue_tasks = db.query(Task).join(Project).filter(
            and_(
                Project.user_id == user_id,
                Task.end_date < now,
                Task.status != TaskStatus.COMPLETED
            )
        ).count()

        return ProjectSummary(
            total_projects=total_projects,
            active_projects=active_projects,
            completed_projects=completed_projects,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            overdue_tasks=overdue_tasks
        )


class CRUDTask:
    def get_task(self, db: Session, task_id: int, user_id: int) -> Optional[Task]:
        return db.query(Task).join(Project).filter(
            and_(Task.id == task_id, Project.user_id == user_id)
        ).first()

    def get_tasks_by_project(self, db: Session, project_id: int, user_id: int) -> List[Task]:
        return db.query(Task).join(Project).filter(
            and_(Task.project_id == project_id, Project.user_id == user_id)
        ).all()

    def get_user_tasks(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Task]:
        return db.query(Task).join(Project).filter(Project.user_id == user_id).offset(skip).limit(limit).all()

    def create_task(self, db: Session, task: TaskCreate, user_id: int) -> Optional[Task]:
        # Verify project belongs to user
        project = db.query(Project).filter(
            and_(Project.id == task.project_id, Project.user_id == user_id)
        ).first()
        if not project:
            return None
            
        db_task = Task(**task.dict())
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task

    def update_task(self, db: Session, task_id: int, user_id: int, task_update: TaskUpdate) -> Optional[Task]:
        db_task = self.get_task(db, task_id, user_id)
        if db_task:
            update_data = task_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_task, field, value)
            db.commit()
            db.refresh(db_task)
        return db_task

    def delete_task(self, db: Session, task_id: int, user_id: int) -> bool:
        db_task = self.get_task(db, task_id, user_id)
        if db_task:
            db.delete(db_task)
            db.commit()
            return True
        return False

    def get_recent_tasks(self, db: Session, user_id: int, limit: int = 10) -> List[TaskSummary]:
        tasks = db.query(Task, Project.name.label('project_name')).join(Project).filter(
            Project.user_id == user_id
        ).order_by(Task.updated_at.desc()).limit(limit).all()

        return [
            TaskSummary(
                id=task.Task.id,
                name=task.Task.name,
                status=task.Task.status,
                priority=task.Task.priority,
                progress=task.Task.progress,
                start_date=task.Task.start_date,
                end_date=task.Task.end_date,
                project_name=task.project_name
            )
            for task in tasks
        ]


# Create instances
project_crud = CRUDProject()
task_crud = CRUDTask()