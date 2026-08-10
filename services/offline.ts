export interface OfflineDraft {
  nodeId: string;
  content: string;
  timestamp: number;
  projectTitle?: string;
  nodeTitle?: string;
}

const DRAFT_PREFIX = 'codex_offline_draft_';

export const saveOfflineDraft = (nodeId: string, content: string, projectTitle?: string, nodeTitle?: string): void => {
  if (!nodeId) return;
  const draft: OfflineDraft = {
    nodeId,
    content,
    timestamp: Date.now(),
    projectTitle,
    nodeTitle
  };
  try {
    localStorage.setItem(DRAFT_PREFIX + nodeId, JSON.stringify(draft));
  } catch (e) {
    console.warn('Failed to save offline draft to localStorage', e);
  }
};

export const getOfflineDraft = (nodeId: string): OfflineDraft | null => {
  if (!nodeId) return null;
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + nodeId);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

export const clearOfflineDraft = (nodeId: string): void => {
  if (!nodeId) return;
  try {
    localStorage.removeItem(DRAFT_PREFIX + nodeId);
  } catch (e) {
    // ignore
  }
};
