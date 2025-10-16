/**
 * DRAGGABLE COMPONENT - USAGE EXAMPLES
 * 
 * The Draggable component is a generic wrapper that makes ANY child component
 * draggable within a canvas area. Here are some examples:
 */

import React, { useState, useRef } from "react";
import Draggable from "../components/common/Draggable";
import { UnitBox } from "../components/common/UnitBox";

// Example 1: Making a UnitBox draggable
export const DraggableUnitExample = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 100, y: 100 });

  const handlePositionChange = (id: number | string, x: number, y: number) => {
    setPosition({ x, y });
  };

  return (
    <div ref={canvasRef} className="relative w-full h-screen">
      <Draggable
        id={1}
        x={position.x}
        y={position.y}
        canvasRef={canvasRef}
        onPositionChange={handlePositionChange}
      >
        <UnitBox
          unitId="CS101"
          unitName="Introduction to Computer Science"
          color="#3B82F6"
        />
      </Draggable>
    </div>
  );
};

// Example 2: Making a custom card draggable
const CustomCard = ({ title, content }: { title: string; content: string }) => (
  <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500">
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-700">{content}</p>
  </div>
);

export const DraggableCardExample = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 200, y: 150 });

  return (
    <div ref={canvasRef} className="relative w-full h-screen bg-gray-100">
      <Draggable
        id="card-1"
        x={position.x}
        y={position.y}
        canvasRef={canvasRef}
        onPositionChange={(id, x, y) => setPosition({ x, y })}
        onDoubleClick={(id) => console.log(`Card ${id} double-clicked!`)}
      >
        <CustomCard
          title="Draggable Card"
          content="This is a custom card component that's now draggable!"
        />
      </Draggable>
    </div>
  );
};

// Example 3: Making an image draggable
export const DraggableImageExample = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  return (
    <div ref={canvasRef} className="relative w-full h-screen bg-gray-200">
      <Draggable
        id="image-1"
        x={position.x}
        y={position.y}
        canvasRef={canvasRef}
        onPositionChange={(id, x, y) => setPosition({ x, y })}
      >
        <img
          src="https://via.placeholder.com/200"
          alt="Draggable"
          className="rounded-lg shadow-md"
        />
      </Draggable>
    </div>
  );
};

// Example 4: Multiple different draggable components
export const MultipleDraggablesExample = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState([
    { id: 1, x: 100, y: 100, type: 'unit' as const },
    { id: 2, x: 400, y: 150, type: 'card' as const },
    { id: 3, x: 700, y: 200, type: 'button' as const },
  ]);

  const handlePositionChange = (id: number | string, x: number, y: number) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, x, y } : item))
    );
  };

  return (
    <div ref={canvasRef} className="relative w-full h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {items.map(item => (
        <Draggable
          key={item.id}
          id={item.id}
          x={item.x}
          y={item.y}
          canvasRef={canvasRef}
          onPositionChange={handlePositionChange}
        >
          {item.type === 'unit' && (
            <UnitBox unitId="MATH201" unitName="Calculus I" color="#10B981" />
          )}
          {item.type === 'card' && (
            <CustomCard title="Note" content="This is a draggable note card!" />
          )}
          {item.type === 'button' && (
            <button className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg">
              Draggable Button
            </button>
          )}
        </Draggable>
      ))}
    </div>
  );
};

/**
 * KEY FEATURES:
 * 
 * 1. Generic Wrapper: Wraps ANY React component
 * 2. Position Control: Parent controls position via x, y props
 * 3. Callbacks: onPositionChange for drag, onDoubleClick for interactions
 * 4. Bounded Movement: Automatically constrains to canvas boundaries
 * 5. Z-index Management: Brings dragged item to front
 * 6. Disable Option: Can disable dragging with disabled prop
 * 
 * PROPS:
 * - id: Unique identifier (number | string)
 * - x, y: Position coordinates
 * - canvasRef: Reference to container element
 * - onPositionChange: Callback for position updates
 * - onDoubleClick?: Optional double-click handler
 * - children: Any React component to make draggable
 * - className?: Optional additional CSS classes
 * - disabled?: Disable dragging functionality
 */
