from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, UTC
from typing import Any


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


@dataclass(slots=True)
class Node:
    id: str
    type: str
    title: str
    content_path: str
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=now_iso)
    updated_at: str = field(default_factory=now_iso)
    parent_id: str | None = None


@dataclass(slots=True)
class Link:
    source_node_id: str
    target_node_id: str
    relation_type: str
    bidirectional: bool = True


@dataclass(slots=True)
class OutlineTreeNode:
    tree_id: str
    parent_id: str | None
    node_id: str
    position: int
    depth: int


@dataclass(slots=True)
class Revision:
    node_id: str
    snapshot_path: str
    timestamp: str = field(default_factory=now_iso)
    note: str | None = None
