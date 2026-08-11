import React, { useState, useEffect } from 'react';
import { Project, FileSystemNode, NodeType, SceneMetadata } from '../types';
import { Sparkles, User, MapPin, StickyNote, FileText, Send, Plus, Search, Tag, Check, RefreshCw, Package, Compass, Flag, Target } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface CodexInspectorProps {
  project: Project;
  activeNode: FileSystemNode | null;
  onUpdateProject: (p: Project) => void;
  onInsertTextAtCursor?: (text: string) => void;
  editorSelectedText?: string;
}

export const CodexInspector: React.FC<CodexInspectorProps> = ({
  project,
  activeNode,
  onUpdateProject,
  onInsertTextAtCursor,
  editorSelectedText = ''
}) => {
  const [tab, setTab] = useState<'notes' | 'codex' | 'ai'>('notes');

  // Notes tab state
  const [sceneNote, setSceneNote] = useState('');
  const [nodeStatus, setNodeStatus] = useState<'draft' | 'revised' | 'final'>('draft');
  const [nodeTargetWordCount, setNodeTargetWordCount] = useState<number>(0);
  const [nodeTags, setNodeTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Sync activeNode metadata to state
  useEffect(() => {
    if (activeNode) {
      setSceneNote(activeNode.metadata?.notes || '');
      setNodeStatus((activeNode.metadata?.status as any) || 'draft');
      setNodeTargetWordCount(activeNode.metadata?.targetWordCount || 0);
      setNodeTags(activeNode.metadata?.tags || []);
    } else {
      setSceneNote('');
      setNodeStatus('draft');
      setNodeTargetWordCount(0);
      setNodeTags([]);
    }
  }, [activeNode?.id]);

  // Codex tab state
  const [codexSearch, setCodexSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'character' | 'location' | 'item' | 'lore' | 'faction' | 'note'>('all');

  // AI Assistant tab state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');

  // Update helpers
  const updateNodeMetadata = (updates: Partial<SceneMetadata>) => {
    if (!activeNode) return;
    const updatedNodes = project.nodes.map(n => {
      if (n.id === activeNode.id) {
        return {
          ...n,
          metadata: {
            ...(n.metadata || {}),
            ...updates
          }
        };
      }
      return n;
    });
    onUpdateProject({
      ...project,
      nodes: updatedNodes,
      lastModified: Date.now()
    });
  };

  const handleStatusChange = (status: 'draft' | 'revised' | 'final') => {
    setNodeStatus(status);
    updateNodeMetadata({ status });
  };

  const handleNoteChange = (val: string) => {
    setSceneNote(val);
    updateNodeMetadata({ notes: val });
  };

  const handleTargetWordCountChange = (val: number) => {
    setNodeTargetWordCount(val);
    updateNodeMetadata({ targetWordCount: val });
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const cleanTag = newTagInput.trim();
    if (nodeTags.includes(cleanTag)) {
      setNewTagInput('');
      return;
    }
    const nextTags = [...nodeTags, cleanTag];
    setNodeTags(nextTags);
    updateNodeMetadata({ tags: nextTags });
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = nodeTags.filter(t => t !== tagToRemove);
    setNodeTags(nextTags);
    updateNodeMetadata({ tags: nextTags });
  };

  // Extract all codex items from project nodes
  const wikiTypes: NodeType[] = ['character', 'location', 'item', 'lore', 'faction', 'note'];
  const codexNodes = (project.nodes || []).filter(
    n => wikiTypes.includes(n.type)
  );

  const filteredCodex = codexNodes.filter(n => {
    const matchesType = filterType === 'all' || n.type === filterType;
    const matchesSearch = n.title.toLowerCase().includes(codexSearch.toLowerCase()) || 
                          (n.content && n.content.toLowerCase().includes(codexSearch.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Handle AI execution
  const runAiCommand = async (actionType: 'continue' | 'rephrase' | 'describe' | 'custom') => {
    if (!process.env.API_KEY) {
      setAiResult('請先設定 API Key 以使用 AI Studio 功能。');
      return;
    }

    setAiLoading(true);
    setAiResult('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let promptText = '';

      const context = activeNode ? (activeNode.content || '').replace(/<[^>]*>/g, ' ').slice(-1000) : '';

      switch (actionType) {
        case 'continue':
          promptText = `你是一位專業的小說共同創作者，請根據以下手稿內容流暢地續寫接下來的劇情（請以繁體中文回答）：\n\n"${context}"`;
          break;
        case 'rephrase':
          promptText = `請修飾並潤色以下段落的文字，提升語感與描繪力（請以繁體中文回答）：\n\n"${editorSelectedText || context.slice(-300)}"`;
          break;
        case 'describe':
          promptText = `請根據現有情節，寫一段具備五感描繪的情境與環境氛圍描寫（請以繁體中文回答）：\n\n"${context.slice(-500)}"`;
          break;
        case 'custom':
          promptText = `手稿情節上下文: "${context.slice(-500)}"\n\n創作指令: ${aiPrompt}`;
          break;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: promptText,
      });

      setAiResult(response.text || '未產生回應。');
    } catch (e) {
      setAiResult(`AI 靈感助手錯誤: ${(e as Error).message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const getWikiIcon = (type: NodeType) => {
    switch (type) {
      case 'character': return <User size={13} className="text-amber-600" />;
      case 'location': return <MapPin size={13} className="text-emerald-600" />;
      case 'item': return <Package size={13} className="text-purple-600" />;
      case 'lore': return <Compass size={13} className="text-blue-600" />;
      case 'faction': return <Flag size={13} className="text-rose-600" />;
      default: return <StickyNote size={13} className="text-stone-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 text-xs font-sans">
      {/* Inspector Tab Bar */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-1 space-x-1 flex-shrink-0">
        <button
          onClick={() => setTab('notes')}
          className={`flex-1 py-1.5 rounded text-center font-medium transition-colors ${
            tab === 'notes'
              ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
              : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
        >
          章節大綱/狀態
        </button>
        <button
          onClick={() => setTab('codex')}
          className={`flex-1 py-1.5 rounded text-center font-medium transition-colors ${
            tab === 'codex'
              ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
              : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
        >
          世界觀 Wiki ({codexNodes.length})
        </button>
        <button
          onClick={() => setTab('ai')}
          className={`flex-1 py-1.5 rounded text-center font-medium transition-colors flex items-center justify-center space-x-1 ${
            tab === 'ai'
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold'
              : 'text-amber-600 dark:text-amber-500 hover:text-amber-700'
          }`}
        >
          <Sparkles size={13} />
          <span>AI 靈感 Studio</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {tab === 'notes' && (
          <div className="space-y-4">
            {!activeNode ? (
              <div className="p-4 text-center text-stone-400 dark:text-stone-500 bg-white dark:bg-stone-850/30 rounded-lg border border-stone-200/60 dark:border-stone-800/60 space-y-3">
                <FileText size={24} className="mx-auto text-stone-300 dark:text-stone-700" />
                <p className="text-xs font-serif leading-relaxed">請在左側目錄選擇或新增章節文件，以開始設定其專屬目標、草稿狀態與標籤。</p>
              </div>
            ) : (
              <>
                {/* Node Metadata */}
                <div>
                  <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1">
                    當前編輯文件
                  </label>
                  <div className="p-3 bg-white dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-800">
                    <span className="font-serif text-sm font-bold text-stone-800 dark:text-stone-100 block">
                      {activeNode.title}
                    </span>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500">
                      類型: {activeNode.type === 'document' ? '章節手稿' : activeNode.type === 'note' ? '靈感筆記' : activeNode.type}
                    </span>
                  </div>
                </div>

                {/* Single Document Target Word Count */}
                <div>
                  <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Target size={11} className="text-amber-600 dark:text-amber-500" /> 單篇寫作字數目標 (字)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={nodeTargetWordCount || ''}
                      onChange={(e) => handleTargetWordCountChange(parseInt(e.target.value) || 0)}
                      placeholder="未設定字數目標"
                      className="w-full p-2 pr-8 bg-white dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 rounded-lg outline-none focus:border-amber-500 text-xs text-stone-800 dark:text-stone-200"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] font-bold text-stone-400 dark:text-stone-500 font-sans">
                      字
                    </span>
                  </div>
                </div>

                {/* Single Document Tags */}
                <div>
                  <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Tag size={11} className="text-amber-600 dark:text-amber-500" /> 單篇文件標籤
                  </label>
                  <div className="space-y-2">
                    <div className="flex space-x-1.5">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="輸入標籤後按 Enter 或點擊「+」"
                        className="flex-1 p-2 bg-white dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 rounded-lg outline-none focus:border-amber-500 text-xs text-stone-800 dark:text-stone-200"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-900 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {nodeTags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {nodeTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/40 dark:border-amber-900/40"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:bg-amber-200 dark:hover:bg-amber-900 rounded-full p-0.5 text-amber-700 dark:text-amber-300 transition-colors"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 italic">
                        尚未為此文件建立任何標籤。
                      </p>
                    )}
                  </div>
                </div>

                {/* Document Status */}
                <div>
                  <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1">
                    草稿狀態標籤
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'draft', label: '初稿 Draft' },
                      { id: 'revised', label: '二修 Revised' },
                      { id: 'final', label: '定稿 Final' }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleStatusChange(st.id as any)}
                        className={`py-1.5 rounded border text-[11px] font-medium transition-all ${
                          nodeStatus === st.id
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 font-bold'
                            : 'border-stone-200 dark:border-stone-800 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scene Notes */}
                <div>
                  <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1">
                    本章大綱與伏筆備忘錄
                  </label>
                  <textarea
                    value={sceneNote}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    placeholder="在此記錄本章節的伏筆、角色動機或情節推進邏輯..."
                    className="w-full h-32 p-3 bg-white dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 rounded-lg outline-none focus:border-amber-500 dark:text-stone-200 text-xs leading-relaxed resize-none font-sans"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'codex' && (
          <div className="space-y-3">
            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
                <input
                  type="text"
                  value={codexSearch}
                  onChange={e => setCodexSearch(e.target.value)}
                  placeholder="搜尋角色、場景、道具、法則..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-800 rounded-lg text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'all', label: '全部' },
                  { id: 'character', label: '角色' },
                  { id: 'location', label: '場景' },
                  { id: 'item', label: '道具' },
                  { id: 'lore', label: '法則' },
                  { id: 'faction', label: '組織' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id as any)}
                    className={`px-2 py-1 rounded text-[10px] transition-colors ${
                      filterType === f.id
                        ? 'bg-amber-500 text-white font-medium'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-2">
              {filteredCodex.length > 0 ? (
                filteredCodex.map(node => (
                  <div
                    key={node.id}
                    className="p-3 bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 rounded-lg hover:border-amber-400 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                        {getWikiIcon(node.type)}
                        {node.title}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-500 font-mono">
                        {node.type}
                      </span>
                    </div>
                    {node.content && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 mb-2">
                        {node.content.replace(/<[^>]*>/g, '')}
                      </p>
                    )}
                    {onInsertTextAtCursor && (
                      <button
                        onClick={() => onInsertTextAtCursor(`【${node.title}】`)}
                        className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline font-bold"
                      >
                        + 插入名稱標記至手稿
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-stone-400 text-xs italic">
                  尚未建立符合條件的世界觀條目。可於左側目錄點擊「+」新增角色或場景卡。
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'ai' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg">
              <span className="font-bold text-amber-900 dark:text-amber-200 block mb-1 flex items-center gap-1">
                <Sparkles size={14} /> AI 靈感寫作搭檔
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-tight">
                運用 Gemini 智慧接續故事、潤色文字或豐富世界觀氛圍描寫。
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => runAiCommand('continue')}
                disabled={aiLoading}
                className="p-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-500 rounded-lg text-left text-xs text-stone-800 dark:text-stone-200 font-medium transition-colors"
              >
                順暢續寫情節
              </button>
              <button
                type="button"
                onClick={() => runAiCommand('rephrase')}
                disabled={aiLoading}
                className="p-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-500 rounded-lg text-left text-xs text-stone-800 dark:text-stone-200 font-medium transition-colors"
              >
                潤色選取文字
              </button>
              <button
                type="button"
                onClick={() => runAiCommand('describe')}
                disabled={aiLoading}
                className="p-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-500 rounded-lg text-left text-xs text-stone-800 dark:text-stone-200 font-medium transition-colors col-span-2"
              >
                生成感官環境氛圍描繪
              </button>
            </div>

            {/* Custom Prompt Box */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                自訂創作指令
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runAiCommand('custom')}
                  placeholder="例如：請寫一段高潮迭起的對峙對話..."
                  className="flex-1 p-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-800 rounded-lg text-xs outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => runAiCommand('custom')}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

            {/* AI Result Box */}
            {aiLoading && (
              <div className="flex items-center justify-center p-6 text-amber-600 space-x-2 animate-pulse">
                <RefreshCw size={16} className="animate-spin" />
                <span>AI 正在斟酌靈感與字句...</span>
              </div>
            )}

            {aiResult && !aiLoading && (
              <div className="p-3 bg-white dark:bg-stone-800 border border-amber-200 dark:border-stone-700 rounded-lg space-y-2">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                  AI 建議靈感
                </span>
                <p className="text-xs leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap font-serif">
                  {aiResult}
                </p>
                {onInsertTextAtCursor && (
                  <button
                    type="button"
                    onClick={() => onInsertTextAtCursor(aiResult)}
                    className="w-full mt-2 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-sans text-xs font-medium flex items-center justify-center space-x-1"
                  >
                    <Check size={14} />
                    <span>插入靈感至目前手稿中</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
