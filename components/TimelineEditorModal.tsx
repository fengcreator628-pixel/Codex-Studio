import React, { useState } from 'react';
import { Project, TimelineEvent } from '../types';
import { 
  Clock, Plus, Trash2, Edit2, Save, X, Calendar, User, MapPin, 
  Sparkles, Filter, ChevronUp, ChevronDown, Check, BookOpen 
} from 'lucide-react';

interface TimelineEditorModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject: (updatedProject: Project) => void;
}

const EVENT_TYPES: { key: TimelineEvent['type']; label: string; color: string }[] = [
  { key: 'main_plot', label: '主線劇情', color: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800' },
  { key: 'sub_plot', label: '支線情節', color: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800' },
  { key: 'backstory', label: '前情歷史', color: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800' },
  { key: 'character_arc', label: '角色轉折', color: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800' },
];

const IMPORTANCE_LEVELS: { key: TimelineEvent['importance']; label: string; color: string }[] = [
  { key: 'critical', label: '高 (核心轉折)', color: 'bg-red-500 text-white' },
  { key: 'major', label: '中 (重要事件)', color: 'bg-amber-500 text-white' },
  { key: 'minor', label: '低 (細節鋪陳)', color: 'bg-stone-400 text-white' },
];

export const TimelineEditorModal: React.FC<TimelineEditorModalProps> = ({
  project,
  isOpen,
  onClose,
  onUpdateProject,
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>(project.timelineEvents || []);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formTimeLabel, setFormTimeLabel] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<TimelineEvent['type']>('main_plot');
  const [formImportance, setFormImportance] = useState<TimelineEvent['importance']>('major');
  const [formCharacters, setFormCharacters] = useState('');
  const [formLocations, setFormLocations] = useState('');

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setIsCreating(true);
    setEditingEvent(null);
    setFormTitle('');
    setFormTimeLabel(`時間點 #${events.length + 1}`);
    setFormDescription('');
    setFormType('main_plot');
    setFormImportance('major');
    setFormCharacters('');
    setFormLocations('');
  };

  const handleOpenEdit = (evt: TimelineEvent) => {
    setEditingEvent(evt);
    setIsCreating(false);
    setFormTitle(evt.title);
    setFormTimeLabel(evt.timeLabel);
    setFormDescription(evt.description);
    setFormType(evt.type);
    setFormImportance(evt.importance);
    setFormCharacters((evt.relatedCharacterNames || []).join(', '));
    setFormLocations((evt.relatedLocationNames || []).join(', '));
  };

  const handleSaveEvent = () => {
    if (!formTitle.trim()) return;

    const chars = formCharacters.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    const locs = formLocations.split(/[,，]/).map(s => s.trim()).filter(Boolean);

    let updatedList: TimelineEvent[] = [];

    if (isCreating) {
      const newEvt: TimelineEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        projectId: project.id,
        title: formTitle.trim(),
        timeLabel: formTimeLabel.trim() || '未設定時間',
        orderIndex: events.length,
        description: formDescription,
        type: formType,
        importance: formImportance,
        relatedCharacterNames: chars,
        relatedLocationNames: locs,
      };
      updatedList = [...events, newEvt];
    } else if (editingEvent) {
      updatedList = events.map(e => {
        if (e.id === editingEvent.id) {
          return {
            ...e,
            title: formTitle.trim(),
            timeLabel: formTimeLabel.trim(),
            description: formDescription,
            type: formType,
            importance: formImportance,
            relatedCharacterNames: chars,
            relatedLocationNames: locs,
          };
        }
        return e;
      });
    }

    setEvents(updatedList);
    onUpdateProject({ ...project, timelineEvents: updatedList });
    setEditingEvent(null);
    setIsCreating(false);
  };

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('確定要刪除此故事時間點嗎？')) {
      const updatedList = events.filter(e => e.id !== id);
      setEvents(updatedList);
      onUpdateProject({ ...project, timelineEvents: updatedList });
      if (editingEvent?.id === id) {
        setEditingEvent(null);
        setIsCreating(false);
      }
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= events.length) return;

    const nextList = [...events];
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;

    // re-assign orderIndex
    const reordered = nextList.map((e, idx) => ({ ...e, orderIndex: idx }));
    setEvents(reordered);
    onUpdateProject({ ...project, timelineEvents: reordered });
  };

  const filteredEvents = selectedType === 'all' 
    ? events 
    : events.filter(e => e.type === selectedType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Modal Top Bar */}
        <div className="p-5 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-md">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                <span>小說故事時間線編輯器 (Timeline)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono">
                  {events.length} 個時間點
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                按時間順序梳理故事重大事件、歷史前情與角色轉折，防範邏輯衝突與時間線混亂
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Events Timeline Stream */}
          <div className="w-full md:w-1/2 border-r border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 p-4 flex flex-col overflow-hidden space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center space-x-1">
                <Calendar size={13} />
                <span>時間軸列表</span>
              </span>

              <button
                onClick={handleOpenCreate}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
              >
                <Plus size={13} />
                <span>新增時間點</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1 pb-2 border-b border-stone-200 dark:border-stone-800">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedType === 'all'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
                全部 ({events.length})
              </button>
              {EVENT_TYPES.map(t => {
                const count = events.filter(e => e.type === t.key).length;
                return (
                  <button
                    key={t.key}
                    onClick={() => setSelectedType(t.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedType === t.key
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                    }`}
                  >
                    {t.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Events Stream List */}
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 relative pl-4 border-l-2 border-amber-300/60 dark:border-amber-800/60 ml-2 py-2">
              {filteredEvents.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
                  尚未建立任何時間點事件，點擊右上角「新增時間點」開始梳理時間線。
                </div>
              ) : (
                filteredEvents.map((evt, idx) => {
                  const typeMeta = EVENT_TYPES.find(t => t.key === evt.type) || EVENT_TYPES[0];
                  const impMeta = IMPORTANCE_LEVELS.find(i => i.key === evt.importance) || IMPORTANCE_LEVELS[1];
                  const isSelected = editingEvent?.id === evt.id;

                  return (
                    <div
                      key={evt.id}
                      onClick={() => handleOpenEdit(evt)}
                      className={`relative p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/80 dark:bg-amber-950/40 dark:border-amber-700 shadow-md ring-1 ring-amber-500/50'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-amber-300'
                      }`}
                    >
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[23px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-stone-900 shadow-xs ${impMeta.color}`} />

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                          {evt.timeLabel}
                        </span>

                        <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleMove(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20"
                            title="前移"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => handleMove(idx, 'down')}
                            disabled={idx === filteredEvents.length - 1}
                            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20"
                            title="後移"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="p-1 text-stone-400 hover:text-red-600 rounded ml-1"
                            title="刪除"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                        {evt.title}
                      </h4>

                      {evt.description && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 italic">
                          {evt.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                        <span className={`px-2 py-0.5 rounded border font-medium ${typeMeta.color}`}>
                          {typeMeta.label}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${impMeta.color}`}>
                          {impMeta.label}
                        </span>

                        {evt.relatedCharacterNames && evt.relatedCharacterNames.length > 0 && (
                          <span className="text-stone-400 flex items-center space-x-1">
                            <User size={10} />
                            <span>{evt.relatedCharacterNames.join(', ')}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Event Editor Form */}
          <div className="w-full md:w-1/2 bg-white dark:bg-stone-900 p-6 flex flex-col overflow-y-auto custom-scrollbar">
            {isCreating || editingEvent ? (
              <div className="space-y-4">
                <div className="pb-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                    <Sparkles size={16} className="text-amber-600" />
                    <span>{isCreating ? '建立故事時間點' : '編輯時間點細節'}</span>
                  </h3>

                  <button
                    onClick={handleSaveEvent}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1"
                  >
                    <Save size={14} />
                    <span>儲存時間點</span>
                  </button>
                </div>

                {/* Event Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    事件名稱 *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="例如：觀星台異象與靈魂封印破解"
                    className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-sm font-serif font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Time Label */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                      時間點標記 (紀年/時間)
                    </label>
                    <input
                      type="text"
                      value={formTimeLabel}
                      onChange={e => setFormTimeLabel(e.target.value)}
                      placeholder="例如：王曆 402 年初冬"
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                      劇情類型
                    </label>
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value as TimelineEvent['type'])}
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none"
                    >
                      {EVENT_TYPES.map(t => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Importance */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    重要程度 (轉折等級)
                  </label>
                  <div className="flex space-x-2">
                    {IMPORTANCE_LEVELS.map(imp => (
                      <button
                        key={imp.key}
                        type="button"
                        onClick={() => setFormImportance(imp.key)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          formImportance === imp.key
                            ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                            : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        {imp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    事件詳細過程與結果描述
                  </label>
                  <textarea
                    rows={5}
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="描述事件發生的背景、經過、引發的衝突及對後續劇情的深遠影響..."
                    className="w-full p-3.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-serif leading-relaxed"
                  />
                </div>

                {/* Related Characters & Locations */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                      關聯登場人物 (逗號分隔)
                    </label>
                    <input
                      type="text"
                      value={formCharacters}
                      onChange={e => setFormCharacters(e.target.value)}
                      placeholder="林星河, 葉千霜"
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                      關聯地點/場景
                    </label>
                    <input
                      type="text"
                      value={formLocations}
                      onChange={e => setFormLocations(e.target.value)}
                      placeholder="觀星台, 雲霄遺蹟"
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-400 space-y-3">
                <Clock size={36} className="text-amber-600/40" />
                <p className="text-sm font-serif">請由左側點選時間點進行編輯，或點選「新增時間點」。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
