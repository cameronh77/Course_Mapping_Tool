import React, { useState } from "react";

interface DraggableProps {
  id: number | string;
  x: number;
  y: number;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onPositionChange: (id: number | string, x: number, y: number) => void;
  onDoubleClick?: (id: number | string) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * A generic Draggable wrapper component that makes any child component draggable
 * within a canvas area.
 * 
 * Usage:
 * <Draggable
 *   id={item.id}
 *   x={item.x}
 *   y={item.y}
 *   canvasRef={canvasRef}
 *   onPositionChange={handlePositionChange}
 *   onDoubleClick={handleDoubleClick}
 * >
 *   <YourComponent {...props} />
 * </Draggable>
 */
const Draggable: React.FC<DraggableProps> = ({
  id,
  x,
  y,
  canvasRef,
  onPositionChange,
  onDoubleClick,
  children,
  className = "",
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();

    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const offset = { x: mouseX - x, y: mouseY - y };

    setIsDragging(true);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;
      
      const moveRect = canvasRef.current.getBoundingClientRect();
      const newMouseX = moveEvent.clientX - moveRect.left;
      const newMouseY = moveEvent.clientY - moveRect.top;
      
      // Calculate new position with bounds checking
      const newX = Math.max(0, Math.min(newMouseX - offset.x, moveRect.width - 256));
      const newY = Math.max(0, Math.min(newMouseY - offset.y, moveRect.height - 100));
      
      onPositionChange(id, newX, newY);
    };

    const handleUp = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      // Delay clearing isDragging to prevent double-click from firing
      setTimeout(() => setIsDragging(false), 100);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const handleDoubleClick = () => {
    if (disabled || isDragging) return;
    onDoubleClick?.(id);
  };

  return (
    <div
      className={`absolute ${className}`}
      style={{ 
        left: `${x}px`, 
        top: `${y}px`, 
        zIndex: isDragging ? 1000 : 1,
        cursor: disabled ? 'default' : 'move'
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {children}
    </div>
  );
};

export default Draggable;
