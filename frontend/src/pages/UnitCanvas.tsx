import React, { useState, useEffect } from 'react';
import { CanvasSidebar } from '../components/layout/CanvasSidebar';
import UnitForm, { type UnitFormData } from '../components/common/UnitForm';
import { axiosInstance } from '../lib/axios'; // Import axios instance
import { useUnitStore } from '../stores/useUnitStore';

// Define the Unit interface
interface Unit {
  unitId: string;
  unitName: string;
  unitDesc: string;
  credits: number;
  semestersOffered: number[];
}

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
    color?: string,
  }>>([]);
  
  // State for editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  // State for dragging
  const [draggedUnit, setDraggedUnit] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const canvasRef = React.useRef<HTMLDivElement>(null);

  // States for unit search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Unit[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const { viewUnits } = useUnitStore();

  useEffect(() => {
    const loadUnits = async () => {
      await viewUnits(); // assuming it returns data or updates the store
    };
    loadUnits();
  }, []);

  // function to create/edit/delete unit boxes
  // function to create/edit/delete unit boxes
  const createUnitBox = (selectedUnit: Unit) => {

    const unitExists = unitBoxes.some(unit => unit.unitId === selectedUnit.unitId);

    if (unitExists) {
      alert("This unit has already been added."); // Or display a more user-friendly message
      setShowSearchResults(false); // Hide search results after selection
      return; // Don't add the unit if it already exists
    }
    
    const newUnit = {
      id: Date.now(),
      name: selectedUnit.unitName,
      unitId: selectedUnit.unitId,
      description: selectedUnit.unitDesc,
      credits: selectedUnit.credits,
      semestersOffered: selectedUnit.semestersOffered,
      x: 100 + (unitBoxes.length * 50), // Offset each new unit
      y: 100 + (unitBoxes.length * 30),  // Stagger vertically too
      color: '#3B82F6' // Default blue color
    };
    setUnitBoxes([...unitBoxes, newUnit]);
    setShowSearchResults(false); // Hide search results after selection
  };

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
              semestersOffered: formData.semestersOffered || unit.semestersOffered,
              color: formData.color || unit.color
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

  function deleteUnit(unitId: number) {
    setUnitBoxes(unitBoxes.filter(unit => unit.id !== unitId));
  }

  // Handler for search input changes
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setShowSearchResults(true); // Show search results when typing

    if (term) {
      try {
        const response = await axiosInstance.get(`/unit/view?search=${term}`); // Adjust the API endpoint as needed
        setSearchResults(response.data);
      } catch (error) {
        console.error("Error fetching units:", error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className=
    "flex h-screen">
      {/* Sidebar container*/}
      <div className="w-1/6 flex flex-col relative">
        {/* Sidebar component */}
        <CanvasSidebar />
        
        {/* Unit Add button */}
        <div className="absolute top-4 left-10 right-10 z-10 bg-white">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search for a unit..."
            className="input input-bordered w-full"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setShowSearchResults(true)} // Show results on focus
            onBlur={() => setTimeout(() => setShowSearchResults(false), 100)} // delayed hide on blur
          />

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-0 mt-2 w-full bg-white border border-gray-300 rounded-md shadow-md z-20">
              {searchResults.map((unit) => (
                <div
                  key={unit.unitId}
                  className="px-4 py-2 text-black hover:bg-gray-100 cursor-pointer"
                  onClick={() => createUnitBox(unit)}
                >
                  {unit.unitName} ({unit.unitId})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

       {/* Main Canvas Area */}
      <div 
        ref={canvasRef}
        className="w-full bg-white p-6 overflow-hidden relative"
        style={{ userSelect: 'none' }} // Prevent text selection while dragging
      >
       
        
        {/* Absolutely positioned unit boxes */}
        {unitBoxes.map((unit) => (
          <div
            key={unit.id}
            className="absolute w-64 cursor-move select-none group"
            style={{
              left: `${unit.x}px`,
              top: `${unit.y}px`,
              zIndex: draggedUnit === unit.id ? 1000 : 1,
            }}
            onMouseDown={(e) => handleMouseDown(e, unit.id)}
            onDoubleClick={() => handleDoubleClick(unit.id)}
          >
            <div className={`transition-shadow duration-200 relative ${
              draggedUnit === unit.id ? 'shadow-lg scale-105' : 'shadow-sm'
            }`}>
              <div 
                className="border border-gray-300 p-4 rounded shadow-sm hover:shadow-md transition-shadow duration-300"
                style={{ 
                  backgroundColor: unit.color || '#3B82F6',
                  color: 'white'
                }}
              >
                <h2 className="text-lg font-semibold text-center text-white">{unit.unitId || unit.name}</h2>
              </div>
              
              {/* Delete button - appears on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteUnit(unit.id);
                }}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                title="Delete unit"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        
        {/* Popup Modal for UnitForm */}
        {showForm && editingId && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-black text-xl font-bold">Edit Unit</h2>
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
                  color: unitBoxes.find(u => u.id === editingId)?.color || null,
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