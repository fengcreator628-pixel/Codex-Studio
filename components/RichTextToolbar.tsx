import React, { useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Quote, Link as LinkIcon, RemoveFormatting,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Outdent, Indent,
  Search, Check, Sparkles, Scissors, Copy, Clipboard, Type, Palette,
  Minus, Undo, Redo, Camera, BookOpen, ChevronUp, ChevronDown, Sliders
} from 'lucide-react';

interface RichTextToolbarProps {
  onExecuteCommand: (command: string, value?: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleFindReplace: () => void;
  onToggleSpellcheck: () => void;
  spellcheckEnabled: boolean;
  onInsertSceneDivider: () => void;
  onOpenSnapshots: () => void;
  onOpenWiki: () => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
}

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  onExecuteCommand,
  onUndo,
  onRedo,
  onToggleFindReplace,
  onToggleSpellcheck,
  spellcheckEnabled,
  onInsertSceneDivider,
  onOpenSnapshots,
  onOpenWiki,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const colors = [
    '#000000', '#374151', '#9ca3af', '#dc2626', '#ea580c',
    '#d97706', '#059669', '#2563eb', '#7c3aed', '#db2777'
  ];

  const handleLink = () => {
    const url = prompt('請輸入超連結網址：', 'https://');
    if (url) {
      onExecuteCommand('createLink', url);
    }
  };

  const handleCut = () => {
    document.execCommand('cut');
  };

