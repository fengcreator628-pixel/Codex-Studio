from __future__ import annotations

import json
import uuid

from codex_studio.models import Node, Revision, now_iso
from codex_studio.storage import LocalProjectStorage


class NodeService:
    def __init__(self, storage: LocalProjectStorage, project_id: str):
        self.storage = storage
        self.project_id = project_id

    def create_node(self, *, type: str, title: str, content: str = "", metadata: dict | None = None, parent_id: str | None = None) -> Node:
        metadata = metadata or {}
        node_id = str(uuid.uuid4())
        rel_path = f"nodes/{node_id}.md"
        self.storage.write_node_markdown(rel_path, content)
        node = Node(
            id=node_id,
            type=type,
            title=title,
            content_path=rel_path,
            metadata=metadata,
            parent_id=parent_id,
        )
        with self.storage.connect() as conn:
            conn.execute(
                """
                INSERT INTO nodes (id, project_id, type, title, content_path, metadata_json, created_at, updated_at, parent_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    node.id,
                    self.project_id,
                    node.type,
                    node.title,
                    node.content_path,
                    json.dumps(node.metadata, ensure_ascii=False),
                    node.created_at,
                    node.updated_at,
                    node.parent_id,
                ),
            )
            conn.execute("INSERT INTO node_fts(node_id, title, body) VALUES (?, ?, ?)", (node.id, node.title, content))
        return node

    def get_node(self, node_id: str) -> dict | None:
        with self.storage.connect() as conn:
            row = conn.execute("SELECT * FROM nodes WHERE id = ?", (node_id,)).fetchone()
            if not row:
                return None
            body = self.storage.read_node_markdown(row["content_path"])
            return {
                "id": row["id"],
                "type": row["type"],
                "title": row["title"],
                "content": body,
                "content_path": row["content_path"],
                "metadata": json.loads(row["metadata_json"]),
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
                "parent_id": row["parent_id"],
            }

    def update_node(self, node_id: str, *, title: str | None = None, content: str | None = None, metadata: dict | None = None, parent_id: str | None = None) -> dict:
        current = self.get_node(node_id)
        if not current:
            raise ValueError("Node not found")
        new_title = title or current["title"]
        new_content = content if content is not None else current["content"]
        new_parent = parent_id if parent_id is not None else current["parent_id"]
        new_metadata = metadata if metadata is not None else current["metadata"]

        snapshot_path = self.storage.save_revision_snapshot(node_id=node_id, content=current["content"])
        revision = Revision(node_id=node_id, snapshot_path=snapshot_path)

        self.storage.write_node_markdown(current["content_path"], new_content)
        with self.storage.connect() as conn:
            conn.execute(
                "UPDATE nodes SET title = ?, metadata_json = ?, updated_at = ?, parent_id = ? WHERE id = ?",
                (new_title, json.dumps(new_metadata, ensure_ascii=False), now_iso(), new_parent, node_id),
            )
            conn.execute(
                "INSERT INTO revisions(id, node_id, snapshot_path, timestamp, note) VALUES (?, ?, ?, ?, ?)",
                (str(uuid.uuid4()), revision.node_id, revision.snapshot_path, revision.timestamp, revision.note),
            )
            conn.execute("DELETE FROM node_fts WHERE node_id = ?", (node_id,))
            conn.execute("INSERT INTO node_fts(node_id, title, body) VALUES (?, ?, ?)", (node_id, new_title, new_content))
        return self.get_node(node_id) or {}

    def search(self, query: str) -> list[dict]:
        with self.storage.connect() as conn:
            rows = conn.execute(
                "SELECT node_id, title, snippet(node_fts, 2, '[', ']', '…', 12) as excerpt FROM node_fts WHERE node_fts MATCH ?",
                (query,),
            ).fetchall()
            return [dict(row) for row in rows]
