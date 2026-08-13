from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class Panel:
    id: str
    title: str
    widgets: list[str] = field(default_factory=list)


def build_library_layout() -> dict:
    """Sidebar library only manages node existence, not manuscript order."""
    return {
        "workspace": {
            "left_sidebar": Panel(
                id="library",
                title="Library",
                widgets=[
                    "project-switcher",
                    "folder-tree",
                    "type-filter-tabs",
                    "node-quick-create",
                    "semantic-link-inspector",
                ],
            ).__dict__,
            "center_editor": Panel(
                id="document-editor",
                title="Node Editor",
                widgets=[
                    "single-node-header",
                    "markdown-editor",
                    "semantic-tag-toolbar",
                    "knowledge-reference-picker",
                    "revision-compare-drawer",
                ],
            ).__dict__,
            "detached_spaces": [
                {
                    "id": "outline-workspace",
                    "title": "Outline Workspace",
                    "widgets": [
                        "outline-tree-view",
                        "version-switcher",
                        "node-reference-dragger",
                    ],
                },
                {
                    "id": "manuscript-manager",
                    "title": "Manuscript Manager",
                    "widgets": [
                        "compile-controls",
                        "global-search-replace",
                        "integrity-checker",
                        "export-targets",
                    ],
                },
            ],
        },
        "theme": {
            "name": "Classic Study",
            "palette": {
                "wood": "#6B4423",
                "parchment": "#F5EEDC",
                "ink": "#2F241B",
            },
            "font_family": "Cormorant Garamond, Noto Serif TC, serif",
            "focus_mode": ["fullscreen-paper", "hide-nonessential-ui", "ambient-sound"],
        },
    }
