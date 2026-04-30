import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCourseStore } from "../stores/useCourseStore";
import { useUnitStore } from "../stores/useUnitStore";

const VIEW_TABS = [
  { path: "/UnitCanvas", label: "Unit Structure" },
  { path: "/WhiteboardCanvas", label: "Teaching Activities" },
] as const;

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentCourse, setCurrentCourse } = useCourseStore() as {
    currentCourse: { courseId?: string; courseName?: string } | null;
    setCurrentCourse: (data: unknown) => void;
  };
  const { currentUnit } = useUnitStore() as {
    currentUnit: { unitId?: string } | null;
  };

  const isInternal = location.pathname === "/UnitInternalCanvas";
  const activeTab = isInternal
    ? "/UnitCanvas"
    : VIEW_TABS.find((t) => t.path === location.pathname)?.path;

  const handleBackToCourses = () => {
    setCurrentCourse(null);
    navigate("/");
  };

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40
            backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={handleBackToCourses}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Back to courses"
            >
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">Courses</span>
            </button>

            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1 text-sm text-white/60 min-w-0"
            >
              {isInternal ? (
                <button
                  onClick={() => navigate("/UnitCanvas")}
                  className="font-medium text-white/80 hover:text-white hover:underline truncate"
                  title="Back to unit structure"
                >
                  {currentCourse?.courseId
                    ? `${currentCourse.courseId} — ${currentCourse.courseName}`
                    : currentCourse?.courseName || "Course"}
                </button>
              ) : (
                <span className="font-medium text-white truncate">
                  {currentCourse?.courseId
                    ? `${currentCourse.courseId} — ${currentCourse.courseName}`
                    : currentCourse?.courseName || "Course"}
                </span>
              )}
              {isInternal && currentUnit?.unitId && (
                <>
                  <ChevronRight className="size-3 shrink-0" />
                  <span className="text-white truncate">{currentUnit.unitId}</span>
                </>
              )}
            </nav>
          </div>

          <div
            role="tablist"
            aria-label="View"
            className="inline-flex items-center gap-1 rounded-lg bg-white/10 p-1"
          >
            {VIEW_TABS.map((tab) => {
              const active = activeTab === tab.path;
              return (
                <button
                  key={tab.path}
                  role="tab"
                  aria-selected={active}
                  onClick={() => navigate(tab.path)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-white text-slate-900 shadow"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/CourseEdit"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location.pathname === "/CourseEdit"
                  ? "bg-white text-slate-900 shadow"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <span className="hidden sm:inline">Edit Course</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
