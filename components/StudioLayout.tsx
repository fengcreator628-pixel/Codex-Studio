import React, { useState, useRef, useEffect } from 'react';

interface StudioLayoutProps {
  leftContent: React.ReactNode;
  centerContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftOpen: boolean;
  rightOpen: boolean;
  onToggleLeft: (open: boolean) => void;
  onToggleRight: (open: boolean) => void;
}

const MIN_WIDTH = 240;
const MAX_WIDTH = 600;
const SNAP_THRESHOLD = 80;

export const StudioLayout: React.FC<StudioLayoutProps> = ({
  leftContent,
  centerContent,
  rightContent,
  leftOpen,
  rightOpen,
  onToggleLeft,
  onToggleRight
}) => {
  // Store preferred widths (restore to these when toggled open)
  const [sidebarConfig, setSidebarConfig] = useState({ left: 280, right: 320 });
  
  // Track active resizing
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const resizingRef = useRef<'left' | 'right' | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;

      if (resizingRef.current === 'left') {
        const newWidth = e.clientX;
        setSidebarConfig(prev => ({ ...prev, left: newWidth }));
        
        // Auto-open if dragging out from closed state
        if (!leftOpen && newWidth > SNAP_THRESHOLD) {
            onToggleLeft(true);
        }
      } else {
        const newWidth = window.innerWidth - e.clientX;
        setSidebarConfig(prev => ({ ...prev, right: newWidth }));
        
        // Auto-open if dragging out from closed state
        if (!rightOpen && newWidth > SNAP_THRESHOLD) {
            onToggleRight(true);
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!resizingRef.current) return;

      const side = resizingRef.current;
      resizingRef.current = null;
      setIsResizing(null);
      
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      
      // Commit Snap Logic
      if (side === 'left') {
         const rawWidth = e.clientX;
         if (rawWidth < SNAP_THRESHOLD) {
             onToggleLeft(false);
             // Reset to default if snapped closed, so next open isn't 0px
             setSidebarConfig(prev => ({ ...prev, left: 280 })); 
         } else {
             // Clamp to valid range
             setSidebarConfig(prev => ({ 
                 ...prev, 
                 left: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, rawWidth)) 
             }));
         }
      } else {
         const rawWidth = window.innerWidth - e.clientX;
         if (rawWidth < SNAP_THRESHOLD) {
             onToggleRight(false);
             setSidebarConfig(prev => ({ ...prev, right: 320 }));
         } else {
             setSidebarConfig(prev => ({ 
                 ...prev, 
                 right: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, rawWidth)) 
             }));
         }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [leftOpen, rightOpen, onToggleLeft, onToggleRight]);

  const startResize = (side: 'left' | 'right') => {
    setIsResizing(side);
    resizingRef.current = side;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Helper to determine the style width based on state
  const getRenderStyle = (side: 'left' | 'right') => {
      const isOpen = side === 'left' ? leftOpen : rightOpen;
      const width = side === 'left' ? sidebarConfig.left : sidebarConfig.right;
      const isActiveDrag = isResizing === side;

      // During drag
      if (isActiveDrag) {
          // In snap zone
          if (width < SNAP_THRESHOLD) {
              return { width: 0, opacity: 0.5 }; // Visual snap hint
          }
          // Normal drag constraint
          return { 
              width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width)), 
              opacity: 1 
          };
      }

      // Static state
      return { 
          width: isOpen ? Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width)) : 0, 
          opacity: isOpen ? 1 : 0 
      };
  };

  const leftStyle = getRenderStyle('left');
  const rightStyle = getRenderStyle('right');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
      
      {/* LEFT PANEL */}
      <aside 
        style={{ width: leftStyle.width, opacity: leftStyle.opacity }} 
        className="flex-shrink-0 h-full border-r border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 transition-all duration-300 ease-out overflow-hidden relative will-change-[width,opacity]"
      >
        <div className="h-full w-full overflow-hidden min-w-[240px]">
           {leftContent}
        </div>
      </aside>

      {/* LEFT RESIZER */}
      <div 
         className="w-1 hover:w-1.5 h-full cursor-col-resize hover:bg-amber-400 dark:hover:bg-amber-600 active:bg-amber-500 transition-colors z-50 flex flex-col justify-center items-center group flex-shrink-0 bg-transparent -ml-0.5 relative"
         onMouseDown={() => startResize('left')}
      >
          {/* Visual Grip Handle */}
          <div className={`h-8 w-1 bg-stone-300 dark:bg-stone-700 rounded-full transition-all ${isResizing === 'left' ? 'bg-amber-500 h-full w-0.5' : 'group-hover:h-12'}`}></div>
      </div>

      {/* CENTER STAGE (Dominant) */}
      <main className="flex-1 h-full min-w-0 bg-stone-50/50 dark:bg-stone-950/50 relative flex flex-col z-0">
        {centerContent}
      </main>

      {/* RIGHT RESIZER */}
      <div 
         className="w-1 hover:w-1.5 h-full cursor-col-resize hover:bg-amber-400 dark:hover:bg-amber-600 active:bg-amber-500 transition-colors z-50 flex flex-col justify-center items-center group flex-shrink-0 bg-transparent -mr-0.5 relative"
         onMouseDown={() => startResize('right')}
      >
          {/* Visual Grip Handle */}
          <div className={`h-8 w-1 bg-stone-300 dark:bg-stone-700 rounded-full transition-all ${isResizing === 'right' ? 'bg-amber-500 h-full w-0.5' : 'group-hover:h-12'}`}></div>
      </div>

      {/* RIGHT PANEL */}
      <aside 
        style={{ width: rightStyle.width, opacity: rightStyle.opacity }} 
        className="flex-shrink-0 h-full border-l border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 transition-all duration-300 ease-out overflow-hidden relative will-change-[width,opacity]"
      >
         <div className="h-full w-full overflow-hidden min-w-[240px]">
            {rightContent}
         </div>
      </aside>

    </div>
  );
};