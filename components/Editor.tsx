import React, { useState, useEffect, useRef } from 'react';
import { Project, Revision, WritingSession, FileSystemNode } from '../types';
import { saveProject, saveSession, saveRevision, deleteRevision, createSnapshot, getSessions } from '../services/storage';
import { calculateStreak, getTodaySessionStats, getLocalDateString } from '../services/streak';
import { saveOfflineDraft, getOfflineDraft, clearOfflineDraft, OfflineDraft } from '../services/offline';
import { 
  ArrowLeft, Flame, Eye, PenTool, Trash2, X, Bold, Italic, Underline, Undo, Redo, Save, 
  Sidebar, PanelRight, Sparkles, Download, Maximize2, CheckCircle2, LayoutGrid, FileText, Type,
  BookOpen, Target, Camera, Search, HelpCircle, Check, Keyboard, Compass, Clock, Layers
} from 'lucide-react';
import { RevisionSidebar } from './RevisionSidebar';
import { LibrarySidebar } from './LibrarySidebar';
import { StudioLayout } from './StudioLayout';
import { useSettings } from '../contexts/SettingsContext';
import { GoogleGenAI } from "@google/genai";
import { WhiteboardEditor } from './WhiteboardEditor';
import { ExportModal } from './ExportModal';
import { WordCountProgress } from './WordCountProgress';
import { FocusModeOverlay } from './FocusModeOverlay';
import { CodexInspector } from './CodexInspector';
import { CorkboardView } from './CorkboardView';
import { ManuscriptView } from './ManuscriptView';
import { ProjectTargetModal } from './ProjectTargetModal';
import { OfflineRecoveryModal } from './OfflineRecoveryModal';
import { SnapshotModal } from './SnapshotModal';
import { WikiWorkspaceModal } from './WikiWorkspaceModal';
import { TimelineEditorModal } from './TimelineEditorModal';
import { OutlineEditorModal } from './OutlineEditorModal';
import { RichTextToolbar } from './RichTextToolbar';
import { FindReplaceBar } from './FindReplaceBar';
import { ShortcutSettingsModal } from './ShortcutSettingsModal';
import { getShortcuts } from '../services/shortcuts';
import { countWords, countChars } from '../utils/wordCount';

interface EditorProps {
  project: Project;
  allProjects: Project[];
  revisions: Revision[];
  onBack: () => void;
  onUpdate: () => void; 
  onSelectProject: (p: Project) => void;
}

class HistoryStack<T> {
  private past: T[] = [];
  private future: T[] = [];
  private current: T;

  constructor(initial: T) {
    this.current = initial;
  }

  push(item: T) {
    if (item === this.current) return;
    this.past.push(this.current);
    this.current = item;
    this.future = [];
    if (this.past.length > 50) this.past.shift();
  }

  undo(): T | null {
    if (this.past.length === 0) return null;
    this.future.unshift(this.current);
    this.current = this.past.pop()!;
    return this.current;
  }

  redo(): T | null {
    if (this.future.length === 0) return null;
    this.past.push(this.current);
    this.current = this.future.shift()!;
    return this.current;
  }

  getCurrent() {
    return this.current;
  }
}

