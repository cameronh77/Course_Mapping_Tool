# Multi-Segment Line Feature

## Overview
The multi-segment line feature allows users to create complex directional lines on the canvas. Lines can consist of multiple segments, each going in one of the four cardinal directions (north, south, east, west). This enables creating paths with turns and complex routing between units.

## Key Features
- ✅ **Multi-Segment Lines**: Create lines with multiple connected segments
- ✅ **Cardinal Directions**: Each segment can go north, south, east, or west
- ✅ **Drag to Adjust**: Click and drag segment endpoints to change their length
- ✅ **Visual Feedback**: Semi-transparent circles at segment endpoints show draggable handles
- ✅ **Add/Remove Segments**: Dynamically add or remove segments in the edit form
- ✅ **Optional Arrowhead**: Toggle arrowhead on/off
- ✅ **Customization**: Change color, stroke width, and individual segment properties

## Files Created

### 1. `frontend/src/components/PolyLine.tsx`
- **Purpose**: Renders an SVG polyline with multiple segments
- **Props**:
  - `id`: Unique identifier
  - `segments`: Array of `{ direction, length }` objects
  - `color`: Hex color string
  - `strokeWidth`: Number (1-10px)
  - `showArrowhead`: Boolean to display arrowhead at end
  - `onSegmentDrag`: Callback for segment endpoint dragging
- **Features**:
  - Automatically calculates path coordinates from segment definitions
  - Dynamically sized SVG viewbox to fit all segments
  - Arrowhead orientation based on final segment direction
  - Draggable handles at each segment endpoint

### 2. `frontend/src/components/PolyLineForm.tsx`
- **Purpose**: Form component for creating and editing polylines
- **Features**:
  - **Segment Management**:
    - Add new segments with "Add Segment" button
    - Remove segments (must keep at least one)
    - Each segment has direction dropdown and length slider
  - **Line Properties**:
    - Color picker
    - Stroke width slider (1-10px)
    - Arrowhead toggle checkbox
  - Save and Cancel buttons

## Integration in UnitCanvas.tsx

### State Management
```typescript
const [polyLines, setPolyLines] = useState<Array<{
  id: string;
  segments: LineSegment[];
  x: number;
  y: number;
  color: string;
  strokeWidth: number;
  showArrowhead: boolean;
}>>([]);
const [editingLineId, setEditingLineId] = useState<string | null>(null);
const [showLineForm, setShowLineForm] = useState<boolean>(false);
const [draggingSegment, setDraggingSegment] = useState<{
  lineId: string;
  segmentIndex: number;
  startMousePos: { x: number; y: number };
  startLength: number;
} | null>(null);
```

### Handlers
- `handleLinePositionChange`: Updates line position when dragged
- `handleLineDoubleClick`: Opens edit modal on double-click
- `deleteLine`: Removes line from canvas
- `handleCreateLine`: Creates new line with one segment at (200, 200)
- `handleLineFormSave`: Saves edited line properties and segments
- `cancelLineEdit`: Closes edit modal without saving
- `handleSegmentDragStart`: Initiates segment length adjustment
- **useEffect hook**: Handles mouse movement during segment dragging

### UI Components
1. **Add Line Button**: Purple button in sidebar to create new lines
2. **Line Rendering**: Each line wrapped in Draggable component with:
   - Draggable handles at segment endpoints
   - Delete button (appears on hover)
3. **Edit Modal**: Popup form for editing segments and line properties

## Usage

### Creating a Line
1. Click "Add Line" button in the sidebar
2. A new line appears at position (200, 200) with default properties:
   - 1 segment going East
   - Length: 100px
   - Color: Black (#000000)
   - Stroke Width: 2px
   - Arrowhead: Enabled

### Moving a Line
- Click and drag the line body to reposition it anywhere on the canvas

### Adjusting Segment Length
1. Hover over a segment endpoint to see the semi-transparent circle handle
2. Click and drag the circle:
   - **North segment**: Drag up to lengthen, down to shorten
   - **South segment**: Drag down to lengthen, up to shorten
   - **East segment**: Drag right to lengthen, left to shorten
   - **West segment**: Drag left to lengthen, right to shorten
3. Length automatically constrained between 20px and 500px

### Editing Line Properties
1. Double-click the line to open the edit modal
2. **Manage Segments**:
   - View all segments in a list
   - Change direction of each segment
   - Adjust length with slider (20-300px)
   - Click "Add Segment" to add a new segment at the end
   - Click "Remove" on a segment to delete it (must keep at least 1)
3. **Line Styling**:
   - Change color with color picker
   - Adjust stroke width (1-10px)
   - Toggle arrowhead on/off
4. Click "Save" to apply changes or "Cancel" to discard

### Deleting a Line
- Hover over the line and click the red × button

### Example Multi-Segment Lines

**L-shaped connection**:
1. Segment 1: East, 150px
2. Segment 2: South, 100px

**Z-shaped path**:
1. Segment 1: East, 100px
2. Segment 2: South, 80px
3. Segment 3: East, 100px

**Complex path**:
1. Segment 1: East, 120px
2. Segment 2: North, 60px
3. Segment 3: East, 80px
4. Segment 4: South, 100px

## Technical Details

### Path Calculation Algorithm
1. Start at origin (0, 0)
2. For each segment:
   - Calculate endpoint based on direction and length
   - Add line command to SVG path
   - Track min/max coordinates for bounding box
3. Calculate SVG viewbox size and offset
4. Translate path to ensure all segments are visible

### Segment Direction Logic
- **North**: Decreases Y coordinate (moves up)
- **South**: Increases Y coordinate (moves down)
- **East**: Increases X coordinate (moves right)
- **West**: Decreases X coordinate (moves left)

### Arrowhead Generation
Arrowhead is drawn at the end of the final segment:
- Triangle shape points in the direction of the last segment
- Size: 10px
- Filled with line color
- Only shown if `showArrowhead` is true

### Segment Dragging
When dragging a segment endpoint:
1. Store starting mouse position and segment length
2. On mouse move, calculate delta from start
3. Apply delta in the direction of the segment:
   - North/South: Use deltaY
   - East/West: Use deltaX
4. Clamp length between 20px and 500px
5. Update segment in state

### Styling
- Line button: Purple background (`bg-purple-500`)
- Delete button: Red, appears on hover with opacity transition
- Edit modal: White background with shadow, max height 80vh for scrolling
- Segment list: Each segment in bordered card with controls
- Draggable handles: Semi-transparent circles (opacity: 0.4) with hover effect (opacity: 0.7)

## Use Cases

### Connecting Units
- Create paths from one unit to another
- Route around obstacles with multiple segments
- Show dependencies or relationships

### Flow Diagrams
- Indicate process flow between steps
- Show branching paths
- Create complex routing

### Hierarchy Visualization
- Connect parent to child elements
- Show organizational structure
- Indicate levels or tiers

## Future Enhancements
- Save polylines to backend/database
- Snap endpoints to unit boxes
- Curved segments (bezier paths)
- Line labels or annotations
- Different line styles (dashed, dotted)
- Automatic routing algorithms
- Connection points on units
- Bi-directional arrows
