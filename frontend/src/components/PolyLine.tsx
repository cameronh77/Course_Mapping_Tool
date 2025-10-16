import React from 'react';

export interface LineSegment {
  direction: 'north' | 'south' | 'east' | 'west';
  length: number;
}

export interface PolyLineProps {
  id: string;
  segments: LineSegment[];
  color: string;
  strokeWidth: number;
  showArrowhead?: boolean;
  onSegmentDrag?: (segmentIndex: number) => (e: React.MouseEvent) => void;
  onAddSegmentDrag?: (e: React.MouseEvent) => void;
}

const PolyLine: React.FC<PolyLineProps> = ({ 
  segments, 
  color, 
  strokeWidth, 
  showArrowhead = true,
  onSegmentDrag,
  onAddSegmentDrag
}) => {
  // Calculate the path and bounding box
  const calculatePath = () => {
    let currentX = 0;
    let currentY = 0;
    let minX = 0;
    let minY = 0;
    let maxX = 0;
    let maxY = 0;
    
    const pathCommands: string[] = [`M 0 0`];
    const segmentPoints: { x: number; y: number; direction: string }[] = [];
    
    segments.forEach((segment) => {
      switch (segment.direction) {
        case 'north':
          currentY -= segment.length;
          break;
        case 'south':
          currentY += segment.length;
          break;
        case 'east':
          currentX += segment.length;
          break;
        case 'west':
          currentX -= segment.length;
          break;
      }
      
      pathCommands.push(`L ${currentX} ${currentY}`);
      segmentPoints.push({ 
        x: currentX, 
        y: currentY, 
        direction: segment.direction 
      });
      
      minX = Math.min(minX, currentX);
      minY = Math.min(minY, currentY);
      maxX = Math.max(maxX, currentX);
      maxY = Math.max(maxY, currentY);
    });
    
    const width = maxX - minX + strokeWidth + 20;
    const height = maxY - minY + strokeWidth + 20;
    const offsetX = -minX + 10;
    const offsetY = -minY + 10;
    
    return {
      pathData: pathCommands.join(' '),
      width,
      height,
      offsetX,
      offsetY,
      segmentPoints,
      endX: currentX,
      endY: currentY
    };
  };

  const { pathData, width, height, offsetX, offsetY, segmentPoints, endX, endY } = calculatePath();
  
  // Create arrowhead at the end
  const createArrowhead = () => {
    if (!showArrowhead || segments.length === 0) return null;
    
    const lastSegment = segments[segments.length - 1];
    const arrowSize = 14;
    const endPoint = { x: endX + offsetX, y: endY + offsetY - 10 };

    let arrowPath = '';
    
    switch (lastSegment.direction) {
      case 'north':
        arrowPath = `M ${endPoint.x} ${endPoint.y} L ${endPoint.x - arrowSize/2} ${endPoint.y + arrowSize} L ${endPoint.x + arrowSize/2} ${endPoint.y + arrowSize}`;
        break;
      case 'south':
        arrowPath = `M ${endPoint.x} ${endPoint.y} L ${endPoint.x - arrowSize/2} ${endPoint.y - arrowSize} L ${endPoint.x + arrowSize/2} ${endPoint.y - arrowSize}`;
        break;
      case 'east':
        arrowPath = `M ${endPoint.x} ${endPoint.y} L ${endPoint.x - arrowSize} ${endPoint.y - arrowSize/2} L ${endPoint.x - arrowSize} ${endPoint.y + arrowSize/2}`;
        break;
      case 'west':
        arrowPath = `M ${endPoint.x} ${endPoint.y} L ${endPoint.x + arrowSize} ${endPoint.y - arrowSize/2} L ${endPoint.x + arrowSize} ${endPoint.y + arrowSize/2}`;
        break;
    }
    
    return <path d={arrowPath} fill={color} />;
  };

  return (
    <svg
      width={width}
      height={height}
      style={{ overflow: 'visible' }}
    >
      <g transform={`translate(${offsetX}, ${offsetY})`}>
        {/* Main path */}
        <path
          d={pathData}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Arrowhead */}
        {createArrowhead()}
        
        {/* Draggable handles at segment endpoints */}
        {onSegmentDrag && segmentPoints.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={6}
            fill={color}
            opacity={0.4}
            className="cursor-move hover:opacity-70"
            onMouseDown={onSegmentDrag(index)}
          />
        ))}
        
        {/* Add new segment handle at the end of the arrow */}
        {onAddSegmentDrag && segmentPoints.length > 0 && (
          <g>
            {/* Outer ring for visibility */}
            <circle
              cx={segmentPoints[segmentPoints.length - 1].x}
              cy={segmentPoints[segmentPoints.length - 1].y}
              r={10}
              fill="none"
              stroke={color}
              strokeWidth={2}
              opacity={0.5}
              className="cursor-pointer hover:opacity-90"
              onMouseDown={onAddSegmentDrag}
            />
            {/* Plus sign */}
            <text
              x={segmentPoints[segmentPoints.length - 1].x}
              y={segmentPoints[segmentPoints.length - 1].y}
              fill={color}
              fontSize="16"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
              opacity={0.6}
              className="cursor-pointer hover:opacity-100 pointer-events-none"
            >
              +
            </text>
          </g>
        )}
      </g>
    </svg>
  );
};

export default PolyLine;
