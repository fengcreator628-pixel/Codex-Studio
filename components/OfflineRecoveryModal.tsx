import React from 'react';
import { AlertTriangle, RotateCcw, Trash2, Clock, FileText } from 'lucide-react';
import { OfflineDraft } from '../services/offline';

interface OfflineRecoveryModalProps {
  isOpen: boolean;
  draft: OfflineDraft | null;
  currentSavedContent: string;
  onRestore: () => void;
  onDiscard: () => void;
}

export const OfflineRecoveryModal: React.FC<OfflineRecoveryModalProps> = ({
  isOpen,
  draft,
  currentSavedContent,
  onRestore,
  onDiscard,
}) => {
  if (!isOpen || !draft) return null;

  const formattedTime = new Date(draft.timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getWordCount = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html || '';
    const text = tmp.textContent || tmp.innerText || '';
    return text.trim().length === 0 ? 0 : text.split(/\s+/).length;
  };

  const draftWords = getWordCount(draft.content);
  const savedWords = getWordCount(currentSavedContent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/60 flex items-start space-x-4">
          <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-0.5 rounded-full mb-1">
              <Clock size={12} />
              <span>離線手稿自動備份提醒</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
              偵測到未儲存的離線變更內容！
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
              系統於 <span className="font-semibold text-amber-700 dark:text-amber-400">{formattedTime}</span> 自動偵測並備份了本章節（{draft.nodeTitle || '手稿文件'}）的離線手稿。請選擇是否復原。
            </p>
          </div>
        </div>

        {/* Content Comparison */}
        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Saved Version */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/50 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800 mb-2">
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400 flex items-center">
                  <FileText size={13} className="mr-1" /> 目前已儲存版本
                </span>
                <span className="text-[11px] font-mono text-stone-400">{savedWords} 字</span>
              </div>
              <div
                className="text-xs text-stone-600 dark:text-stone-400 line-clamp-6 font-serif italic"
                dangerouslySetInnerHTML={{ __html: currentSavedContent || '<p className="text-stone-400">（空白內容）</p>' }}
              />
            </div>

            {/* Offline Draft Version */}
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-900 mb-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center">
                  <RotateCcw size={13} className="mr-1" /> 離線備份草稿 (建議)
                </span>
                <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">{draftWords} 字</span>
              </div>
              <div
                className="text-xs text-stone-800 dark:text-stone-200 line-clamp-6 font-serif"
                dangerouslySetInnerHTML={{ __html: draft.content || '<p className="text-stone-400">（空白內容）</p>' }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row justify-end items-center gap-3">
          <button
            onClick={onDiscard}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
          >
            <Trash2 size={14} />
            <span>放棄離線草稿 (保留已儲存內容)</span>
          </button>

          <button
            onClick={onRestore}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-1.5"
          >
            <RotateCcw size={14} />
            <span>復原離線備份草稿</span>
          </button>
        </div>
      </div>
    </div>
  );
};
