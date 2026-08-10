export interface ShortcutConfig {
  id: string;
  label: string;
  category: string;
  key: string; // Key character or Code
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  { id: 'save', label: '立即儲存稿件', category: '編輯', key: 's', ctrlKey: true },
  { id: 'bold', label: '套用粗體格式', category: '格式', key: 'b', ctrlKey: true },
  { id: 'italic', label: '套用斜體格式', category: '格式', key: 'i', ctrlKey: true },
  { id: 'underline', label: '套用底線格式', category: '格式', key: 'u', ctrlKey: true },
  { id: 'readingMode', label: '切換沉浸式閱讀模式', category: '檢視', key: 'r', altKey: true },
  { id: 'typewriterMode', label: '切換打字機焦點模式', category: '檢視', key: 't', altKey: true },
  { id: 'focusMode', label: '切換全螢幕專注模式', category: '檢視', key: 'f', altKey: true },
  { id: 'wiki', label: '開啟 Wiki 世界觀知識庫', category: '工具', key: 'w', altKey: true },
  { id: 'exportDoc', label: '開啟稿件匯出視窗', category: '檔案', key: 'e', altKey: true },
  { id: 'findReplace', label: '開啟搜尋與取代欄', category: '搜尋', key: 'f', ctrlKey: true },
  { id: 'snapshot', label: '開啟版本快照視窗', category: '工具', key: 'k', altKey: true },
];

const STORAGE_KEY = 'codex_custom_shortcuts';

export const getShortcuts = (): ShortcutConfig[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return DEFAULT_SHORTCUTS.map(def => {
        const found = parsed.find((p: ShortcutConfig) => p.id === def.id);
        return found ? { ...def, ...found } : def;
      });
    }
  } catch (e) {
    console.error('Failed to load custom shortcuts', e);
  }
  return DEFAULT_SHORTCUTS;
};

export const saveShortcuts = (shortcuts: ShortcutConfig[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
};

export const resetShortcuts = (): ShortcutConfig[] => {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_SHORTCUTS;
};

export const formatShortcutKey = (sc: ShortcutConfig): string => {
  const parts: string[] = [];
  if (sc.ctrlKey) parts.push('Ctrl');
  if (sc.altKey) parts.push('Alt');
  if (sc.shiftKey) parts.push('Shift');
  parts.push(sc.key.toUpperCase());
  return parts.join(' + ');
};
