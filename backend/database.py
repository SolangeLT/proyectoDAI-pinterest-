import os
import re
from contextlib import contextmanager
from uuid import uuid4

import psycopg
from psycopg.rows import dict_row


def get_database_url() -> str | None:
    return os.getenv("DATABASE_URL")


@contextmanager
def get_connection():
    database_url = get_database_url()
    if not database_url:
        raise RuntimeError("DATABASE_URL is not configured")

    with psycopg.connect(database_url, row_factory=dict_row) as conn:
        yield conn


def init_db() -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    email TEXT NOT NULL UNIQUE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS posts (
                    id UUID PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    image_url TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )

            migrate_posts_user_name_to_user_id(cur)

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS tags (
                    id UUID PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE
                );
                """
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS post_tags (
                    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
                    PRIMARY KEY (post_id, tag_id)
                );
                """
            )

            cur.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at DESC);
                CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
                """
            )
        conn.commit()


def fallback_email(username: str) -> str:
    safe_name = re.sub(r"[^a-z0-9]+", ".", username.lower()).strip(".") or "usuario"
    return f"{safe_name}-{uuid4().hex[:8]}@local.invalid"


def migrate_posts_user_name_to_user_id(cur) -> None:
    cur.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'posts';
        """
    )
    columns = {row["column_name"] for row in cur.fetchall()}

    if "user_name" not in columns or "user_id" in columns:
        return

    cur.execute("ALTER TABLE posts ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;")
    cur.execute("SELECT DISTINCT user_name FROM posts WHERE user_name IS NOT NULL;")

    for row in cur.fetchall():
        original_user_name = row["user_name"]
        username = original_user_name.strip() or f"usuario-{uuid4().hex[:8]}"
        cur.execute("SELECT id FROM users WHERE username = %s;", (username,))
        existing_user = cur.fetchone()

        if existing_user:
            user_id = existing_user["id"]
        else:
            user_id = uuid4()
            cur.execute(
                """
                INSERT INTO users (id, username, email)
                VALUES (%s, %s, %s);
                """,
                (user_id, username, fallback_email(username)),
            )

        cur.execute(
            "UPDATE posts SET user_id = %s WHERE user_name = %s AND user_id IS NULL;",
            (user_id, original_user_name),
        )

    cur.execute("SELECT COUNT(*) AS missing FROM posts WHERE user_id IS NULL;")
    if cur.fetchone()["missing"] == 0:
        cur.execute("ALTER TABLE posts ALTER COLUMN user_id SET NOT NULL;")
        cur.execute("DROP INDEX IF EXISTS idx_posts_user_name;")
        cur.execute("ALTER TABLE posts DROP COLUMN user_name;")


def check_database() -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 AS ok;")
                row = cur.fetchone()
                return row is not None and row["ok"] == 1
    except Exception:
        return False
