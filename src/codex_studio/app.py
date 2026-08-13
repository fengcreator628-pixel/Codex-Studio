from __future__ import annotations

import uuid
from pathlib import Path

from codex_studio.node_api import create_app
from codex_studio.storage import LocalProjectStorage


def build_default_app(codex_path: str = "./project.codex"):
    root = Path(codex_path)
    project_id = str(uuid.uuid5(uuid.NAMESPACE_URL, str(root.resolve())))
    project_name = root.stem

    if not root.exists():
        storage = LocalProjectStorage.bootstrap(root, project_name=project_name, project_id=project_id)
    else:
        storage = LocalProjectStorage(root)
        storage.apply_schema()
        storage.init_project(project_id=project_id, name=project_name)

    return create_app(storage=storage, project_id=project_id)


app = build_default_app()
