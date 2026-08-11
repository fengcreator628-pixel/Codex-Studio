import React, { useState } from 'react';
import { Project, FileSystemNode, NodeType } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { buildTree, createNode, deleteNode, moveNode } from '../services/fileSystem';
import { PomodoroSprintTimer } from './PomodoroSprintTimer';
import { 
  Folder, FileText, StickyNote, User, MapPin, Package, Compass, Flag,
  ChevronRight, ChevronDown, Plus, Trash2, Edit2, Network, Timer, Sidebar
} from 'lucide-react';

interface LibrarySidebarProps {
  project: Project;
  activeNodeId: string | null;
  onUpdateProject: (project: Project) => void;
  onSelectNode: (node: FileSystemNode | null) => void;
  currentWordCount?: number;
  onClose?: () => void;
}

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({ 
  project, 
  activeNodeId, 
  onUpdateProject, 
  onSelectNode,
  currentWordCount = 0,
  onClose,
}) => {
  const { t } = useSettings();
  const [dragOverInfo, setDragOverInfo] = useState<{ id: string, position: 'before' | 'after' | 'inside' } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTimer, setShowTimer] = useState(true);

  // --- Actions ---

  const handleCreate = (type: NodeType) => {
    setShowAddMenu(false);
    let parentId = null;
    const activeNode = project.nodes?.find(n => n.id === activeNodeId);
    
    if (activeNode) {
        if (activeNode.type === 'folder') parentId = activeNode.id;
        else parentId = activeNode.parentId;
    }

    const titles: Record<NodeType, string> = {
      folder: '新卷宗資料夾',
      document: '新章節手稿',
      note: '新寫作靈感',
      character: '新登場角色',
      location: '新世界場景',
      item: '新寶物道具',
      lore: '新世界法則',
      faction: '新陣營組織',
      whiteboard: '新心智白板'
    };

    const { project: updatedProject, newNode } = createNode(project, type, titles[type] || 'Untitled', parentId);
    onUpdateProject(updatedProject);
    onSelectNode(newNode);
    setEditingId(newNode.id);
    setEditTitle(newNode.title);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm('確定要刪除此條目及其內容嗎？此操作無法復原。')) {
       const updated = deleteNode(project, id);
       onUpdateProject(updated);
       
       if (activeNodeId) {
           const activeStillExists = updated.nodes.find(n => n.id === activeNodeId);
           if (!activeStillExists) {
               onSelectNode(null);
           }
       }
    }
  };

  const handleRename = (id: string, title: string) => {
    const updatedNodes = project.nodes.map(n => n.id === id ? { ...n, title } : n);
    onUpdateProject({ ...project, nodes: updatedNodes });
    setEditingId(null);
  };

  const handleToggleFolder = (node: FileSystemNode, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const updatedNodes = project.nodes.map(n => n.id === node.id ? { ...n, isOpen: !n.isOpen } : n);
      onUpdateProject({ ...project, nodes: updatedNodes });
  };

  // --- Drag & Drop ---

  const handleDragStart = (e: React.DragEvent, node: FileSystemNode) => {
      e.dataTransfer.setData('nodeId', node.id);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetNode: FileSystemNode) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;

      let position: 'before' | 'after' | 'inside' = 'inside';

      if (targetNode.type === 'folder') {
          if (y < height * 0.25) position = 'before';
          else if (y > height * 0.75) position = 'after';
          else position = 'inside';
      } else {
          if (y < height * 0.5) position = 'before';
          else position = 'after';
      }

      setDragOverInfo({ id: targetNode.id, position });
  };

  const handleDragLeave = () => {
      setDragOverInfo(null);
  };

  const handleDrop = (e: React.DragEvent, targetNode: FileSystemNode) => {
      e.preventDefault();
      e.stopPropagation();
      const draggedId = e.dataTransfer.getData('nodeId');
      
      if (draggedId && dragOverInfo) {
          const updated = moveNode(project, draggedId, targetNode.id, dragOverInfo.position);
          onUpdateProject(updated);
      }
      setDragOverInfo(null);
  };

  // --- Render Helpers ---

  const getIcon = (type: NodeType) => {
      switch(type) {
          case 'folder': return Folder;
          case 'document': return FileText;
          case 'note': return StickyNote;
          case 'character': return User;
          case 'location': return MapPin;
          case 'item': return Package;
          case 'lore': return Compass;
          case 'faction': return Flag;
          case 'whiteboard': return Network;
          default: return FileText;
      }
  };

  const renderTree = (nodes: FileSystemNode[], depth = 0) => {
      if (!nodes || nodes.length === 0) return null;

      return nodes.map(node => {
          const Icon = getIcon(node.type);
          const isDragOver = dragOverInfo?.id === node.id;
          const isActive = activeNodeId === node.id;
          
          return (
              <React.Fragment key={node.id}>
                  <div 
                    draggable
                    onDragStart={(e) => handleDragStart(e, node)}
                    onDragOver={(e) => handleDragOver(e, node)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, node)}
                    onClick={() => onSelectNode(node)}
                    className={`
                        relative group flex items-center py-1.5 px-2 cursor-pointer transition-colors text-sm rounded-md mx-2
                        ${isActive ? 'bg-amber-100 dark:bg-amber-900/40 text-stone-900 dark:text-stone-100 font-medium' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}
                    `}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                  >
                      {/* Drop Indicators */}
                      {isDragOver && dragOverInfo.position === 'before' && (
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full pointer-events-none" />
                      )}
                      {isDragOver && dragOverInfo.position === 'after' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full pointer-events-none" />
                      )}
                      {isDragOver && dragOverInfo.position === 'inside' && (
                          <div className="absolute inset-0 bg-amber-500/10 border-2 border-amber-500 rounded-md pointer-events-none z-10" />
                      )}

                      {/* Icon / Toggler */}
                      <span 
                        className={`mr-2 p-0.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 ${node.type === 'folder' ? 'cursor-pointer' : 'opacity-70'}`}
                        onClick={(e) => node.type === 'folder' && handleToggleFolder(node, e)}
                      >
                          {node.type === 'folder' ? (
                              node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                          ) : (
                              <Icon size={14} className={node.type !== 'document' ? 'text-amber-600 dark:text-amber-500' : ''} />
                          )}
                      </span>

                      {/* Title / Edit Mode */}
                      {editingId === node.id ? (
                          <input 
                              autoFocus
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              onBlur={() => handleRename(node.id, editTitle)}
                              onKeyDown={e => e.key === 'Enter' && handleRename(node.id, editTitle)}
                              onClick={e => e.stopPropagation()}
                              className="bg-white dark:bg-stone-900 border border-amber-500 rounded px-1 py-0.5 text-xs w-full focus:outline-none"
                          />
                      ) : (
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                              <span className="truncate select-none mr-2">{node.title}</span>
                              <div className="flex items-center space-x-1 flex-shrink-0 mr-1.5 opacity-90 group-hover:opacity-40 transition-opacity">
                                  {node.metadata?.tags && node.metadata.tags.slice(0, 2).map((tag, i) => (
                                      <span key={i} className="text-[9px] px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200/40 dark:border-amber-900/40 rounded-sm font-sans font-normal scale-95 origin-right">
                                          {tag}
                                      </span>
                                  ))}
                                  {node.metadata?.targetWordCount ? (
                                      <span className="text-[9px] text-stone-400 dark:text-stone-500 font-sans font-normal">
                                          /{node.metadata.targetWordCount}字
                                      </span>
                                  ) : null}
                              </div>
                          </div>
                      )}

                      {/* Actions */}
                      <div className="hidden group-hover:flex items-center space-x-1 ml-2 z-20 relative">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setEditingId(node.id); setEditTitle(node.title); }} className="p-1 hover:text-amber-600 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"><Edit2 size={12} /></button>
                          <button type="button" onClick={(e) => handleDelete(node.id, e)} className="p-1 hover:text-rose-600 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"><Trash2 size={12} /></button>
                      </div>
                  </div>
                  
                  {/* Recursion */}
                  {node.type === 'folder' && node.isOpen && (
                      <div className="ml-1 border-l border-stone-200 dark:border-stone-800">
                           {renderTree(buildTree(project.nodes || [], node.id), depth + 1)}
                      </div>
                  )}
              </React.Fragment>
          );
      });
  };

  const rootNodes = buildTree(project.nodes || [], null);

  return (
    <div className="h-full flex flex-col bg-stone-50 dark:bg-stone-900 font-sans">
      <div className="p-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between flex-shrink-0 relative">
         <div className="flex items-center space-x-1.5">
           {onClose && (
             <button
               type="button"
               onClick={onClose}
               className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
               title="收合側欄"
             >
               <Sidebar size={14} />
             </button>
           )}
           <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('library.title')}</span>
         </div>
         <div className="flex space-x-1 items-center">
             <button type="button" onClick={() => handleCreate('document')} className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded text-stone-500" title={t('tree.add.document')}><FileText size={14}/></button>
             <button type="button" onClick={() => handleCreate('folder')} className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded text-stone-500" title={t('tree.add.folder')}><Folder size={14}/></button>
             
             {/* Dropdown Menu for All Types */}
             <div className="relative">
               <button 
                 type="button" 
                 onClick={() => setShowAddMenu(!showAddMenu)} 
                 className="p-1 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900 rounded transition-colors" 
                 title="新增設定與項目"
               >
                 <Plus size={14}/>
               </button>

               {showAddMenu && (
                 <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl rounded-lg py-1 z-50 text-xs">
                   <button onClick={() => handleCreate('document')} className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"><FileText size={13}/> 章節手稿</button>
                   <button onClick={() => handleCreate('folder')} className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"><Folder size={13}/> 卷宗資料夾</button>
                   <button onClick={() => handleCreate('character')} className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"><User size={13} className="text-amber-600"/> 登場角色卡 (Wiki)</button>
                   <button onClick={() => handleCreate('location')} className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"><MapPin size={13} className="text-amber-600"/> 世界場景卡 (Wiki)</button>
                   <button onClick={() => handleCreate('item')} className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"><Package size={13} className="text-amber-600"/> 道具神器卡 (Wiki)</button>
                   <button onClick={() => handleCreate('lore')} className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"><Compass size={13} className="text-amber-600"/> 世界法則卡 (Wiki)</button>
                   <button onClick={() => handleCreate('faction')} className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"><Flag size={13} className="text-amber-600"/> 陣營組織卡 (Wiki)</button>
                   <button onClick={() => handleCreate('note')} className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"><StickyNote size={13}/> 靈感隨手筆記</button>
                   <button onClick={() => handleCreate('whiteboard')} className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"><Network size={13}/> 心智網絡白板</button>
                 </div>
               )}
             </div>
         </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {/* 總稿卷宗 (根目錄) Clickable Node */}
          <div 
            onClick={() => onSelectNode(null)}
            className={`
                relative group flex items-center py-1.5 px-3 cursor-pointer transition-all text-sm rounded-md mx-2 mb-2 border
                ${activeNodeId === null 
                  ? 'bg-amber-100/80 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60 text-stone-900 dark:text-stone-100 font-bold shadow-xs' 
                  : 'bg-white/80 dark:bg-stone-900/50 border-stone-200/60 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'}
            `}
          >
              <span className="mr-2 p-0.5 rounded opacity-95 text-amber-600 dark:text-amber-500">
                  <Folder size={14} className="fill-amber-100 dark:fill-amber-900/10" />
              </span>
              <span className="truncate flex-1">總稿卷宗 (根目錄)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200/40 dark:border-stone-700/60 font-normal">
                  corkboard
              </span>
          </div>

          {rootNodes.length > 0 ? renderTree(rootNodes) : (
             <div className="text-center mt-10 text-stone-400 text-xs italic p-4">
                點擊上方按鈕建立您的第一章手稿或角色卡片。
             </div>
          )}
      </div>

      {/* Pomodoro Writing Sprint Timer Widget */}
      <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-950/40">
         <div className="flex items-center justify-between mb-2">
           <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center">
             <Timer size={12} className="mr-1 text-amber-600" />
             番茄鐘寫作衝刺
           </span>
           <button
             onClick={() => setShowTimer(!showTimer)}
             className="text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 font-medium"
           >
             {showTimer ? '隱藏' : '展開'}
           </button>
         </div>

         {showTimer && (
           <PomodoroSprintTimer
             compact
             currentWordCount={currentWordCount}
           />
         )}
      </div>
    </div>
  );
};