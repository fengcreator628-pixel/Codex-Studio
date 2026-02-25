from __future__ import annotations

import uuid
from pathlib import Path

from codex_studio.graph import KnowledgeGraphService
from codex_studio.manuscript import ManuscriptManager
from codex_studio.outline_engine import OutlineEngine
from codex_studio.services import NodeService
from codex_studio.storage import LocalProjectStorage


def test_node_outline_manuscript_flow(tmp_path: Path):
    root = tmp_path / "demo.codex"
    project_id = str(uuid.uuid4())
    storage = LocalProjectStorage.bootstrap(root, project_name="demo", project_id=project_id)

    node_service = NodeService(storage, project_id=project_id)
    outline = OutlineEngine(storage, project_id=project_id)
    graph = KnowledgeGraphService(storage, project_id=project_id)

    n1 = node_service.create_node(type="document", title="章節一", content="內容 A")
    n2 = node_service.create_node(type="research", title="研究卡", content="來源 B")

    updated = node_service.update_node(n1.id, content="內容 A2")
    assert updated["content"] == "內容 A2"

    graph.link_nodes(n1.id, n2.id, relation_type="references")
    neighbors = graph.neighbors(n1.id)
    assert neighbors and neighbors[0]["target_node_id"] == n2.id

    tree = outline.create_tree("draft", "v1")
    outline.add_reference(tree, node_id=n1.id)
    outline.add_reference(tree, node_id=n2.id)

    manager = ManuscriptManager(storage, outline)
    issues = manager.check_outline_integrity(tree)
    assert not issues

    output = tmp_path / "manuscript.md"
    manuscript = manager.compile_tree(tree, output)
    assert "章節一" in manuscript
    assert output.exists()


def test_fts_search(tmp_path: Path):
    root = tmp_path / "search.codex"
    project_id = str(uuid.uuid4())
    storage = LocalProjectStorage.bootstrap(root, project_name="search", project_id=project_id)
    node_service = NodeService(storage, project_id=project_id)
    node_service.create_node(type="wiki", title="Alchemy", content="Philosopher stone notes")

    results = node_service.search("Philosopher")
    assert results
