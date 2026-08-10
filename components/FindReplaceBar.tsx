import React, { useState } from 'react';
import { Search, ChevronUp, ChevronDown, X, Replace, ReplaceAll, Sparkles } from 'lucide-react';

interface FindReplaceBarProps {
  onClose: () => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
  onContentChange: () => void;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  onClose,
  editorRef,
  onContentChange,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [matchIndex, setMatchIndex] = useState<number>(0);
  const [caseSensitive, setCaseSensitive] = useState(false);

  const handleSearch = (direction: 'next' | 'prev') => {
    if (!findText.trim() || !editorRef.current) return;

    // Use window.find if available
    const win = window as any;
    if (typeof win.find === 'function') {
      const found = win.find(
        findText,
        caseSensitive,
        direction === 'prev', // backwards
        true, // wrapAround
        false, // wholeWord
        false, // searchInFrames
        false
      );

      // Count occurrences in innerText
      const fullText = editorRef.current.innerText || '';
      const regex = new RegExp(
        findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        caseSensitive ? 'g' : 'gi'
      );
      const matches = fullText.match(regex);
      setMatchCount(matches ? matches.length : 0);
    }
  };

  const handleReplaceSingle = () => {
    if (!findText.trim()) return;
    const selection = window.getSelection();
    if (selection && selection.toString().toLowerCase() === findText.toLowerCase()) {
      document.execCommand('insertText', false, replaceText);
      onContentChange();
      handleSearch('next');
    } else {
      handleSearch('next');
    }
  };

  const handleReplaceAll = () => {
    if (!findText.trim() || !editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const regex = new RegExp(
      findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      caseSensitive ? 'g' : 'gi'
    );
    const newHtml = html.replace(regex, replaceText);
    editorRef.current.innerHTML = newHtml;
    onContentChange();
    setMatchCount(0);
  };

  return (
    <div className="bg-amber-50 dark:bg-stone-900 border-b border-amber-200 dark:border-stone-800 px-4 py-2 flex flex-wrap items-center gap-2 text-xs animate-fade-in shadow-xs">
      <div className="flex items-center space-x-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2 py-1">
        <Search size={14} className="text-stone-400" />
        <input
          type="text"
          placeholder="搜尋文字..."
          value={findText}
          onChange={e => {
            setFindText(e.target.value);
            setMatchCount(null);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSearch('next');
          }}
          className="bg-transparent border-none text-xs text-stone-800 dark:text-stone-100 focus:outline-none w-32 sm:w-44"
        />
        {matchCount !== null && (
          <span className="text-[10px] text-stone-400 font-mono">
            {matchCount > 0 ? `${matchCount} 個符合` : '無符合結果'}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => handleSearch('prev')}
          className="p-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200"
          title="上一個符合項目"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={() => handleSearch('next')}
          className="p-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200"
          title="下一個符合項目"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="flex items-center space-x-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2 py-1">
        <input
          type="text"
          placeholder="取代為..."
          value={replaceText}
          onChange={e => setReplaceText(e.target.value)}
          className="bg-transparent border-none text-xs text-stone-800 dark:text-stone-100 focus:outline-none w-32 sm:w-44"
        />
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={handleReplaceSingle}
          className="px-2.5 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium flex items-center space-x-1"
        >
          <Replace size={13} />
          <span>取代</span>
        </button>
        <button
          onClick={handleReplaceAll}
          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center space-x-1 shadow-xs"
        >
          <ReplaceAll size={13} />
          <span>全部取代</span>
        </button>
      </div>

      <label className="flex items-center space-x-1 text-stone-600 dark:text-stone-300 font-medium cursor-pointer ml-2">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={e => setCaseSensitive(e.target.checked)}
          className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
        />
        <span>區分大小寫</span>
      </label>

      <button
        onClick={onClose}
        className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded ml-auto"
      >
        <X size={16} />
      </button>
    </div>
  );
};
