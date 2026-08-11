import { Project, Revision, WritingSession, ProjectSnapshot, WikiArticle } from '../types';

const STORAGE_KEYS = {
  PROJECTS: 'codex_projects',
  SESSIONS: 'codex_sessions',
  REVISIONS: 'codex_revisions',
  SNAPSHOTS: 'codex_snapshots',
  WIKI: 'codex_wiki_articles',
};

// --- Projects ---

export const getProjects = (): Project[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  return data ? JSON.parse(data) : [];
};

export const saveProject = (project: Project): void => {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.push(project);
  }
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
};

export const deleteProject = (projectId: string): void => {
  const projects = getProjects().filter(p => p.id !== projectId);
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
};

export const createProject = (
  title: string, 
  coreTheme: string = '', 
  targetWordCount: number = 0, 
  synopsis: string = '', 
  projectColor: string = '#78716c', 
  projectTags: string[] = []
): Project => {
  const newProject: Project = {
    id: crypto.randomUUID(),
    title,
    content: '',
    createdAt: Date.now(),
    lastModified: Date.now(),
    coreTheme,
    targetWordCount,
    dailyTargetWordCount: 500,
    synopsis,
    projectColor,
    projectTags,
    nodes: [] // Initialize empty nodes array
  };
  
  // Create default initial document
  const defaultDoc = {
    id: crypto.randomUUID(),
    type: 'document' as const,
    title: '第一章',
    content: '',
    parentId: null,
    order: 0,
    isOpen: false
  };
  newProject.nodes.push(defaultDoc);
  
  saveProject(newProject);
  return newProject;
};

// --- Snapshots ---

export const getSnapshots = (projectId: string): ProjectSnapshot[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
  const all: ProjectSnapshot[] = data ? JSON.parse(data) : [];
  return all
    .filter(s => s.projectId === projectId)
    .sort((a, b) => b.timestamp - a.timestamp);
};

export const saveSnapshot = (snapshot: ProjectSnapshot): void => {
  const data = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
  const all: ProjectSnapshot[] = data ? JSON.parse(data) : [];
  const index = all.findIndex(s => s.id === snapshot.id);
  if (index >= 0) {
    all[index] = snapshot;
  } else {
    all.push(snapshot);
  }
  localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(all));
};

export const calculateTotalProjectWords = (project: Project): number => {
  if (!project.nodes || project.nodes.length === 0) return 0;
  return project.nodes.reduce((acc, node) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = node.content || '';
    const text = tmp.textContent || tmp.innerText || '';
    const trimmed = text.trim();
    if (!trimmed) return acc;
    return acc + trimmed.length;
  }, 0);
};

export const createSnapshot = (
  project: Project,
  label: string = '編輯快照',
  trigger: 'auto_hourly' | 'manual' | 'before_major' = 'manual'
): ProjectSnapshot => {
  const snapshot: ProjectSnapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    projectId: project.id,
    timestamp: Date.now(),
    label,
    projectData: JSON.parse(JSON.stringify(project)),
    trigger,
    wordCount: calculateTotalProjectWords(project)
  };
  saveSnapshot(snapshot);
  return snapshot;
};

export const deleteSnapshot = (snapshotId: string): void => {
  const data = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
  let all: ProjectSnapshot[] = data ? JSON.parse(data) : [];
  all = all.filter(s => s.id !== snapshotId);
  localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(all));
};

export const restoreSnapshot = (snapshotId: string): Project | null => {
  const data = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
  const all: ProjectSnapshot[] = data ? JSON.parse(data) : [];
  const found = all.find(s => s.id === snapshotId);
  if (!found) return null;
  const restoredProject = JSON.parse(JSON.stringify(found.projectData));
  restoredProject.lastModified = Date.now();
  saveProject(restoredProject);
  return restoredProject;
};

// --- Wiki / Knowledge Base ---

export const getWikiArticles = (projectId: string): WikiArticle[] => {
  const data = localStorage.getItem(STORAGE_KEYS.WIKI);
  const all: WikiArticle[] = data ? JSON.parse(data) : [];
  return all
    .filter(a => a.projectId === projectId)
    .sort((a, b) => b.lastModified - a.lastModified);
};

export const saveWikiArticle = (article: WikiArticle): void => {
  const data = localStorage.getItem(STORAGE_KEYS.WIKI);
  const all: WikiArticle[] = data ? JSON.parse(data) : [];
  const index = all.findIndex(a => a.id === article.id);
  if (index >= 0) {
    all[index] = article;
  } else {
    all.push(article);
  }
  localStorage.setItem(STORAGE_KEYS.WIKI, JSON.stringify(all));
};

export const deleteWikiArticle = (articleId: string): void => {
  const data = localStorage.getItem(STORAGE_KEYS.WIKI);
  let all: WikiArticle[] = data ? JSON.parse(data) : [];
  all = all.filter(a => a.id !== articleId);
  localStorage.setItem(STORAGE_KEYS.WIKI, JSON.stringify(all));
};

// --- Sessions ---

export const getSessions = (): WritingSession[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return data ? JSON.parse(data) : [];
};

export const saveSession = (session: WritingSession): void => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
};

// --- Revisions ---

export const getRevisions = (projectId: string): Revision[] => {
  const data = localStorage.getItem(STORAGE_KEYS.REVISIONS);
  const allRevisions: Revision[] = data ? JSON.parse(data) : [];
  return allRevisions.filter(r => r.documentId === projectId);
};

export const saveRevision = (revision: Revision): void => {
  const data = localStorage.getItem(STORAGE_KEYS.REVISIONS);
  const allRevisions: Revision[] = data ? JSON.parse(data) : [];
  const index = allRevisions.findIndex(r => r.id === revision.id);
  
  if (index >= 0) {
    allRevisions[index] = revision;
  } else {
    allRevisions.push(revision);
  }
  localStorage.setItem(STORAGE_KEYS.REVISIONS, JSON.stringify(allRevisions));
};

export const deleteRevision = (revisionId: string): void => {
  const data = localStorage.getItem(STORAGE_KEYS.REVISIONS);
  let allRevisions: Revision[] = data ? JSON.parse(data) : [];
  allRevisions = allRevisions.filter(r => r.id !== revisionId);
  localStorage.setItem(STORAGE_KEYS.REVISIONS, JSON.stringify(allRevisions));
};