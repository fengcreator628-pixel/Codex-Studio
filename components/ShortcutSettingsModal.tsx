import React, { useState } from 'react';
import { Keyboard, X, RotateCcw, Check, Command, Sparkles } from 'lucide-react';
import {
  ShortcutConfig,
  getShortcuts,
  saveShortcuts,
  resetShortcuts,
  formatShortcutKey
} from '../services/shortcuts';

interface ShortcutSettingsModalProps {
  onClose: () => void;
  onShortcutsUpdated: () => void;
}

export const ShortcutSettingsModal: React.FC<ShortcutSettingsModalProps> = ({
  onClose,
  onShortcutsUpdated,
}) => {
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>(getShortcuts());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleKeyDownRecording = (e: React.KeyboardEvent, id: string) => {
    e.preventDefault();
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

    const key = e.key.toLowerCase();
    const ctrlKey = e.ctrlKey || e.metaKey;
    const altKey = e.altKey;
    const shiftKey = e.shiftKey;

    setShortcuts(prev =>
      prev.map(sc => {
        if (sc.id === id) {
          return {
            ...sc,
            key,
            ctrlKey,
            altKey,
            shiftKey,
          };
        }
        return sc;
      })
    );
    setEditingId(null);
  };

  const handleSave = () => {
    saveShortcuts(shortcuts);
    onShortcutsUpdated();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    if (window.confirm('確定要恢復預設快捷鍵組合嗎？')) {
      const defs = resetShortcuts();
      setShortcuts(defs);
      onShortcutsUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded-xl">
              <Keyboard size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                快捷鍵全域設定
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                點擊組合鍵框，可按下任意按鍵進行自訂綁定
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortcuts List Body */}
        <div className="p-5 overflow-y-auto space-y-3 custom-scrollbar flex-1">
          {shortcuts.map(sc => (
            <div
              key={sc.id}
              className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 rounded-xl hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
            >
              <div>
                <div className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-2">
                  <span>{sc.label}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-full font-normal">
                    {sc.category}
                  </span>
                </div>
              </div>

              {editingId === sc.id ? (
                <input
                  type="text"
                  readOnly
                  autoFocus
                  value="請按下鍵盤組合鍵..."
                  onKeyDown={e => handleKeyDownRecording(e, sc.id)}
                  onBlur={() => setEditingId(null)}
                  className="px-3 py-1.5 bg-amber-100 dark:bg-amber-950 border-2 border-amber-500 rounded-lg text-xs font-mono text-amber-900 dark:text-amber-200 animate-pulse text-center focus:outline-none w-44 shadow-inner"
                />
              ) : (
                <button
                  onClick={() => setEditingId(sc.id)}
                  className="px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 hover:border-amber-500 dark:hover:border-amber-500 rounded-lg text-xs font-mono font-bold text-stone-800 dark:text-stone-100 transition-all flex items-center space-x-1 shadow-xs"
                  title="點擊修改此快捷鍵"
                >
                  <Command size={12} className="text-amber-600" />
                  <span>{formatShortcutKey(sc)}</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-900/80 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-medium flex items-center space-x-1 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <RotateCcw size={13} />
            <span>恢復預設設定</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md transition-colors flex items-center space-x-1.5"
            >
              {isSaved ? (
                <>
                  <Check size={15} />
                  <span>設定已儲存！</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>儲存快捷鍵配置</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