export const Editor: React.FC<EditorProps> = ({ 
  project, 
  allProjects, 
  revisions, 
  onBack, 
  onUpdate, 
  onSelectProject 
}) => {
  const [localProject, setLocalProject] = useState<Project>(project);
  
  // Ensure we have at least one node to edit
  useEffect(() => {
    if (project.nodes === undefined || project.nodes.length === 0) {
        const rootDoc: FileSystemNode = {
            id: crypto.randomUUID(),
            type: 'document',
            title: '第一章',
            content: project.content || '',
            parentId: null,
            order: 0,
            isOpen: false
        };
        const migrated = { ...project, nodes: [rootDoc] };
        saveProject(migrated);
        setLocalProject(migrated);
        setActiveNodeId(rootDoc.id);
        setContent(rootDoc.content);
        historyRef.current = new HistoryStack(rootDoc.content);
    } else {
        setLocalProject(project);
    }
  }, [project]);

  // Active Node State
  const [activeNodeId, setActiveNodeId] = useState<string | null>(() => {
      const firstDoc = project.nodes?.find(n => n.type === 'document' || n.type === 'note');
      return firstDoc ? firstDoc.id : (project.nodes && project.nodes.length > 0 ? project.nodes[0].id : null);
  });

  const activeNode = localProject.nodes?.find(n => n.id === activeNodeId) || null;

  // Editor Content State
  const [content, setContent] = useState(activeNode ? activeNode.content : '');
  const [mode, setMode] = useState<'author' | 'review'>('author');
  const [centerView, setCenterView] = useState<'editor' | 'corkboard' | 'manuscript' | 'wiki'>('editor');
  const [readingMode, setReadingMode] = useState(false);
  const [rightTab, setRightTab] = useState<'inspector' | 'revisions'>('inspector');

  const [streakInfo, setStreakInfo] = useState(calculateStreak());
  const [sessionStats, setSessionStats] = useState(getTodaySessionStats(project.id));
  const [lastSaved, setLastSaved] = useState(Date.now());
  const [isSaving, setIsSaving] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [showWikiModal, setShowWikiModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showOutlineModal, setShowOutlineModal] = useState(false);
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [spellcheckEnabled, setSpellcheckEnabled] = useState(true);
  const [showWorkshopMenu, setShowWorkshopMenu] = useState(false);
  const [fontFamily, setFontFamily] = useState('Noto Serif TC, Songti TC, serif');
  const [fontSize, setFontSize] = useState('3');
  const [focusMode, setFocusMode] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);

  // Hourly Auto Snapshot Trigger
  useEffect(() => {
    // Take an initial auto snapshot on load if project has nodes
    const hourlySnapshotTimer = setInterval(() => {
      if (localProject && localProject.nodes && localProject.nodes.length > 0) {
        createSnapshot(localProject, '編輯一小時自動快照', 'auto_hourly');
      }
    }, 3600000); // 1 hour = 3,600,000 ms

    return () => clearInterval(hourlySnapshotTimer);
  }, [localProject]);

  // Offline Draft Recovery State
  const [offlineDraftModal, setOfflineDraftModal] = useState<{
    isOpen: boolean;
    draft: OfflineDraft | null;
    savedContent: string;
  }>({ isOpen: false, draft: null, savedContent: '' });

  const { t } = useSettings();
  
  // Suggestion State
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const suggestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Layout State
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // Selection state for Review Mode
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number, text: string} | null>(null);
  const [insertionPoint, setInsertionPoint] = useState<number | null>(null);
  const [insertionText, setInsertionText] = useState('');

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef(new HistoryStack(activeNode ? activeNode.content : ''));
  const sessionStartContentLength = useRef(0);
  const sessionStartTime = useRef(Date.now());
  const lastActivityTime = useRef(Date.now());
  const activeDuration = useRef(0);
  const hasSavedSessionToday = useRef(false);

  // Initialize Word Count helper
  const getWordCount = (html: string) => {
    return countWords(html);
  };

  const getCharCount = (html: string) => {
    return countChars(html);
  };

  const cleanContent = (html: string) => {
      return (html || '').replace(/<span id="ai-ghost".*?>.*?<\/span>/g, '');
  };

  useEffect(() => {
    sessionStartContentLength.current = getWordCount(content);
  }, [activeNodeId]);

  // Sync content when activeNode changes or mode changes
  useEffect(() => {
      if (activeNode) {
          const clean = cleanContent(activeNode.content || '');
          setContent(clean);
          if (activeNode.type !== 'whiteboard' && editorRef.current) {
              editorRef.current.innerHTML = clean;
          }
          historyRef.current = new HistoryStack(clean);
          setSuggestion(null);
      }
  }, [activeNodeId, mode]);

  // CRITICAL FIX FOR TEXT EDITOR DISPLAY BUG:
  // Ensure editorRef.current.innerHTML is populated on mount whenever editorRef is attached!
  useEffect(() => {
    if (editorRef.current && activeNode && activeNode.type !== 'whiteboard') {
      const clean = cleanContent(content || activeNode.content || '');
      if (editorRef.current.innerHTML !== clean) {
        editorRef.current.innerHTML = clean;
      }
    }
  });

  // Check for unsaved offline draft when activeNodeId changes
  useEffect(() => {
    if (activeNodeId) {
      const draft = getOfflineDraft(activeNodeId);
      if (draft && draft.content) {
        const saved = activeNode ? (activeNode.content || '') : '';
        if (draft.content.trim() !== saved.trim()) {
          setOfflineDraftModal({
            isOpen: true,
            draft,
            savedContent: saved,
          });
        }
      }
    }
  }, [activeNodeId]);

  const handleRestoreOfflineDraft = () => {
    if (offlineDraftModal.draft && activeNodeId) {
      const restoredContent = offlineDraftModal.draft.content;
      setContent(restoredContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = restoredContent;
      }
      updateActiveNodeContent(restoredContent);
      clearOfflineDraft(activeNodeId);
      setOfflineDraftModal({ isOpen: false, draft: null, savedContent: '' });
    }
  };

  const handleDiscardOfflineDraft = () => {
    if (activeNodeId) {
      clearOfflineDraft(activeNodeId);
      setOfflineDraftModal({ isOpen: false, draft: null, savedContent: '' });
    }
  };

  // Persist localProject changes to storage
  const persistProject = (proj: Project) => {
      setIsSaving(true);
      saveProject(proj);
      if (activeNodeId) clearOfflineDraft(activeNodeId);
      setLocalProject(proj);
      setLastSaved(Date.now());
      setTimeout(() => setIsSaving(false), 400);
      onUpdate();
  };

  const updateActiveNodeContent = (newContent: string) => {
      if (!activeNodeId) return;
      
      // Auto-backup to offline draft
      saveOfflineDraft(activeNodeId, newContent, localProject.title, activeNode?.title);

      const updatedNodes = localProject.nodes.map(n => 
          n.id === activeNodeId ? { ...n, content: newContent } : n
      );
      
      const updatedProject = { ...localProject, nodes: updatedNodes, lastModified: Date.now() };
      setLocalProject(updatedProject); 

      // Debounced auto save to localStorage
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(() => {
        saveProject(updatedProject);
        clearOfflineDraft(activeNodeId);
        setLastSaved(Date.now());
        setIsSaving(false);
      }, 1500);
  };

  // Auto-save every 1 minute
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (activeNodeId) {
          const currentContent = historyRef.current.getCurrent();
          const updatedNodes = localProject.nodes.map(n => 
            n.id === activeNodeId ? { ...n, content: currentContent } : n
          );
          saveProject({ ...localProject, nodes: updatedNodes, lastModified: Date.now() });
          clearOfflineDraft(activeNodeId);
          setLastSaved(Date.now());
      }
    }, 60000); 

    return () => clearInterval(autoSaveInterval);
  }, [localProject, activeNodeId]);

  // Session Tracking Loop
  const contentRef = useRef(content);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityTime.current < 60000) {
        activeDuration.current += 5; 
      }
      
      if (activeNode?.type === 'document' || activeNode?.type === 'note') {
          const currentWords = getWordCount(contentRef.current);
          const startWords = sessionStartContentLength.current;
          const wordsTypedToday = Math.max(0, currentWords - startWords); 
          
          const todayStr = getLocalDateString(new Date());
          if (wordsTypedToday > 0 || activeDuration.current >= 10) {
            const session: WritingSession = {
              id: `session_${project.id}_${activeNodeId || 'default'}_${sessionStartTime.current}`,
              projectId: project.id,
              date: todayStr,
              startTime: sessionStartTime.current,
              endTime: Date.now(),
              wordCountDelta: wordsTypedToday,
              durationSeconds: activeDuration.current
            };
            saveSession(session);
            setStreakInfo(calculateStreak()); 
          }
      }
      setSessionStats(getTodaySessionStats(project.id));
    }, 5000);

    return () => clearInterval(interval);
  }, [project.id, activeNode?.type, activeNodeId]);

  // Real-time calculation of today's total written words across all documents
  const getRealtimeTodayWords = () => {
    const today = getLocalDateString(new Date());
    const sessions = getSessions().filter(s => s.projectId === project.id && s.date === today);
    const currentSessionId = `session_${project.id}_${activeNodeId || 'default'}_${sessionStartTime.current}`;
    
    // Sum of all other sessions today (excluding the currently active unsaved editor session)
    const otherSessionsWords = sessions
      .filter(s => s.id !== currentSessionId)
      .reduce((acc, s) => acc + (s.wordCountDelta || 0), 0);
      
    // Calculate current editor session's real-time delta
    const currentWords = getWordCount(content);
    const startWords = sessionStartContentLength.current;
    const currentSessionWordsDelta = Math.max(0, currentWords - startWords);
    
    return otherSessionsWords + currentSessionWordsDelta;
  };

  const realtimeTodayWords = getRealtimeTodayWords();

  // --- AI Suggestion Logic ---
  const fetchSuggestion = async (textContext: string) => {
      if (mode !== 'author' || !process.env.API_KEY || !textContext.trim()) return;

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Complete the following sentence or phrase naturally. Return ONLY the completion text (max 10 words). Context: "${textContext.slice(-500)}"`,
          });
          
          const completion = response.text;
          if (completion && completion.trim().length > 0) {
              setSuggestion(completion);
          }
      } catch (e) {
          console.debug("Suggestion failed", e);
      }
  };

  // Render suggestion into DOM
  useEffect(() => {
    if (suggestion && editorRef.current) {
       const selection = window.getSelection();
       if (!selection || selection.rangeCount === 0) return;
       
       const range = selection.getRangeAt(0);
       if (!range.collapsed) return;

       const ghostSpan = document.createElement('span');
       ghostSpan.id = 'ai-ghost';
       ghostSpan.contentEditable = 'false';
       ghostSpan.className = 'text-stone-300 dark:text-stone-600 italic pointer-events-none select-none';
       ghostSpan.innerText = suggestion;

       range.insertNode(ghostSpan);
       
       range.setStartBefore(ghostSpan);
       range.setEndBefore(ghostSpan);
       selection.removeAllRanges();
       selection.addRange(range);
    }
  }, [suggestion]);

  // --- Handlers ---

  // Typewriter Mode Scroll Centering Logic
  const handleTypewriterScroll = () => {
    if (!typewriterMode || !editorRef.current) return;
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect && rect.top > 0) {
        const parentMain = editorRef.current?.closest('main');
        if (parentMain) {
          const parentRect = parentMain.getBoundingClientRect();
          const targetY = parentRect.top + parentRect.height / 2;
          const diff = rect.top - targetY;
          if (Math.abs(diff) > 4) {
            parentMain.scrollBy({ top: diff, behavior: 'smooth' });
          }
        }
      }
    }, 10);
  };

  useEffect(() => {
    if (typewriterMode) {
      handleTypewriterScroll();
    }
  }, [typewriterMode]);

  // Global Custom Keyboard Shortcuts Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const scs = getShortcuts();
      const isCtrl = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      const matches = (id: string) => {
        const sc = scs.find(s => s.id === id);
        if (!sc) return false;
        return (
          sc.key.toLowerCase() === key &&
          !!sc.ctrlKey === isCtrl &&
          !!sc.altKey === isAlt &&
          !!sc.shiftKey === isShift
        );
      };

      if (matches('save')) {
        e.preventDefault();
        handleManualSave();
      } else if (matches('readingMode')) {
        e.preventDefault();
        setReadingMode(prev => {
          const next = !prev;
          if (next) {
            setLeftOpen(false);
            setRightOpen(false);
          } else {
            setLeftOpen(true);
            setRightOpen(true);
          }
          return next;
        });
      } else if (matches('typewriterMode')) {
        e.preventDefault();
        setTypewriterMode(prev => !prev);
      } else if (matches('focusMode')) {
        e.preventDefault();
        setFocusMode(prev => !prev);
      } else if (matches('wiki')) {
        e.preventDefault();
        setCenterView('wiki');
      } else if (matches('exportDoc')) {
        e.preventDefault();
        setShowExportModal(true);
      } else if (matches('findReplace')) {
        e.preventDefault();
        setShowFindReplace(prev => !prev);
      } else if (matches('snapshot')) {
        e.preventDefault();
        setShowSnapshotModal(true);
      } else if (matches('bold')) {
        e.preventDefault();
        executeCommand('bold');
      } else if (matches('italic')) {
        e.preventDefault();
        executeCommand('italic');
      } else if (matches('underline')) {
        e.preventDefault();
        executeCommand('underline');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [localProject, activeNodeId, content]);

  const handleInput = () => {
    if (editorRef.current) {
      const rawHtml = editorRef.current.innerHTML;
      const clean = cleanContent(rawHtml);
      
      setSuggestion(null);
      if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);

      setContent(clean);
      historyRef.current.push(clean);
      lastActivityTime.current = Date.now();
      updateActiveNodeContent(clean);

      if (typewriterMode) {
        setTimeout(handleTypewriterScroll, 50);
      }

      if (mode === 'author') {
          const textContext = editorRef.current.innerText; 
          suggestionTimeoutRef.current = setTimeout(() => {
              fetchSuggestion(textContext);
          }, 1200);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Tab' && suggestion) {
          e.preventDefault();
          if (editorRef.current) {
              const ghost = editorRef.current.querySelector('#ai-ghost');
              if (ghost) {
                  const text = ghost.textContent || '';
                  const textNode = document.createTextNode(text);
                  ghost.parentNode?.replaceChild(textNode, ghost);
                  
                  const range = document.createRange();
                  range.setStartAfter(textNode);
                  range.setEndAfter(textNode);
                  const sel = window.getSelection();
                  sel?.removeAllRanges();
                  sel?.addRange(range);
                  
                  handleInput();
              }
          }
          setSuggestion(null);
          return;
      }

      if (e.key === 'Escape' && suggestion) {
          e.preventDefault();
          setSuggestion(null);
          if (editorRef.current) {
             const ghost = editorRef.current.querySelector('#ai-ghost');
             ghost?.remove();
          }
          return;
      }
  };

  const handleUndo = () => {
    setSuggestion(null);
    if (mode === 'author') {
      const previous = historyRef.current.undo();
      if (previous !== null) {
        setContent(previous);
        if (editorRef.current) editorRef.current.innerHTML = previous;
        updateActiveNodeContent(previous);
      }
    } else {
      const myRevisions = revisions.filter(r => r.status === 'pending').sort((a, b) => b.timestamp - a.timestamp);
      if (myRevisions.length > 0) {
        deleteRevision(myRevisions[0].id);
        onUpdate();
      }
    }
  };

  const handleRedo = () => {
    setSuggestion(null);
    if (mode === 'author') {
      const next = historyRef.current.redo();
      if (next !== null) {
        setContent(next);
        if (editorRef.current) editorRef.current.innerHTML = next;
        updateActiveNodeContent(next);
      }
    }
  };

  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    handleInput();
  };

  const handleInsertSceneDivider = () => {
    if (editorRef.current) {
      document.execCommand('insertHTML', false, '<p style="text-align:center; font-family:serif; margin: 2rem 0; color:#78716c;">* * *</p><p><br></p>');
      handleInput();
    }
  };

  const handleSnapshotRestored = (updatedProject: Project) => {
    setLocalProject(updatedProject);
    onUpdate();
    if (updatedProject.nodes && updatedProject.nodes.length > 0) {
      const firstNode = updatedProject.nodes[0];
      setActiveNodeId(firstNode.id);
      setContent(firstNode.content || '');
      if (editorRef.current) {
        editorRef.current.innerHTML = firstNode.content || '';
      }
    }
  };

  const handleManualSave = () => {
    if (activeNodeId) {
        const updatedNodes = localProject.nodes.map(n => 
          n.id === activeNodeId ? { ...n, content: content } : n
        );
        persistProject({ ...localProject, nodes: updatedNodes });
    }
  };

  const handleSelectNode = (node: FileSystemNode | null) => {
      if (activeNodeId && activeNode && content !== activeNode.content) {
          const updatedNodes = localProject.nodes.map(n => 
            n.id === activeNodeId ? { ...n, content: content } : n
          );
          persistProject({ ...localProject, nodes: updatedNodes });
      }
      
      setActiveNodeId(node ? node.id : null);
      if (!node || node.type === 'folder') {
        setCenterView('corkboard');
      } else {
        setCenterView('editor');
      }
  };

  const handleUpdateProject = (updated: Project) => {
      setLocalProject(updated);
      saveProject(updated);
      onUpdate();
  };

  const handleInsertFromInspector = (textToInsert: string) => {
    const formatted = `<p>${textToInsert.replace(/\n\n/g, '</p><p>')}</p>`;
    const newContent = content + formatted;
    setContent(newContent);
    if (editorRef.current) {
      editorRef.current.innerHTML = newContent;
    }
    updateActiveNodeContent(newContent);
  };

  const renderReviewContent = () => {
    const relevantRevisions = revisions.filter(r => r.status === 'pending' && r.documentId === project.id).sort((a, b) => a.startIndex - b.startIndex);
    
    const nodes = [];
    let lastIndex = 0;
    
    relevantRevisions.forEach(rev => {
      const safeStart = Math.min(rev.startIndex, content.length);
      const safeEnd = Math.min(rev.endIndex, content.length);

      if (safeStart > lastIndex) {
        const segment = content.substring(lastIndex, safeStart);
        nodes.push(<span key={`seg-${lastIndex}`} dangerouslySetInnerHTML={{__html: segment}} />);
      }

      if (rev.type === 'delete') {
         nodes.push(
           <span key={rev.id} className="bg-rose-100 dark:bg-rose-900/50 text-stone-500 dark:text-stone-400 line-through decoration-rose-400 decoration-2 mx-0.5 px-0.5 rounded cursor-help group relative inline-block">
             <span dangerouslySetInnerHTML={{__html: rev.originalText}} />
             <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-md">
               {t('revision.deleted')} {rev.author}
             </span>
           </span>
         );
         lastIndex = safeEnd; 
      } else if (rev.type === 'insert') {
         nodes.push(
           <span key={rev.id} className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-100 mx-0.5 px-0.5 rounded cursor-help group relative inline-block border-b-2 border-emerald-200 dark:border-emerald-700">
             <span dangerouslySetInnerHTML={{__html: rev.revisedText}} />
             <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-md">
               {t('revision.inserted')} {rev.author}
             </span>
           </span>
         );
      }
    });

    if (lastIndex < content.length) {
      nodes.push(<span key="end" dangerouslySetInnerHTML={{__html: content.substring(lastIndex)}} />);
    }

    return (
        <div 
          className="font-serif text-lg leading-loose outline-none min-h-[500px] whitespace-pre-wrap review-content dark:text-stone-200"
          onMouseUp={() => {
              const sel = window.getSelection();
              if (!sel || sel.rangeCount === 0) return;
              const range = sel.getRangeAt(0);
              if (range.collapsed) { setInsertionPoint(null); setSelectionRange(null); return; }
              const container = document.createElement('div');
              container.appendChild(range.cloneContents());
              setSelectionRange({ start: -1, end: -1, text: container.innerHTML }); 
          }}
        >
            {nodes}
        </div>
    );
  };
  
  const handleProposeDeletion = () => {
    if (!selectionRange || !activeNodeId) return;
    const idx = content.indexOf(selectionRange.text);
    if (idx !== -1) {
        const revision: Revision = {
            id: crypto.randomUUID(),
            documentId: project.id,
            type: 'delete',
            startIndex: idx,
            endIndex: idx + selectionRange.text.length,
            originalText: selectionRange.text,
            revisedText: '',
            author: 'Editor',
            timestamp: Date.now(),
            status: 'pending'
        };
        saveRevision(revision);
        setSelectionRange(null);
        onUpdate();
        if (!rightOpen) setRightOpen(true);
    }
  };

  const handleProposeInsertion = () => {
      if (!insertionText) return;
      const revision: Revision = {
          id: crypto.randomUUID(),
          documentId: project.id,
          type: 'insert',
          startIndex: content.length,
          endIndex: content.length,
          originalText: '',
          revisedText: insertionText,
          author: 'Editor',
          timestamp: Date.now(),
          status: 'pending'
      };
      saveRevision(revision);
      setInsertionText('');
      onUpdate();
      if (!rightOpen) setRightOpen(true);
  };

  const handleAcceptRevision = (rev: Revision) => {
    let newContent = content;
    if (rev.type === 'delete') {
      newContent = content.slice(0, rev.startIndex) + content.slice(rev.endIndex);
    } else if (rev.type === 'insert') {
      newContent = content.slice(0, rev.startIndex) + rev.revisedText + content.slice(rev.startIndex);
    }
    const shift = (rev.revisedText?.length || 0) - (rev.originalText?.length || 0);
    const otherRevisions = revisions.filter(r => r.id !== rev.id && r.status === 'pending');
    otherRevisions.forEach(r => {
      if (r.startIndex >= rev.startIndex) {
        r.startIndex += shift;
        if (r.endIndex > rev.startIndex) r.endIndex += shift; 
        saveRevision(r);
      }
    });
    setContent(newContent);
    if (editorRef.current) {
      editorRef.current.innerHTML = newContent;
    }
    updateActiveNodeContent(newContent);
    deleteRevision(rev.id);
    onUpdate();
  };

  const handleRejectRevision = (rev: Revision) => {
    deleteRevision(rev.id);
    onUpdate();
  };

  const isWhiteboard = activeNode?.type === 'whiteboard';

  // Total project word count calculation
  const totalProjectWords = (localProject.nodes || []).reduce((acc, n) => {
    if (n.type !== 'document') return acc;
    return acc + countWords(n.content || '');
  }, 0);

  // --- Panels ---

  const LibraryPanel = (
    <LibrarySidebar 
        project={localProject}
        activeNodeId={activeNodeId}
        onUpdateProject={handleUpdateProject}
        onSelectNode={handleSelectNode}
        currentWordCount={getWordCount(content)}
        onClose={() => setLeftOpen(false)}
    />
  );

  const RightPanel = (
    <div className="h-full flex flex-col">
      <div className="flex items-center border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-1 pr-2">
        <div className="flex flex-1 space-x-1">
          <button
            onClick={() => setRightTab('inspector')}
            className={`flex-1 py-1 text-xs font-semibold rounded transition-colors ${
              rightTab === 'inspector' 
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200' 
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            屬性設定與 Wiki
          </button>
          <button
            onClick={() => setRightTab('revisions')}
            className={`flex-1 py-1 text-xs font-semibold rounded transition-colors ${
              rightTab === 'revisions' 
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200' 
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            修訂提案 ({revisions.length})
          </button>
        </div>
        <button 
          onClick={() => setRightOpen(false)} 
          className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500 ml-1" 
          title="隱藏屬性側欄"
        >
          <PanelRight size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {rightTab === 'inspector' ? (
          <CodexInspector
            project={localProject}
            activeNode={activeNode}
            onUpdateProject={handleUpdateProject}
            onInsertTextAtCursor={handleInsertFromInspector}
          />
        ) : (
          <RevisionSidebar 
            revisions={revisions} 
            onAccept={handleAcceptRevision}
            onReject={handleRejectRevision}
          />
        )}
      </div>
    </div>
  );

  const CenterPanel = (
    <div className="flex flex-col h-full">
        {/* Header */}
        <header className="h-16 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between px-6 flex-shrink-0 z-20 transition-colors duration-300">
            <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
                <button onClick={onBack} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full text-stone-500 dark:text-stone-400 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-100 truncate max-w-[200px]">
                        {activeNode ? activeNode.title : project.title}
                    </h1>
                    
                    {/* Saved Status Indicator */}
                    <div className="flex items-center space-x-1.5 text-xs">
                      {isSaving ? (
                        <span className="flex items-center text-amber-600 dark:text-amber-500 animate-pulse font-medium">
                          <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
                          Saving to Local Storage...
                        </span>
                      ) : (
                        <span className="flex items-center text-emerald-600 dark:text-emerald-500 font-medium" title="All edits saved locally in browser storage">
                          <CheckCircle2 size={13} className="mr-1" />
                          Saved to Storage ({new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      )}
                    </div>
                </div>
            </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Reading Mode vs Writing Mode Segmented Control (Icons only) */}
              <div className="flex items-center bg-stone-200/80 dark:bg-stone-800 p-1 rounded-xl border border-stone-300/70 dark:border-stone-700 space-x-0.5">
                <button
                  onClick={() => {
                    setReadingMode(false);
                    setLeftOpen(true);
                    setRightOpen(true);
                  }}
                  className={`p-1.5 rounded-lg transition-all ${
                    !readingMode
                      ? 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-200 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                  title="寫作模式 (顯示側邊欄與格式選項)"
                >
                  <PenTool size={16} />
                </button>
                <button
                  onClick={() => {
                    setReadingMode(true);
                    setLeftOpen(false);
                    setRightOpen(false);
                  }}
                  className={`p-1.5 rounded-lg transition-all ${
                    readingMode
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                  title="極簡沉浸式閱讀模式 (隱藏所有側邊欄與格式列)"
                >
                  <BookOpen size={16} />
                </button>
              </div>

              {/* Target & Goals Setting Button (Icon-only) */}
              <button
                onClick={() => setShowTargetModal(true)}
                className="p-2 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
                title="設定專案寫作目標與大綱"
              >
                <Target size={16} className="text-amber-600 dark:text-amber-400" />
              </button>

              {/* View Switcher Segmented Control (Icons with tooltips) */}
              <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200 dark:border-stone-700 space-x-0.5">
                <button
                  onClick={() => setCenterView('editor')}
                  className={`p-1.5 rounded-md transition-all ${
                    centerView === 'editor' ? 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-200 shadow-xs font-bold' : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  }`}
                  title="單頁文件編輯器"
                >
                  <FileText size={16} />
                </button>
                <button
                  onClick={() => setCenterView('manuscript')}
                  className={`p-1.5 rounded-md transition-all ${
                    centerView === 'manuscript' ? 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-200 shadow-xs font-bold' : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  }`}
                  title="手稿大綱與總稿組裝空間"
                >
                  <BookOpen size={16} />
                </button>
                <button
                  onClick={() => setCenterView('corkboard')}
                  className={`p-1.5 rounded-md transition-all ${
                    centerView === 'corkboard' ? 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-200 shadow-xs font-bold' : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  }`}
                  title="軟木板故事卡片大綱"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setCenterView('wiki')}
                  className={`p-1.5 rounded-md transition-all ${
                    centerView === 'wiki' ? 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-200 shadow-xs font-bold' : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  }`}
                  title="Wiki 世界觀獨立空間"
                >
                  <Compass size={16} />
                </button>
              </div>

              {/* Mode Switcher Segmented Control (Icons with tooltips) */}
              <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200 dark:border-stone-700 space-x-0.5">
                <button 
                  onClick={() => setMode('author')}
                  className={`p-1.5 rounded-md transition-all ${mode === 'author' ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-xs' : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'}`}
                  title="創作模式"
                >
                  <PenTool size={16} />
                </button>
                <button 
                  onClick={() => setMode('review')}
                  className={`p-1.5 rounded-md transition-all ${mode === 'review' ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-xs' : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'}`}
                  title="修訂模式"
                >
                  <Eye size={16} />
                </button>
              </div>

              {/* Export Trigger */}
              <button
                onClick={() => setShowExportModal(true)}
                className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                title="匯出稿件 (.docx, .md, .txt)"
              >
                <Download size={16} />
              </button>
            </div>
        </header>

        {/* Secondary Rich Text Formatting Toolbar */}
        {!isWhiteboard && centerView === 'editor' && !readingMode && (
          <RichTextToolbar
            onExecuteCommand={executeCommand}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onToggleFindReplace={() => setShowFindReplace(!showFindReplace)}
            onToggleSpellcheck={() => setSpellcheckEnabled(!spellcheckEnabled)}
            spellcheckEnabled={spellcheckEnabled}
            onInsertSceneDivider={handleInsertSceneDivider}
            onOpenSnapshots={() => setShowSnapshotModal(true)}
            onOpenWiki={() => setShowWikiModal(true)}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
        )}

        {/* Search & Replace Bar */}
        {showFindReplace && !isWhiteboard && centerView === 'editor' && !readingMode && (
          <FindReplaceBar
            onClose={() => setShowFindReplace(false)}
            editorRef={editorRef}
            onContentChange={handleInput}
          />
        )}

        {/* Editor Stage */}
        <main className={`flex-1 overflow-y-auto relative custom-scrollbar ${isWhiteboard || centerView === 'manuscript' || centerView === 'wiki' ? 'bg-stone-100 dark:bg-stone-950 overflow-hidden' : ''}`}>
            {readingMode ? (
              <div className="max-w-3xl mx-auto py-12 px-10 bg-amber-50/40 dark:bg-stone-900/40 shadow-sm my-8 border border-stone-200/60 dark:border-stone-800 rounded-2xl transition-all duration-300 min-h-[calc(100vh-8rem)]">
                <div className="mb-6 pb-4 border-b border-amber-200/50 dark:border-stone-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen size={16} className="text-amber-600" />
                    <span className="text-sm font-serif font-bold text-amber-900 dark:text-amber-200">
                      {activeNode ? activeNode.title : project.title} · 沉浸式閱讀模式
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setReadingMode(false);
                      setLeftOpen(true);
                      setRightOpen(true);
                    }}
                    className="px-3 py-1 text-xs bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 hover:bg-amber-200 rounded-lg font-bold transition-colors"
                  >
                    離開閱讀模式
                  </button>
                </div>
                <div 
                  className="w-full text-lg leading-loose text-stone-800 dark:text-stone-200 font-serif select-text"
                  dangerouslySetInnerHTML={{ __html: content || '<p class="italic text-stone-400">當前稿件無內容...</p>' }}
                />
              </div>
            ) : centerView === 'wiki' ? (
              <div className="h-full w-full bg-stone-50 dark:bg-stone-950 overflow-hidden">
                <WikiWorkspaceModal
                  project={localProject}
                  isOpen={true}
                  onClose={() => setCenterView('editor')}
                  isEmbeddedView={true}
                />
              </div>
            ) : centerView === 'manuscript' ? (
              <ManuscriptView
                project={localProject}
                revisions={revisions}
                onUpdateProject={persistProject}
                onUpdateRevisions={onUpdate}
                onOpenTargetModal={() => setShowTargetModal(true)}
              />
            ) : centerView === 'corkboard' ? (
              <CorkboardView
                project={localProject}
                onSelectNode={handleSelectNode}
                onUpdateProject={handleUpdateProject}
                activeFolderId={activeNodeId}
              />
            ) : isWhiteboard ? (
                <WhiteboardEditor 
                    initialContent={content}
                    onChange={(newContent) => {
                        setContent(newContent);
                        updateActiveNodeContent(newContent);
                        lastActivityTime.current = Date.now();
                    }}
                />
            ) : (
                <div className="max-w-3xl mx-auto py-12 px-12 min-h-[calc(100vh-8rem)] bg-white dark:bg-stone-900 shadow-sm my-8 border border-stone-200 dark:border-stone-800 transition-colors duration-300">
                {!activeNode ? (
                    <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                        <p className="font-serif italic text-lg">請在左側「目錄與書架」選擇或新增章節文件以開始創作。</p>
                    </div>
                ) : mode === 'author' ? (
                    <div
                    ref={editorRef}
                    contentEditable
                    spellCheck={spellcheckEnabled}
                    style={{ fontFamily }}
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onClick={typewriterMode ? handleTypewriterScroll : undefined}
                    onKeyUp={typewriterMode ? handleTypewriterScroll : undefined}
                    onBlur={() => setSuggestion(null)}
                    className={`w-full h-full min-h-[60vh] outline-none text-lg leading-loose text-stone-800 dark:text-stone-200 empty:before:content-[attr(data-placeholder)] empty:before:text-stone-300 dark:empty:before:text-stone-600 ${typewriterMode ? 'py-[35vh]' : ''}`}
                    data-placeholder={t('editor.placeholder')}
                    />
                ) : (
                    <div className="relative">
                        {selectionRange && (
                            <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg shadow-xl px-4 py-3 flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-4">
                                <span className="text-xs text-stone-400 dark:text-stone-500 font-mono">
                                    {selectionRange.text.replace(/<[^>]*>/g, '').substring(0, 20)}...
                                </span>
                                <button 
                                    onClick={handleProposeDeletion}
                                    className="flex items-center text-sm bg-rose-600 hover:bg-rose-500 px-3 py-1.5 rounded transition-colors text-white"
                                >
                                    <Trash2 size={14} className="mr-2" />
                                    {t('editor.review.delete')}
                                </button>
                                <button onClick={() => setSelectionRange(null)} className="text-stone-500 hover:text-white dark:hover:text-stone-900"><X size={16}/></button>
                            </div>
                        )}
                        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-stone-800 p-4 rounded-lg flex items-center space-x-2">
                            <span className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase tracking-wider">{t('editor.review.notice.title')}</span>
                            <span className="text-xs text-blue-600 dark:text-blue-300">{t('editor.review.notice.desc')}</span>
                        </div>
                        {renderReviewContent()}
                        <div className="mt-8 pt-8 border-t border-stone-100 dark:border-stone-800">
                            <label className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2 block">{t('editor.review.append')}</label>
                            <div className="flex space-x-2">
                                <input 
                                    type="text" 
                                    value={insertionText}
                                    onChange={(e) => setInsertionText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleProposeInsertion()}
                                    className="flex-1 border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 rounded p-2 text-sm focus:outline-none focus:border-stone-400"
                                    placeholder="..."
                                />
                                <button onClick={handleProposeInsertion} className="bg-stone-800 dark:bg-stone-700 text-white px-4 py-2 rounded text-sm hover:bg-stone-700 dark:hover:bg-stone-600">{t('editor.review.insert')}</button>
                            </div>
                        </div>
                    </div>
                )}
                </div>
            )}
        </main>

        {/* Real-time Word Count Monitor Footer */}
        <footer className="h-9 bg-stone-100 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between px-4 text-xs font-medium text-stone-500 dark:text-stone-400 flex-shrink-0 z-20 transition-colors duration-300">
            <div className="flex space-x-4 items-center">
                {/* Real-time Word Count Progress Widget */}
                <WordCountProgress
                  currentDocumentWords={getWordCount(content)}
                  currentDocumentChars={getCharCount(content)}
                  sessionWords={realtimeTodayWords}
                  sessionTimeSeconds={sessionStats.time}
                  targetWordCount={localProject.targetWordCount || 0}
                  totalProjectWords={totalProjectWords}
                />

                <span className="text-stone-300 dark:text-stone-700">|</span>

                <span className={realtimeTodayWords >= 50 ? 'text-emerald-600 dark:text-emerald-500 font-bold' : ''}>
                {t('editor.today')}: +{realtimeTodayWords} {t('editor.words')}
                </span>

                {suggestion && !isWhiteboard && (
                   <span className="ml-4 flex items-center text-amber-600 dark:text-amber-500 animate-pulse">
                      <Sparkles size={11} className="mr-1" />
                      按下 Tab 鍵採納 AI 續寫建議
                   </span>
                )}
            </div>
            
            <div className={`flex items-center space-x-2 ${streakInfo.currentStreak > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-stone-400 dark:text-stone-600'}`}>
                <Flame size={13} fill={streakInfo.currentStreak > 0 ? "currentColor" : "none"} />
                <span>{t('editor.streak')}: {streakInfo.currentStreak} 天</span>
            </div>
        </footer>
    </div>
  );

  return (
    <>
      <StudioLayout 
        leftContent={LibraryPanel}
        centerContent={CenterPanel}
        rightContent={RightPanel}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onToggleLeft={setLeftOpen}
        onToggleRight={setRightOpen}
      />

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          project={localProject}
          activeNode={activeNode}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Focus Mode Sanctuary Overlay */}
      {focusMode && (
        <FocusModeOverlay
          content={content}
          onChange={(newContent) => {
            setContent(newContent);
            updateActiveNodeContent(newContent);
          }}
          documentTitle={activeNode ? activeNode.title : project.title}
          onExit={() => setFocusMode(false)}
        />
      )}

      {/* Project Target & Goal Settings Modal */}
      <ProjectTargetModal
        project={localProject}
        isOpen={showTargetModal}
        onClose={() => setShowTargetModal(false)}
        onSave={(p) => persistProject(p)}
      />

      {/* Offline Draft Recovery Modal */}
      <OfflineRecoveryModal
        isOpen={offlineDraftModal.isOpen}
        draft={offlineDraftModal.draft}
        currentSavedContent={offlineDraftModal.savedContent}
        onRestore={handleRestoreOfflineDraft}
        onDiscard={handleDiscardOfflineDraft}
      />

      {/* Snapshot Manager Modal */}
      {showSnapshotModal && (
        <SnapshotModal
          project={localProject}
          isOpen={showSnapshotModal}
          onClose={() => setShowSnapshotModal(false)}
          onSnapshotRestored={handleSnapshotRestored}
        />
      )}

      {/* Wiki & Worldbuilding Modal */}
      {showWikiModal && (
        <WikiWorkspaceModal
          project={localProject}
          isOpen={showWikiModal}
          onClose={() => setShowWikiModal(false)}
        />
      )}

      {/* Timeline Editor Modal */}
      {showTimelineModal && (
        <TimelineEditorModal
          project={localProject}
          isOpen={showTimelineModal}
          onClose={() => setShowTimelineModal(false)}
          onUpdateProject={(updated) => persistProject(updated)}
        />
      )}

      {/* Outline Editor Modal */}
      {showOutlineModal && (
        <OutlineEditorModal
          project={localProject}
          isOpen={showOutlineModal}
          onClose={() => setShowOutlineModal(false)}
          onUpdateProject={(updated) => persistProject(updated)}
          onSelectNode={(node) => {
            setActiveNodeId(node.id);
            setCenterView('editor');
            setShowOutlineModal(false);
          }}
        />
      )}

      {/* Global Shortcut Settings Modal */}
      {showShortcutModal && (
        <ShortcutSettingsModal
          onClose={() => setShowShortcutModal(false)}
          onShortcutsUpdated={() => {}}
        />
      )}
    </>
  );
};
