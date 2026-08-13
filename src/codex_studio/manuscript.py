from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from codex_studio.outline_engine import OutlineEngine
from codex_studio.storage import LocalProjectStorage


@dataclass(slots=True)
class CompileOptions:
    include_yaml_frontmatter: bool = True
    heading_offset: int = 1


class ManuscriptManager:
    def __init__(self, storage: LocalProjectStorage, outline_engine: OutlineEngine):
        self.storage = storage
        self.outline_engine = outline_engine

    def check_outline_integrity(self, tree_id: str) -> list[str]:
        issues: list[str] = []
        refs = self.outline_engine.flatten_tree(tree_id)
        for ref in refs:
            path = self.storage.project_root / ref["content_path"]
            if not path.exists():
                issues.append(f"Missing content file for node {ref['node_id']} at {ref['content_path']}")
        return issues

    def compile_tree(self, tree_id: str, output_path: Path, options: CompileOptions | None = None) -> str:
        options = options or CompileOptions()
        refs = self.outline_engine.flatten_tree(tree_id)
        parts: list[str] = []

        if options.include_yaml_frontmatter:
            parts.append("---\ntitle: Compiled Manuscript\nformat: markdown\n---\n")

        for ref in refs:
            heading = "#" * (options.heading_offset + ref["depth"])
            content = self.storage.read_node_markdown(ref["content_path"])
            parts.append(f"{heading} {ref['title']}\n\n{content}\n")

        manuscript = "\n".join(parts)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(manuscript, encoding="utf-8")
        return manuscript
