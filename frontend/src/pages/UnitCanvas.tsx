import React, { useState } from 'react';
import { CanvasSidebar } from '../components/layout/CanvasSidebar';
import { UnitBox } from '../components/common/UnitBox';
import UnitForm, { type UnitFormData } from '../components/common/UnitForm';

export const CanvasPage: React.FC = () => {

  // State to store all created unit boxes with unit details and position
  const [unitBoxes, setUnitBoxes] = useState<Array<{
    id: number, 
    name: string,
    unitId?: string,
    description?: string,
    credits?: number,
    semestersOffered?: number[],
    x: number,
    y: number,
  }>>([]);
  
  // State for editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  // State for dragging
  const [draggedUnit, setDraggedUnit] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const canvasRef = React.useRef<HTMLDivElement>(null);

  // function to create/edit/delete unit boxes
  function createUnitBox() {
    const newUnit = { 
      id: Date.now(),
      name: `Unit ${unitBoxes.length + 1}`,
      x: 100 + (unitBoxes.length * 50), // Offset each new unit
      y: 100 + (unitBoxes.length * 30)  // Stagger vertically too
    };
    setUnitBoxes([...unitBoxes, newUnit]);
  }

  function startEdit(id: number) {
    setEditingId(id);
    setShowForm(true);
  }

  // function to handle form save
  function handleFormSave(formData: UnitFormData) {
    if (editingId) {
      setUnitBoxes(unitBoxes.map(unit => 
        unit.id === editingId 
          ? { 
              ...unit, 
              name: formData.unitName || unit.name,
              unitId: formData.unitId || unit.unitId,
              description: formData.unitDesc || unit.description,
              credits: formData.credits || unit.credits,
              semestersOffered: formData.semestersOffered || unit.semestersOffered
            }
          : unit
      ));
    }
    setEditingId(null);
    setShowForm(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setShowForm(false);
  }

  // function to handel drag and drop
  function handleMouseDown(e: React.MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    
    const unit = unitBoxes.find(u => u.id === id);
    if (!unit || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // calculate offset within the unit box
    const offset = { 
      x: mouseX - unit.x, 
      y: mouseY - unit.y
    };
    setDragOffset(offset);
    setDraggedUnit(id);
    setIsDragging(false);

    // Create handler functions that capture current values
    const handleMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;
      
      setIsDragging(true);
      const moveRect = canvasRef.current.getBoundingClientRect();
      const newMouseX = moveEvent.clientX - moveRect.left;
      const newMouseY = moveEvent.clientY - moveRect.top;

      setUnitBoxes((prevUnits) =>
        prevUnits.map((unit) =>
          unit.id === id
            ? { 
                ...unit, 
                x: Math.max(0, Math.min(newMouseX - offset.x, moveRect.width - 256)),
                y: Math.max(0, Math.min(newMouseY - offset.y, moveRect.height - 100))
              }
            : unit
        )
      );
    };

    const handleUp = () => {
      setDraggedUnit(null);
      setDragOffset({ x: 0, y: 0 });
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      setTimeout(() => setIsDragging(false), 100);
    };

    // add global mouse event listeners
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }
  
  function handleDoubleClick(unitId: number) {
    if (isDragging) return; // Don't edit if we're dragging
    startEdit(unitId);
  }

  return (
    <div className=
    "flex h-screen">
      {/* Sidebar container*/}
      <div className="w-1/4 flex flex-col relative">
        {/* Sidebar component */}
        <CanvasSidebar />
        
        {/* Unit Add button */}
        <div className="absolute top-4 left-10 right-10 z-10 bg-white">
          <UnitBox unitName="+" onClick={createUnitBox} />
        </div>
      </div>

       {/* Main Canvas Area */}
      <div 
        ref={canvasRef}
        className="w-3/4 bg-white p-6 overflow-hidden relative"
        style={{ userSelect: 'none' }} // Prevent text selection while dragging
      >
       
        
        {/* Absolutely positioned unit boxes */}
        {unitBoxes.map((unit) => (
          <div
            key={unit.id}
            className="absolute w-64 cursor-move select-none"
            style={{
              left: `${unit.x}px`,
              top: `${unit.y}px`,
              zIndex: draggedUnit === unit.id ? 1000 : 1,
            }}
            onMouseDown={(e) => handleMouseDown(e, unit.id)}
            onDoubleClick={() => handleDoubleClick(unit.id)}
          >
            <div className={`transition-shadow duration-200 ${
              draggedUnit === unit.id ? 'shadow-lg scale-105' : 'shadow-sm'
            }`}>
              <div className="border border-gray-300 p-4 bg-white rounded shadow-sm hover:shadow-md transition-shadow duration-300">
                <h2 className="text-lg font-semibold text-center">{unit.unitId || unit.name}</h2>
              </div>
            </div>
          </div>
        ))}
        
        {/* Popup Modal for UnitForm */}
        {showForm && editingId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Unit</h2>
                <button
                  onClick={cancelEdit}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
              <UnitForm 
                onSave={handleFormSave} 
                initialData={{
                  unitId: unitBoxes.find(u => u.id === editingId)?.unitId || null,
                  unitName: unitBoxes.find(u => u.id === editingId)?.name || null,
                  unitDesc: unitBoxes.find(u => u.id === editingId)?.description || null,
                  credits: unitBoxes.find(u => u.id === editingId)?.credits || null,
                  semestersOffered: unitBoxes.find(u => u.id === editingId)?.semestersOffered || null,
                }}
              />
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default CanvasPage;