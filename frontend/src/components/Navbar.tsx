import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

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

          <div className="flex items-center gap-2">
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
