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
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  return (
    <div className="relative inline-block">
      {/* Trigger button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center space-x-2 text-xs font-medium hover:bg-stone-200 dark:hover:bg-stone-800 px-2 py-1 rounded transition-colors"
      >
        <span className="font-semibold text-stone-700 dark:text-stone-300">
          {currentDocumentWords} words
        </span>
        <span className="text-stone-400 dark:text-stone-500">
          (+{sessionWords})
        </span>
        <div className="w-12 bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
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
              Session Goals & Stats
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              Real-time
            </span>
          </div>

          {/* Current Doc Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
              <span className="text-[10px] text-stone-400 dark:text-stone-500 block">Active Doc Words</span>
              <span className="font-serif text-base font-bold text-stone-800 dark:text-stone-100">
                {currentDocumentWords}
              </span>
            </div>
            <div className="p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
              <span className="text-[10px] text-stone-400 dark:text-stone-500 block">Characters</span>
              <span className="font-serif text-base font-bold text-stone-800 dark:text-stone-100">
                {currentDocumentChars}
              </span>
            </div>
          </div>

          {/* Session Progress */}
          <div className="space-y-1 mb-3">
            <div className="flex justify-between items-center text-[11px]">
              <span className="flex items-center gap-1 text-stone-600 dark:text-stone-400">
                <Flame size={12} className="text-amber-500" /> Today's Target
              </span>
              <span className="font-medium text-stone-800 dark:text-stone-200">
                {sessionWords} / {sessionGoal} words ({sessionPercent}%)
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
                <span className="flex items-center gap-1 text-stone-600 dark:text-stone-400">
                  <Award size={12} className="text-emerald-500" /> Novel Target
                </span>
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {totalProjectWords} / {targetWordCount} ({totalPercent}%)
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
              <Clock size={11} /> Writing Duration: {formatTime(sessionTimeSeconds)}
            </span>
            <span className="flex items-center gap-1">
              <FileText size={11} /> Auto-tracked
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
