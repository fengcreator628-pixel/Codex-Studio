from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Iterable

from codex_studio.models import now_iso


CODEX_DIRS = ["nodes", "assets", "revisions", "mindmaps", "whiteboards"]


class LocalProjectStorage:
    """Manages local-first .codex container and SQLite access."""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.db_path = project_root / "index.db"

    @classmethod
    def bootstrap(cls, project_root: Path, project_name: str, project_id: str) -> "LocalProjectStorage":
        project_root.mkdir(parents=True, exist_ok=True)
        for item in CODEX_DIRS:
            (project_root / item).mkdir(exist_ok=True)

        (project_root / "project.json").write_text(
            json.dumps(
                {
                    "id": project_id,
                    "name": project_name,
                    "created_at": now_iso(),
                    "format": "codex-studio/1.0",
                },
                indent=2,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )

        storage = cls(project_root)
        storage.apply_schema()
        storage.init_project(project_id=project_id, name=project_name)
        return storage

    def connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def apply_schema(self) -> None:
        schema_path = Path(__file__).with_name("db") / "schema.sql"
        script = schema_path.read_text(encoding="utf-8")
        with self.connect() as conn:
            conn.executescript(script)

    def init_project(self, project_id: str, name: str) -> None:
        now = now_iso()
        with self.connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO projects (id, name, codex_path, created_at, updated_at)
                VALUES (?, ?, ?, COALESCE((SELECT created_at FROM projects WHERE id = ?), ?), ?)
                """,
                (project_id, name, str(self.project_root), project_id, now, now),
            )

    def write_node_markdown(self, relative_path: str, markdown: str) -> Path:
        target = self.project_root / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(markdown, encoding="utf-8")
        return target

    def read_node_markdown(self, relative_path: str) -> str:
        return (self.project_root / relative_path).read_text(encoding="utf-8")

    def save_revision_snapshot(self, node_id: str, content: str) -> str:
        filename = f"{node_id}-{now_iso().replace(':', '-')}.md"
        rel_path = f"revisions/{filename}"
        self.write_node_markdown(rel_path, content)
        return rel_path

    def read_many(self, paths: Iterable[str]) -> dict[str, str]:
        return {path: self.read_node_markdown(path) for path in paths}
