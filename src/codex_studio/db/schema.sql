PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  codex_path TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN (
    'document','wiki','concept','research','asset','mindmap','whiteboard','character','fragment'
  )),
  title TEXT NOT NULL,
  content_path TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  parent_id TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY(parent_id) REFERENCES nodes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  bidirectional INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY(source_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  FOREIGN KEY(target_node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS outline_trees (
  tree_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  version_tag TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS outline_nodes (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL,
  parent_id TEXT,
  node_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  depth INTEGER NOT NULL,
  FOREIGN KEY(tree_id) REFERENCES outline_trees(tree_id) ON DELETE CASCADE,
  FOREIGN KEY(parent_id) REFERENCES outline_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY(node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS revisions (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL,
  snapshot_path TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  note TEXT,
  FOREIGN KEY(node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE VIRTUAL TABLE IF NOT EXISTS node_fts USING fts5(
  node_id,
  title,
  body,
  content=''
);

CREATE INDEX IF NOT EXISTS idx_nodes_project_type ON nodes(project_id, type);
CREATE INDEX IF NOT EXISTS idx_links_project_source ON links(project_id, source_node_id);
CREATE INDEX IF NOT EXISTS idx_outline_nodes_tree_parent_pos ON outline_nodes(tree_id, parent_id, position);
CREATE INDEX IF NOT EXISTS idx_revisions_node_time ON revisions(node_id, timestamp DESC);
