import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WhiteboardData, WhiteboardElement, WhiteboardTool } from '../types';
import { MousePointer2, Square, Circle, StickyNote, Minus, Type, Move, ZoomIn, ZoomOut, Trash2 } from 'lucide-react';

interface WhiteboardEditorProps {
  initialContent: string;
  onChange: (newContent: string) => void;
}

// Default colors
const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#78716c'];

export const WhiteboardEditor: React.FC<WhiteboardEditorProps> = ({ initialContent, onChange }) => {
  // --- State ---
  const [data, setData] = useState<WhiteboardData>(() => {
    try {
      return initialContent ? JSON.parse(initialContent) : { elements: [], viewport: { x: 0, y: 0, zoom: 1 } };
    } catch {
      return { elements: [], viewport: { x: 0, y: 0, zoom: 1 } };
    }
  });

  const [tool, setTool] = useState<WhiteboardTool>('select');
  const [selection, setSelection] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [currentColor, setCurrentColor] = useState('#78716c');
  
  // Refs for tracking drag deltas
  const svgRef = useRef<SVGSVGElement>(null);
  const lastMousePos = useRef<{ x: number, y: number } | null>(null);
  const dragStartPos = useRef<{ x: number, y: number } | null>(null);
  const activeElementId = useRef<string | null>(null);

  // --- Helpers ---

  // Convert screen coordinates to SVG coordinates
  const getMouseCoords = (e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - data.viewport.x) / data.viewport.zoom,
      y: (e.clientY - rect.top - data.viewport.y) / data.viewport.zoom
    };
  };

  const save = (newData: WhiteboardData) => {
    setData(newData);
    onChange(JSON.stringify(newData));
  };

  // --- Handlers ---

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click or Space+Click -> Pan
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        return;
    }

    const { x, y } = getMouseCoords(e);
    
    if (tool === 'select') {
        // Selection logic handled by element onClick, but if clicked empty space:
        if (e.target === svgRef.current) {
            setSelection(null);
        }
        return;
    }

    // Creating new element
    const id = crypto.randomUUID();
    let newElement: WhiteboardElement = {
        id,
        type: tool,
        x, y,
        width: 10, height: 10, // Initial size
        color: currentColor,
        text: tool === 'text' ? 'Text' : tool === 'note' ? 'Note' : ''
    };

    if (tool === 'line' && selection) {
        // Connect to selected if exists
        newElement.startId = selection;
        newElement.endId = undefined; // Will set on mouse up if over another node
        // Actually line drawing is complex, let's simplify: simple line creation
    }
    
    // For text/note default size
    if (tool === 'note') { newElement.width = 150; newElement.height = 150; }
    if (tool === 'text') { newElement.width = 200; newElement.height = 40; }
    if (tool === 'circle') { newElement.width = 100; newElement.height = 100; }
    if (tool === 'rect') { newElement.width = 120; newElement.height = 80; }

    activeElementId.current = id;
    setIsDragging(true);
    dragStartPos.current = { x, y }; // Store origin for resizing creation

    const updatedElements = [...data.elements, newElement];
    save({ ...data, elements: updatedElements });
    setSelection(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && lastMousePos.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        save({
            ...data,
            viewport: {
                ...data.viewport,
                x: data.viewport.x + dx,
                y: data.viewport.y + dy
            }
        });
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        return;
    }

    if (isDragging && activeElementId.current) {
        const { x, y } = getMouseCoords(e);
        
        if (tool === 'select') {
            // Moving existing element
            if (!dragStartPos.current) return;
            const dx = x - dragStartPos.current.x;
            const dy = y - dragStartPos.current.y;
            
            save({
                ...data,
                elements: data.elements.map(el => 
                    el.id === activeElementId.current 
                    ? { ...el, x: el.x + dx, y: el.y + dy } 
                    : el
                )
            });
            dragStartPos.current = { x, y }; // Update reference for continuous drag
        } else {
            // resizing creation (dragging bottom-right)
            // Not implemented for simplicity, creating fixed size for now on click
            // If creating line:
            if (tool === 'line') {
                 save({
                    ...data,
                    elements: data.elements.map(el => 
                        el.id === activeElementId.current 
                        ? { ...el, width: x - el.x, height: y - el.y } // Hack: store end point as width/height rel
                        : el
                    )
                });
            }
        }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDragging(false);
    activeElementId.current = null;
    dragStartPos.current = null;
    if (tool !== 'select' && tool !== 'line') setTool('select'); // Switch back after create
  };

  const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const zoomSpeed = 0.001;
          const newZoom = Math.max(0.1, Math.min(5, data.viewport.zoom - e.deltaY * zoomSpeed));
          save({ ...data, viewport: { ...data.viewport, zoom: newZoom } });
      } else {
          // Pan
          save({ 
              ...data, 
              viewport: { 
                  ...data.viewport, 
                  x: data.viewport.x - e.deltaX, 
                  y: data.viewport.y - e.deltaY 
              } 
          });
      }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && selection) {
          // Delete selected
          save({
              ...data,
              elements: data.elements.filter(el => el.id !== selection)
          });
          setSelection(null);
      }
  }, [selection, data]);

  useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const updateElementText = (id: string, newText: string) => {
      save({
          ...data,
          elements: data.elements.map(el => el.id === id ? { ...el, text: newText } : el)
      });
  };

  // --- Renderers ---

  const renderElement = (el: WhiteboardElement) => {
      const isSelected = selection === el.id;
      const stroke = isSelected ? '#3b82f6' : (el.type === 'line' ? el.color : 'none');
      const strokeWidth = isSelected ? 2 : (el.type === 'line' ? 2 : 0);
      
      const commonProps = {
          onMouseDown: (e: React.MouseEvent) => {
              e.stopPropagation();
              setSelection(el.id);
              if (tool === 'select') {
                  activeElementId.current = el.id;
                  setIsDragging(true);
                  const { x, y } = getMouseCoords(e);
                  dragStartPos.current = { x, y };
              }
          },
          className: "cursor-move hover:opacity-90 transition-opacity",
          style: { filter: isSelected ? 'drop-shadow(0 0 4px rgba(59,130,246,0.5))' : 'none' }
      };

      switch (el.type) {
          case 'rect':
              return (
                  <g key={el.id} transform={`translate(${el.x},${el.y})`} {...commonProps}>
                      <rect width={el.width} height={el.height} fill={el.color} rx={4} stroke={isSelected ? '#3b82f6' : 'transparent'} strokeWidth={2} />
                      <foreignObject width={el.width} height={el.height}>
                          <textarea 
                             className="w-full h-full bg-transparent resize-none border-none outline-none p-2 text-center flex items-center justify-center pointer-events-auto text-white placeholder-white/50"
                             style={{ color: 'white' }} // Simple contrast assumption
                             value={el.text}
                             onChange={(e) => updateElementText(el.id, e.target.value)}
                             onMouseDown={(e) => e.stopPropagation()} // Allow text select
                          />
                      </foreignObject>
                  </g>
              );
          case 'circle':
              return (
                  <g key={el.id} transform={`translate(${el.x},${el.y})`} {...commonProps}>
                      <ellipse cx={(el.width || 0)/2} cy={(el.height || 0)/2} rx={(el.width || 0)/2} ry={(el.height || 0)/2} fill={el.color} stroke={isSelected ? '#3b82f6' : 'transparent'} strokeWidth={2} />
                      <foreignObject width={el.width} height={el.height}>
                          <div className="w-full h-full flex items-center justify-center p-2">
                             <input 
                                className="bg-transparent text-center outline-none w-full text-white placeholder-white/50"
                                value={el.text}
                                onChange={(e) => updateElementText(el.id, e.target.value)}
                                onMouseDown={(e) => e.stopPropagation()}
                             />
                          </div>
                      </foreignObject>
                  </g>
              );
          case 'note':
              return (
                  <g key={el.id} transform={`translate(${el.x},${el.y})`} {...commonProps}>
                      <rect width={el.width} height={el.height} fill="#fef3c7" stroke={isSelected ? '#3b82f6' : '#d6d3d1'} strokeWidth={1} filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.1))" />
                      <foreignObject width={el.width} height={el.height}>
                           <textarea 
                             className="w-full h-full bg-transparent resize-none border-none outline-none p-4 text-stone-800 font-serif leading-relaxed"
                             value={el.text}
                             onChange={(e) => updateElementText(el.id, e.target.value)}
                             onMouseDown={(e) => e.stopPropagation()}
                          />
                      </foreignObject>
                  </g>
              );
          case 'text':
              return (
                  <g key={el.id} transform={`translate(${el.x},${el.y})`} {...commonProps}>
                      <foreignObject width={el.width} height={el.height} overflow="visible">
                          <input 
                              className="bg-transparent border-none outline-none text-xl font-bold text-stone-800 dark:text-stone-200"
                              value={el.text}
                              onChange={(e) => updateElementText(el.id, e.target.value)}
                              onMouseDown={(e) => e.stopPropagation()}
                              style={{ width: 'max-content', minWidth: '50px' }}
                           />
                      </foreignObject>
                      {isSelected && <rect width={el.width} height={el.height} fill="none" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4" />}
                  </g>
              );
          case 'line':
              // Draw line from x,y to x+width, y+height
              return (
                  <line 
                    key={el.id} 
                    x1={el.x} y1={el.y} 
                    x2={el.x + (el.width || 0)} y2={el.y + (el.height || 0)} 
                    stroke={el.color} 
                    strokeWidth={3} 
                    strokeLinecap="round"
                    {...commonProps}
                  />
              );
          default: return null;
      }
  };

  return (
    <div className="w-full h-full relative bg-stone-100 dark:bg-stone-950 overflow-hidden cursor-crosshair">
       {/* Toolbar */}
       <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-stone-900 shadow-md rounded-lg p-1.5 flex items-center space-x-1 z-10 border border-stone-200 dark:border-stone-800">
           <button onClick={() => setTool('select')} className={`p-2 rounded ${tool === 'select' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100' : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'}`}><MousePointer2 size={18} /></button>
           <div className="w-px h-6 bg-stone-200 dark:bg-stone-800 mx-1"></div>
           <button onClick={() => setTool('rect')} className={`p-2 rounded ${tool === 'rect' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100' : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'}`}><Square size={18} /></button>
           <button onClick={() => setTool('circle')} className={`p-2 rounded ${tool === 'circle' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100' : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'}`}><Circle size={18} /></button>
           <button onClick={() => setTool('note')} className={`p-2 rounded ${tool === 'note' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100' : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'}`}><StickyNote size={18} /></button>
           <button onClick={() => setTool('text')} className={`p-2 rounded ${tool === 'text' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100' : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'}`}><Type size={18} /></button>
           <button onClick={() => setTool('line')} className={`p-2 rounded ${tool === 'line' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100' : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'}`}><Minus size={18} /></button>
       </div>

       {/* Property Bar (visible if selection) */}
       {selection && (
           <div className="absolute top-4 right-4 bg-white dark:bg-stone-900 shadow-md rounded-lg p-2 flex items-center space-x-2 z-10 border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in">
               {COLORS.map(c => (
                   <button 
                     key={c}
                     onClick={() => {
                         setCurrentColor(c);
                         // Update active element
                         const updated = data.elements.map(el => el.id === selection ? { ...el, color: c } : el);
                         save({ ...data, elements: updated });
                     }}
                     className={`w-6 h-6 rounded-full border-2 ${currentColor === c ? 'border-stone-600 dark:border-stone-200' : 'border-transparent'}`}
                     style={{ backgroundColor: c }}
                   />
               ))}
               <div className="w-px h-6 bg-stone-200 dark:bg-stone-800 mx-1"></div>
               <button 
                 onClick={() => {
                     const updated = data.elements.filter(el => el.id !== selection);
                     save({ ...data, elements: updated });
                     setSelection(null);
                 }}
                 className="p-1 text-rose-500 hover:bg-rose-50 rounded"
               >
                   <Trash2 size={16} />
               </button>
           </div>
       )}

       {/* Zoom Controls */}
       <div className="absolute bottom-4 left-4 bg-white dark:bg-stone-900 shadow-sm rounded-lg flex flex-col z-10 border border-stone-200 dark:border-stone-800">
           <button onClick={() => save({...data, viewport: {...data.viewport, zoom: data.viewport.zoom + 0.1}})} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"><ZoomIn size={16}/></button>
           <div className="h-px bg-stone-200 dark:bg-stone-800"></div>
           <button onClick={() => save({...data, viewport: {...data.viewport, zoom: data.viewport.zoom - 0.1}})} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"><ZoomOut size={16}/></button>
       </div>

       <svg
         ref={svgRef}
         className="w-full h-full touch-none"
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
         onWheel={handleWheel}
       >
           {/* Grid Pattern */}
           <defs>
               <pattern id="grid" width={40 * data.viewport.zoom} height={40 * data.viewport.zoom} patternUnits="userSpaceOnUse" x={data.viewport.x} y={data.viewport.y}>
                   <path d={`M ${40 * data.viewport.zoom} 0 L 0 0 0 ${40 * data.viewport.zoom}`} fill="none" stroke="currentColor" strokeWidth={0.5} className="text-stone-300 dark:text-stone-800 opacity-50"/>
               </pattern>
           </defs>
           <rect width="100%" height="100%" fill="url(#grid)" />

           {/* Elements Layer */}
           <g transform={`translate(${data.viewport.x},${data.viewport.y}) scale(${data.viewport.zoom})`}>
               {data.elements.map(renderElement)}
           </g>
       </svg>
    </div>
  );
};