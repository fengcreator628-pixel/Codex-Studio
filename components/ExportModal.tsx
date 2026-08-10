import React, { useState } from 'react';
import { Project, FileSystemNode } from '../types';
import { exportContent, compileProjectManuscript, DocxExportOptions } from '../services/export';
import { Download, FileText, FileCode, FileSpreadsheet, X, CheckCircle2, Sliders, Eye } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface ExportModalProps {
  project: Project;
  activeNode: FileSystemNode | null;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ project, activeNode, onClose }) => {
  const { t } = useSettings();
  const [format, setFormat] = useState<'txt' | 'docx' | 'md'>('docx');
  const [scope, setScope] = useState<'active' | 'manuscript'>('manuscript');
  const [exported, setExported] = useState(false);

  // DOCX Formatting Options
  const [headerText, setHeaderText] = useState(project.title || '作品稿件');
  const [footerText, setFooterText] = useState('第 1 頁');
  const [fontSize, setFontSize] = useState('12pt');
  const [lineHeight, setLineHeight] = useState('1.5');
  const [fontFamily, setFontFamily] = useState('Times New Roman, 宋體');

  const handleExport = () => {
    const docxOptions: DocxExportOptions = {
      headerText,
      footerText,
      fontSize,
      lineHeight,
      fontFamily,
    };

    if (scope === 'active' && activeNode) {
      exportContent(activeNode.title, activeNode.content || '', format, '單章稿件', docxOptions);
    } else {
      const compiled = compileProjectManuscript(project);
      const htmlToUse = format === 'txt' ? compiled.text : (format === 'md' ? compiled.markdown : compiled.html);
      exportContent(compiled.title, htmlToUse, format, '完整手稿', docxOptions);
    }
    setExported(true);
    setTimeout(() => {
      setExported(false);
      onClose();
    }, 1200);
  };

  // Get sample text for preview
  const getPreviewText = () => {
    if (scope === 'active' && activeNode) {
      const tmp = document.createElement('div');
      tmp.innerHTML = activeNode.content || '';
      return tmp.innerText || '無內文預覽...';
    }
    return `第一章 開始的故事\n這是匯出文件的即時樣式預覽。頁首與頁尾將會在 Microsoft Word 或 Pages 開啟時自動帶入設定。`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded-xl">
              <Download size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                匯出稿件與排版選項
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                將您的小說創作匯出為標準Word、Markdown或純文字檔
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

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">
              匯出範圍
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope('manuscript')}
                className={`p-3 rounded-xl border text-left text-sm transition-all flex flex-col justify-between ${
                  scope === 'manuscript'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-stone-900 dark:text-stone-100 font-bold shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                }`}
              >
                <span className="font-bold truncate">{project.title}</span>
                <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">完整作品手稿 (包含所有章節)</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('active')}
                disabled={!activeNode}
                className={`p-3 rounded-xl border text-left text-sm transition-all flex flex-col justify-between ${
                  scope === 'active'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-stone-900 dark:text-stone-100 font-bold shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                } ${!activeNode ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span className="font-bold truncate">{activeNode ? activeNode.title : '當前章節'}</span>
                <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">單一選取章節/文件</span>
              </button>
            </div>
          </div>

          {/* Format Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">
              檔案格式
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormat('docx')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 text-xs transition-all ${
                  format === 'docx'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-stone-900 dark:text-stone-100 font-bold'
                    : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                }`}
              >
                <FileText className="text-blue-600 dark:text-blue-400" size={22} />
                <span>Word 文件 (.docx)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('md')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 text-xs transition-all ${
                  format === 'md'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-stone-900 dark:text-stone-100 font-bold'
                    : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                }`}
              >
                <FileCode className="text-purple-600 dark:text-purple-400" size={22} />
                <span>Markdown (.md)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('txt')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 text-xs transition-all ${
                  format === 'txt'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-stone-900 dark:text-stone-100 font-bold'
                    : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                }`}
              >
                <FileSpreadsheet className="text-stone-600 dark:text-stone-400" size={22} />
                <span>純文字檔 (.txt)</span>
              </button>
            </div>
          </div>

          {/* Word Document Options & Paper Live Preview */}
          {format === 'docx' && (
            <div className="space-y-4 pt-2 border-t border-stone-200 dark:border-stone-800">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Sliders size={14} className="text-amber-600" />
                <span>Word (.docx) 排版與頁首頁尾預設值設定</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-stone-600 dark:text-stone-300 mb-1 font-medium">頁首內容 (Header)</label>
                  <input
                    type="text"
                    value={headerText}
                    onChange={e => setHeaderText(e.target.value)}
                    placeholder="輸入頁首文字 (例如: 書名)"
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 dark:text-stone-300 mb-1 font-medium">頁尾內容 (Footer)</label>
                  <input
                    type="text"
                    value={footerText}
                    onChange={e => setFooterText(e.target.value)}
                    placeholder="輸入頁尾文字 (例如: 頁碼標記)"
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 dark:text-stone-300 mb-1 font-medium">內文字型大小</label>
                  <select
                    value={fontSize}
                    onChange={e => setFontSize(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:border-amber-500"
                  >
                    <option value="10.5pt">10.5 pt (標準5號字)</option>
                    <option value="12pt">12 pt (出版標準字體)</option>
                    <option value="14pt">14 pt (放大易讀體)</option>
                    <option value="16pt">16 pt (大字列印檔)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 dark:text-stone-300 mb-1 font-medium">段落行距</label>
                  <select
                    value={lineHeight}
                    onChange={e => setLineHeight(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:border-amber-500"
                  >
                    <option value="1.15">1.15 倍 (緊湊行高)</option>
                    <option value="1.25">1.25 倍 (適中行高)</option>
                    <option value="1.5">1.5 倍 (標準投稿雙倍空行)</option>
                    <option value="2.0">2.0 倍 (雙倍行高校對稿)</option>
                  </select>
                </div>
              </div>

              {/* Simulated Paper Live Preview */}
              <div className="mt-4 border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-100 dark:bg-stone-950 p-4">
                <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mb-2 font-medium">
                  <div className="flex items-center space-x-1">
                    <Eye size={12} className="text-amber-600" />
                    <span>紙張頁面實時排版預覽</span>
                  </div>
                  <span>A4 規格模擬</span>
                </div>

                <div className="bg-white text-stone-900 rounded-md p-5 shadow-sm border border-stone-300 font-serif min-h-[140px] flex flex-col justify-between select-none">
                  <div className="border-b border-stone-200 pb-1 text-[10px] text-stone-400 flex justify-between">
                    <span>{headerText || '頁首預記'}</span>
                    <span>Codex Studio Exporter</span>
                  </div>

                  <div 
                    className="my-3 text-stone-800 line-clamp-3 leading-relaxed"
                    style={{ fontSize: fontSize === '10.5pt' ? '11px' : (fontSize === '12pt' ? '13px' : '15px'), lineHeight }}
                  >
                    {getPreviewText()}
                  </div>

                  <div className="border-t border-stone-200 pt-1 text-[10px] text-stone-400 flex justify-between">
                    <span>秘密稿件</span>
                    <span>{footerText || '頁尾預記'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-stone-50 dark:bg-stone-900/60 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-400 dark:text-stone-500">
            瀏覽器安全本地直接產生與下載
          </span>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md transition-colors flex items-center space-x-2"
            >
              {exported ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>檔案已成功匯出與下載！</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>下載匯出檔案</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
