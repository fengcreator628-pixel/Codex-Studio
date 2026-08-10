import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, Coffee, Flame, CheckCircle2, Volume2, VolumeX } from 'lucide-react';

interface PomodoroSprintTimerProps {
  currentWordCount?: number;
  onSprintComplete?: (wordsWritten: number) => void;
  compact?: boolean;
}

export const PomodoroSprintTimer: React.FC<PomodoroSprintTimerProps> = ({
  currentWordCount = 0,
  onSprintComplete,
  compact = false,
}) => {
  const PRESETS = [15, 25, 45, 60];
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Sprint session word count tracking
  const initialWordsRef = useRef<number>(currentWordCount);
  const [sprintWords, setSprintWords] = useState<number>(0);

  // Sound chime using Web Audio API
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.8); // C6

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      // ignore
    }
  };

  // Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Completed!
      setIsRunning(false);
      playChime();

      if (!isBreak) {
        const wordsDone = Math.max(0, currentWordCount - initialWordsRef.current);
        setSprintWords(wordsDone);
        if (onSprintComplete) onSprintComplete(wordsDone);
        setIsBreak(true);
        setTimeLeft(5 * 60); // 5 min break
      } else {
        setIsBreak(false);
        setTimeLeft(selectedMinutes * 60);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, isBreak, currentWordCount, selectedMinutes, onSprintComplete, soundEnabled]);

  // Track words when running
  useEffect(() => {
    if (isRunning && !isBreak) {
      setSprintWords(Math.max(0, currentWordCount - initialWordsRef.current));
    }
  }, [currentWordCount, isRunning, isBreak]);

  const handleStart = () => {
    if (!isRunning) {
      initialWordsRef.current = currentWordCount;
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(selectedMinutes * 60);
    setSprintWords(0);
    initialWordsRef.current = currentWordCount;
  };

  const handleSelectPreset = (mins: number) => {
    setSelectedMinutes(mins);
    setTimeLeft(mins * 60);
    setIsRunning(false);
    setIsBreak(false);
    setSprintWords(0);
    initialWordsRef.current = currentWordCount;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalSecs = isBreak ? 5 * 60 : selectedMinutes * 60;
  const progressPercent = Math.min(100, Math.max(0, ((totalSecs - timeLeft) / totalSecs) * 100));

  if (compact) {
    return (
      <div className="p-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center">
            {isBreak ? <Coffee size={13} className="mr-1 text-amber-600" /> : <Timer size={13} className="mr-1 text-amber-600" />}
            {isBreak ? '休息時間' : '寫作衝刺'}
          </span>
          <span className="font-mono font-bold text-stone-800 dark:text-stone-100">{formatTime(timeLeft)}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${isBreak ? 'bg-amber-500' : 'bg-amber-600'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-1">
            <button
              onClick={handleStart}
              className="p-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
              title={isRunning ? '暫停' : '開始寫作衝刺'}
            >
              {isRunning ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg transition-colors"
              title="重設"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          <span className="text-[10px] text-stone-400 font-mono">
            衝刺產出: <span className="font-bold text-amber-600 dark:text-amber-400">+{sprintWords} 字</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60">
            {isBreak ? <Coffee size={18} /> : <Timer size={18} />}
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-stone-800 dark:text-stone-100">
              {isBreak ? '小憩休息時間' : '番茄鐘寫作衝刺'}
            </h3>
            <p className="text-[11px] text-stone-400">
              {isBreak ? '放下鍵盤，放鬆眼睛與手腕' : '設定高效率專注時間，維持寫作節奏'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(prev => !prev)}
          className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          title={soundEnabled ? '關閉提示音' : '開啟提示音'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Preset Buttons */}
      {!isBreak && !isRunning && (
        <div className="flex items-center justify-between gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-medium">
          {PRESETS.map(mins => (
            <button
              key={mins}
              onClick={() => handleSelectPreset(mins)}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                selectedMinutes === mins
                  ? 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-200 font-bold shadow-sm'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              {mins} 分鐘
            </button>
          ))}
        </div>
      )}

      {/* Big Display Timer Circle */}
      <div className="relative flex flex-col items-center justify-center py-4 bg-stone-50 dark:bg-stone-950/60 rounded-xl border border-stone-200/80 dark:border-stone-800/80">
        <div className="text-4xl font-mono font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
          {formatTime(timeLeft)}
        </div>

        {/* Progress Bar */}
        <div className="w-3/4 bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden mt-3">
          <div
            className={`h-full transition-all duration-300 ${isBreak ? 'bg-amber-500' : 'bg-amber-600'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Status indicator */}
        <div className="flex items-center space-x-3 mt-3 text-xs font-medium text-stone-500 dark:text-stone-400">
          <span className="flex items-center">
            <Flame size={13} className="mr-1 text-amber-600" />
            本節累積：<strong className="font-mono text-amber-700 dark:text-amber-400 ml-0.5">+{sprintWords} 字</strong>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 pt-1">
        <button
          onClick={handleStart}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm ${
            isRunning
              ? 'bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
              : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 shadow-lg'
          }`}
        >
          {isRunning ? (
            <>
              <Pause size={15} />
              <span>暫停計時</span>
            </>
          ) : (
            <>
              <Play size={15} />
              <span>{timeLeft < selectedMinutes * 60 ? '繼續衝刺' : '開始寫作衝刺'}</span>
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="px-3.5 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-medium transition-colors flex items-center space-x-1"
          title="重設衝刺"
        >
          <RotateCcw size={15} />
          <span className="hidden sm:inline">重設</span>
        </button>
      </div>
    </div>
  );
};
