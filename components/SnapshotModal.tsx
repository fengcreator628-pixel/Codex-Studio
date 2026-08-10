import React, { useState, useEffect } from 'react';
import { Camera, Clock, RotateCcw, Trash2, Plus, Check, ShieldAlert, Sparkles, AlertCircle, FileText } from 'lucide-react';
import { Project, ProjectSnapshot } from '../types';
import { getSnapshots, createSnapshot, restoreSnapshot, deleteSnapshot } from '../services/storage';

interface SnapshotModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSnapshotRestored: (updatedProject: Project) => void;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({
  project,
  isOpen,
  onClose,
  onSnapshotRestored,
}) => {
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState<ProjectSnapshot | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

  const refreshSnapshots = () => {
    if (project && project.id) {
      const list = getSnapshots(project.id);
      setSnapshots(list);
      if (list.length > 0 && !selectedSnapshot) {
        setSelectedSnapshot(list[0]);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshSnapshots();
    }
  }, [isOpen, project.id]);

  if (!isOpen) return null;

  const handleCreateManualSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLabel.trim() || '手動版本快照';
    const created = createSnapshot(project, label, 'manual');
    setNewLabel('');
    refreshSnapshots();
    setSelectedSnapshot(created);
  };

  const handleRestore = (snapshotId: string) => {
    // Before restoring, create a "before restore" snapshot automatically
    createSnapshot(project, '復原舊版前的自動備份', 'before_major');
    const restored = restoreSnapshot(snapshotId);
    if (restored) {
      onSnapshotRestored(restored);
      onClose();
    }
  };

  const handleDelete = (snapshotId: string) => {
    deleteSnapshot(snapshotId);
    if (selectedSnapshot?.id === snapshotId) {
      setSelectedSnapshot(null);
    }
    refreshSnapshots();
  };

  const getTriggerBadge = (trigger: ProjectSnapshot['trigger']) => {
    switch (trigger) {
      case 'auto_hourly':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            <Clock size={10} />
            <span>每小時自動快照</span>
          </span>
        );
      case 'before_major':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-300">
            <ShieldAlert size={10} />
            <span>重大變更前備份</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300 border border-stone-200 dark:border-stone-800">
            <Camera size={10} />
            <span>使用者手動建立</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-6 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md">
              <Camera size={22} />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                <span>專案版本快照與復原中心</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                系統每小時會自動建立唯讀快照，您也可隨時手動備份以保護手稿創作
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
          >
            關閉
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Snapshots List */}
          <div className="w-full md:w-80 border-r border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 p-4 flex flex-col overflow-hidden">
            {/* Create Manual Snapshot Form */}
            <form onSubmit={handleCreateManualSnapshot} className="mb-4 space-y-2">
              <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                建立新版本快照
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="版本備註（如：完成前三章草稿）..."
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1 shrink-0"
                >
                  <Plus size={14} />
                  <span>快照</span>
                </button>
              </div>
            </form>

            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>歷史快照備份 ({snapshots.length})</span>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {snapshots.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
                  尚無快照記錄，可點擊上方按鈕建立第一個快照。
                </div>
              ) : (
                snapshots.map(snap => (
                  <div
                    key={snap.id}
                    onClick={() => setSelectedSnapshot(snap)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      selectedSnapshot?.id === snap.id
                        ? 'bg-amber-500/10 border-amber-500/50 dark:bg-amber-950/40 dark:border-amber-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-800 dark:text-stone-100 truncate max-w-[160px]">
                        {snap.label}
                      </span>
                      {getTriggerBadge(snap.trigger)}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                      <span>{new Date(snap.timestamp).toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>{snap.wordCount.toLocaleString()} 字</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Snapshot Detail Preview & Actions */}
          <div className="flex-1 p-6 flex flex-col bg-white dark:bg-stone-900 overflow-hidden">
            {selectedSnapshot ? (
              <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                {/* Snapshot Header Info */}
                <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                        {selectedSnapshot.label}
                      </h3>
                      {getTriggerBadge(selectedSnapshot.trigger)}
                    </div>
                    <p className="text-xs text-stone-500 font-mono">
                      建立時間：{new Date(selectedSnapshot.timestamp).toLocaleString()} • 總字數：{selectedSnapshot.wordCount.toLocaleString()} 字
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {confirmRestoreId === selectedSnapshot.id ? (
                      <div className="flex items-center space-x-2 animate-fade-in">
                        <button
                          onClick={() => handleRestore(selectedSnapshot.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1"
                        >
                          <Check size={14} />
                          <span>確認覆蓋還原</span>
                        </button>
                        <button
                          onClick={() => setConfirmRestoreId(null)}
                          className="px-2.5 py-1.5 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-medium"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRestoreId(selectedSnapshot.id)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
                      >
                        <RotateCcw size={14} />
                        <span>復原此快照版本</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(selectedSnapshot.id)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                      title="刪除此快照"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Chapter/Node Breakdown Preview */}
                <div className="flex-1 overflow-y-auto custom-scrollbar border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center space-x-1">
                    <FileText size={14} />
                    <span>快照手稿結構內容預覽</span>
                  </h4>

                  {selectedSnapshot.projectData.nodes?.map(node => (
                    <div
                      key={node.id}
                      className="p-3 bg-stone-50 dark:bg-stone-950/80 rounded-xl border border-stone-200/60 dark:border-stone-800/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-stone-200">
                        <span>{node.title || '無標題章節'}</span>
                        <span className="text-[10px] text-stone-400 font-mono uppercase">{node.type}</span>
                      </div>
                      <div
                        className="text-xs text-stone-600 dark:text-stone-400 line-clamp-3 font-serif"
                        dangerouslySetInnerHTML={{ __html: node.content || '<span class="italic text-stone-400">（空白內容）</span>' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <Sparkles size={36} className="text-amber-500/50" />
                <p className="text-xs text-stone-400 max-w-sm">
                  請從左側點選任一歷史快照版本，以檢視內文細節或覆蓋復原至專案手稿。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
