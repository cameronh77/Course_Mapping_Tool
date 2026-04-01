// Registry for whiteboard playground handlers
// Used to pass add functions from WhiteboardCanvas to Navbar

let handlers: {
  addUnit?: () => void;
  addCLO?: () => void;
} = {};

export const registerWhiteboardHandlers = (h: {
  addUnit?: () => void;
  addCLO?: () => void;
}) => {
  handlers = h;
};

export const clearWhiteboardHandlers = () => {
  handlers = {};
};

export const getWhiteboardHandlers = () => handlers;
