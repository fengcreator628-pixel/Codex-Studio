import React, { useState } from 'react';
import { createProject } from '../services/storage';
import { ArrowLeft, Save, Check } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface CreateProjectPageProps {
  onBack: () => void;
  onCreated: () => void;
}

const PRESET_COLORS = [
  '#78716c', // Stone (Default)
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export const CreateProjectPage: React.FC<CreateProjectPageProps> = ({ onBack, onCreated }) => {
  const { t } = useSettings();
  const [formData, setFormData] = useState({
    title: '',
    coreTheme: '',
    targetWordCount: 50000,
    synopsis: '',
    projectColor: '#78716c',
    tags: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    const tagArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
    
    createProject(
      formData.title.trim(),
      formData.coreTheme,
      Number(formData.targetWordCount),
      formData.synopsis,
      formData.projectColor,
      tagArray
    );
    
    onCreated();
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-8 flex flex-col items-center transition-colors duration-300">
      <div className="w-full max-w-2xl">
        <button onClick={onBack} className="flex items-center text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> {t('create.back')}
        </button>
        
        <h1 className="text-3xl font-serif font-bold text-stone-800 dark:text-stone-100 mb-2">{t('create.title')}</h1>
        <p className="text-stone-500 dark:text-stone-400 mb-8">{t('create.subtitle')}</p>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-900 p-8 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">{t('create.field.title')}</label>
            <input 
              required
              name="title"
              type="text" 
              value={formData.title}
              onChange={handleChange}
              className="w-full text-xl font-serif p-3 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:border-stone-800 dark:focus:border-stone-400 bg-stone-50 dark:bg-stone-800 focus:bg-white dark:focus:bg-stone-900 transition-colors dark:text-stone-100"
              placeholder={t('create.placeholder.title')}
            />
          </div>

          {/* Theme & Goal */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">{t('create.field.theme')}</label>
              <input 
                name="coreTheme"
                type="text" 
                value={formData.coreTheme}
                onChange={handleChange}
                className="w-full p-3 text-sm border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:border-stone-800 dark:focus:border-stone-400 dark:bg-stone-800 dark:text-stone-100"
                placeholder={t('create.placeholder.theme')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">{t('create.field.target')}</label>
              <input 
                name="targetWordCount"
                type="number" 
                value={formData.targetWordCount}
                onChange={handleChange}
                className="w-full p-3 text-sm border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:border-stone-800 dark:focus:border-stone-400 dark:bg-stone-800 dark:text-stone-100"
              />
            </div>
          </div>

          {/* Synopsis */}
          <div>
             <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">{t('create.field.synopsis')}</label>
             <textarea 
               name="synopsis"
               rows={4}
               value={formData.synopsis}
               onChange={handleChange}
               className="w-full p-3 text-sm border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:border-stone-800 dark:focus:border-stone-400 resize-none font-serif leading-relaxed dark:bg-stone-800 dark:text-stone-100"
               placeholder={t('create.placeholder.synopsis')}
             />
          </div>

          {/* Color & Tags */}
          <div className="grid grid-cols-2 gap-6">
             <div>
               <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">{t('create.field.color')}</label>
               <div className="flex flex-wrap gap-2">
                 {PRESET_COLORS.map((color) => (
                   <button
                     key={color}
                     type="button"
                     onClick={() => setFormData(prev => ({ ...prev, projectColor: color }))}
                     className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                       formData.projectColor === color 
                         ? 'ring-2 ring-offset-2 ring-stone-400 dark:ring-offset-stone-900' 
                         : ''
                     }`}
                     style={{ backgroundColor: color }}
                   >
                     {formData.projectColor === color && (
                       <Check size={14} className="text-white drop-shadow-md" />
                     )}
                   </button>
                 ))}
               </div>
             </div>
             <div>
               <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">{t('create.field.tags')}</label>
               <input 
                  name="tags"
                  type="text" 
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder={t('create.placeholder.tags')}
                  className="w-full p-3 text-sm border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:border-stone-800 dark:focus:border-stone-400 dark:bg-stone-800 dark:text-stone-100"
               />
             </div>
          </div>

          <div className="pt-6 border-t border-stone-100 dark:border-stone-800 flex justify-end">
            <button 
              type="submit"
              className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-6 py-3 rounded-lg font-medium hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors flex items-center"
            >
              <Save size={18} className="mr-2" />
              {t('create.button')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};