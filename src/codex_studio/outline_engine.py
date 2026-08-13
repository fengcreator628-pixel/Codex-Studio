from __future__ import annotations

import uuid
from dataclasses import dataclass

from codex_studio.models import now_iso
from codex_studio.storage import LocalProjectStorage


@dataclass(slots=True)
class OutlineRef:
    id: str
    tree_id: str
    parent_id: str | None
    node_id: str
    position: int
    depth: int


class OutlineEngine:
    def __init__(self, storage: LocalProjectStorage, project_id: str):
        self.storage = storage
        self.project_id = project_id

    def create_tree(self, name: str, version_tag: str) -> str:
        tree_id = str(uuid.uuid4())
        now = now_iso()
        with self.storage.connect() as conn:
            conn.execute(
                "INSERT INTO outline_trees(tree_id, project_id, name, version_tag, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                (tree_id, self.project_id, name, version_tag, now, now),
            )
        return tree_id

    def add_reference(self, tree_id: str, node_id: str, parent_id: str | None = None) -> OutlineRef:
        with self.storage.connect() as conn:
            existing = conn.execute(
                "SELECT COALESCE(MAX(position), -1) + 1 as next_position, COALESCE(MAX(depth), 0) as max_depth FROM outline_nodes WHERE tree_id = ? AND parent_id IS ?",
                (tree_id, parent_id),
            ).fetchone()
            position = existing["next_position"]
            depth = 0
            if parent_id:
                parent = conn.execute("SELECT depth FROM outline_nodes WHERE id = ?", (parent_id,)).fetchone()
                if not parent:
                    raise ValueError("parent outline node not found")
                depth = parent["depth"] + 1

            item = OutlineRef(
                id=str(uuid.uuid4()),
                tree_id=tree_id,
                parent_id=parent_id,
                node_id=node_id,
                position=position,
                depth=depth,
            )
            conn.execute(
                "INSERT INTO outline_nodes(id, tree_id, parent_id, node_id, position, depth) VALUES (?, ?, ?, ?, ?, ?)",
                (item.id, item.tree_id, item.parent_id, item.node_id, item.position, item.depth),
            )
            conn.execute(
                "UPDATE outline_trees SET updated_at = ? WHERE tree_id = ?",
                (now_iso(), tree_id),
            )
        return item

    def flatten_tree(self, tree_id: str) -> list[dict]:
        with self.storage.connect() as conn:
            rows = conn.execute(
                """
                SELECT o.id, o.parent_id, o.node_id, o.position, o.depth, n.title, n.content_path
                FROM outline_nodes o
                JOIN nodes n ON n.id = o.node_id
                WHERE o.tree_id = ?
                ORDER BY o.depth ASC, o.parent_id, o.position ASC
                """,
                (tree_id,),
            ).fetchall()
            return [dict(r) for r in rows]
