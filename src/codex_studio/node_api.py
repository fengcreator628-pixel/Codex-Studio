from __future__ import annotations

from dataclasses import asdict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from codex_studio.services import NodeService
from codex_studio.storage import LocalProjectStorage


class CreateNodeInput(BaseModel):
    type: str
    title: str
    content: str = ""
    metadata: dict = Field(default_factory=dict)
    parent_id: str | None = None


class UpdateNodeInput(BaseModel):
    title: str | None = None
    content: str | None = None
    metadata: dict | None = None
    parent_id: str | None = None


def create_app(storage: LocalProjectStorage, project_id: str) -> FastAPI:
    app = FastAPI(title="Codex Studio Node API")
    service = NodeService(storage=storage, project_id=project_id)

    @app.post("/api/nodes")
    def create_node(payload: CreateNodeInput):
        node = service.create_node(
            type=payload.type,
            title=payload.title,
            content=payload.content,
            metadata=payload.metadata,
            parent_id=payload.parent_id,
        )
        return asdict(node)

    @app.get("/api/nodes/{node_id}")
    def get_node(node_id: str):
        data = service.get_node(node_id)
        if not data:
            raise HTTPException(status_code=404, detail="Node not found")
        return data

    @app.patch("/api/nodes/{node_id}")
    def update_node(node_id: str, payload: UpdateNodeInput):
        try:
            return service.update_node(
                node_id,
                title=payload.title,
                content=payload.content,
                metadata=payload.metadata,
                parent_id=payload.parent_id,
            )
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @app.get("/api/search")
    def search(query: str):
        return {"results": service.search(query)}

    return app
