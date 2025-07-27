from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from typing import Any

from ....core.cache import cache as redis_cache
from ....core.security import create_access_token
from ....core.config import settings
from ....db.session import get_db
from ....db.crud_user import user
from ....schemas.user import Token, User, UserCreate, UserSignup

router = APIRouter()


@router.post("/signup", response_model=dict, status_code=status.HTTP_201_CREATED)
async def signup(signup_data: UserSignup, db: AsyncSession = Depends(get_db)):
    """
    Create a new user account and return access token.
    """
    # Check if user with this email already exists
    existing_user = await user.get_by_email(db, email=signup_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists.",
        )

    # Convert signup data to user create format
    user_create = UserCreate(
        email=signup_data.email,
        password=signup_data.password,
        full_name=signup_data.username
    )

    # Create the user
    created_user = await user.create(db, obj_in=user_create)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=created_user.id,
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": created_user.id,
            "email": created_user.email,
            "name": created_user.full_name or created_user.email.split("@")[0],
            "full_name": created_user.full_name,
            "is_active": created_user.is_active,
        }
    }


@router.post("/login", response_model=dict)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user_obj = await user.authenticate(db, email=form_data.username, password=form_data.password)
    if not user_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active(user_obj):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user_obj.id,
        expires_delta=access_token_expires,
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_obj.id,
            "email": user_obj.email,
            "name": user_obj.full_name or user_obj.email.split("@")[0],
            "full_name": user_obj.full_name,
            "is_active": user_obj.is_active,
        }
    }


@router.post("/login/json", response_model=dict)
async def login_json(credentials: dict, db: AsyncSession = Depends(get_db)):
    """
    Login with username/email and password using JSON.
    """
    username = credentials.get("username")
    password = credentials.get("password")
    
    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required"
        )
    
    # Try to authenticate with email
    user_obj = await user.authenticate(db, email=username, password=password)
    
    if not user_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
        )
    elif not user.is_active(user_obj):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user_obj.id,
        expires_delta=access_token_expires,
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_obj.id,
            "email": user_obj.email,
            "name": user_obj.full_name or user_obj.email.split("@")[0],
            "full_name": user_obj.full_name,
            "is_active": user_obj.is_active,
        }
    }