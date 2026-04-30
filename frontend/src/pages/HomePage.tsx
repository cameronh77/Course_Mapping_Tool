import { useEffect, useState } from "react";
import { useCourseStore } from "../stores/useCourseStore";
import { useNavigate } from "react-router-dom";
import { CourseCard } from "../components/common/CourseCard";

export interface Course {
  courseId: string;
  courseName: string;
  courseDesc: string;
  expectedDuration: number;
  numberTeachingPeriods: number;
}

const inputClass =
  "w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

const labelClass = "text-sm font-medium text-gray-700 mb-1";

const btnOutline =
  "bg-transparent hover:bg-blue-500 text-blue-600 font-semibold hover:text-white py-2 px-6 border border-blue-500 hover:border-transparent rounded-lg transition-colors";

export const HomePage = () => {
  const [courseData, setCourseData] = useState({
    courseId: "",
    courseName: "",
    courseDesc: "",
    expectedDuration: "",
    numberTeachingPeriods: "",
  });
  const [loadedCourses, setLoadedCourses] = useState<Course[]>([]);
  const [addingCourse, setAddingCourse] = useState<number>(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { existingCourses, createCourse, viewCourses, setCurrentCourse } =
    useCourseStore();

  useEffect(() => {
    setLoadedCourses(
      existingCourses.map((c: any) => ({
        courseId: c.courseId,
        courseName: c.courseName,
        courseDesc: c.courseDesc,
        expectedDuration: Number(c.expectedDuration),
        numberTeachingPeriods: Number(c.numberTeachingPeriods),
      })) as Course[]
    );
  }, [existingCourses]);

  useEffect(() => {
    const loadCourses = async () => {
      await viewCourses();
    };
    loadCourses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    setCurrentCourse(courseData);
    createCourse(courseData);
    navigate("/UnitCanvas");
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredCourses = loadedCourses.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.courseName.toLowerCase().includes(q) ||
      c.courseId.toLowerCase().includes(q) ||
      c.courseDesc.toLowerCase().includes(q)
    );
  });

  const handleViewCourse = (course: Course) => {
    setCourseData({
      courseId: course.courseId,
      courseName: course.courseName,
      courseDesc: course.courseDesc,
      expectedDuration: String(course.expectedDuration),
      numberTeachingPeriods: String(course.numberTeachingPeriods),
    });
    setCurrentCourse(course);
    navigate("/UnitCanvas");
  };

  return (
    <div>
      {/* Step 1 — Basic Info */}
      {addingCourse === 1 && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-5">
            <div>
              <p className="text-xl font-bold text-gray-900">Create New Course</p>
              <p className="text-sm text-gray-500 mt-1">Step 1 of 2 — Course details</p>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col flex-1">
                <label className={labelClass}>Course Name</label>
                <input name="courseName" value={courseData.courseName} onChange={handleChange} className={inputClass} placeholder="e.g. Bachelor of Science" />
              </div>
              <div className="flex flex-col w-36">
                <label className={labelClass}>Course ID</label>
                <input name="courseId" value={courseData.courseId} onChange={handleChange} className={inputClass} placeholder="e.g. BSC01" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Description</label>
              <input name="courseDesc" value={courseData.courseDesc} onChange={handleChange} className={inputClass} placeholder="Brief course description" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button className={btnOutline} onClick={() => setAddingCourse(0)}>Cancel</button>
              <button className={btnOutline} onClick={() => setAddingCourse(2)}>Save & Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Academic Structure */}
      {addingCourse === 2 && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-5">
            <div>
              <p className="text-xl font-bold text-gray-900">Academic Structure</p>
              <p className="text-sm text-gray-500 mt-1">Step 2 of 2 — Structure details</p>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col flex-1">
                <label className={labelClass}>Teaching Periods per Year</label>
                <p className="text-xs text-gray-400 mb-1">How many teaching periods occur in a single calendar year</p>
                <input name="numberTeachingPeriods" value={courseData.numberTeachingPeriods} onChange={handleChange} className={inputClass} placeholder="e.g. 2 (semesters per year)" />
              </div>
              <div className="flex flex-col flex-1">
                <label className={labelClass}>Expected Duration</label>
                <p className="text-xs text-gray-400 mb-1">Total length of the course in years</p>
                <input name="expectedDuration" value={courseData.expectedDuration} onChange={handleChange} className={inputClass} placeholder="e.g. 3 years" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button className={btnOutline} onClick={() => setAddingCourse(1)}>Back</button>
              <button className={btnOutline} onClick={handleSubmit}>Create Course</button>
            </div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 bg-white border-r border-gray-200 flex flex-col py-6 px-3 gap-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Navigation</p>
          {[
            {
              label: "All Courses",
              path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            },
            {
              label: "Institution Settings",
              path: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
            },
          ].map(({ label, path }) => (
            <a
              key={label}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
              </svg>
              {label}
            </a>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-gray-100 p-8 overflow-auto">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Management Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Manage and map university curriculum frameworks</p>
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              Search courses
              <span className="ml-1 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">⌘K</span>
            </button>
          </div>

          {/* Search Modal */}
          {searchOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-24" onClick={() => setSearchOpen(false)}>
              <div
                className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search by name, ID, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {filteredCourses.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">No courses match "{searchQuery}"</p>
                  ) : (
                    filteredCourses.map((course) => (
                      <button
                        key={course.courseId}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                        onClick={() => { setSearchOpen(false); setSearchQuery(""); handleViewCourse(course); }}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">{course.courseName}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{course.courseId}</p>
                        </div>
                        <span className="text-xs text-gray-400">{course.expectedDuration}yr</span>
                      </button>
                    ))
                  )}
                </div>
                {filteredCourses.length > 0 && (
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-400">{filteredCourses.length} result{filteredCourses.length !== 1 ? "s" : ""}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-5">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.courseId}
                activeStatus={true}
                courseName={course.courseName}
                courseId={course.courseId}
                courseDuration={course.expectedDuration}
                numberOfUnits={32}
                onClick={() => handleViewCourse(course)}
              />
            ))}
            <button
              className="h-[25rem] rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center gap-2 transition-colors group"
              onClick={() => setAddingCourse(1)}
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">Add New Course</p>
              <p className="text-xs text-gray-400">Start mapping a new curriculum</p>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
