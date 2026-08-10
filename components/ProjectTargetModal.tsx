import React, { useState } from 'react';
import { Project } from '../types';
import { Target, Calendar, Award, Tag, Sparkles, X, Check, FileText } from 'lucide-react';

interface ProjectTargetModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: Project) => void;
}

export const ProjectTargetModal: React.FC<ProjectTargetModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(project.title);
  const [coreTheme, setCoreTheme] = useState(project.coreTheme || '');
  const [targetWordCount, setTargetWordCount] = useState<number>(project.targetWordCount || 50000);
  const [synopsis, setSynopsis] = useState(project.synopsis || '');
  const [projectColor, setProjectColor] = useState(project.projectColor || '#d97706');
  const [tagsInput, setTagsInput] = useState((project.projectTags || []).join(', '));

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const updated: Project = {
      ...project,
      title: title.trim() || '未命名傑作',
      coreTheme,
      targetWordCount: Number(targetWordCount) || 10000,
      synopsis,
      projectColor,
      projectTags: tags,
      lastModified: Date.now(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
              <Target size={18} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-800 dark:text-stone-100">
                專案目標與寫作參數設定
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                設定新手稿的寫作目標字數、主題、大綱與標籤標記
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
              專案名稱 Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="請輸入作品名稱..."
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-800 dark:text-stone-100 outline-none focus:border-amber-500 transition-colors"
              required
            />
          </div>

          {/* Word Count Goal & Theme */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Target size={13} className="text-amber-600" /> 目標長度 (字數)
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={targetWordCount}
                onChange={e => setTargetWordCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-800 dark:text-stone-100 font-mono outline-none focus:border-amber-500"
                required
              />
              <p className="text-[10px] text-stone-400 mt-1">
                常用：極短篇 5,000 · 中篇 30,000 · 長篇 80,000+
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles size={13} className="text-amber-600" /> 核心主題 Core Theme
              </label>
              <input
                type="text"
                value={coreTheme}
                onChange={e => setCoreTheme(e.target.value)}
                placeholder="例：救贖、時間旅行、背叛"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-800 dark:text-stone-100 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Color & Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Tag size={13} className="text-amber-600" /> 專案標籤 (逗號分隔)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="例：奇幻, 初稿, 懸疑"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-800 dark:text-stone-100 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
                專案辨識色彩
              </label>
              <div className="flex items-center space-x-2 pt-1">
                {['#d97706', '#2563eb', '#059669', '#dc2626', '#7c3aed', '#db2777'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setProjectColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      projectColor === c ? 'scale-110 border-stone-900 dark:border-white shadow-md' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Synopsis */}
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FileText size={13} className="text-amber-600" /> 故事大綱 / 企劃備忘 Synopsis
            </label>
            <textarea
              value={synopsis}
              onChange={e => setSynopsis(e.target.value)}
              rows={4}
              placeholder="簡述作品主要背景、高潮情節、主要衝突或世界觀梗概..."
              className="w-full p-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg text-xs leading-relaxed text-stone-800 dark:text-stone-100 outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow flex items-center space-x-1.5 transition-colors"
            >
              <Check size={15} />
              <span>儲存寫作目標設定</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
