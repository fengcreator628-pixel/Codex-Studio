import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, Volume2, VolumeX, Music, Check, Sparkles, Feather } from 'lucide-react';
import { soundEngine } from '../services/sound';

interface FocusModeProps {
  content: string;
  onChange: (newContent: string) => void;
  documentTitle: string;
  onExit: () => void;
}

export const FocusModeOverlay: React.FC<FocusModeProps> = ({
  content,
  onChange,
  documentTitle,
  onExit
}) => {
  const [ambientSound, setAmbientSound] = useState<'rain' | 'waves' | 'brown' | 'off'>('off');
  const [typewriterClicks, setTypewriterClicks] = useState(true);
  const [volume, setVolume] = useState(0.2);
  const [wordCount, setWordCount] = useState(0);

  const editorRef = React.useRef<HTMLDivElement>(null);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  // Update word count
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, ' ').trim();
    setWordCount(text ? text.split(/\s+/).length : 0);
  }, [content]);

  // Handle ambient sound change
  const handleSoundChange = (type: 'rain' | 'waves' | 'brown' | 'off') => {
    setAmbientSound(type);
    soundEngine.setAmbientSound(type, volume);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    soundEngine.setVolume(newVol);
  };

  // Input & Key handlers
  const handleInput = () => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      onChange(newHtml);

      if (typewriterClicks) {
        soundEngine.playTypewriterClick();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      soundEngine.stopAmbient();
      onExit();
    }
  };

  return (
    <div 
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 bg-stone-900 text-stone-100 flex flex-col font-serif select-none animate-in fade-in duration-300"
    >
      {/* Subtle Floating Controls (Fades out when typing, visible on mouse hover) */}
      <header className="opacity-40 hover:opacity-100 transition-opacity duration-300 px-8 py-4 flex items-center justify-between text-xs text-stone-400 font-sans border-b border-stone-800/50">
        <div className="flex items-center space-x-3">
          <Feather size={16} className="text-amber-500" />
          <span className="font-medium text-stone-200 truncate max-w-xs">{documentTitle}</span>
          <span className="text-stone-600">|</span>
          <span>Focus Mode</span>
        </div>

        {/* Focus Controls */}
        <div className="flex items-center space-x-6">
          {/* Ambient Sound Selector */}
          <div className="flex items-center space-x-2">
            <Music size={14} className="text-stone-400" />
            <select
              value={ambientSound}
              onChange={(e) => handleSoundChange(e.target.value as 'rain' | 'waves' | 'brown' | 'off')}
              className="bg-stone-800 text-stone-300 text-xs rounded px-2 py-1 border border-stone-700 outline-none focus:border-amber-500"
            >
              <option value="off">Ambient: Off</option>
              <option value="rain">Rainfall</option>
              <option value="waves">Ocean Waves</option>
              <option value="brown">Brown Noise</option>
            </select>

            {ambientSound !== 'off' && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 accent-amber-500 cursor-pointer"
                title="Ambient Volume"
              />
            )}
          </div>

          {/* Typewriter clicks toggle */}
          <button
            onClick={() => setTypewriterClicks(!typewriterClicks)}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded transition-colors ${
              typewriterClicks ? 'text-amber-400 bg-amber-950/40' : 'text-stone-500'
            }`}
            title="Typewriter Sound Effects"
          >
            <Volume2 size={14} />
            <span>Click SFX</span>
          </button>

          {/* Word Count */}
          <div className="text-stone-400 font-mono">
            {wordCount} words
          </div>

          {/* Exit Button */}
          <button
            onClick={() => {
              soundEngine.stopAmbient();
              onExit();
            }}
            className="flex items-center space-x-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-lg transition-colors font-sans"
            title="Press Esc to exit Focus Mode"
          >
            <Minimize2 size={14} />
            <span>Exit Focus (Esc)</span>
          </button>
        </div>
      </header>

      {/* Main Sanctuary Writing Stage */}
      <main className="flex-1 overflow-y-auto px-4 py-12 flex justify-center custom-scrollbar">
        <div className="w-full max-w-2xl px-6 py-8">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            className="w-full min-h-[70vh] outline-none text-xl leading-relaxed text-stone-200 font-serif tracking-wide empty:before:content-['Type_freely...'] empty:before:text-stone-600"
          />
        </div>
      </main>

      {/* Footer Minimal Stats */}
      <footer className="py-3 px-8 text-center text-[11px] font-sans text-stone-600 opacity-30 hover:opacity-80 transition-opacity">
        Press <kbd className="px-1 py-0.5 bg-stone-800 rounded text-stone-400">Esc</kbd> anytime to return to standard workspace
      </footer>
    </div>
  );
};
