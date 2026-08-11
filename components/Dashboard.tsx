import React, { useState } from 'react';
import { Project, WritingStreak } from '../types';
import { Book, Plus, Flame, Clock, BarChart2, Moon, Sun, Tag, Filter, Trash2, BookOpen, FileText, Award, Film, Briefcase, Layers } from 'lucide-react';
import { calculateStreak } from '../services/streak';
import { useSettings } from '../contexts/SettingsContext';
import { deleteProject, getSessions } from '../services/storage';
import { countWords } from '../utils/wordCount';

interface DashboardProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onRefresh: () => void;
  onNavigateToCreate: () => void;
  onNavigateToStreak: () => void;
}

const PROJECT_TYPE_INFO: Record<string, { name: string; icon: any; colorClass: string; bgClass: string }> = {
  novel: { name: '小說創作', icon: BookOpen, colorClass: 'text-blue-700 dark:text-blue-300 border-blue-200/40 dark:border-blue-900/40', bgClass: 'bg-blue-50 dark:bg-blue-950/40' },
  prose: { name: '散文隨筆', icon: FileText, colorClass: 'text-emerald-700 dark:text-emerald-300 border-emerald-200/40 dark:border-emerald-900/40', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40' },
  academic: { name: '學術論文', icon: Award, colorClass: 'text-indigo-700 dark:text-indigo-300 border-indigo-200/40 dark:border-indigo-900/40', bgClass: 'bg-indigo-50 dark:bg-indigo-950/40' },
  screenplay: { name: '劇本創作', icon: Film, colorClass: 'text-rose-700 dark:text-rose-300 border-rose-200/40 dark:border-rose-900/40', bgClass: 'bg-rose-50 dark:bg-rose-950/40' },
  planning: { name: '企劃報告', icon: Briefcase, colorClass: 'text-amber-700 dark:text-amber-300 border-amber-200/40 dark:border-amber-900/40', bgClass: 'bg-amber-50 dark:bg-amber-950/40' },
  other: { name: '其他類型', icon: Layers, colorClass: 'text-stone-700 dark:text-stone-300 border-stone-200/40 dark:border-stone-800/40', bgClass: 'bg-stone-50 dark:bg-stone-900/40' }
};

export const Dashboard: React.FC<DashboardProps> = ({ projects, onSelectProject, onRefresh, onNavigateToCreate, onNavigateToStreak }) => {
  const streakInfo: WritingStreak = calculateStreak();
  const { theme, toggleTheme, lang, toggleLang, t } = useSettings();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Collect all unique tags across all projects
  const allTags = Array.from(
    new Set(projects.flatMap(p => p.projectTags || []))
  ).filter(Boolean);

  const filteredProjects = projects.filter(p => {
    const matchesTag = !selectedTag || (p.projectTags && p.projectTags.includes(selectedTag));
    const matchesType = !selectedType || (p.projectType === selectedType || (!p.projectType && selectedType === 'novel'));
    return matchesTag && matchesType;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const sessions = getSessions();
  
  // Calculate word count written today for each project
  const todayProjectWords = (projId: string) => {
    return sessions
      .filter(s => s.projectId === projId && s.date === todayStr)
      .reduce((sum, s) => sum + Math.max(0, s.wordCountDelta), 0);
  };

  const getProjectWordCount = (proj: Project) => {
    return (proj.nodes || []).reduce((acc, n) => {
      return acc + countWords(n.content || '');
    }, 0);
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string, title: string) => {
    e.stopPropagation();
    if (window.confirm(`確定要將作品「${title}」從書架中刪除嗎？此操作無法復原。`)) {
      deleteProject(projectId);
      onRefresh();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-stone-800 dark:text-stone-100 mb-1">{t('dashboard.title')}</h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm font-medium">{t('dashboard.subtitle')}</p>
          </div>
          
          <div className="flex items-center space-x-3">
             {/* Settings Toggles */}
             <div className="flex items-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full px-2 py-1 shadow-sm mr-4">
                <button 
                  onClick={toggleTheme} 
                  className="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                  title="切換深淺色主題"
                >
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
             </div>

             <div 
                className="flex items-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full px-4 py-2 shadow-sm space-x-6 cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                onClick={onNavigateToStreak}
             >
                <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-500 group">
                  <div className="bg-amber-50 dark:bg-amber-950 p-1.5 rounded-full group-hover:bg-amber-100 dark:group-hover:bg-amber-900 transition-colors">
                    <Flame size={16} fill="currentColor" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wider font-bold">{t('dashboard.streak')}</span>
                    <span className="font-bold leading-none text-stone-800 dark:text-stone-200">{streakInfo.currentStreak} {t('dashboard.days')}</span>
                  </div>
                </div>
                
                <div className="w-px h-8 bg-stone-100 dark:bg-stone-800"></div>
                
                <div className="flex items-center space-x-2 text-stone-600 dark:text-stone-400">
                    <div className="bg-stone-50 dark:bg-stone-800 p-1.5 rounded-full">
                      <Clock size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wider font-bold">{t('dashboard.lastWritten')}</span>
                      <span className="font-bold leading-none text-sm text-stone-800 dark:text-stone-200">
                        {streakInfo.lastWritingDate ? new Date(streakInfo.lastWritingDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : t('dashboard.none')}
                      </span>
                    </div>
                </div>
                
                <div className="ml-2 text-stone-300 dark:text-stone-600">
                    <BarChart2 size={16} />
                </div>
             </div>
          </div>
        </header>

        {/* Filters Section */}
        <div className="mb-8 space-y-3">
          {/* Project Type Filter Row */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2 bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center mr-2">
              <BookOpen size={14} className="mr-1.5 text-amber-600 dark:text-amber-500" />
              專案類型過濾:
            </span>
            <button
              onClick={() => setSelectedType(null)}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${
                selectedType === null
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              全部類型 ({projects.length})
            </button>
            {Object.entries(PROJECT_TYPE_INFO).map(([typeId, info]) => {
              const Icon = info.icon;
              const count = projects.filter(p => p.projectType === typeId || (!p.projectType && typeId === 'novel')).length;
              if (count === 0) return null; // Only show active types
              return (
                <button
                  key={typeId}
                  onClick={() => setSelectedType(typeId)}
                  className={`text-xs px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    selectedType === typeId
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  <Icon size={12} />
                  <span>{info.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedType === typeId ? 'bg-amber-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-300'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tag Filter Bar */}
          {allTags.length > 0 && (
            <div className="flex items-center space-x-2 flex-wrap gap-y-2 bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
              <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center mr-2">
                <Tag size={14} className="mr-1.5 text-amber-600 dark:text-amber-500" />
                {t('dashboard.filterTag')}:
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${
                  selectedTag === null
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 font-bold'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {t('dashboard.allTags')} ({projects.length})
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`text-xs px-3 py-1 rounded-lg font-medium transition-all flex items-center ${
                    selectedTag === tag
                      ? 'bg-amber-500 text-white font-bold shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  <Tag size={11} className="mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New Project Card */}
          <div 
             className="bg-white dark:bg-stone-900 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl p-6 flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-all cursor-pointer min-h-[240px] group"
             onClick={onNavigateToCreate}
          >
            <div className="bg-stone-50 dark:bg-stone-800 p-4 rounded-full mb-4 group-hover:bg-stone-100 dark:group-hover:bg-stone-700 transition-colors">
              <Plus size={32} />
            </div>
            <span className="font-medium font-serif text-lg">{t('dashboard.newProject')}</span>
          </div>

          {filteredProjects.map(project => {
            const nodeWordCount = (project.nodes || []).reduce((acc, n) => {
              if (n.type !== 'document') return acc;
              return acc + countWords(n.content || '');
            }, 0);

            const typeInfo = PROJECT_TYPE_INFO[project.projectType || 'novel'] || PROJECT_TYPE_INFO.novel;
            const TypeIcon = typeInfo.icon;

            return (
              <div 
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600 transition-all cursor-pointer flex flex-col min-h-[240px] relative overflow-hidden"
              >
                <div 
                  className="absolute top-0 left-0 w-1 h-full transition-all" 
                  style={{ backgroundColor: project.projectColor || '#78716c' }}
                />
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                       {/* Project Type Badge */}
                       <span className={`text-[9px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-sans font-bold uppercase tracking-wider ${typeInfo.bgClass} ${typeInfo.colorClass}`}>
                         <TypeIcon size={9} />
                         {typeInfo.name}
                       </span>
                       {project.coreTheme && (
                         <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 dark:text-stone-500">
                           {project.coreTheme}
                         </span>
                       )}
                     </div>
                     <div className="flex items-center space-x-2 flex-shrink-0">
                       {project.targetWordCount > 0 && (
                         <span className="text-[10px] bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-500 dark:text-stone-400 font-mono">
                           {t('dashboard.target')}: {(project.targetWordCount/1000).toFixed(0)}k
                         </span>
                       )}
                       <button
                         onClick={(e) => handleDeleteProject(e, project.id, project.title)}
                         className="p-1 text-stone-300 hover:text-red-600 dark:text-stone-600 dark:hover:text-red-400 rounded transition-colors"
                         title="從書架刪除作品"
                       >
                         <Trash2 size={14} />
                       </button>
                     </div>
                  </div>
                  
                  <h3 className="font-serif font-bold text-2xl text-stone-800 dark:text-stone-100 mb-2 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors leading-tight">
                    {project.title}
                  </h3>
                  
                  <p className="text-stone-400 dark:text-stone-500 text-sm line-clamp-3 font-serif italic mb-4">
                    {project.synopsis || "尚無摘要簡介..."}
                  </p>

                  {project.projectTags && project.projectTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.projectTags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 rounded border border-amber-200 dark:border-amber-900 flex items-center">
                          <Tag size={9} className="mr-1 opacity-70" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center text-xs text-stone-500 dark:text-stone-500">
                  <div className="flex items-center">
                    <Book size={14} className="mr-1.5" />
                    <span>{nodeWordCount.toLocaleString()} {t('dashboard.words')}</span>
                  </div>
                  <span>{new Date(project.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};