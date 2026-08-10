import React from 'react';
import { Revision } from '../types';
import { Check, X, Clock, User } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface RevisionSidebarProps {
  revisions: Revision[];
  onAccept: (revision: Revision) => void;
  onReject: (revision: Revision) => void;
}

export const RevisionSidebar: React.FC<RevisionSidebarProps> = ({ revisions, onAccept, onReject }) => {
  const pendingRevisions = revisions.filter(r => r.status === 'pending').sort((a, b) => b.timestamp - a.timestamp);
  const { t } = useSettings();

  if (pendingRevisions.length === 0) {
    return (
      <div className="w-80 h-full border-l border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-6 flex flex-col items-center justify-center text-stone-400 dark:text-stone-500">
        <Check size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-medium">{t('revision.empty')}</p>
        <p className="text-xs mt-2 text-center">{t('revision.emptyDesc')}</p>
      </div>
    );
  }

  return (
    <div className="w-80 h-full border-l border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 overflow-y-auto">
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 sticky top-0 z-10">
        <h3 className="font-sans font-semibold text-stone-700 dark:text-stone-300 text-sm uppercase tracking-wide">
          {t('revision.title')} ({pendingRevisions.length})
        </h3>
      </div>
      
      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {pendingRevisions.map(rev => (
          <div key={rev.id} className="p-4 hover:bg-white dark:hover:bg-stone-800 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  rev.type === 'insert' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
                  rev.type === 'delete' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                }`}>
                  {rev.type.toUpperCase()}
                </span>
                <span className="text-xs text-stone-400 dark:text-stone-500 flex items-center">
                  <Clock size={10} className="mr-1" />
                  {new Date(rev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="mb-3 font-serif text-sm leading-relaxed text-stone-800 dark:text-stone-200">
              {rev.type === 'delete' && (
                 <div className="bg-rose-50 dark:bg-rose-950 p-2 rounded border border-rose-100 dark:border-rose-900 line-through decoration-rose-400 text-stone-500 dark:text-stone-400">
                   {rev.originalText}
                 </div>
              )}
              {rev.type === 'insert' && (
                 <div className="bg-emerald-50 dark:bg-emerald-950 p-2 rounded border border-emerald-100 dark:border-emerald-900">
                   {rev.revisedText}
                 </div>
              )}
              {rev.type === 'replace' && (
                <div className="space-y-1">
                   <div className="bg-rose-50 dark:bg-rose-950 p-1.5 rounded text-xs line-through text-stone-500 dark:text-stone-400">{rev.originalText}</div>
                   <div className="bg-emerald-50 dark:bg-emerald-950 p-1.5 rounded text-xs">{rev.revisedText}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 opacity-60 group-hover:opacity-100 transition-opacity">
               <div className="flex items-center text-xs text-stone-500 dark:text-stone-400">
                 <User size={12} className="mr-1" />
                 {rev.author}
               </div>
               <div className="flex space-x-2">
                 <button 
                   onClick={() => onReject(rev)}
                   className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900 rounded transition-colors"
                   title="Reject Change"
                 >
                   <X size={16} />
                 </button>
                 <button 
                   onClick={() => onAccept(rev)}
                   className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900 rounded transition-colors"
                   title="Accept Change"
                 >
                   <Check size={16} />
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};