  const handleCopy = () => {
    document.execCommand('copy');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        document.execCommand('insertText', false, text);
      }
    } catch {
      document.execCommand('paste');
    }
  };

  if (isCollapsed) {
    return (
      <div className="bg-stone-50/90 dark:bg-stone-900/90 border-b border-stone-200 dark:border-stone-800 px-4 py-1 flex items-center justify-between text-xs select-none transition-all duration-300 shadow-xs">
        <button
          onClick={() => setIsCollapsed(false)}
          className="px-2.5 py-1 rounded-lg bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-amber-950 hover:text-amber-900 dark:hover:text-amber-200 transition-all flex items-center space-x-1.5 font-bold text-[11px]"
          title="展開文字排版與進階工具列"
        >
          <ChevronDown size={13} />
          <Sliders size={12} className="text-amber-600" />
          <span>展開排版工具列</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleFindReplace}
            className="p-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            title="搜尋與取代"
          >
            <Search size={13} />
          </button>
          <button
            onClick={onOpenSnapshots}
            className="p-1 text-stone-500 hover:text-amber-700 dark:hover:text-amber-300"
            title="版本快照"
          >
            <Camera size={13} />
          </button>
          <button
            onClick={onOpenWiki}
            className="p-1 text-stone-500 hover:text-amber-600 dark:hover:text-amber-400"
            title="Wiki 知識庫"
          >
            <BookOpen size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 py-2 flex flex-wrap items-center gap-1 text-xs select-none">
      {/* Undo / Redo */}
      <div className="flex items-center space-x-0.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-0.5">
        <button
          onClick={onUndo}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-600 dark:text-stone-300"
          title="復原 (Ctrl+Z)"
        >
          <Undo size={14} />
        </button>
        <button
          onClick={onRedo}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-600 dark:text-stone-300"
          title="重做 (Ctrl+Y)"
        >
          <Redo size={14} />
        </button>
      </div>

      <div className="w-px h-5 bg-stone-300 dark:bg-stone-700 mx-1" />

      {/* Font Family & Size Selectors */}
      <div className="flex items-center space-x-1">
        <select
          value={fontFamily}
          onChange={e => {
            setFontFamily(e.target.value);
            onExecuteCommand('fontName', e.target.value);
          }}
          className="px-2 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-800 dark:text-stone-200 font-medium focus:outline-none"
        >
          <option value="Noto Serif TC, Songti TC, serif">經典宋體 (Serif)</option>
          <option value="Inter, system-ui, sans-serif">現代黑體 (Sans)</option>
          <option value="KaiTi, STKaiti, cursive">傳統楷體 (Cursive)</option>
          <option value="FangSong, STFangsong, serif">仿宋體 (FangSong)</option>
          <option value="Courier New, monospace">等寬程式體 (Mono)</option>
        </select>

        <select
          value={fontSize}
          onChange={e => {
            setFontSize(e.target.value);
            onExecuteCommand('fontSize', e.target.value);
          }}
          className="px-2 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-800 dark:text-stone-200 font-medium focus:outline-none"
        >
          <option value="3">16px (正文)</option>
          <option value="4">18px (適中)</option>
          <option value="5">20px (放大)</option>
          <option value="6">24px (副標題)</option>
          <option value="7">28px (大標題)</option>
        </select>
      </div>

      <div className="w-px h-5 bg-stone-300 dark:bg-stone-700 mx-1" />

      {/* Basic Text Formatting */}
      <div className="flex items-center space-x-0.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-0.5">
        <button
          onClick={() => onExecuteCommand('bold')}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200 font-bold"
          title="粗體 (Ctrl+B)"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => onExecuteCommand('italic')}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200 italic"
          title="斜體 (Ctrl+I)"
        >
          <Italic size={14} />
        </button>
        <button
          onClick={() => onExecuteCommand('underline')}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200 underline"
          title="底線 (Ctrl+U)"
        >
          <Underline size={14} />
        </button>
        <button
          onClick={() => onExecuteCommand('strikeThrough')}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200 line-through"
          title="刪除線"
        >
          <Strikethrough size={14} />
        </button>

        {/* Text Color Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200 flex items-center space-x-0.5"
            title="文字顏色"
          >
            <Palette size={14} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full mt-1 left-0 z-30 p-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg grid grid-cols-5 gap-1">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => {
                    onExecuteCommand('foreColor', c);
                    setShowColorPicker(false);
                  }}
                  className="w-5 h-5 rounded-md border border-stone-300 dark:border-stone-600"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-px h-5 bg-stone-300 dark:bg-stone-700 mx-1" />

      {/* Headings & Block Formatting */}
      <div className="flex items-center space-x-1">
        <select
          onChange={e => {
            const val = e.target.value;
            if (val === 'p') onExecuteCommand('formatBlock', '<p>');
            else if (val === 'h1') onExecuteCommand('formatBlock', '<h1>');
            else if (val === 'h2') onExecuteCommand('formatBlock', '<h2>');
            else if (val === 'h3') onExecuteCommand('formatBlock', '<h3>');
            else if (val === 'blockquote') onExecuteCommand('formatBlock', '<blockquote>');
          }}
          className="px-2 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-800 dark:text-stone-200 font-medium focus:outline-none"
        >
          <option value="p">段落文字 (Paragraph)</option>
          <option value="h1">第一級標題 (H1)</option>
          <option value="h2">第二級標題 (H2)</option>
          <option value="h3">第三級標題 (H3)</option>
          <option value="blockquote">引用區塊 (Quote)</option>
        </select>
      </div>

      <div className="w-px h-5 bg-stone-300 dark:bg-stone-700 mx-1" />

      {/* Alignment & Indent */}
      <div className="flex items-center space-x-0.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-0.5">
        <button
          onClick={() => onExecuteCommand('justifyLeft')}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200"
          title="靠左對齊"
        >
          <AlignLeft size={14} />
        </button>
        <button
          onClick={() => onExecuteCommand('justifyCenter')}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200"
          title="置中對齊"
        >
          <AlignCenter size={14} />
        </button>
        <button
          onClick={() => onExecuteCommand('justifyRight')}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200"
          title="靠右對齊"
        >
          <AlignRight size={14} />
        </button>
        <button
          onClick={() => onExecuteCommand('justifyFull')}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200"
          title="兩端對齊"
        >
          <AlignJustify size={14} />
        </button>
        <button
          onClick={() => onExecuteCommand('indent')}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200"
          title="增加縮排"
        >
          <Indent size={14} />
        </button>
        <button
          onClick={() => onExecuteCommand('outdent')}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200"
          title="減少縮排"
        >
          <Outdent size={14} />
        </button>
      </div>

      <div className="w-px h-5 bg-stone-300 dark:bg-stone-700 mx-1" />

      {/* Insert Specials */}
      <div className="flex items-center space-x-0.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-0.5">
        <button
          onClick={handleLink}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200"
          title="插入超連結"
        >
          <LinkIcon size={14} />
        </button>
        <button
          onClick={onInsertSceneDivider}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200 font-bold"
          title="插入場景分隔符 (***)"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => onExecuteCommand('removeFormat')}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200"
          title="清除格式"
        >
          <RemoveFormatting size={14} />
        </button>
      </div>

      <div className="w-px h-5 bg-stone-300 dark:bg-stone-700 mx-1" />

      {/* Cut / Copy / Paste Operations */}
      <div className="flex items-center space-x-0.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-0.5">
        <button
          onClick={handleCut}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200"
          title="剪下"
        >
          <Scissors size={14} />
        </button>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200"
          title="複製"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={handlePaste}
          className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200"
          title="貼上"
        >
          <Clipboard size={14} />
        </button>
      </div>

      <div className="w-px h-5 bg-stone-300 dark:bg-stone-700 mx-1" />

      {/* Advanced Features: Find/Replace, Spellcheck, Snapshot & Wiki */}
      <div className="flex items-center space-x-1">
        <button
          onClick={onToggleFindReplace}
          className="px-2.5 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center space-x-1 font-medium"
          title="搜尋與取代 (Find & Replace)"
        >
          <Search size={13} />
          <span>搜尋/取代</span>
        </button>

        <button
          onClick={onToggleSpellcheck}
          className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all flex items-center space-x-1 ${
            spellcheckEnabled
              ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600'
          }`}
          title="開關拼字檢查"
        >
          <Check size={13} />
          <span>拼字檢查</span>
        </button>

        <button
          onClick={onOpenSnapshots}
          className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-lg hover:bg-amber-200 transition-colors flex items-center space-x-1 font-bold"
          title="專案自動快照與版本復原"
        >
          <Camera size={13} />
          <span>版本快照</span>
        </button>

        <button
          onClick={onOpenWiki}
          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all flex items-center space-x-1 font-bold shadow-xs"
          title="開啟獨立 Wiki 世界觀知識庫"
        >
          <BookOpen size={13} />
          <span>Wiki 知識庫</span>
        </button>
      </div>

      {/* Smooth Collapse Button */}
      <button
        onClick={() => setIsCollapsed(true)}
        className="px-2 py-1 bg-stone-200/60 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg transition-colors flex items-center space-x-1 ml-auto font-medium text-[11px]"
        title="收起格式工具欄"
      >
        <ChevronUp size={13} />
        <span>收起</span>
      </button>
    </div>
  );
};
