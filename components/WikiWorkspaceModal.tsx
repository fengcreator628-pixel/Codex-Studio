import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  User,
  MapPin,
  Package,
  Compass,
  Flag,
  StickyNote,
  Plus,
  Search,
  Trash2,
  Save,
  Tag,
  Link,
  Sparkles,
  X,
  FileText,
  Eye,
  Edit3,
  Calendar,
  Shield,
  Users,
  Layers,
  Zap,
  Filter
} from 'lucide-react';
import { Project, WikiArticle, WikiCategory } from '../types';
import { getWikiArticles, saveWikiArticle, deleteWikiArticle } from '../services/storage';

interface WikiWorkspaceModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: WikiCategory;
  isEmbeddedView?: boolean;
}

const CATEGORY_CONFIG: {
  key: WikiCategory;
  label: string;
  icon: any;
  color: string;
}[] = [
  { key: 'character', label: '人物設定', icon: User, color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-300' },
  { key: 'location', label: '地點設定', icon: MapPin, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-300' },
  { key: 'lore', label: '世界觀設定', icon: Compass, color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-900 dark:text-purple-300' },
  { key: 'era', label: '時代背景', icon: Calendar, color: 'text-cyan-600 bg-cyan-50 border-cyan-200 dark:bg-cyan-950 dark:border-cyan-900 dark:text-cyan-300' },
  { key: 'event', label: '事件設定', icon: Sparkles, color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-900 dark:text-orange-300' },
  { key: 'faction', label: '組織設定', icon: Flag, color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900 dark:text-red-300' },
  { key: 'rule', label: '規則設定', icon: Shield, color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-300' },
  { key: 'item', label: '物件設定', icon: Package, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300' },
  { key: 'relationship', label: '人物關係', icon: Users, color: 'text-pink-600 bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-900 dark:text-pink-300' },
  { key: 'theme', label: '主題設定', icon: Layers, color: 'text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-950 dark:border-teal-900 dark:text-teal-300' },
  { key: 'conflict', label: '衝突設定', icon: Zap, color: 'text-amber-700 bg-amber-100 border-amber-300 dark:bg-amber-900 dark:border-amber-800 dark:text-amber-200' },
  { key: 'notes', label: '創作隨筆', icon: StickyNote, color: 'text-stone-600 bg-stone-100 border-stone-200 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300' },
];

export const WikiWorkspaceModal: React.FC<WikiWorkspaceModalProps> = ({
  project,
  isOpen,
  onClose,
  initialCategory,
  isEmbeddedView = false,
}) => {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<WikiCategory | 'all'>(initialCategory || 'all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<WikiArticle | null>(null);

  // Form states for editing
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<WikiCategory>('character');
  const [editSummary, setEditSummary] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTagInput, setEditTagInput] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const refreshArticles = () => {
    if (project && project.id) {
      const list = getWikiArticles(project.id);
      setArticles(list);
      if (list.length > 0 && !activeArticle) {
        selectArticle(list[0]);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshArticles();
      if (initialCategory) {
        setSelectedCategory(initialCategory);
      }
    }
  }, [isOpen, project.id, initialCategory]);

  const selectArticle = (art: WikiArticle) => {
    setActiveArticle(art);
    setEditTitle(art.title || '');
    setEditCategory(art.category || 'character');
    setEditSummary(art.summary || '');
    setEditContent(art.content || '');
    setEditTags(art.tags || []);
    setEditImageUrl(art.imageUrl || '');
  };

  const handleCreateNew = (category: WikiCategory = 'character') => {
    const newArt: WikiArticle = {
      id: `wiki_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      projectId: project.id,
      title: '新百科條目',
      category: category,
      summary: '',
      content: '',
      tags: [],
      imageUrl: '',
      lastModified: Date.now(),
    };
    saveWikiArticle(newArt);
    refreshArticles();
    selectArticle(newArt);
  };

  const handleSaveActive = () => {
    if (!activeArticle) return;
    const updated: WikiArticle = {
      ...activeArticle,
      title: editTitle.trim() || '未命名條目',
      category: editCategory,
      summary: editSummary,
      content: editContent,
      tags: editTags,
      imageUrl: editImageUrl,
      lastModified: Date.now(),
    };
    saveWikiArticle(updated);
    setActiveArticle(updated);
    refreshArticles();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1200);
  };

  const handleDelete = (artId: string) => {
    if (window.confirm('確定要刪除此條目嗎？')) {
      deleteWikiArticle(artId);
      if (activeArticle?.id === artId) {
        setActiveArticle(null);
      }
      refreshArticles();
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editTagInput.trim()) {
      e.preventDefault();
      if (!editTags.includes(editTagInput.trim())) {
        setEditTags([...editTags, editTagInput.trim()]);
      }
      setEditTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(t => t !== tagToRemove));
  };

  // Collect all unique tags across articles
  const allWikiTags = useMemo(() => {
    return Array.from(new Set(articles.flatMap(a => a.tags || []))).filter(Boolean);
  }, [articles]);

  // Filtered Articles list
  const filteredArticles = useMemo(() => {
    return articles.filter(art => {
      const matchCat = selectedCategory === 'all' || art.category === selectedCategory;
      const matchTag = !selectedTag || (art.tags && art.tags.includes(selectedTag));
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.content.toLowerCase().includes(q) ||
        art.tags.some(t => t.toLowerCase().includes(q));
      return matchCat && matchTag && matchQuery;
    });
  }, [articles, selectedCategory, selectedTag, searchQuery]);

  if (!isOpen) return null;

  const innerWorkspace = (
    <div className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full shadow-2xl overflow-hidden flex flex-col ${isEmbeddedView ? 'h-full border-none rounded-none shadow-none' : 'max-w-6xl h-[88vh]'}`}>
      {/* Modal Top Header */}
      <div className="p-4 sm:p-5 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-md">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
              <span>設定與世界觀 Wiki 管理儀表板</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono">
                {articles.length} 條目
              </span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              系統化編纂人物、地點、事件、規則與衝突，建立宏大嚴謹的世界觀體系
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
          title="關閉"
        >
          <X size={20} />
        </button>
      </div>

      {/* Modal Workspace Split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Category Tabs & Search & Article List */}
        <div className="w-full md:w-80 border-r border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/40 p-4 flex flex-col overflow-hidden space-y-3">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              世界觀分類
            </span>
            <button
              onClick={() => handleCreateNew(selectedCategory === 'all' ? 'character' : selectedCategory)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
            >
              <Plus size={13} />
              <span>新增條目</span>
            </button>
          </div>

          {/* Category Filter Pills Grid */}
          <div className="grid grid-cols-2 gap-1 pb-2 border-b border-stone-200 dark:border-stone-800 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`col-span-2 px-2.5 py-1 rounded-lg text-xs font-medium transition-all text-left flex items-center justify-between ${
                selectedCategory === 'all'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              <span>全部條目</span>
              <span className="font-mono text-[10px] opacity-80">({articles.length})</span>
            </button>
            {CATEGORY_CONFIG.map(cat => {
              const count = articles.filter(a => a.category === cat.key).length;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center space-x-1.5 truncate ${
                    selectedCategory === cat.key
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                  title={cat.label}
                >
                  <Icon size={12} className="shrink-0" />
                  <span className="truncate">{cat.label}</span>
                  <span className="font-mono text-[9px] opacity-70 ml-auto">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Tag Cloud Filter Bar */}
          {allWikiTags.length > 0 && (
            <div className="pb-2 border-b border-stone-200 dark:border-stone-800 space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center">
                <Tag size={10} className="mr-1" />
                關聯標籤過濾:
              </span>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    selectedTag === null ? 'bg-amber-600 text-white font-bold' : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  全部標籤
                </button>
                {allWikiTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      selectedTag === tag ? 'bg-amber-600 text-white font-bold' : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-300'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="全文搜尋條目標題、內容、標籤..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Articles List */}
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {filteredArticles.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
                查無相關條目，可點擊「新增條目」開始撰寫。
              </div>
            ) : (
              filteredArticles.map(art => {
                const catMeta = CATEGORY_CONFIG.find(c => c.key === art.category) || CATEGORY_CONFIG[0];
                const Icon = catMeta.icon;
                const isActive = activeArticle?.id === art.id;

                return (
                  <div
                    key={art.id}
                    onClick={() => selectArticle(art)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500/60 dark:bg-amber-950/40 dark:border-amber-700 shadow-sm'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-800 dark:text-stone-100 truncate max-w-[160px]">
                        {art.title || '無標題'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border flex items-center space-x-1 ${catMeta.color}`}>
                        <Icon size={10} />
                        <span>{catMeta.label}</span>
                      </span>
                    </div>

                    {art.summary && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 italic">
                        {art.summary}
                      </p>
                    )}

                    {art.tags && art.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {art.tags.slice(0, 3).map(t => (
                          <span key={t} className="px-1.5 py-0.2 bg-stone-100 dark:bg-stone-800 text-stone-500 text-[9px] rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Article Editor Canvas */}
        <div className="flex-1 bg-white dark:bg-stone-900 p-6 flex flex-col overflow-hidden space-y-4">
          {activeArticle ? (
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar space-y-5 pr-2">
              {/* Title & Category Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="輸入條目名稱（如：角色姓名、地點名稱、世界規則、勢力名）..."
                  className="flex-1 font-serif font-extrabold text-2xl bg-transparent border-b border-transparent hover:border-stone-300 dark:hover:border-stone-700 focus:border-amber-500 text-stone-900 dark:text-stone-100 focus:outline-none transition-colors"
                />

                <div className="flex items-center space-x-2">
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as WikiCategory)}
                    className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none"
                  >
                    {CATEGORY_CONFIG.map(c => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleSaveActive}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1"
                  >
                    <Save size={14} />
                    <span>{isSaved ? '已儲存！' : '儲存條目'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(activeArticle.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    title="刪除本條目"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Quick Summary / Profile Overview */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
                  一句話摘要 / 人物或概念短評
                </label>
                <input
                  type="text"
                  value={editSummary}
                  onChange={e => setEditSummary(e.target.value)}
                  placeholder="例如：帝國第一劍豪，隱姓埋名於邊境小鎮的酒館老闆..."
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Tags Editor */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
                  關聯標籤 (按 Enter 建立新標籤)
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl">
                  {editTags.map(tag => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-xs font-medium rounded-lg flex items-center space-x-1 border border-amber-200 dark:border-amber-800"
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600 ml-1"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={editTagInput}
                    onChange={e => setEditTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="輸入標籤..."
                    className="flex-1 min-w-[100px] bg-transparent text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Detailed Article Body */}
              <div className="space-y-1 flex-1 flex flex-col">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
                  詳細百科紀錄與設定筆記
                </label>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder="【外貌特徵】&#10;【性格動機】&#10;【招式能力與規則限制】&#10;【與其他角色、事件的關聯...】"
                  className="w-full flex-1 min-h-[220px] p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-serif leading-relaxed resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-400 space-y-3">
              <BookOpen size={36} className="text-amber-600/40" />
              <p className="text-sm font-serif">請由左側點選條目以閱讀與編輯，或點選「新增條目」。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isEmbeddedView) {
    return innerWorkspace;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {innerWorkspace}
    </div>
  );
};
