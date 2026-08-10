import { WritingSession, WritingStreak } from '../types';
import { getSessions } from './storage';

export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateStreak = (): WritingStreak => {
  const sessions = getSessions();
  
  // Aggregate session metrics per date
  const dailyStats = new Map<string, { words: number; time: number }>();
  
  sessions.forEach(session => {
    if (!session.date) return;
    const current = dailyStats.get(session.date) || { words: 0, time: 0 };
    dailyStats.set(session.date, {
      words: current.words + Math.max(0, session.wordCountDelta || 0),
      time: current.time + Math.max(0, session.durationSeconds || 0)
    });
  });

  const validDates = new Set<string>();
  dailyStats.forEach((stats, dateStr) => {
    // Valid writing day if user typed > 0 words OR spent >= 30s writing
    if (stats.words > 0 || stats.time >= 30) {
      validDates.add(dateStr);
    }
  });

  const sortedDates = Array.from(validDates).sort();
  
  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastWritingDate: null };
  }

  const lastWritingDate = sortedDates[sortedDates.length - 1];
  
  const todayStr = getLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);
  
  let currentStreak = 0;
  
  // If the last writing date is today or yesterday, streak is active
  if (validDates.has(todayStr) || validDates.has(yesterdayStr)) {
    const startDateStr = validDates.has(todayStr) ? todayStr : yesterdayStr;
    const [year, month, day] = startDateStr.split('-').map(Number);
    let checkDate = new Date(year, month - 1, day);
    
    while (true) {
      const dateStr = getLocalDateString(checkDate);
      if (validDates.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate Longest Streak
  let maxStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;
  
  sortedDates.forEach(dateStr => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffTime = Math.abs(dateObj.getTime() - prevDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > maxStreak) maxStreak = tempStreak;
    prevDate = dateObj;
  });

  return {
    currentStreak,
    longestStreak: Math.max(currentStreak, maxStreak),
    lastWritingDate
  };
};

export const getTodaySessionStats = (projectId: string) => {
    const today = getLocalDateString(new Date());
    const sessions = getSessions().filter(s => s.projectId === projectId && s.date === today);
    
    return sessions.reduce((acc, curr) => ({
        words: acc.words + (curr.wordCountDelta || 0),
        time: acc.time + (curr.durationSeconds || 0)
    }), { words: 0, time: 0 });
};
