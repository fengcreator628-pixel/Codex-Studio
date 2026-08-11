import React, { useState } from 'react';
import { Target, Award, Flame, ChevronUp, Clock, FileText } from 'lucide-react';

interface WordCountProgressProps {
  currentDocumentWords: number;
  currentDocumentChars: number;
  sessionWords: number;
  sessionTimeSeconds: number;
  targetWordCount: number;
  totalProjectWords: number;
}

export const WordCountProgress: React.FC<WordCountProgressProps> = ({
  currentDocumentWords,
  currentDocumentChars,
  sessionWords,
  sessionTimeSeconds,
  targetWordCount,
  totalProjectWords
}) => {
  const [expanded, setExpanded] = useState(false);

  // Session goal default 500 words or scaled to project target
  const sessionGoal = targetWordCount > 0 ? Math.min(500, Math.ceil(targetWordCount * 0.05)) : 500;
  const sessionPercent = Math.min(100, Math.round((sessionWords / sessionGoal) * 100));
  const totalPercent = targetWordCount > 0 ? Math.min(100, Math.round((totalProjectWords / targetWordCount) * 100)) : 0;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs} 小時 ${mins % 60} 分鐘`;
    return `${mins} 分鐘`;
  };

  return (
    <div className="relative inline-block">
      {/* Trigger button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center space-x-2 text-xs font-medium hover:bg-stone-200 dark:hover:bg-stone-800 px-2 py-1 rounded transition-colors"
      >
        <span className="font-semibold text-stone-700 dark:text-stone-300">
          {currentDocumentWords} 字
        </span>
        <span className="text-stone-400 dark:text-stone-500">
          (今日 +{sessionWords})
        </span>
        <div className="w-12 bg-stone-200/60 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-amber-500 h-full transition-all duration-300"
            style={{ width: `${sessionPercent}%` }}
          />
        </div>
        <ChevronUp size={12} className={`transition-transform text-stone-400 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Details */}
      {expanded && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl p-4 z-50 text-xs font-sans text-stone-700 dark:text-stone-300 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-3">
            <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Target size={14} className="text-amber-500" />
              本次寫作進度與統計
            </span>
            <span className="text-[10px] text-stone-400 font-mono bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
              即時更新
            </span>
          </div>

          {/* Current Doc Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
              <span className="text-[10px] text-stone-400 dark:text-stone-500 block mb-0.5">當前文件字數</span>
              <span className="font-serif text-base font-bold text-stone-800 dark:text-stone-100">
                {currentDocumentWords} 字
              </span>
            </div>
            <div className="p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
              <span className="text-[10px] text-stone-400 dark:text-stone-500 block mb-0.5">當前文件字元數</span>
              <span className="font-serif text-base font-bold text-stone-800 dark:text-stone-100">
                {currentDocumentChars} 字元
              </span>
            </div>
          </div>

          {/* Session Progress */}
          <div className="space-y-1 mb-3">
            <div className="flex justify-between items-center text-[11px]">
              <span className="flex items-center gap-1 text-stone-600 dark:text-stone-400 font-medium">
                <Flame size={12} className="text-amber-500" /> 今日寫作目標
              </span>
              <span className="font-semibold text-stone-850 dark:text-stone-200">
                {sessionWords} / {sessionGoal} 字 ({sessionPercent}%)
              </span>
            </div>
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${sessionPercent}%` }}
              />
            </div>
          </div>

          {/* Project Total Target */}
          {targetWordCount > 0 && (
            <div className="space-y-1 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div className="flex justify-between items-center text-[11px]">
                <span className="flex items-center gap-1 text-stone-600 dark:text-stone-400 font-medium">
                  <Award size={12} className="text-emerald-500" /> 整部小說寫作目標
                </span>
                <span className="font-semibold text-stone-850 dark:text-stone-200">
                  {totalProjectWords} / {targetWordCount} 字 ({totalPercent}%)
                </span>
              </div>
              <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Writing Time */}
          <div className="mt-3 text-[10px] text-stone-400 dark:text-stone-500 flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
            <span className="flex items-center gap-1">
              <Clock size={11} /> 本次寫作時長: {formatTime(sessionTimeSeconds)}
            </span>
            <span className="flex items-center gap-1">
              <FileText size={11} /> 系統自動追蹤
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
