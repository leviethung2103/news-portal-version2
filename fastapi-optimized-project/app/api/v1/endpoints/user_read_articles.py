from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from ....db.session import get_db
from ....models.user_read_articles import UserReadArticle
from ....schemas.user_read_articles import UserReadArticleCreate, UserReadArticleResponse
from ...deps import get_current_user
from ....models.user import User

router = APIRouter()


@router.post("/mark-read", response_model=UserReadArticleResponse)
async def mark_article_as_read(
    article_data: UserReadArticleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark an article as read by the current user."""
    try:
        # Check if already marked as read
        result = await db.execute(
            select(UserReadArticle).where(
                UserReadArticle.user_id == current_user.id, UserReadArticle.article_id == article_data.article_id
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            return existing

        # Create new read record
        read_article = UserReadArticle(
            user_id=current_user.id,
            article_id=article_data.article_id,
            article_title=article_data.article_title,
            article_link=article_data.article_link,
        )

        db.add(read_article)
        await db.commit()
        await db.refresh(read_article)

        return read_article

    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Article already marked as read")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to mark article as read: {str(e)}")


@router.get("/read-articles", response_model=List[str])
async def get_read_articles(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get list of article IDs that the current user has read."""
    result = await db.execute(select(UserReadArticle.article_id).where(UserReadArticle.user_id == current_user.id))
    read_article_ids = [row[0] for row in result.fetchall()]
    return read_article_ids


@router.delete("/unmark-read/{article_id}")
async def unmark_article_as_read(
    article_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Unmark an article as read (for testing purposes)."""
    result = await db.execute(
        select(UserReadArticle).where(
            UserReadArticle.user_id == current_user.id, UserReadArticle.article_id == article_id
        )
    )
    read_article = result.scalar_one_or_none()

    if not read_article:
        raise HTTPException(status_code=404, detail="Read article record not found")

    await db.delete(read_article)
    await db.commit()

    return {"message": "Article unmarked as read"}
