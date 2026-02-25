# Codex Studio

Codex Studio 是一套 **Local-First 專業寫作作業系統**，專為長篇、研究型、非線性創作流程設計。

## 1) 系統架構（Architecture）

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Codex Studio Workspace                                              │
├──────────────────────┬──────────────────────────┬───────────────────┤
│ Library (Sidebar)    │ Document Editor (Center) │ Detached Systems  │
│ - Node existence     │ - One node at a time     │ - Outline         │
│ - Folder/Type views  │ - Markdown + semantics   │ - Manuscript      │
│ - No chapter order   │ - Revision comparison    │ - Compiler/Search │
└──────────────────────┴──────────────────────────┴───────────────────┘

Local-first container:
project.codex/
  index.db
  nodes/
  assets/
  revisions/
  mindmaps/
  whiteboards/
  project.json
```

- **Library** 只管理 Node 的存在，不管理章節順序。
- **Outline Workspace** 是獨立空間，儲存「Node 引用」形成樹狀結構。
- **Manuscript Manager** 讀取 Outline 並編譯輸出，進行全域檢查、搜尋替換與格式輸出。

## 2) 資料結構（Data Structures）

SQLite schema 位於 `src/codex_studio/db/schema.sql`，對應核心物件：

- `projects`
- `nodes`（符合指定欄位：id/type/title/content_path/metadata/created_at/updated_at/parent_id）
- `links`（語意關聯，支援雙向）
- `outline_trees` + `outline_nodes`（結構樹、非內容容器）
- `revisions`（快照路徑 + 時間戳）
- `node_fts`（FTS5 全文搜尋）

## 3) 模組設計（Modules）

### A. Local 檔案存取層
`src/codex_studio/storage.py`
- 建立/初始化 `.codex` 專案容器
- 套用 SQLite schema
- Markdown 內容讀寫
- Revision 快照保存

### B. Node 管理 API
`src/codex_studio/node_api.py`
- `POST /api/nodes` 建立 Node
- `GET /api/nodes/{id}` 讀取 Node
- `PATCH /api/nodes/{id}` 更新 Node（先寫 revision 快照）
- `GET /api/search?query=` FTS 搜尋

### C. Outline 結構引擎
`src/codex_studio/outline_engine.py`
- 建立多版本 Outline Tree
- 將 Node 以 reference 形式加入樹
- 展平成可供編譯流程讀取的序列

### D. Manuscript 編譯系統
`src/codex_studio/manuscript.py`
- Outline 完整性檢查（引用節點檔案是否存在）
- 依 depth 自動轉換章節標題層級
- 編譯成單一 Markdown manuscript

### E. Knowledge Graph 關聯系統
`src/codex_studio/graph.py`
- 建立 `source -> target` 關係
- 可選雙向關聯
- 讀取鄰接節點（neighbors）

### F. Library UI 架構
`src/codex_studio/ui/library_layout.py`
- 宣告三區塊工作空間 + Outline/Manuscript 獨立系統
- 套用古典書房主題（木質、羊皮紙、襯線字體）
- 提供 Focus Mode 元件設定

## 4) 實作覆蓋的任務對照

1. ✅ 建立 SQLite 資料庫 schema  
2. ✅ 建立 Node 管理 API  
3. ✅ 建立 Outline 結構引擎  
4. ✅ 建立 Manuscript 編譯邏輯  
5. ✅ 建立 Library UI 架構  
6. ✅ 建立本地檔案存取層

## 5) 啟動方式

```bash
pip install -e .
uvicorn codex_studio.app:app --reload
```

啟動後會自動初始化 `./project.codex`（若不存在）。
