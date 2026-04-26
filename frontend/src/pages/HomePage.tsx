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
                <input name="numberTeachingPeriods" value={courseData.numberTeachingPeriods} onChange={handleChange} className={inputClass} placeholder="e.g. 2" />
              </div>
              <div className="flex flex-col flex-1">
                <label className={labelClass}>Expected Duration (years)</label>
                <input name="expectedDuration" value={courseData.expectedDuration} onChange={handleChange} className={inputClass} placeholder="e.g. 3" />
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
              label: "Dashboard",
              path: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
            },
            {
              label: "All Courses",
              path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            },
            {
              label: "Themes",
              path: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Course Management Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and map university curriculum frameworks</p>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {loadedCourses.map((course) => (
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
