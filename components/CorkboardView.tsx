import React, { useState } from 'react';
import { Project, FileSystemNode } from '../types';
import { FileText, Folder, Grid, Table as TableIcon, Edit3, Trash2 } from 'lucide-react';
import { htmlToPlainText } from '../services/export';
import { countWords } from '../utils/wordCount';

interface CorkboardViewProps {
  project: Project;
  onSelectNode: (node: FileSystemNode | null) => void;
  onUpdateProject: (p: Project) => void;
  activeFolderId?: string | null;
}

export const CorkboardView: React.FC<CorkboardViewProps> = ({
  project,
  onSelectNode,
  onUpdateProject,
  activeFolderId
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'outliner'>('cards');

  const activeFolder = activeFolderId ? (project.nodes || []).find(n => n.id === activeFolderId) : null;

  // Filter nodes: if activeFolderId is set, show items whose parentId matches activeFolderId.
  // Otherwise, show top-level nodes (where parentId is null).
  const nodes = (project.nodes || []).filter(
    n => {
      const isRightType = n.type === 'document' || n.type === 'folder' || n.type === 'note' || n.type === 'whiteboard';
      if (!isRightType) return false;
      if (activeFolderId) {
        return n.parentId === activeFolderId;
      } else {
        return n.parentId === null;
      }
    }
  );

  const getWordCount = (content: string) => {
    return countWords(content);
  };

  return (
    <div className="h-full flex flex-col bg-amber-50/30 dark:bg-stone-950 p-6 overflow-y-auto custom-scrollbar">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Manuscript</span>
            <span>/</span>
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              {activeFolder ? activeFolder.title : 'All Chapters'}
            </span>
          </div>
          <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            {activeFolder ? (
              <>
                <Folder size={18} className="text-amber-600 animate-pulse" />
                <span>{activeFolder.title} 的子項目管理</span>
              </>
            ) : (
              <span>Corkboard & Manuscript Outliner</span>
            )}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {activeFolder ? '檢視與調整當前資料夾下的所有場景卡片與子大綱' : 'Scrivener 風格視覺索引卡片與章節大綱總覽'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {activeFolder && (
            <button
              onClick={() => {
                const parentNode = activeFolder.parentId ? (project.nodes || []).find(n => n.id === activeFolder.parentId) : null;
                onSelectNode(parentNode || null);
              }}
              className="px-3 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-medium transition-colors border border-stone-200 dark:border-stone-700 cursor-pointer"
            >
              返回上層資料夾
            </button>
          )}

          <div className="flex items-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Grid size={14} />
              <span>Corkboard</span>
            </button>
            <button
              onClick={() => setViewMode('outliner')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'outliner'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <TableIcon size={14} />
              <span>Outliner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {nodes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-amber-50/20 dark:bg-stone-900/10 border-2 border-dashed border-stone-200 dark:border-stone-850 rounded-2xl p-6 text-center">
          <Folder size={48} className="text-stone-300 dark:text-stone-700 mb-4" />
          <h3 className="text-base font-serif font-bold text-stone-700 dark:text-stone-300 mb-1">空資料夾</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mb-4 leading-relaxed">
            這個資料夾目前沒有子項目。您可以使用左側的書架側欄（Bookshelf）建立新章節，或拖曳其他章節進入本資料夾。
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {nodes.map(node => {
            const wordCount = getWordCount(node.content);
            const excerpt = htmlToPlainText(node.content || '').slice(0, 150);

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className="group relative bg-amber-100/70 dark:bg-stone-900 border border-amber-200 dark:border-stone-800 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[180px]"
              >
                {/* Pin accent */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-rose-500 rounded-full shadow-sm border border-rose-600"></div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base truncate flex items-center gap-2">
                      {node.type === 'folder' ? <Folder size={16} className="text-amber-600" /> : <FileText size={16} className="text-stone-600" />}
                      {node.title}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-sans line-clamp-4 italic">
                    {excerpt || 'Empty scene description...'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-200/50 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                  <span className="uppercase font-mono text-[9px] bg-amber-200/60 dark:bg-stone-800 px-2 py-0.5 rounded">
                    {node.type}
                  </span>
                  <span>{wordCount} words</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Outliner Table View */
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs font-sans text-stone-700 dark:text-stone-300">
            <thead className="bg-stone-100 dark:bg-stone-800 text-stone-500 uppercase text-[10px] tracking-wider border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-3 font-bold">Document Title</th>
                <th className="p-3 font-bold">Type</th>
                <th className="p-3 font-bold">Word Count</th>
                <th className="p-3 font-bold">Preview / Synopsis</th>
                <th className="p-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {nodes.map(node => (
                <tr
                  key={node.id}
                  onClick={() => onSelectNode(node)}
                  className="hover:bg-amber-50/50 dark:hover:bg-stone-800/50 cursor-pointer transition-colors"
                >
                  <td className="p-3 font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    {node.type === 'folder' ? <Folder size={14} className="text-amber-600" /> : <FileText size={14} className="text-stone-600" />}
                    {node.title}
                  </td>
                  <td className="p-3 capitalize text-stone-500">{node.type}</td>
                  <td className="p-3 font-mono">{getWordCount(node.content)} words</td>
                  <td className="p-3 text-stone-500 dark:text-stone-400 max-w-xs truncate">
                    {htmlToPlainText(node.content || '').slice(0, 80) || 'No content'}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectNode(node);
                      }}
                      className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 rounded font-medium hover:bg-amber-200 transition-colors"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
