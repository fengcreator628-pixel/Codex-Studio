import React from 'react';
import { calculateStreak } from '../services/streak';
import { getSessions } from '../services/storage';
import { ArrowLeft, Flame, Calendar, Trophy, Grid, Target, Award } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip } from 'recharts';
import { Project } from '../types';
import { WritingTrendChart } from './WritingTrendChart';
import { countWords } from '../utils/wordCount';

interface StreakPageProps {
  onBack: () => void;
  projects?: Project[];
}

export const StreakPage: React.FC<StreakPageProps> = ({ onBack, projects = [] }) => {
  const streak = calculateStreak();
  const sessions = getSessions();
  const { theme, t } = useSettings();

  const todayStr = new Date().toISOString().split('T')[0];
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
  
  // Calculate total stats
  const totalWords = sessions.reduce((acc, s) => acc + s.wordCountDelta, 0);
  const totalTime = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  
  // Prepare calendar grid (last 28 days)
  const days = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const hasSession = sessions.some(s => s.date === dateStr && (s.wordCountDelta >= 50 || s.durationSeconds >= 300));
    days.push({ date: d, active: hasSession });
  }

  // Prepare yearly contribution heatmap data (last 364 days = 52 weeks)
  const today = new Date();
  const heatmapData: any[] = [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 364);
  const startDay = startDate.getDay(); // 0 is Sunday, 6 is Saturday
  // Align start to the Sunday of that week
  startDate.setDate(startDate.getDate() - startDay);

  for (let i = 0; i < 371; i++) { // 53 weeks * 7 days = 371 cells
    const current = new Date(startDate.getTime());
    current.setDate(current.getDate() + i);
    
    if (current > today) continue;
    
    const dateStr = current.toISOString().split('T')[0];
    const dayWords = sessions
      .filter(s => s.date === dateStr)
      .reduce((sum, s) => sum + Math.max(0, s.wordCountDelta), 0);
      
    const weekIndex = Math.floor(i / 7);
    const dayOfWeek = current.getDay(); // 0 (Sun) to 6 (Sat)
    
    heatmapData.push({
      week: weekIndex,
      day: dayOfWeek,
      words: dayWords,
      date: dateStr,
    });
  }

  // Custom cell rendering for Recharts ScatterChart to show classic GitHub contribution grid
  const renderCell = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined) return null;
    const words = payload.words;
    
    // Empty cell color adapts to dark / light mode
    let color = theme === 'dark' ? '#292524' : '#e7e5e4'; // stone-800 or stone-200
    if (words > 0) {
      if (words < 100) color = theme === 'dark' ? '#78350f' : '#fef3c7'; // amber-900 / amber-100
      else if (words < 300) color = '#fcd34d'; // amber-300
      else if (words < 700) color = '#f59e0b'; // amber-500
      else color = '#b45309'; // amber-700
    }
    
    return (
      <rect
        x={cx - 5}
        y={cy - 5}
        width={10}
        height={10}
        rx={2}
        ry={2}
        fill={color}
        className="transition-all duration-200 hover:stroke-stone-400 dark:hover:stroke-stone-300 cursor-pointer"
      />
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-stone-900 text-stone-100 p-2.5 rounded-xl text-xs shadow-xl border border-stone-800 font-sans">
          <p className="font-semibold text-stone-300">{data.date}</p>
          <p className="text-amber-400 mt-1 font-mono font-bold">{data.words} 字</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center mb-8">
          <button onClick={onBack} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full text-stone-500 dark:text-stone-400 mr-4 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-100">{t('streak.title')}</h1>
        </header>

        {/* Streaks stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="bg-amber-100 dark:bg-amber-950 p-3 rounded-full mb-3 text-amber-700 dark:text-amber-500">
                <Flame size={24} fill="currentColor" />
              </div>
              <span className="text-3xl font-bold text-stone-800 dark:text-stone-100 font-serif">{streak.currentStreak}</span>
              <span className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider font-medium mt-1">{t('streak.current')}</span>
           </div>
           
           <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="bg-stone-100 dark:bg-stone-800 p-3 rounded-full mb-3 text-stone-600 dark:text-stone-300">
                <Trophy size={24} />
              </div>
              <span className="text-3xl font-bold text-stone-800 dark:text-stone-100 font-serif">{streak.longestStreak}</span>
              <span className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider font-medium mt-1">{t('streak.best')}</span>
           </div>
        </div>

        {/* Writing Goals Tracker Widget */}
        {projects.length > 0 && (
          <div className="mb-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Target size={18} />
              </div>
              <div>
                <h2 className="font-serif font-bold text-base text-stone-800 dark:text-stone-100">
                  寫作目標與進度追蹤
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  監控專案的每日目標與手稿總進度，養成健康的每日寫作習慣
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Goals */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame size={13} className="text-amber-500" />
                  <span>每日寫作目標進度 (今日)</span>
                </h3>
                
                <div className="space-y-3">
                  {projects.slice(0, 3).map(proj => {
                    const todayWords = todayProjectWords(proj.id);
                    const dailyTarget = proj.dailyTargetWordCount || 500;
                    const percent = Math.min(100, Math.round((todayWords / dailyTarget) * 100));

                    return (
                      <div key={`daily-${proj.id}`} className="space-y-1 bg-stone-50 dark:bg-stone-950/40 p-3 rounded-xl border border-stone-100 dark:border-stone-800/60">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-stone-700 dark:text-stone-300 truncate max-w-[150px]">
                            {proj.title}
                          </span>
                          <span className="font-mono text-stone-500 dark:text-stone-400">
                            {todayWords} / {dailyTarget} 字 ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Project Goals */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={13} className="text-amber-500" />
                  <span>手稿總長目標進度</span>
                </h3>

                <div className="space-y-3">
                  {projects.slice(0, 3).map(proj => {
                    const totalWords = getProjectWordCount(proj);
                    const targetWords = proj.targetWordCount || 50000;
                    const percent = Math.min(100, Math.round((totalWords / targetWords) * 100));

                    return (
                      <div key={`project-${proj.id}`} className="space-y-1 bg-stone-50 dark:bg-stone-950/40 p-3 rounded-xl border border-stone-100 dark:border-stone-800/60">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-stone-700 dark:text-stone-300 truncate max-w-[150px]">
                            {proj.title}
                          </span>
                          <span className="font-mono text-stone-500 dark:text-stone-400">
                            {totalWords.toLocaleString()} / {targetWords.toLocaleString()} 字 ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-stone-600 dark:bg-amber-600/80 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7-Day Writing Trend Chart */}
        <WritingTrendChart />

        {/* 28-day Calendar Grid */}
        <div className="bg-white dark:bg-stone-900 p-8 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm mb-8">
           <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-6 flex items-center">
             <Calendar size={16} className="mr-2 text-amber-600" />
             {t('streak.last28')}
           </h3>
           <div className="grid grid-cols-7 gap-3">
              {days.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center">
                   <div 
                     className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                       day.active 
                       ? 'bg-amber-500 text-white shadow-md scale-105' 
                       : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600'
                     }`}
                     title={day.date.toDateString()}
                   >
                     {day.date.getDate()}
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Annual Contribution Heatmap (Recharts Scatter) */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm mb-8">
           <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4 flex items-center">
             <Grid size={16} className="mr-2 text-amber-600" />
             年度寫作活動熱圖 (過去一年)
           </h3>
           
           <div className="w-full h-[160px]">
             <ResponsiveContainer width="100%" height="100%">
               <ScatterChart
                 margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
               >
                 <XAxis 
                   type="number" 
                   dataKey="week" 
                   domain={[0, 52]} 
                   tick={false} 
                   axisLine={false} 
                 />
                 <YAxis 
                   type="number" 
                   dataKey="day" 
                   domain={[0, 6]} 
                   reversed={true} 
                   tickFormatter={(v) => ['日', '一', '二', '三', '四', '五', '六'][v]}
                   width={24}
                   axisLine={false}
                   tickLine={false}
                   tick={{ fontSize: 10, fill: theme === 'dark' ? '#a8a29e' : '#78716c' }}
                 />
                 <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                 <Scatter 
                   data={heatmapData} 
                   shape={renderCell} 
                 />
               </ScatterChart>
             </ResponsiveContainer>
           </div>

           {/* Legend */}
           <div className="mt-2 flex items-center justify-end space-x-2 text-[10px] text-stone-400 dark:text-stone-500">
             <span>少</span>
             <div className="w-2.5 h-2.5 rounded-sm bg-stone-200 dark:bg-stone-800" />
             <div className="w-2.5 h-2.5 rounded-sm bg-amber-100 dark:bg-amber-900" />
             <div className="w-2.5 h-2.5 rounded-sm bg-amber-300 dark:bg-amber-500" />
             <div className="w-2.5 h-2.5 rounded-sm bg-amber-500 dark:bg-amber-600" />
             <div className="w-2.5 h-2.5 rounded-sm bg-amber-700 dark:bg-amber-800" />
             <span>多</span>
           </div>
        </div>

        {/* Total Stats */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-stone-100 dark:bg-stone-900 border border-transparent dark:border-stone-800 p-4 rounded-lg flex items-center justify-between">
              <span className="text-stone-500 dark:text-stone-400 text-sm">{t('streak.totalWords')}</span>
              <span className="font-serif font-bold text-lg text-stone-800 dark:text-stone-200">{totalWords.toLocaleString()}</span>
           </div>
           <div className="bg-stone-100 dark:bg-stone-900 border border-transparent dark:border-stone-800 p-4 rounded-lg flex items-center justify-between">
              <span className="text-stone-500 dark:text-stone-400 text-sm">{t('streak.totalTime')}</span>
              <span className="font-serif font-bold text-lg text-stone-800 dark:text-stone-200">{Math.round(totalTime / 60 / 60)} {t('streak.hrs')}</span>
           </div>
        </div>
      </div>
    </div>
  );
};
