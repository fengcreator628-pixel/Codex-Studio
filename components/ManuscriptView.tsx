import React, { useState } from 'react';
import { Project, FileSystemNode, Revision, SceneMetadata, SceneStatus } from '../types';
import { countWords } from '../utils/wordCount';
import {
  FileText, Folder, ArrowUp, ArrowDown, Plus, Eye, PenTool, Check, X,
  Download, BookOpen, Layers, CheckCircle2, ChevronRight, ChevronDown,
  Sparkles, Trash2, Edit3, Target, Clock, MapPin, User, Tag, PanelRight, Search
} from 'lucide-react';
import { saveRevision, deleteRevision } from '../services/storage';

interface ManuscriptViewProps {
  project: Project;
  revisions: Revision[];
  onUpdateProject: (updated: Project) => void;
  onUpdateRevisions: () => void;
  onOpenTargetModal: () => void;
  indentEnabled?: boolean;
}

// Word-level LCS Diff helper function to highlight text changes
export function computeWordDiff(original: string, revised: string): string {
  const getPlainText = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const origText = getPlainText(original || '');
  const revText = getPlainText(revised || '');

  // Split by words/whitespace/characters to do a high fidelity diff
  const origWords = origText.split(/(\s+)/);
  const revWords = revText.split(/(\s+)/);

  const dp: number[][] = Array(origWords.length + 1)
    .fill(null)
    .map(() => Array(revWords.length + 1).fill(0));

  for (let i = 1; i <= origWords.length; i++) {
    for (let j = 1; j <= revWords.length; j++) {
      if (origWords[i - 1] === revWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = origWords.length;
  let j = revWords.length;
  const result: string[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1] === revWords[j - 1]) {
      result.unshift(origWords[i - 1]);
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      const word = revWords[j - 1];
      if (word.trim() === '') {
        result.unshift(word);
      } else {
        result.unshift(`<ins class="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 no-underline px-1 py-0.5 rounded mx-0.5 font-bold border-b border-emerald-500">${word}</ins>`);
      }
      j--;
    } else {
      const word = origWords[i - 1];
      if (word.trim() === '') {
        result.unshift(word);
      } else {
        result.unshift(`<del class="bg-rose-100 dark:bg-rose-950/70 text-rose-500 dark:text-rose-400 line-through px-1 py-0.5 rounded mx-0.5">${word}</del>`);
      }
      i--;
    }
  }

  return result.join('').replace(/\n/g, '<br/>');
}

const STATUS_CONFIG: Record<SceneStatus, { label: string; color: string }> = {
  idea: { label: '靈感構想', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  draft: { label: '草稿初稿', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  revised: { label: '潤飾修訂', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
  final: { label: '完稿審定', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
};

export const ManuscriptView: React.FC<ManuscriptViewProps> = ({
  project,
  revisions,
  onUpdateProject,
  onUpdateRevisions,
  onOpenTargetModal,
  indentEnabled = false,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMetaPanel, setShowMetaPanel] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ id: string; position: 'before' | 'after' } | null>(null);

  // States for collapsed outline index and center layout mode
  const [isOutlineCollapsed, setIsOutlineCollapsed] = useState(true);
  const [centerViewMode, setCenterViewMode] = useState<'cards' | 'single'>('cards');

  // New local states for editing and revision proposals
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editDraftContent, setEditDraftContent] = useState('');

  const nodes = project.nodes || [];
  const documentNodes = nodes.filter(n => n.type === 'document').sort((a, b) => a.order - b.order);

  // Drag and Drop handlers for chapters
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('nodeId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const position = y < rect.height / 2 ? 'before' : 'after';
    setDragOverInfo({ id: targetId, position });
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = e.dataTransfer.getData('nodeId') || draggedId;
    if (!sourceId || sourceId === targetId || !dragOverInfo) {
      setDraggedId(null);
      setDragOverInfo(null);
      return;
    }

    const docList = [...documentNodes];
    const sourceIdx = docList.findIndex(n => n.id === sourceId);

    if (sourceIdx !== -1) {
      const [moved] = docList.splice(sourceIdx, 1);
      const targetIdx = docList.findIndex(n => n.id === targetId);
      const insertIdx = dragOverInfo.position === 'before' ? targetIdx : targetIdx + 1;
      docList.splice(insertIdx, 0, moved);

      // Reassign order for documents
      const newOrders = docList.map((doc, idx) => ({ id: doc.id, order: idx }));
      const updatedNodes = nodes.map(n => {
        const match = newOrders.find(o => o.id === n.id);
        return match ? { ...n, order: match.order } : n;
      });
      onUpdateProject({ ...project, nodes: updatedNodes });
    }

    setDraggedId(null);
    setDragOverInfo(null);
  };

  // Word & Reading Time helpers
  const getWordCount = (html: string) => {
    return countWords(html);
  };

  const getReadingTime = (words: number) => {
    return Math.max(1, Math.round(words / 300)); // ~300 chars per min reading speed
  };

  const totalWords = documentNodes.reduce((acc, n) => acc + getWordCount(n.content), 0);
  const totalReadingMinutes = getReadingTime(totalWords);
  const targetCount = project.targetWordCount || 50000;
  const progressPercent = Math.min(100, Math.round((totalWords / targetCount) * 100));

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || documentNodes[0] || null;

  // Ordering Handlers
  const handleMoveNode = (nodeId: string, direction: 'up' | 'down') => {
    const list = [...nodes];
    const index = list.findIndex(n => n.id === nodeId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const reordered = list.map((item, idx) => ({ ...item, order: idx }));
    onUpdateProject({ ...project, nodes: reordered });
  };

  const handleUpdateNodeTitle = (nodeId: string, newTitle: string) => {
    const updatedNodes = nodes.map(n =>
      n.id === nodeId ? { ...n, title: newTitle } : n
    );
    onUpdateProject({ ...project, nodes: updatedNodes });
  };

  const handleUpdateNodeMetadata = (nodeId: string, meta: Partial<SceneMetadata>) => {
    const updatedNodes = nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          metadata: {
            ...n.metadata,
            ...meta,
          },
        };
      }
      return n;
    });
    onUpdateProject({ ...project, nodes: updatedNodes });
  };

  const handleSaveProposal = (nodeId: string) => {
    const docNode = nodes.find(n => n.id === nodeId);
    if (!docNode) return;

    // Verify if there is any actual change
    const originalText = docNode.content || '';
    if (originalText === editDraftContent) {
      setEditingNodeId(null);
      return;
    }

    const revision: Revision = {
      id: crypto.randomUUID(),
      documentId: nodeId, // Associate with this chapter node
      type: 'replace',
      startIndex: 0,
      endIndex: originalText.length,
      originalText: originalText,
      revisedText: editDraftContent,
      author: '手稿組裝器修訂',
      timestamp: Date.now(),
      status: 'pending',
    };

    saveRevision(revision);
    setEditingNodeId(null);
    onUpdateRevisions();
  };

  const handleAcceptProposal = (rev: Revision) => {
    const updatedNodes = nodes.map(n =>
      n.id === rev.documentId ? { ...n, content: rev.revisedText } : n
    );
    onUpdateProject({ ...project, nodes: updatedNodes });
    saveRevision({ ...rev, status: 'accepted' });
    onUpdateRevisions();
  };

  const handleRejectProposal = (rev: Revision) => {
    saveRevision({ ...rev, status: 'rejected' });
    onUpdateRevisions();
  };

  const handleAddChapter = () => {
    const newDoc: FileSystemNode = {
      id: crypto.randomUUID(),
      type: 'document',
      title: `第 ${documentNodes.length + 1} 章`,
      content: '<p>在此處撰寫本章節故事內文...</p>',
      parentId: null,
      order: nodes.length,
      isOpen: false,
      metadata: {
        pov: '',
        location: '',
        time: '',
        status: 'draft',
        notes: '',
      },
    };
    onUpdateProject({ ...project, nodes: [...nodes, newDoc] });
    setSelectedNodeId(newDoc.id);
  };

  const handleDeleteNode = (nodeId: string) => {
    const filtered = nodes.filter(n => n.id !== nodeId);
    onUpdateProject({ ...project, nodes: filtered });
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  // Export full manuscript
  const handleExportFullManuscript = () => {
    let fullText = `# ${project.title}\n\n`;
    if (project.coreTheme) fullText += `核心主題：${project.coreTheme}\n\n`;
    if (project.synopsis) fullText += `大綱摘要：\n${project.synopsis}\n\n---\n\n`;

    documentNodes.forEach((doc, idx) => {
      fullText += `## ${doc.title}\n`;
      if (doc.metadata?.pov) fullText += `【POV 視角】：${doc.metadata.pov}  `;
      if (doc.metadata?.time || doc.metadata?.location) {
        fullText += `【時空環境】：${doc.metadata.time || ''} ${doc.metadata.location || ''}\n`;
      }
      fullText += `\n`;
      const tmp = document.createElement('DIV');
      tmp.innerHTML = doc.content;
      fullText += `${tmp.textContent || tmp.innerText || ''}\n\n* * *\n\n`;
    });

    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title || 'Novel_Manuscript'}.md`;
    link.click();
  };

  const filteredNodes = documentNodes.filter(n =>
    !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50/50 dark:bg-stone-950/50 overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-6 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-md">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
              <span>{project.title || '無標題小說專案'}</span>
              <span className="text-xs font-normal text-stone-400">（手稿大綱與章節組裝器）</span>
            </h2>
            <div className="flex items-center space-x-3 text-xs text-stone-500 font-mono mt-0.5">
              <span>總字數：{totalWords.toLocaleString()} 字</span>
              <span>•</span>
              <span>預估閱讀：約 {totalReadingMinutes} 分鐘</span>
              <span>•</span>
              <span>章節場景：{documentNodes.length} 章</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Collapse/Expand Outline Index Toggle */}
          <button
            onClick={() => setIsOutlineCollapsed(!isOutlineCollapsed)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center space-x-1.5 ${
              !isOutlineCollapsed
                ? 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 shadow-xs'
                : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100'
            }`}
            title="展開或收起左側章節目錄大綱"
          >
            <Layers size={14} className="text-amber-600" />
            <span>{isOutlineCollapsed ? '展開大綱目錄' : '收起大綱目錄'}</span>
          </button>

          <button
            onClick={onOpenTargetModal}
            className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <Target size={14} className="text-amber-600" />
            <span>目標：{progressPercent}% ({totalWords}/{targetCount})</span>
          </button>

          <button
            onClick={() => setShowMetaPanel(!showMetaPanel)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center space-x-1.5 ${
              showMetaPanel
                ? 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 shadow-xs'
                : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100'
            }`}
            title="開關場景元資料詳細設定面板"
          >
            <PanelRight size={15} />
            <span>{showMetaPanel ? '收起元資料' : '場景元資料'}</span>
          </button>

          <button
            onClick={handleAddChapter}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1"
          >
            <Plus size={14} />
            <span>新增章節/場景</span>
          </button>

          <button
            onClick={handleExportFullManuscript}
            className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1"
          >
            <Download size={14} />
            <span>導出全文</span>
          </button>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Chapters Navigation Outline Tree */}
        {!isOutlineCollapsed && (
          <div className="w-80 border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 flex flex-col space-y-3 overflow-hidden animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center space-x-1">
                <Layers size={13} />
              <span>章節目錄大綱</span>
            </span>
          </div>

          {/* Quick Filter */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="搜尋章節標題..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Chapters List */}
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {filteredNodes.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
                無相關章節，可點擊右上角新增章節。
              </div>
            ) : (
              filteredNodes.map((doc, idx) => {
                const isSelected = selectedNode?.id === doc.id;
                const words = getWordCount(doc.content);
                const status = doc.metadata?.status || 'draft';
                const statusMeta = STATUS_CONFIG[status];
                const isDragOver = dragOverInfo?.id === doc.id;

                return (
                  <div
                    key={doc.id}
                    draggable
                    onDragStart={e => handleDragStart(e, doc.id)}
                    onDragOver={e => handleDragOver(e, doc.id)}
                    onDrop={e => handleDrop(e, doc.id)}
                    onClick={() => setSelectedNodeId(doc.id)}
                    className={`p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing space-y-2 relative ${
                      isDragOver
                        ? dragOverInfo.position === 'before'
                          ? 'border-t-4 border-t-amber-500 bg-amber-50/50 dark:bg-amber-950/30'
                          : 'border-b-4 border-b-amber-500 bg-amber-50/50 dark:bg-amber-950/30'
                        : isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 dark:bg-amber-950/40 dark:border-amber-700 shadow-xs'
                        : 'bg-stone-50/80 dark:bg-stone-950/60 border-stone-200/80 dark:border-stone-800/80 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <FileText size={14} className="text-amber-600 shrink-0" />
                        <span className="font-bold text-xs text-stone-800 dark:text-stone-100 truncate">
                          {doc.title}
                        </span>
                      </div>

                      {/* Order and action buttons */}
                      <div className="flex items-center space-x-1 shrink-0 opacity-80 hover:opacity-100" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleMoveNode(doc.id, 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded disabled:opacity-20 text-stone-500"
                          title="向上移"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={() => handleMoveNode(doc.id, 'down')}
                          disabled={idx === filteredNodes.length - 1}
                          className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded disabled:opacity-20 text-stone-500"
                          title="向下移"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`確定要刪除「${doc.title}」章節嗎？此操作無法復原。`)) {
                              handleDeleteNode(doc.id);
                            }
                          }}
                          className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-400 hover:text-red-600 ml-1"
                          title="刪除章節"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                      <span className="text-stone-400 font-mono">{words.toLocaleString()} 字</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        )}

        {/* Center Reader & Content View */}
        <div className="flex-1 bg-stone-100/50 dark:bg-stone-950 p-6 flex flex-col overflow-y-auto custom-scrollbar">
          {/* Workspace view mode switcher */}
          <div className="max-w-5xl w-full mx-auto mb-6 flex items-center justify-between bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCenterViewMode('cards')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  centerViewMode === 'cards'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Layers size={14} />
                <span>所有章節卡片（看板組裝器）</span>
              </button>
              <button
                onClick={() => {
                  if (selectedNode) {
                    setCenterViewMode('single');
                  } else if (documentNodes.length > 0) {
                    setSelectedNodeId(documentNodes[0].id);
                    setCenterViewMode('single');
                  }
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  centerViewMode === 'single'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <FileText size={14} />
                <span>單章詳細檢視</span>
              </button>
            </div>
            
            <div className="hidden sm:block text-[11px] text-stone-400 dark:text-stone-500 font-mono">
              💡 雙按兩下卡片即可快速切換至單章詳細檢視
            </div>
          </div>

          {centerViewMode === 'cards' ? (
            <div className="max-w-3xl w-full mx-auto pb-10 space-y-8">
              {documentNodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs text-center">
                  <BookOpen size={48} className="text-stone-300 dark:text-stone-700 mb-4 animate-pulse" />
                  <h3 className="text-lg font-serif font-bold text-stone-700 dark:text-stone-300 mb-2">尚無章節手稿</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mb-6 leading-relaxed">
                    在您的專案中還沒有任何章節手稿。您可以點擊右上角的「新增章節/場景」來建立。
                  </p>
                  <button
                    onClick={handleAddChapter}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1"
                  >
                    <Plus size={14} />
                    <span>立即新增第一章</span>
                  </button>
                </div>
              ) : (
                documentNodes.map((doc, idx) => {
                  const words = getWordCount(doc.content);
                  const status = doc.metadata?.status || 'draft';
                  const statusMeta = STATUS_CONFIG[status];
                  const isDragOver = dragOverInfo?.id === doc.id;

                  return (
                    <div
                      key={doc.id}
                      draggable
                      onDragStart={e => handleDragStart(e, doc.id)}
                      onDragOver={e => handleDragOver(e, doc.id)}
                      onDrop={e => handleDrop(e, doc.id)}
                      className={`relative bg-white dark:bg-stone-900 border rounded-2xl p-8 sm:p-12 shadow-lg hover:shadow-xl transition-all flex flex-col space-y-6 ${
                        isDragOver
                          ? dragOverInfo.position === 'before'
                            ? 'border-t-4 border-t-amber-500 bg-amber-50/20 dark:bg-amber-950/20'
                            : 'border-b-4 border-b-amber-500 bg-amber-50/20 dark:bg-amber-950/20'
                          : 'border-stone-200 dark:border-stone-800'
                      }`}
                    >
                      {/* Top Control Bar for Assembler Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800/80 pb-4">
                        <div className="flex items-center space-x-2.5">
                          <span className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-400" title="拖曳卡片以重組章節順序">
                            <Layers size={14} className="text-amber-600" />
                          </span>
                          <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 rounded-full">
                            第 {idx + 1} 章
                          </span>
                          <span className="text-xs text-stone-400 font-mono">{words.toLocaleString()} 字</span>
                        </div>

                        {/* Order adjustment / editing buttons */}
                        <div className="flex items-center space-x-1.5">
                          {/* Quick status selector */}
                          <select
                            value={status}
                            onChange={e => handleUpdateNodeMetadata(doc.id, { status: e.target.value as any })}
                            className="text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-stone-600 dark:text-stone-300 focus:outline-none focus:border-amber-500"
                          >
                            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                              <option key={key} value={key}>{val.label}</option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleMoveNode(doc.id, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded disabled:opacity-20 text-stone-500"
                            title="向上移動章節"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => handleMoveNode(doc.id, 'down')}
                            disabled={idx === documentNodes.length - 1}
                            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded disabled:opacity-20 text-stone-500"
                            title="向下移動章節"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedNodeId(doc.id);
                              setCenterViewMode('single');
                            }}
                            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500"
                            title="進入單章聚焦檢視"
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (editingNodeId === doc.id) {
                                setEditingNodeId(null);
                              } else {
                                setEditingNodeId(doc.id);
                                setEditDraftContent(doc.content || '');
                              }
                            }}
                            className={`p-1.5 rounded transition-all ${
                              editingNodeId === doc.id
                                ? 'bg-amber-600 text-white'
                                : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-amber-600'
                            }`}
                            title="編輯此章並產生修訂提案"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`確定要刪除「${doc.title}」章節嗎？此操作無法復原。`)) {
                                handleDeleteNode(doc.id);
                              }
                            }}
                            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-400 hover:text-red-600"
                            title="刪除此章節"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Header (Title and Metadata) */}
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={doc.title}
                          onChange={e => handleUpdateNodeTitle(doc.id, e.target.value)}
                          className="w-full text-2xl font-serif font-extrabold text-stone-900 dark:text-stone-100 bg-transparent border-b border-transparent hover:border-stone-300 dark:hover:border-stone-700 focus:border-amber-500 focus:outline-none transition-colors"
                          placeholder="章節名稱..."
                        />

                        {/* Metadata chips */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {doc.metadata?.pov && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800">
                              <User size={12} />
                              <span>POV：{doc.metadata.pov}</span>
                            </span>
                          )}

                          {(doc.metadata?.time || doc.metadata?.location) && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
                              <MapPin size={12} />
                              <span>{doc.metadata.time} • {doc.metadata.location}</span>
                            </span>
                          )}

                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg font-mono">
                            <Clock size={12} />
                            <span>約 {getReadingTime(words)} 分鐘閱讀</span>
                          </span>
                        </div>
                      </div>

                      {/* Content Area (Reader or Editor with Diff) */}
                      {editingNodeId === doc.id ? (
                        <div className="space-y-4 border-t border-dashed border-stone-200 dark:border-stone-800 pt-6">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center space-x-1">
                              <PenTool size={12} className="text-amber-500" />
                              <span>草擬修訂提案</span>
                            </span>
                            <span className="text-xs text-stone-400 dark:text-stone-500 font-serif">
                              儲存後將產生一個「修訂提案」，需要手動採納才會正式套用
                            </span>
                          </div>
                          <textarea
                            value={editDraftContent}
                            onChange={e => setEditDraftContent(e.target.value)}
                            className="w-full min-h-[250px] p-4 font-serif text-sm bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed text-stone-800 dark:text-stone-200"
                            placeholder="在此處草擬您的修改內容..."
                          />
                          {/* Live Diff Preview */}
                          <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 bg-stone-50/50 dark:bg-stone-950/30 space-y-2">
                            <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center space-x-1">
                              <Sparkles size={12} className="text-amber-500 animate-pulse" />
                              <span>即時修訂差異預覽 (Live Diff)</span>
                            </span>
                            <div 
                              className={`prose prose-sm dark:prose-invert max-w-none text-stone-800 dark:text-stone-200 font-serif leading-relaxed text-xs bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-3 rounded-lg shadow-xs ${indentEnabled ? 'indent-novel' : ''}`}
                              dangerouslySetInnerHTML={{ __html: computeWordDiff(doc.content, editDraftContent) || '<p class="italic text-stone-400">尚未修改內容...</p>' }}
                            />
                          </div>
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setEditingNodeId(null)}
                              className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-bold transition-all"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => handleSaveProposal(doc.id)}
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1"
                            >
                              <CheckCircle2 size={12} />
                              <span>產生修訂提案</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Full Content Prose Reader */}
                          <div
                            className={`prose dark:prose-invert max-w-none text-stone-800 dark:text-stone-200 font-serif leading-relaxed text-base min-h-[100px] border-t border-dashed border-stone-100 dark:border-stone-800/60 pt-4 ${indentEnabled ? 'indent-novel' : ''}`}
                            dangerouslySetInnerHTML={{ __html: doc.content || '<p class="italic text-stone-300 dark:text-stone-700">（本章節尚無內容，請回文字編輯器撰寫）</p>' }}
                          />

                          {/* Chapter Specific Revisions List */}
                          {revisions.filter(r => r.documentId === doc.id && r.status === 'pending').length > 0 && (
                            <div className="border-t border-dashed border-stone-200 dark:border-stone-800 pt-4 space-y-3">
                              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                                <Sparkles size={12} />
                                <span>待審閱的修訂提案 ({revisions.filter(r => r.documentId === doc.id && r.status === 'pending').length})</span>
                              </span>
                              <div className="space-y-3">
                                {revisions.filter(r => r.documentId === doc.id && r.status === 'pending').map(rev => (
                                  <div key={rev.id} className="border border-stone-150 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                                      <span>修訂者：{rev.author} • {new Date(rev.timestamp).toLocaleString()}</span>
                                      <div className="flex space-x-1">
                                        <button
                                          onClick={() => handleRejectProposal(rev)}
                                          className="flex items-center space-x-1 px-2.5 py-1 text-[11px] bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 rounded-lg transition-all"
                                        >
                                          <X size={10} />
                                          <span>退回提案</span>
                                        </button>
                                        <button
                                          onClick={() => handleAcceptProposal(rev)}
                                          className="flex items-center space-x-1 px-2.5 py-1 text-[11px] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-lg transition-all"
                                        >
                                          <Check size={10} />
                                          <span>採納並套用</span>
                                        </button>
                                      </div>
                                    </div>
                                    <div 
                                      className={`prose prose-sm dark:prose-invert max-w-none text-stone-800 dark:text-stone-200 font-serif leading-relaxed text-xs bg-white dark:bg-stone-900/60 p-3 rounded-lg border border-stone-150 dark:border-stone-800/80 ${indentEnabled ? 'indent-novel' : ''}`}
                                      dangerouslySetInnerHTML={{ __html: computeWordDiff(rev.originalText, rev.revisedText) }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      <div className="pt-4 text-center text-stone-300 dark:text-stone-700 font-serif text-xs tracking-widest border-t border-stone-100 dark:border-stone-800/80">
                        * * *
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="max-w-3xl w-full mx-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl p-8 sm:p-12 space-y-6 pb-12">
              {/* Node Title Header */}
              <div className="border-b border-stone-200 dark:border-stone-800 pb-6 flex items-start justify-between">
                <div className="space-y-3 flex-1 mr-4">
                  <input
                    type="text"
                    value={selectedNode?.title || ''}
                    onChange={e => selectedNode && handleUpdateNodeTitle(selectedNode.id, e.target.value)}
                    className="w-full text-2xl sm:text-3xl font-serif font-extrabold text-stone-900 dark:text-stone-100 bg-transparent border-b border-transparent hover:border-stone-300 dark:hover:border-stone-700 focus:border-amber-500 focus:outline-none transition-colors"
                    placeholder="章節名稱..."
                  />

                  {/* Metadata Chips Bar */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {selectedNode?.metadata?.pov && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800">
                        <User size={12} />
                        <span>POV：{selectedNode.metadata.pov}</span>
                      </span>
                    )}

                    {(selectedNode?.metadata?.time || selectedNode?.metadata?.location) && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <MapPin size={12} />
                        <span>{selectedNode.metadata.time} • {selectedNode.metadata.location}</span>
                      </span>
                    )}

                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg font-mono">
                      <Clock size={12} />
                      <span>約 {getReadingTime(getWordCount(selectedNode?.content || ''))} 分鐘閱讀</span>
                    </span>
                  </div>
                </div>

                {selectedNode && (
                  <button
                    onClick={() => {
                      if (editingNodeId === selectedNode.id) {
                        setEditingNodeId(null);
                      } else {
                        setEditingNodeId(selectedNode.id);
                        setEditDraftContent(selectedNode.content || '');
                      }
                    }}
                    className={`px-3 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1 text-xs font-bold ${
                      editingNodeId === selectedNode.id
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700'
                    }`}
                    title="編輯此章並產生修訂提案"
                  >
                    <Edit3 size={13} />
                    <span>{editingNodeId === selectedNode.id ? '取消' : '編輯提案'}</span>
                  </button>
                )}
              </div>

              {/* Content Area (Reader or Editor with Diff) */}
              {editingNodeId === selectedNode?.id ? (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center space-x-1">
                      <PenTool size={12} className="text-amber-500" />
                      <span>草擬修訂提案</span>
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-500 font-serif">
                      儲存後將產生一個「修訂提案」，需要手動採納才會正式套用
                    </span>
                  </div>
                  <textarea
                    value={editDraftContent}
                    onChange={e => setEditDraftContent(e.target.value)}
                    className="w-full min-h-[350px] p-6 font-serif text-base bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed text-stone-800 dark:text-stone-200"
                    placeholder="在此處草擬您的修改內容..."
                  />
                  {/* Live Diff Preview */}
                  <div className="border border-stone-200 dark:border-stone-800 rounded-2xl p-6 bg-stone-50/50 dark:bg-stone-950/30 space-y-3">
                    <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center space-x-1">
                      <Sparkles size={12} className="text-amber-500 animate-pulse" />
                      <span>即時修訂差異預覽 (Live Diff)</span>
                    </span>
                    <div 
                      className={`prose dark:prose-invert max-w-none text-stone-800 dark:text-stone-200 font-serif leading-relaxed text-base bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-5 rounded-xl shadow-xs ${indentEnabled ? 'indent-novel' : ''}`}
                      dangerouslySetInnerHTML={{ __html: computeWordDiff(selectedNode.content, editDraftContent) || '<p class="italic text-stone-400">尚未修改內容...</p>' }}
                    />
                  </div>
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setEditingNodeId(null)}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-bold transition-all"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleSaveProposal(selectedNode.id)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1"
                    >
                      <CheckCircle2 size={12} />
                      <span>產生修訂提案</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Reader HTML Content */}
                  <div
                    className={`prose dark:prose-invert max-w-none text-stone-800 dark:text-stone-200 font-serif leading-relaxed text-base min-h-[300px] ${indentEnabled ? 'indent-novel' : ''}`}
                    dangerouslySetInnerHTML={{ __html: selectedNode?.content || '<p className="italic text-stone-400">（本章節尚無內容，請回文字編輯器撰寫）</p>' }}
                  />

                  {/* Chapter Specific Revisions List */}
                  {selectedNode && revisions.filter(r => r.documentId === selectedNode.id && r.status === 'pending').length > 0 && (
                    <div className="border-t border-stone-200 dark:border-stone-800 pt-6 space-y-4">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                        <Sparkles size={12} />
                        <span>本章待審閱的修訂提案 ({revisions.filter(r => r.documentId === selectedNode.id && r.status === 'pending').length})</span>
                      </span>
                      <div className="space-y-4">
                        {revisions.filter(r => r.documentId === selectedNode.id && r.status === 'pending').map(rev => (
                          <div key={rev.id} className="border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                              <span>修訂者：{rev.author} • {new Date(rev.timestamp).toLocaleString()}</span>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleRejectProposal(rev)}
                                  className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 rounded-lg transition-all"
                                >
                                  <X size={12} />
                                  <span>退回提案</span>
                                </button>
                                <button
                                  onClick={() => handleAcceptProposal(rev)}
                                  className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-lg transition-all"
                                >
                                  <Check size={12} />
                                  <span>採納並套用修訂</span>
                                </button>
                              </div>
                            </div>
                            <div 
                              className={`prose dark:prose-invert max-w-none text-stone-800 dark:text-stone-200 font-serif leading-relaxed text-sm bg-white dark:bg-stone-900/60 p-4 rounded-xl border border-stone-150 dark:border-stone-800/80 shadow-inner ${indentEnabled ? 'indent-novel' : ''}`}
                              dangerouslySetInnerHTML={{ __html: computeWordDiff(rev.originalText, rev.revisedText) }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="pt-6 border-t border-stone-100 dark:border-stone-800 text-center text-stone-400 font-serif text-sm tracking-widest">
                * * *
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Scene Metadata Inspector */}
        {showMetaPanel && selectedNode && (
          <div className="w-80 border-l border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 flex flex-col space-y-5 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center space-x-1">
                <Edit3 size={14} className="text-amber-600" />
                <span>場景元資料詳細設定</span>
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="p-1 text-stone-400 hover:text-red-600 rounded"
                  title="刪除本章"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  onClick={() => setShowMetaPanel(false)}
                  className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded"
                  title="收起詳細設定面板"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Status Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                場景寫作狀態
              </label>
              <select
                value={selectedNode.metadata?.status || 'draft'}
                onChange={e => handleUpdateNodeMetadata(selectedNode.id, { status: e.target.value as SceneStatus })}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none"
              >
                <option value="idea">靈感構想 (Idea)</option>
                <option value="draft">草稿初稿 (Draft)</option>
                <option value="revised">潤飾修訂 (Revised)</option>
                <option value="final">完稿審定 (Final)</option>
              </select>
            </div>

            {/* POV Character */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                視角人物 (POV)
              </label>
              <input
                type="text"
                placeholder="例如：林星河（第一人稱 / 第三人稱視角）"
                value={selectedNode.metadata?.pov || ''}
                onChange={e => handleUpdateNodeMetadata(selectedNode.id, { pov: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Time & Location */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  故事時間軸設定
                </label>
                <input
                  type="text"
                  placeholder="例如：王曆 402 年初冬・深夜"
                  value={selectedNode.metadata?.time || ''}
                  onChange={e => handleUpdateNodeMetadata(selectedNode.id, { time: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  場景地點環境
                </label>
                <input
                  type="text"
                  placeholder="例如：地下遺跡核心・觀星台"
                  value={selectedNode.metadata?.location || ''}
                  onChange={e => handleUpdateNodeMetadata(selectedNode.id, { location: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Scene Notes */}
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                場景備註與伏筆規劃
              </label>
              <textarea
                placeholder="記錄此章節需揭露的關鍵訊息、情感轉折點或伏筆..."
                value={selectedNode.metadata?.notes || ''}
                onChange={e => handleUpdateNodeMetadata(selectedNode.id, { notes: e.target.value })}
                className="w-full flex-1 min-h-[140px] p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-serif"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
