export type NodeType = 'folder' | 'document' | 'note' | 'character' | 'location' | 'item' | 'lore' | 'faction' | 'whiteboard' | 'reference';

export type SceneStatus = 'idea' | 'draft' | 'revised' | 'final';

export interface SceneMetadata {
  pov?: string;
  location?: string;
  time?: string;
  status?: SceneStatus;
  notes?: string;
  targetWordCount?: number;
  tags?: string[];
}

export interface FileSystemNode {
  id: string;
  type: NodeType;
  title: string;
  content: string; // Content is now stored per-node
  parentId: string | null;
  order: number;
  isOpen?: boolean; // UI state for folders
  metadata?: SceneMetadata;
}

export interface ProjectSnapshot {
  id: string;
  projectId: string;
  timestamp: number;
  label: string;
  projectData: Project;
  trigger: 'auto_hourly' | 'manual' | 'before_major';
  wordCount: number;
}

export interface Project {
  id: string;
  title: string;
  content: string; // Deprecated: used for migration or full compiled manuscript
  createdAt: number;
  lastModified: number;
  
  // New Fields
  coreTheme: string;
  projectType?: string;
  targetWordCount: number;
  dailyTargetWordCount?: number;
  synopsis: string;
  projectColor: string;
  projectTags: string[];
  
  // Module 3: Library System
  nodes: FileSystemNode[];
  timelineEvents?: TimelineEvent[];
}

export type WikiCategory = 
  | 'character'    // 人物設定
  | 'location'     // 地點設定
  | 'lore'         // 世界觀設定
  | 'era'          // 時代背景
  | 'event'        // 事件設定
  | 'faction'      // 組織設定
  | 'rule'         // 規則設定
  | 'item'         // 物件設定
  | 'relationship' // 人物關係
  | 'theme'        // 主題設定
  | 'conflict'     // 衝突設定
  | 'notes';       // 創作隨筆

export interface TimelineEvent {
  id: string;
  projectId: string;
  title: string;
  timeLabel: string; // e.g. "王曆 402 年初冬"
  orderIndex: number;
  description: string;
  type: 'main_plot' | 'sub_plot' | 'backstory' | 'character_arc';
  importance: 'critical' | 'major' | 'minor';
  relatedCharacterNames?: string[];
  relatedLocationNames?: string[];
  nodeId?: string; // Optional link to a chapter node
}

export interface WikiArticle {
  id: string;
  projectId: string;
  title: string;
  category: WikiCategory;
  summary: string;
  content: string;
  tags: string[];
  imageUrl?: string;
  relatedNodeIds?: string[];
  lastModified: number;
}

export interface WritingSession {
  id: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  startTime: number;
  endTime: number;
  wordCountDelta: number;
  durationSeconds: number;
}

export interface WritingStreak {
  currentStreak: number;
  longestStreak: number;
  lastWritingDate: string | null; // YYYY-MM-DD
}

export type RevisionType = 'insert' | 'delete' | 'replace';

export interface Revision {
  id: string;
  documentId: string;
  type: RevisionType;
  startIndex: number;
  endIndex: number; // For insert, endIndex == startIndex
  originalText: string;
  revisedText: string;
  author: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected';
}

// Helper to track active writing session in memory
export interface SessionTracker {
  startTime: number;
  startWordCount: number;
  currentWordCount: number;
  lastTypingTime: number;
  activeDurationSeconds: number;
}

// --- Whiteboard Specific Types ---

export type WhiteboardTool = 'select' | 'rect' | 'circle' | 'note' | 'line' | 'text';

export interface WhiteboardElement {
  id: string;
  type: WhiteboardTool;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color?: string;
  startId?: string; // For lines
  endId?: string;   // For lines
}

export interface WhiteboardData {
  elements: WhiteboardElement[];
  viewport: { x: number; y: number; zoom: number };
}