import React from 'react';

interface CanvasSidebarProps {
  children?: React.ReactNode;
}

export const CanvasSidebar: React.FC<CanvasSidebarProps> = ({ children }) => {
  return (
    <div className="bg-gray-100 p-4 w-64 h-full overflow-y-auto flex flex-col">
      <h2 className="text-lg font-bold mb-4 text-gray-800">Unit Tools</h2>
      {/* The content (buttons/search) will be rendered here */}
      {children}
    </div>
  );
};