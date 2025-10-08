import React, { useState } from 'react';
import { CanvasSidebar } from '../components/layout/canvasSidebar';
import { UnitBox } from '../components/common/unitBox';

export const CanvasPage: React.FC = () => {
  // State to store all created unit boxes
  const [unitBoxes, setUnitBoxes] = useState<Array<{id: number, name: string}>>([]);

  function createUnitBox() {
    const newId = Date.now(); // Use timestamp for unique ID
    const newUnit = { id: newId, name: `Unit ${unitBoxes.length + 1}` };
    setUnitBoxes([...unitBoxes, newUnit]);
  }
  return (
    <div className="flex h-screen">
      {/* Sidebar Container - Fixed 50% width */}
      <div className="w-1/2 flex flex-col">
        {/* Sidebar Component */}
        <CanvasSidebar />
        
        {/* Unit Creation and Display Area */}
        <div className="p-4 overflow-y-auto">
          <UnitBox unitName="Click to Add Unit" onClick={createUnitBox} />
          
          {/* Display all created unit boxes */}
          {unitBoxes.map((unit) => (
            <UnitBox 
              key={unit.id}
              unitName={unit.name} 
              onClick={() => alert(`Clicked ${unit.name}!`)} 
            />
          ))}
        </div>
      </div>
      
      {/* Main Content Area - Fixed 67% width */}
      <div className="w-2/3 bg-white p-6 overflow-y-auto">
        <div className="mb-6">
        </div>
        
      </div>
    </div>
  );
};

export default CanvasPage;