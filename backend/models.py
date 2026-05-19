from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: str = Field(..., min_length=5, max_length=120)


class UserOut(BaseModel):
    id: UUID
    username: str
    email: str
    created_at: datetime


class PostCreate(BaseModel):
    image_url: str = Field(..., min_length=5)
    tags: list[str] = Field(default_factory=list)
    created_at: datetime | None = None


class PostPatch(BaseModel):
    image_url: str | None = Field(default=None, min_length=5)
    tags: list[str] | None = None
    created_at: datetime | None = None


class PostOut(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    user_email: str
    image_url: str
    tags: list[str]
    created_at: datetime
    updated_at: datetime


class PostsPage(BaseModel):
    items: list[PostOut]
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool


class DiscoverPhoto(BaseModel):
    id: str
    description: str
    image_url: str
    thumb_url: str
    author_name: str
    author_url: str
    source_url: str


class HealthOut(BaseModel):
    api: bool
    database: bool
    unsplash: bool
