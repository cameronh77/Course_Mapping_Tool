import React, { useState } from 'react';
import { CanvasSidebar } from '../components/layout/CanvasSidebar';
import { UnitBox } from '../components/common/UnitBox';
import UnitForm, { type UnitFormData } from '../components/common/UnitForm';

export const CanvasPage: React.FC = () => {

  // State to store all created unit boxes with more details
  const [unitBoxes, setUnitBoxes] = useState<Array<{
    id: number, 
    name: string,
    unitId?: string,
    description?: string,
    credits?: number,
    semestersOffered?: number[]
  }>>([]);
  
  // State for editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  function createUnitBox() {
    const newUnit = { id: Date.now(), name: `Unit ${unitBoxes.length + 1}` };
    setUnitBoxes([...unitBoxes, newUnit]);
  }

  function startEdit(id: number) {
    setEditingId(id);
    setShowForm(true);
  }

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

      {/* Main Content Area */}
      <div className="w-2/3 bg-white p-6 overflow-y-auto">
        <div className="mb-6">
        </div>
        
        {/* Display all created unit boxes in the main content area */}
        <div className="flex flex-wrap gap-3 justify-center">
          {unitBoxes.map((unit) => (
            <div key={unit.id} className="w-64">
              <UnitBox 
                unitName={unit.unitId || unit.name} 
                onClick={() => startEdit(unit.id)}
              />
            </div>
          ))}
        </div>
        
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