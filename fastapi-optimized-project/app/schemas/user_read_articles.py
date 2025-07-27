from datetime import datetime
from pydantic import BaseModel

class UserReadArticleCreate(BaseModel):
    article_id: str
    article_title: str
    article_link: str

class UserReadArticleResponse(BaseModel):
    id: int
    user_id: int
    article_id: str
    article_title: str
    article_link: str
    read_at: datetime

    class Config:
        from_attributes = True