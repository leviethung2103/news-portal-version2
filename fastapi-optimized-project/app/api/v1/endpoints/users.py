from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import timedelta

from ....core.cache import cache as redis_cache
from ....db.session import get_db
from ....db.crud_user import user
from ....schemas.user import User, UserCreate, UserUpdate
from ....core.config import settings

router = APIRouter()


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new user.
    """
    # Check if user with this email already exists
    existing_user = await user.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists.",
        )

    created_user = await user.create(db, obj_in=user_in)
    return created_user


@router.get("/{user_id}", response_model=User)
async def read_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get user by ID.
    """
    db_user = await user.get(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return db_user


@router.get("/", response_model=List[User])
async def read_users(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """
    Retrieve users with pagination.
    """
    users = await user.get_multi(db, skip=skip, limit=limit)
    return users


@router.put("/{user_id}", response_model=User)
async def update_user(user_id: int, user_in: UserUpdate, db: AsyncSession = Depends(get_db)):
    """
    Update a user.
    """
    db_user = await user.get(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    updated_user = await user.update(db, db_obj=db_user, obj_in=user_in)

    # Invalidate cache for this user
    await redis_cache.delete(f"user:{user_id}")

    return updated_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Delete a user.
    """
    db_user = await user.get(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    await user.remove(db, id=user_id)

    # Invalidate cache for this user
    await redis_cache.delete(f"user:{user_id}")

    return None
