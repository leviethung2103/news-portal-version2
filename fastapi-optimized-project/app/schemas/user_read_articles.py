from datetime import datetime
from pydantic import BaseModel, field_validator
from typing import Union

class UserReadArticleCreate(BaseModel):
    article_id: Union[str, int]
    article_title: str
    article_link: str
    
    @field_validator('article_id')
    @classmethod
    def convert_article_id_to_string(cls, v):
        """Convert article_id to string if it's an integer"""
        return str(v)

class UserReadArticleResponse(BaseModel):
    id: int
    user_id: int
    article_id: str
    article_title: str
    article_link: str
    read_at: datetime

    class Config:
        from_attributes = True