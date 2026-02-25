from __future__ import annotations

import uuid

from codex_studio.models import Link, now_iso
from codex_studio.storage import LocalProjectStorage


class KnowledgeGraphService:
    def __init__(self, storage: LocalProjectStorage, project_id: str):
        self.storage = storage
        self.project_id = project_id

    def link_nodes(self, source_node_id: str, target_node_id: str, relation_type: str, bidirectional: bool = True) -> Link:
        link = Link(
            source_node_id=source_node_id,
            target_node_id=target_node_id,
            relation_type=relation_type,
            bidirectional=bidirectional,
        )
        with self.storage.connect() as conn:
            conn.execute(
                """
                INSERT INTO links(id, project_id, source_node_id, target_node_id, relation_type, bidirectional, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (str(uuid.uuid4()), self.project_id, source_node_id, target_node_id, relation_type, int(bidirectional), now_iso()),
            )
            if bidirectional:
                conn.execute(
                    """
                    INSERT INTO links(id, project_id, source_node_id, target_node_id, relation_type, bidirectional, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (str(uuid.uuid4()), self.project_id, target_node_id, source_node_id, relation_type, int(bidirectional), now_iso()),
                )
        return link

    def neighbors(self, node_id: str) -> list[dict]:
        with self.storage.connect() as conn:
            rows = conn.execute(
                """
                SELECT l.target_node_id, l.relation_type, n.title, n.type
                FROM links l
                JOIN nodes n ON n.id = l.target_node_id
                WHERE l.project_id = ? AND l.source_node_id = ?
                """,
                (self.project_id, node_id),
            ).fetchall()
            return [dict(r) for r in rows]
