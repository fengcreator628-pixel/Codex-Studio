import React from 'react';
import { PenTool, ChevronRight } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface WelcomePageProps {
  onStart: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onStart }) => {
  const { t } = useSettings();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden transition-colors duration-300">
       {/* Background decoration */}
       <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-stone-300 dark:bg-stone-700 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-overlay"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-stone-200 dark:bg-stone-800 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-overlay"></div>
       </div>

       <div className="relative z-10 max-w-lg">
          <div className="w-20 h-20 bg-stone-900 dark:bg-stone-100 rounded-2xl mx-auto mb-8 flex items-center justify-center text-stone-50 dark:text-stone-900 shadow-xl rotate-3">
             <PenTool size={40} />
          </div>
          
          <h1 className="font-serif text-5xl font-bold text-stone-900 dark:text-stone-50 mb-4 tracking-tight">
            {t('welcome.title')}
          </h1>
          
          <p className="font-sans text-stone-500 dark:text-stone-400 text-lg mb-12 leading-relaxed whitespace-pre-line">
            {t('welcome.subtitle')}
          </p>
          
          <button 
            onClick={onStart}
            className="group relative inline-flex items-center justify-center px-8 py-3.5 bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 font-medium rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <span>{t('welcome.enter')}</span>
            <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <p className="mt-8 text-xs text-stone-400 dark:text-stone-600 font-medium uppercase tracking-widest">
            {t('welcome.footer')}
          </p>
       </div>
    </div>
  );
};