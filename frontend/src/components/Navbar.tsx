import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isTeachingActivitiesSelected = location.pathname === "/WhiteboardCanvas";

  const selectedView =
    location.pathname === "/WhiteboardCanvas" ? "/WhiteboardCanvas" : "/UnitCanvas";

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40
            backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="relative flex items-center gap-8">
            <select
              value={selectedView}
              onChange={(e) => navigate(e.target.value)}
              className="h-9 rounded-md border border-base-300 bg-base-100 px-3 text-sm"
            >
              <option value="/UnitCanvas">Unit Structure</option>
              <option value="/WhiteboardCanvas">Teaching Activities</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            {isTeachingActivitiesSelected && (
              <div
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'help',
                }}
                className="group"
              >
                <svg
                  className="w-5 h-5 text-gray-600 hover:text-gray-700 transition-colors"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div
                  className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-3 py-2 bg-gray-400 text-white text-xs rounded shadow-lg opacity-0 pointer-events-none transition-opacity group-hover:opacity-100"
                  style={{
                    fontSize: '12px',
                    lineHeight: '1.4',
                    maxWidth: '250px',
                    whiteSpace: 'normal',
                    width: 'max-content',
                  }}
                >
                  This is the free whiteboard canvas, all elements are free to move and you can save and edit this canvas as you want
                  <div
                    style={{
                      position: 'absolute',
                      left: '100%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '0',
                      height: '0',
                      borderTop: '6px solid transparent',
                      borderBottom: '6px solid transparent',
                      borderLeft: '6px solid rgb(156, 163, 175)',
                    }}
                  />
                </div>
              </div>
            )}
            <Link
              to={"/CourseEdit"}
              className={`
                            btn btn-sm gap-2 transition-colors
                            
                            `}
            >
              <span className="hidden sm: inline">Edit Course</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                to={"/UnitCanvas"}
                className={`
                            btn btn-sm gap-2 transition-colors
                            
                            `}
              >
                <span className="hidden sm: inline">Edit Canvas</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
