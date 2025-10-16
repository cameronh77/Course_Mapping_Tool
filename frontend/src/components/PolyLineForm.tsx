import React, { useState } from 'react';
import { type LineSegment } from './PolyLine';

export interface PolyLineFormData {
  segments: LineSegment[];
  color: string;
  strokeWidth: number;
  showArrowhead: boolean;
}

interface PolyLineFormProps {
  initialData?: PolyLineFormData;
  onSave: (data: PolyLineFormData) => void;
  onCancel: () => void;
  snappedToUnits?: {
    unit1Name: string;
    unit2Name: string;
  } | null;
  relationshipInfo?: {
    startUnitId?: number;
    endUnitId?: number;
    startUnitName?: string;
    endUnitName?: string;
  } | null;
}

const PolyLineForm: React.FC<PolyLineFormProps> = ({ 
  initialData, 
  onSave, 
  onCancel, 
  snappedToUnits,
  relationshipInfo 
}) => {
  const [formData, setFormData] = useState<PolyLineFormData>(
    initialData || {
      segments: [{ direction: 'east', length: 100 }],
      color: '#000000',
      strokeWidth: 2,
      showArrowhead: true,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addSegment = () => {
    const lastSegment = formData.segments[formData.segments.length - 1];
    // Default new segment to perpendicular direction
    let newDirection: 'north' | 'south' | 'east' | 'west' = 'east';
    
    if (lastSegment) {
      if (lastSegment.direction === 'north' || lastSegment.direction === 'south') {
        newDirection = 'east';
      } else {
        newDirection = 'south';
      }
    }
    
    setFormData({
      ...formData,
      segments: [...formData.segments, { direction: newDirection, length: 100 }],
    });
  };

  const removeSegment = (index: number) => {
    if (formData.segments.length > 1) {
      setFormData({
        ...formData,
        segments: formData.segments.filter((_, i) => i !== index),
      });
    }
  };

  const updateSegment = (index: number, field: 'direction' | 'length', value: any) => {
    const newSegments = [...formData.segments];
    if (field === 'direction') {
      newSegments[index] = {
        ...newSegments[index],
        direction: value as 'north' | 'south' | 'east' | 'west',
      };
    } else {
      newSegments[index] = {
        ...newSegments[index],
        length: parseInt(value),
      };
    }
    setFormData({ ...formData, segments: newSegments });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Relationship Info Display - Endpoint Connections */}
      {relationshipInfo && (relationshipInfo.startUnitId || relationshipInfo.endUnitId) && (
        <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-700">Relationship</span>
          </div>
          <div className="text-xs text-gray-700 space-y-1">
            {relationshipInfo.startUnitId && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Type: </span>
                <span className="bg-white px-2 py-1 rounded border border-blue-300">
                  {relationshipInfo.startUnitName || `Unit ${relationshipInfo.startUnitId}`}
                </span>
              </div>
            )}
            {relationshipInfo.endUnitId && (
              <div className="flex items-center gap-2">
                <span className="font-medium">connected to:</span>
                <span className="bg-white px-2 py-1 rounded border border-blue-300">
                  {relationshipInfo.endUnitName || `Unit ${relationshipInfo.endUnitId}`}
                </span>
              </div>
            )}
          </div>
          {relationshipInfo.startUnitId && relationshipInfo.endUnitId && (
            <p className="text-xs text-green-600 font-medium">
              ✓ Connected
            </p>
          )}
        </div>
      )}
      
      {/* Snapped Units Display */}
      {snappedToUnits && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-green-700">Midpoint Snap</span>
          </div>
          <div className="text-xs text-gray-700 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Between:</span>
              <span className="bg-white px-2 py-1 rounded border border-green-300">{snappedToUnits.unit1Name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">And:</span>
              <span className="bg-white px-2 py-1 rounded border border-green-300">{snappedToUnits.unit2Name}</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 italic">
            This arrow is locked between these units. Drag it away to unsnap.
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium">Segments</label>
          <button
            type="button"
            onClick={addSegment}
            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
          >
            + Add Segment
          </button>
        </div>
        
        {formData.segments.map((segment, index) => (
          <div key={index} className="border border-gray-200 p-3 rounded-md space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-600">Segment {index + 1}</span>
              {formData.segments.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSegment(index)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="relative">
              <label className="block text-xs font-medium mb-1">Direction</label>
              <select
                value={segment.direction}
                onChange={(e) => {
                  e.stopPropagation();
                  updateSegment(index, 'direction', e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="north">North (↑)</option>
                <option value="south">South (↓)</option>
                <option value="east">East (→)</option>
                <option value="west">West (←)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1">
                Length: {segment.length}px
              </label>
              <input
                type="range"
                min="20"
                max="300"
                value={segment.length}
                onChange={(e) =>
                  updateSegment(index, 'length', e.target.value)
                }
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Color</label>
        <input
          type="color"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          className="w-full h-10 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Stroke Width: {formData.strokeWidth}px
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.strokeWidth}
          onChange={(e) =>
            setFormData({ ...formData, strokeWidth: parseInt(e.target.value) })
          }
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full cursor-pointer"
          style={{ pointerEvents: 'auto' }}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="showArrowhead"
          checked={formData.showArrowhead}
          onChange={(e) =>
            setFormData({ ...formData, showArrowhead: e.target.checked })
          }
          className="mr-2"
        />
        <label htmlFor="showArrowhead" className="text-sm font-medium">
          Show Arrowhead
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default PolyLineForm;
