import { Link } from "react-router-dom";
import { LogOut, MessageSquare, Settings, User } from "lucide-react";

const Navbar = () => {
  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40
            backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8"></div>

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
