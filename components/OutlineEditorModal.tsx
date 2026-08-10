import React, { useState } from 'react';
import { Project, FileSystemNode, SceneStatus } from '../types';
import { 
  FileText, Plus, Trash2, Edit2, Save, X, ChevronUp, ChevronDown, 
  Target, User, MapPin, Layers, Sparkles, Move, Flag
} from 'lucide-react';
import { createNode, deleteNode } from '../services/fileSystem';

interface OutlineEditorModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject: (updatedProject: Project) => void;
  onSelectNode: (node: FileSystemNode) => void;
}

const STATUS_MAP: Record<SceneStatus, { label: string; color: string }> = {
  idea: { label: '靈感構想', color: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300' },
  draft: { label: '草稿寫作', color: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' },
  revised: { label: '潤飾修訂', color: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200' },
  final: { label: '完稿審定', color: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' },
};

export const OutlineEditorModal: React.FC<OutlineEditorModalProps> = ({
  project,
  isOpen,
  onClose,
  onUpdateProject,
  onSelectNode,
}) => {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter document & note nodes (manuscript nodes)
  const manuscriptNodes = (project.nodes || [])
    .filter(n => n.type === 'document' || n.type === 'folder')
    .sort((a, b) => a.order - b.order);

  const selectedNode = manuscriptNodes.find(n => n.id === activeNodeId) || manuscriptNodes[0];

  const handleAddChapter = () => {
    const { project: updated, newNode } = createNode(
      project, 
      'document', 
      `第 ${manuscriptNodes.length + 1} 章：新大綱`, 
      null
    );
    onUpdateProject(updated);
    setActiveNodeId(newNode.id);
  };

  const handleUpdateNode = (id: string, updates: Partial<FileSystemNode>) => {
    const updatedNodes = project.nodes.map(n => n.id === id ? { ...n, ...updates } : n);
    onUpdateProject({ ...project, nodes: updatedNodes });
  };

  const handleUpdateMetadata = (id: string, metaUpdates: Partial<NonNullable<FileSystemNode['metadata']>>) => {
    const updatedNodes = project.nodes.map(n => {
      if (n.id === id) {
        return {
          ...n,
          metadata: { ...(n.metadata || {}), ...metaUpdates }
        };
      }
      return n;
    });
    onUpdateProject({ ...project, nodes: updatedNodes });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('確定要從手稿大綱中刪除此章節嗎？')) {
      const updated = deleteNode(project, id);
      onUpdateProject(updated);
      if (activeNodeId === id) {
        setActiveNodeId(null);
      }
    }
  };

  const handleMoveNode = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= manuscriptNodes.length) return;

    const nextList = [...manuscriptNodes];
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;

    const newOrders = nextList.map((node, idx) => ({ id: node.id, order: idx }));
    const updatedNodes = project.nodes.map(n => {
      const match = newOrders.find(o => o.id === n.id);
      return match ? { ...n, order: match.order } : n;
    });

    onUpdateProject({ ...project, nodes: updatedNodes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-6xl w-full shadow-2xl overflow-hidden flex flex-col h-[88vh]">
        {/* Top Header */}
        <div className="p-5 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-md">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                <span>故事大綱與情節結構編輯器 (Story Outline)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono">
                  {manuscriptNodes.length} 章節
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                對每一章進行目標、衝突阻礙、結果與起承轉合佈局，讓全書脈絡清晰、節奏流暢
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Outline Chapter Cards */}
          <div className="w-full md:w-80 border-r border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 p-4 flex flex-col overflow-hidden space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                大綱章節目錄
              </span>
              <button
                onClick={handleAddChapter}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
              >
                <Plus size={13} />
                <span>新增章節大綱</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
              {manuscriptNodes.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
                  無章節大綱，點擊右上角「新增章節大綱」。
                </div>
              ) : (
                manuscriptNodes.map((node, idx) => {
                  const isSelected = selectedNode?.id === node.id;
                  const status = node.metadata?.status || 'draft';
                  const statusMeta = STATUS_MAP[status];

                  return (
                    <div
                      key={node.id}
                      onClick={() => setActiveNodeId(node.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/80 dark:bg-amber-950/40 dark:border-amber-700 shadow-sm'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 truncate">
                          <span className="font-mono text-xs text-amber-600 font-bold">#{idx + 1}</span>
                          <span className="font-bold text-xs text-stone-800 dark:text-stone-100 truncate">
                            {node.title}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleMoveNode(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded disabled:opacity-20 text-stone-400"
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            onClick={() => handleMoveNode(idx, 'down')}
                            disabled={idx === manuscriptNodes.length - 1}
                            className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded disabled:opacity-20 text-stone-400"
                          >
                            <ChevronDown size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(node.id)}
                            className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-400 hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {node.metadata?.notes && (
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 italic font-serif">
                          {node.metadata.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px]">
                        <span className={`px-2 py-0.5 rounded font-medium ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                        {node.metadata?.pov && (
                          <span className="text-stone-400 font-serif">POV: {node.metadata.pov}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Detailed Outline Inspector */}
          <div className="flex-1 bg-white dark:bg-stone-900 p-6 flex flex-col overflow-y-auto custom-scrollbar">
            {selectedNode ? (
              <div className="space-y-5">
                <div className="pb-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <input
                      type="text"
                      value={selectedNode.title}
                      onChange={e => handleUpdateNode(selectedNode.id, { title: e.target.value })}
                      placeholder="章節目錄標題..."
                      className="w-full text-2xl font-serif font-extrabold text-stone-900 dark:text-stone-100 bg-transparent border-b border-transparent hover:border-stone-300 dark:hover:border-stone-700 focus:border-amber-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    onClick={() => {
                      onSelectNode(selectedNode);
                      onClose();
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 shrink-0"
                  >
                    <FileText size={14} />
                    <span>前往寫作本章</span>
                  </button>
                </div>

                {/* Chapter Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      寫作進度狀態
                    </label>
                    <select
                      value={selectedNode.metadata?.status || 'draft'}
                      onChange={e => handleUpdateMetadata(selectedNode.id, { status: e.target.value as SceneStatus })}
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none"
                    >
                      <option value="idea">靈感構想</option>
                      <option value="draft">草稿初稿</option>
                      <option value="revised">潤飾修訂</option>
                      <option value="final">完稿審定</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      視角人物 (POV)
                    </label>
                    <input
                      type="text"
                      placeholder="如：林星河"
                      value={selectedNode.metadata?.pov || ''}
                      onChange={e => handleUpdateMetadata(selectedNode.id, { pov: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      目標字數 (字)
                    </label>
                    <input
                      type="number"
                      placeholder="如：3000"
                      value={selectedNode.metadata?.targetWordCount || ''}
                      onChange={e => handleUpdateMetadata(selectedNode.id, { targetWordCount: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Outline Beat Breakdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    章節大綱、核心起承轉合與主要衝突
                  </label>
                  <textarea
                    rows={8}
                    value={selectedNode.metadata?.notes || ''}
                    onChange={e => handleUpdateMetadata(selectedNode.id, { notes: e.target.value })}
                    placeholder="【主要目標】主角在本章希望達成什麼目的？&#10;【阻礙衝突】遭遇了什麼預料之外的阻礙或反派行動？&#10;【結果轉折】最終成功、失敗還是帶來新的問題？&#10;【伏筆預告】本章埋下了什麼後續轉折伏筆？"
                    className="w-full p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-serif leading-relaxed resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-stone-400">
                請由左側選擇章節大綱進行編輯。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
