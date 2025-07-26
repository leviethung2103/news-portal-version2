import asyncio
import logging
from datetime import datetime
from typing import Dict, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.jobstores.base import JobLookupError
from croniter import croniter
from sqlalchemy.ext.asyncio import AsyncSession
from ..db.session import async_session_factory
from ..db.crud_rss import cron_job, CronJobCreate, CronJobUpdate
from ..models.rss import CronJob
from .rss_service import rss_service

logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.running = False
        self.default_jobs = [
            {
                "name": "rss_fetch_hourly",
                "schedule": "0 * * * *",  # Every hour
                "active": True
            },
            {
                "name": "rss_fetch_30min",
                "schedule": "*/30 * * * *",  # Every 30 minutes
                "active": False
            },
            {
                "name": "rss_fetch_15min",
                "schedule": "*/15 * * * *",  # Every 15 minutes
                "active": False
            }
        ]

    async def start(self):
        """Start the scheduler."""
        if not self.running:
            # Initialize default cron jobs
            await self.initialize_default_jobs()
            
            # Load existing jobs from database
            await self.load_jobs_from_database()
            
            # Start scheduler
            self.scheduler.start()
            self.running = True
            logger.info("Scheduler service started")

    async def stop(self):
        """Stop the scheduler."""
        if self.running:
            self.scheduler.shutdown()
            self.running = False
            logger.info("Scheduler service stopped")

    async def initialize_default_jobs(self):
        """Initialize default cron jobs if they don't exist."""
        try:
            async with async_session_factory() as db:
                for job_data in self.default_jobs:
                    # Check if job already exists
                    existing_job = await cron_job.get_by_name(db, job_data["name"])
                    if not existing_job:
                        # Create new job
                        job_create = CronJobCreate(**job_data)
                        await cron_job.create(db, obj_in=job_create)
                        logger.info(f"Created default cron job: {job_data['name']}")
        except Exception as e:
            logger.error(f"Failed to initialize default jobs: {e}")

    async def load_jobs_from_database(self):
        """Load and schedule all active jobs from database."""
        try:
            async with async_session_factory() as db:
                active_jobs = await cron_job.get_active_jobs(db)
                
                for job in active_jobs:
                    await self.schedule_job(job)
                    
            logger.info(f"Loaded {len(active_jobs)} active jobs from database")
            
        except Exception as e:
            logger.error(f"Failed to load jobs from database: {e}")

    async def schedule_job(self, job: CronJob):
        """Schedule a single job."""
        try:
            # Validate cron expression
            if not croniter.is_valid(job.schedule):
                logger.error(f"Invalid cron expression for job {job.name}: {job.schedule}")
                return False

            # Remove existing job if it exists
            try:
                self.scheduler.remove_job(str(job.id))
            except JobLookupError:
                pass  # Job doesn't exist, that's fine

            # Add new job
            trigger = CronTrigger.from_crontab(job.schedule)
            self.scheduler.add_job(
                func=self.execute_rss_fetch_job,
                trigger=trigger,
                id=str(job.id),
                name=job.name,
                args=[job.id],
                replace_existing=True,
                max_instances=1,  # Prevent overlapping executions
                misfire_grace_time=300  # 5 minutes grace time
            )
            
            # Calculate next run time
            next_run = croniter(job.schedule, datetime.utcnow()).get_next(datetime)
            
            # Update job with next run time
            async with async_session_factory() as db:
                await cron_job.update_run_status(
                    db, job.id, job.last_run or datetime.utcnow(), next_run
                )
            
            logger.info(f"Scheduled job {job.name} with schedule {job.schedule}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to schedule job {job.name}: {e}")
            return False

    async def unschedule_job(self, job_id: int):
        """Unschedule a job."""
        try:
            self.scheduler.remove_job(str(job_id))
            logger.info(f"Unscheduled job {job_id}")
            return True
        except JobLookupError:
            logger.warning(f"Job {job_id} not found in scheduler")
            return False
        except Exception as e:
            logger.error(f"Failed to unschedule job {job_id}: {e}")
            return False

    async def execute_rss_fetch_job(self, job_id: int):
        """Execute RSS fetch job."""
        start_time = datetime.utcnow()
        error_message = None
        
        try:
            logger.info(f"Executing RSS fetch job {job_id}")
            
            # Fetch all due feeds
            results = await rss_service.fetch_all_due_feeds()
            
            logger.info(
                f"RSS fetch completed: {results['successful_feeds']}/{results['total_feeds']} "
                f"feeds successful, {results['total_articles']} articles fetched"
            )
            
            if results['errors']:
                error_message = "; ".join(results['errors'][:5])  # Limit error message length
                
        except Exception as e:
            error_message = str(e)
            logger.error(f"RSS fetch job {job_id} failed: {e}")
        
        # Update job status
        try:
            async with async_session_factory() as db:
                # Calculate next run time
                job_record = await cron_job.get(db, job_id)
                if job_record:
                    next_run = croniter(job_record.schedule, start_time).get_next(datetime)
                    await cron_job.update_run_status(
                        db, job_id, start_time, next_run, error_message
                    )
        except Exception as e:
            logger.error(f"Failed to update job status for {job_id}: {e}")

    async def create_and_schedule_job(self, job_data: CronJobCreate) -> Optional[CronJob]:
        """Create a new cron job and schedule it."""
        try:
            async with async_session_factory() as db:
                # Create job in database
                new_job = await cron_job.create(db, obj_in=job_data)
                
                # Schedule the job if it's active
                if new_job.active:
                    success = await self.schedule_job(new_job)
                    if not success:
                        # If scheduling failed, mark job as inactive
                        await cron_job.update(
                            db, db_obj=new_job, obj_in=CronJobUpdate(active=False)
                        )
                        return None
                
                return new_job
                
        except Exception as e:
            logger.error(f"Failed to create and schedule job: {e}")
            return None

    async def update_and_reschedule_job(
        self, 
        job_id: int, 
        job_update: CronJobUpdate
    ) -> Optional[CronJob]:
        """Update a cron job and reschedule it."""
        try:
            async with async_session_factory() as db:
                # Get existing job
                existing_job = await cron_job.get(db, job_id)
                if not existing_job:
                    return None
                
                # Update job in database
                updated_job = await cron_job.update(db, db_obj=existing_job, obj_in=job_update)
                
                # Unschedule old job
                await self.unschedule_job(job_id)
                
                # Schedule updated job if it's active
                if updated_job.active:
                    await self.schedule_job(updated_job)
                
                return updated_job
                
        except Exception as e:
            logger.error(f"Failed to update and reschedule job {job_id}: {e}")
            return None

    async def delete_and_unschedule_job(self, job_id: int) -> bool:
        """Delete a cron job and unschedule it."""
        try:
            # Unschedule job first
            await self.unschedule_job(job_id)
            
            # Delete from database
            async with async_session_factory() as db:
                deleted_job = await cron_job.remove(db, id=job_id)
                return deleted_job is not None
                
        except Exception as e:
            logger.error(f"Failed to delete and unschedule job {job_id}: {e}")
            return False

    async def trigger_immediate_fetch(self) -> dict:
        """Trigger immediate RSS fetch for all feeds."""
        try:
            logger.info("Triggering immediate RSS fetch")
            results = await rss_service.fetch_all_due_feeds()
            return {"success": True, "results": results}
        except Exception as e:
            logger.error(f"Immediate fetch failed: {e}")
            return {"success": False, "error": str(e)}

    def get_job_status(self) -> dict:
        """Get scheduler status and job information."""
        try:
            jobs = self.scheduler.get_jobs()
            return {
                "running": self.running,
                "total_jobs": len(jobs),
                "jobs": [
                    {
                        "id": job.id,
                        "name": job.name,
                        "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                        "trigger": str(job.trigger)
                    }
                    for job in jobs
                ]
            }
        except Exception as e:
            logger.error(f"Failed to get job status: {e}")
            return {"running": self.running, "error": str(e)}

# Global scheduler service instance
scheduler_service = SchedulerService()