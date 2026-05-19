import os
from contextlib import contextmanager
from datetime import datetime
from math import ceil
from typing import Annotated
from uuid import UUID, uuid4

import httpx
import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from database import check_database, get_connection, init_db
from models import DiscoverPhoto, HealthOut, PostCreate, PostOut, PostPatch, PostsPage, UserCreate, UserOut


load_dotenv()

app = FastAPI(title="Mosaico API", version="1.0.0")

allowed_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_URL", "*").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    if os.getenv("DATABASE_URL"):
        try:
            init_db()
        except Exception as exc:
            print(f"Database initialization failed: {exc}")


@contextmanager
def database_connection():
    try:
        with get_connection() as conn:
            yield conn
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


def normalize_tags(tags: list[str] | None) -> list[str]:
    if tags is None:
        return []

    normalized: list[str] = []
    seen: set[str] = set()
    for tag in tags:
        clean = tag.strip().lower()
        if clean and clean not in seen:
            normalized.append(clean[:40])
            seen.add(clean)
    return normalized[:12]


def normalize_user_payload(payload: UserCreate) -> UserCreate:
    return UserCreate(
        username=payload.username.strip(),
        email=payload.email.strip().lower(),
    )


def require_user_id(x_user: str | None) -> UUID:
    user_id = (x_user or "").strip()
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-User header is required",
        )
    try:
        return UUID(user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-User must be a valid user id",
        ) from exc


def fetch_user_or_404(user_id: UUID) -> dict:
    with database_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, username, email, created_at FROM users WHERE id = %s;", (user_id,))
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="User not found")
            return row


def fetch_post_or_404(post_id: UUID) -> dict:
    with database_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                POST_SELECT_SQL + " WHERE p.id = %(post_id)s GROUP BY p.id, u.id;",
                {"post_id": post_id},
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Post not found")
            return row


def assert_owner(post_id: UUID, user_id: UUID) -> None:
    with database_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM posts WHERE id = %s;", (post_id,))
            row = cur.fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Post not found")
    if row["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the creator can modify this post")


def replace_post_tags(conn, post_id: UUID, tags: list[str]) -> None:
    with conn.cursor() as cur:
        cur.execute("DELETE FROM post_tags WHERE post_id = %s;", (post_id,))

        for tag_name in normalize_tags(tags):
            tag_id = uuid4()
            cur.execute(
                """
                INSERT INTO tags (id, name)
                VALUES (%s, %s)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                RETURNING id;
                """,
                (tag_id, tag_name),
            )
            row = cur.fetchone()
            cur.execute(
                "INSERT INTO post_tags (post_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
                (post_id, row["id"]),
            )


POST_SELECT_SQL = """
    SELECT
        p.id,
        p.user_id,
        u.username AS user_name,
        u.email AS user_email,
        p.image_url,
        p.created_at,
        p.updated_at,
        COALESCE(
            ARRAY_AGG(t.name ORDER BY t.name) FILTER (WHERE t.id IS NOT NULL),
            ARRAY[]::TEXT[]
        ) AS tags
    FROM posts p
    INNER JOIN users u ON u.id = p.user_id
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON t.id = pt.tag_id
"""


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {"message": "Mosaico API is running"}


@app.get("/users", response_model=list[UserOut])
def list_users() -> list[dict]:
    with database_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, username, email, created_at
                FROM users
                ORDER BY created_at DESC;
                """
            )
            return cur.fetchall()


@app.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate) -> dict:
    user = normalize_user_payload(payload)
    if not user.username or not user.email:
        raise HTTPException(status_code=400, detail="Username and email are required")

    user_id = uuid4()
    try:
        with database_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO users (id, username, email)
                    VALUES (%s, %s, %s)
                    RETURNING id, username, email, created_at;
                    """,
                    (user_id, user.username, user.email),
                )
                row = cur.fetchone()
            conn.commit()
            return row
    except psycopg.errors.UniqueViolation as exc:
        raise HTTPException(
            status_code=409,
            detail="Username or email already exists",
        ) from exc


@app.get("/health", response_model=HealthOut)
async def health() -> HealthOut:
    database_ok = check_database()
    unsplash_ok = False

    access_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if access_key:
        try:
            async with httpx.AsyncClient(timeout=6) as client:
                response = await client.get(
                    "https://api.unsplash.com/photos",
                    params={"per_page": 1},
                    headers={"Authorization": f"Client-ID {access_key}"},
                )
                unsplash_ok = response.status_code == 200
        except Exception:
            unsplash_ok = False

    return HealthOut(api=True, database=database_ok, unsplash=unsplash_ok)


