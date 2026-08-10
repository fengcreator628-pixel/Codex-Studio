import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Calendar, Award, Flame, BarChart3 } from 'lucide-react';
import { getSessions } from '../services/storage';
import { getLocalDateString } from '../services/streak';

export const WritingTrendChart: React.FC = () => {
  const [daysCount, setDaysCount] = useState<7 | 14>(7);

  // Compute past N days writing stats
  const chartData = useMemo(() => {
    const sessions = getSessions();
    
    // Aggregate words per date string YYYY-MM-DD
    const dateMap = new Map<string, number>();
    sessions.forEach(s => {
      if (!s.date) return;
      const prev = dateMap.get(s.date) || 0;
      dateMap.set(s.date, prev + Math.max(0, s.wordCountDelta || 0));
    });

    const list = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      const wordCount = dateMap.get(dateStr) || 0;

      // Label for display (e.g. "8/10" or "周一")
      const label = d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });

      list.push({
        dateStr,
        label,
        dayName,
        wordCount,
      });
    }

    return list;
  }, [daysCount]);

  // Compute summary metrics
  const totalWords = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.wordCount, 0);
  }, [chartData]);

  const avgWords = useMemo(() => {
    return Math.round(totalWords / chartData.length);
  }, [totalWords, chartData.length]);

  const maxWordsDay = useMemo(() => {
    let max = 0;
    let maxDayLabel = '';
    chartData.forEach(d => {
      if (d.wordCount >= max) {
        max = d.wordCount;
        maxDayLabel = d.label;
      }
    });
    return { count: max, label: maxDayLabel };
  }, [chartData]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-stone-900 text-stone-100 p-3 rounded-xl shadow-xl border border-stone-800 text-xs space-y-1">
          <p className="font-bold text-amber-400 flex items-center space-x-1">
            <Calendar size={12} className="mr-1" />
            <span>{data.dateStr} ({data.dayName})</span>
          </p>
          <p className="text-stone-300 font-mono">
            當日字數：<span className="font-bold text-white text-sm">{data.wordCount.toLocaleString()}</span> 字
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm mb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60">
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-100 flex items-center space-x-2">
              <span>每日寫作字數趨勢</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-medium">
                近 {daysCount} 天產出
              </span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              視覺化追蹤過去一週的創作累積與寫作習慣
            </p>
          </div>
        </div>

        {/* Range Switcher Segmented Control */}
        <div className="flex items-center bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setDaysCount(7)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              daysCount === 7
                ? 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-200 shadow-sm font-bold'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            近 7 天
          </button>
          <button
            onClick={() => setDaysCount(14)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              daysCount === 14
                ? 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-200 shadow-sm font-bold'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            近 14 天
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800/80 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
            <BarChart3 size={18} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">7 日總字數</span>
            <span className="text-xl font-bold font-mono text-stone-800 dark:text-stone-100">
              {totalWords.toLocaleString()} <span className="text-xs font-normal text-stone-400">字</span>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800/80 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            <Flame size={18} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">日均產出字數</span>
            <span className="text-xl font-bold font-mono text-stone-800 dark:text-stone-100">
              {avgWords.toLocaleString()} <span className="text-xs font-normal text-stone-400">字/天</span>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800/80 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-500 text-white">
            <Award size={18} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">最高單日產出</span>
            <span className="text-xl font-bold font-mono text-stone-800 dark:text-stone-100">
              {maxWordsDay.count.toLocaleString()} <span className="text-xs font-normal text-stone-400">字 ({maxWordsDay.label})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorWordCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" opacity={0.5} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#a8a29e' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#a8a29e' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="wordCount"
              stroke="#d97706"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorWordCount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
