import React from 'react';
import { calculateStreak } from '../services/streak';
import { getSessions } from '../services/storage';
import { ArrowLeft, Flame, Calendar, Trophy } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface StreakPageProps {
  onBack: () => void;
}

export const StreakPage: React.FC<StreakPageProps> = ({ onBack }) => {
  const streak = calculateStreak();
  const sessions = getSessions();
  const { t } = useSettings();
  
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

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-8 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center mb-8">
          <button onClick={onBack} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full text-stone-500 dark:text-stone-400 mr-4 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-100">{t('streak.title')}</h1>
        </header>

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

        <div className="bg-white dark:bg-stone-900 p-8 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm mb-8">
           <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-6 flex items-center">
             <Calendar size={16} className="mr-2" />
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