@app.get("/posts", response_model=PostsPage)
def list_posts(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=50),
    min_date: datetime | None = None,
) -> PostsPage:
    where_sql = ""
    params: dict[str, object] = {"limit": limit, "offset": (page - 1) * limit}

    if min_date is not None:
        where_sql = " WHERE p.updated_at >= %(min_date)s"
        params["min_date"] = min_date

    with database_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) AS total FROM posts p{where_sql};", params)
            total = cur.fetchone()["total"]

            cur.execute(
                f"""
                {POST_SELECT_SQL}
                {where_sql}
                GROUP BY p.id, u.id
                ORDER BY p.created_at DESC
                LIMIT %(limit)s OFFSET %(offset)s;
                """,
                params,
            )
            items = cur.fetchall()

    total_pages = max(1, ceil(total / limit)) if total else 1
    return PostsPage(
        items=items,
        page=page,
        limit=limit,
        total=total,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_previous=page > 1,
    )


@app.get("/posts/{post_id}", response_model=PostOut)
def get_post(post_id: UUID) -> dict:
    return fetch_post_or_404(post_id)


@app.post("/posts", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostCreate,
    x_user: Annotated[str | None, Header(alias="X-User")] = None,
) -> dict:
    user_id = require_user_id(x_user)
    fetch_user_or_404(user_id)
    post_id = uuid4()

    with database_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO posts (id, user_id, image_url, created_at, updated_at)
                VALUES (%s, %s, %s, COALESCE(%s::timestamptz, NOW()), NOW());
                """,
                (post_id, user_id, payload.image_url, payload.created_at),
            )
            replace_post_tags(conn, post_id, payload.tags)
        conn.commit()

    return fetch_post_or_404(post_id)


@app.patch("/posts/{post_id}", response_model=PostOut)
def patch_post(
    post_id: UUID,
    payload: PostPatch,
    x_user: Annotated[str | None, Header(alias="X-User")] = None,
) -> dict:
    user_id = require_user_id(x_user)
    assert_owner(post_id, user_id)

    if (
        payload.image_url is None
        and payload.created_at is None
        and payload.tags is None
    ):
        raise HTTPException(status_code=400, detail="No fields to update")

    with database_connection() as conn:
        with conn.cursor() as cur:
            if payload.image_url is not None:
                cur.execute(
                    "UPDATE posts SET image_url = %s, updated_at = NOW() WHERE id = %s;",
                    (payload.image_url, post_id),
                )
            if payload.created_at is not None:
                cur.execute(
                    "UPDATE posts SET created_at = %s, updated_at = NOW() WHERE id = %s;",
                    (payload.created_at, post_id),
                )
            if payload.tags is not None:
                replace_post_tags(conn, post_id, payload.tags)
                cur.execute("UPDATE posts SET updated_at = NOW() WHERE id = %s;", (post_id,))
        conn.commit()

    return fetch_post_or_404(post_id)


@app.put("/posts/{post_id}", response_model=PostOut)
def replace_post(
    post_id: UUID,
    payload: PostCreate,
    x_user: Annotated[str | None, Header(alias="X-User")] = None,
) -> dict:
    user_id = require_user_id(x_user)
    assert_owner(post_id, user_id)

    with database_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE posts
                SET image_url = %s,
                    created_at = COALESCE(%s::timestamptz, created_at),
                    updated_at = NOW()
                WHERE id = %s;
                """,
                (payload.image_url, payload.created_at, post_id),
            )
            replace_post_tags(conn, post_id, payload.tags)
        conn.commit()

    return fetch_post_or_404(post_id)


@app.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: UUID,
    x_user: Annotated[str | None, Header(alias="X-User")] = None,
) -> None:
    user_id = require_user_id(x_user)
    assert_owner(post_id, user_id)

    with database_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM posts WHERE id = %s;", (post_id,))
        conn.commit()

    return None


@app.get("/discover", response_model=list[DiscoverPhoto])
async def discover(count: int = Query(default=12, ge=1, le=30)) -> list[DiscoverPhoto]:
    access_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if not access_key:
        raise HTTPException(status_code=503, detail="UNSPLASH_ACCESS_KEY is not configured")

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            "https://api.unsplash.com/photos/random",
            params={"count": count, "orientation": "portrait"},
            headers={"Authorization": f"Client-ID {access_key}"},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Unsplash request failed")

    data = response.json()
    photos = data if isinstance(data, list) else [data]

    return [
        DiscoverPhoto(
            id=photo["id"],
            description=photo.get("alt_description") or photo.get("description") or "Imagen de Unsplash",
            image_url=photo["urls"]["regular"],
            thumb_url=photo["urls"]["thumb"],
            author_name=photo["user"]["name"],
            author_url=photo["user"]["links"]["html"],
            source_url=photo["links"]["html"],
        )
        for photo in photos
    ]
