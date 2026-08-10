import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';
export type Lang = 'en' | 'zh';

const translations = {
  en: {
    "welcome.title": "Codex Studio",
    "welcome.subtitle": "A sanctuary for serious writers.\nDistraction-free, local-first, and built for discipline.",
    "welcome.enter": "Enter Studio",
    "welcome.footer": "v1.0 · Local Storage · No Cloud",
    
    "dashboard.title": "Codex Studio",
    "dashboard.subtitle": "Quiet space for serious writing.",
    "dashboard.streak": "Current Streak",
    "dashboard.lastWritten": "Last Written",
    "dashboard.newProject": "Initialize New Codex",
    "dashboard.target": "Target",
    "dashboard.words": "words",
    "dashboard.days": "Days",
    "dashboard.none": "None",
    "dashboard.filterTag": "Filter by Tag",
    "dashboard.allTags": "All Tags",
    "dashboard.noProjects": "No projects match the selected tag.",
    "dashboard.manageTags": "Manage Project Tags",
    
    "create.title": "Initialize Codex",
    "create.subtitle": "Define the parameters of your new manuscript.",
    "create.back": "Back",
    "create.field.title": "Project Title",
    "create.field.theme": "Core Theme",
    "create.field.target": "Target Word Count",
    "create.field.synopsis": "Synopsis / Outline",
    "create.field.color": "Project Color",
    "create.field.tags": "Tags (comma separated)",
    "create.button": "Create Project",
    "create.placeholder.title": "The Untitled Masterpiece",
    "create.placeholder.theme": "e.g. Betrayal, Redemption",
    "create.placeholder.synopsis": "Brief summary of the work...",
    "create.placeholder.tags": "Fiction, Mystery, Draft 1",
    
    "editor.saved": "Saved",
    "editor.unsaved": "Unsaved",
    "editor.words": "words",
    "editor.mode.author": "Author",
    "editor.mode.review": "Review",
    "editor.review.notice.title": "Review Mode",
    "editor.review.notice.desc": "Edits are tracked. Select text to delete, or type below to append.",
    "editor.review.append": "Append Revision",
    "editor.review.insert": "Propose Insert",
    "editor.review.delete": "Propose Deletion",
    "editor.today": "Today",
    "editor.time": "Time",
    "editor.streak": "Streak",
    "editor.placeholder": "Start writing...",
    "editor.typewriterMode": "Typewriter Mode",
    "editor.typewriterOn": "Typewriter Mode Active",
    "editor.wikiManager": "Wiki / World Codex",
    
    "streak.title": "Writing Discipline",
    "streak.current": "Current Streak",
    "streak.best": "Best Streak",
    "streak.last28": "Last 28 Days",
    "streak.totalWords": "Total Words",
    "streak.totalTime": "Total Time",
    "streak.hrs": "hrs",
    
    "revision.title": "Pending Revisions",
    "revision.empty": "No pending revisions",
    "revision.emptyDesc": "Edits made in Review Mode will appear here.",
    "revision.inserted": "Inserted by",
    "revision.deleted": "Deleted by",
    "revision.accept": "Accept & Apply to Manuscript",
    "revision.reject": "Reject Revision",

    "library.title": "Library",
    "library.empty": "No other projects",
    "library.current": "Current",
    "layout.toggleLeft": "Toggle Library",
    "layout.toggleRight": "Toggle Tools",

    "tree.add.document": "New Document",
    "tree.add.folder": "New Folder",
    "tree.add.note": "New Note",
    "tree.add.character": "New Character",
    "tree.add.location": "New Location",
    "tree.add.item": "New Item",
    "tree.add.lore": "New Lore",
    "tree.add.faction": "New Faction",
    "tree.add.whiteboard": "New Whiteboard",
    "tree.delete": "Delete",
    "tree.rename": "Rename",

    "wiki.title": "Wiki / World Building Codex",
    "wiki.subtitle": "Manage characters, locations, lore, magic, factions, and items.",
    "wiki.add": "Add Wiki Entry",
    "wiki.search": "Search wiki entries...",
    "wiki.allCategories": "All Categories",
    "wiki.category.character": "Character",
    "wiki.category.location": "Location",
    "wiki.category.item": "Item/Artifact",
    "wiki.category.lore": "Lore/Rule",
    "wiki.category.faction": "Faction/Group",
    "wiki.category.note": "General Note",
    "wiki.insert": "Insert Summary into Manuscript"
  },
  zh: {
    "welcome.title": "Codex Studio",
    "welcome.subtitle": "嚴肅寫作者的避風港。\n零干擾、本地優先、為自律而生。",
    "welcome.enter": "進入工作室",
    "welcome.footer": "v1.0 · 本地存儲 · 無雲端",
    
    "dashboard.title": "Codex Studio 寫作工作室",
    "dashboard.subtitle": "嚴肅寫作與世界觀建構的靜謐空間。",
    "dashboard.streak": "當前連續寫作",
    "dashboard.lastWritten": "上次寫作日期",
    "dashboard.newProject": "創建新手稿 Codex",
    "dashboard.target": "目標字數",
    "dashboard.words": "字",
    "dashboard.days": "天",
    "dashboard.none": "無紀錄",
    "dashboard.filterTag": "按標籤過濾",
    "dashboard.allTags": "全部標籤",
    "dashboard.noProjects": "沒有符合所選標籤的專案。",
    "dashboard.manageTags": "管理專案標籤",
    
    "create.title": "建立手稿 Codex",
    "create.subtitle": "定義您新手稿的核心參數與目標。",
    "create.back": "返回面板",
    "create.field.title": "專案標題",
    "create.field.theme": "核心主題",
    "create.field.target": "目標字數",
    "create.field.synopsis": "大綱 / 故事摘要",
    "create.field.color": "專案代表色",
    "create.field.tags": "標籤 (以逗號分隔)",
    "create.button": "創建專案",
    "create.placeholder.title": "未命名傑作",
    "create.placeholder.theme": "例如：背叛、救贖、科幻冒險",
    "create.placeholder.synopsis": "請輸入作品簡介、大綱或核心設定...",
    "create.placeholder.tags": "長篇小說, 懸疑, 初稿, 奇幻",
    
    "editor.saved": "已儲存至本地",
    "editor.unsaved": "儲存中...",
    "editor.words": "字",
    "editor.mode.author": "創作模式",
    "editor.mode.review": "修訂模式",
    "editor.review.notice.title": "修訂模式啟動中",
    "editor.review.notice.desc": "所有變更均會被追蹤。選取內文可提案刪除，或在下方追加提案修訂。",
    "editor.review.append": "追加修訂提案",
    "editor.review.insert": "提案插入",
    "editor.review.delete": "提案刪除",
    "editor.today": "今日進度",
    "editor.time": "寫作時間",
    "editor.streak": "連續寫作",
    "editor.placeholder": "在此開始傾注您的靈感與文采...",
    "editor.typewriterMode": "打字機模式",
    "editor.typewriterOn": "打字機垂直置中已啟用",
    "editor.wikiManager": "Wiki / 世界觀典藏庫",
    
    "streak.title": "寫作紀律與統計",
    "streak.current": "當前連續天數",
    "streak.best": "最佳連續紀錄",
    "streak.last28": "過去 28 天字數熱力圖",
    "streak.totalWords": "累計創作字數",
    "streak.totalTime": "累計專注時間",
    "streak.hrs": "小時",
    
    "revision.title": "待審閱修訂列表",
    "revision.empty": "無待審閱修訂",
    "revision.emptyDesc": "在修訂模式下提出的修改提案將顯示於此。",
    "revision.inserted": "插入提案者",
    "revision.deleted": "刪除提案者",
    "revision.accept": "採納修訂並融入原稿",
    "revision.reject": "退回修訂",

    "library.title": "手稿目錄與書架",
    "library.empty": "尚無其他專案",
    "library.current": "當前手稿",
    "layout.toggleLeft": "切換書架側欄",
    "layout.toggleRight": "切換檢視工具欄",

    "tree.add.document": "新增章節/文件",
    "tree.add.folder": "新增卷宗/資料夾",
    "tree.add.note": "新增靈感筆記",
    "tree.add.character": "新增登場角色",
    "tree.add.location": "新增世界場景",
    "tree.add.item": "新增道具/寶物",
    "tree.add.lore": "新增世界法則/傳說",
    "tree.add.faction": "新增陣營/組織",
    "tree.add.whiteboard": "新增心智白板",
    "tree.delete": "刪除條目",
    "tree.rename": "重新命名",

    "wiki.title": "Wiki / 世界觀典藏庫",
    "wiki.subtitle": "管理專案角色、場景、道具、法則與組織設定。",
    "wiki.add": "新增 Wiki 設定條目",
    "wiki.search": "搜尋設定條目...",
    "wiki.allCategories": "全部分類",
    "wiki.category.character": "角色人物",
    "wiki.category.location": "世界場景",
    "wiki.category.item": "道具神器",
    "wiki.category.lore": "世界法則/傳奇",
    "wiki.category.faction": "陣營組織",
    "wiki.category.note": "隨手筆記",
    "wiki.insert": "將設定摘要插入原稿"
  }
};

interface SettingsContextType {
  theme: Theme;
  toggleTheme: () => void;
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('codex_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });
  
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('codex_lang');
    return (saved === 'zh' || saved === 'en') ? saved : 'zh'; // Default to Traditional Chinese as requested!
  });

  useEffect(() => {
    localStorage.setItem('codex_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('codex_lang', lang);
  }, [lang]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(prev => prev === 'en' ? 'zh' : 'en');

  const t = (key: string): string => {
    // 1. Direct flat key lookup in current language
    const currentDict = translations[lang] as Record<string, string>;
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }

    // 2. Direct flat key lookup fallback in English
    const fallbackDict = translations['en'] as Record<string, string>;
    if (fallbackDict && fallbackDict[key] !== undefined) {
      return fallbackDict[key];
    }

    return key;
  };

  return (
    <SettingsContext.Provider value={{ theme, toggleTheme, lang, toggleLang, t }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};