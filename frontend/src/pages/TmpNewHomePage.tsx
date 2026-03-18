import { useEffect, useState } from "react";
import { useCourseStore } from "../stores/useCourseStore";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CourseCard } from "../components/common/CourseCard";

export interface Course {
  courseId: string;
  courseName: string;
  courseDesc: string;
  expectedDuration: number;
  numberTeachingPeriods: number;
}

export const TmpNewHomePage = () => {
  const [courseData, setCourseData] = useState({
    courseId: "",
    courseName: "",
    courseDesc: "",
    expectedDuration: "",
    numberTeachingPeriods: "",
  });
  const [loadedCourses, setLoadedCourses] = useState<Course[]>([]);
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
    console.log("Existing Courses");
  }, [existingCourses]);

  useEffect(() => {
    const loadCourses = async () => {
      await viewCourses(); // assuming it returns data or updates the store
    };
    loadCourses();
  }, []);

  const handleSubmit = (e) => {
    console.log("TEST");
    //e.preventDefault();
    //const success = validateForm();
    setCurrentCourse(courseData);
    createCourse(courseData);
    navigate("/UnitCanvas");
  };

  const handleViewCourse = (course: Course) => {
    console.log("TESTSTETETETE");
    // Update local state
    setCourseData({
      courseId: course.courseId,
      courseName: course.courseName,
      courseDesc: course.courseDesc,
      expectedDuration: String(course.expectedDuration),
      numberTeachingPeriods: String(course.numberTeachingPeriods),
    });

    // Store globally
    setCurrentCourse(course);

    // Navigate to edit or view page
    navigate("/UnitCanvas");
  };

  return (
    <div className="min-h-screen flex lg:flex-row">
      <div className="grow-2 flex flex-col items-center p-6 sm:p-12 bg-white">
        <ul className="menu rounded-box">
          <li>
            <a className="tooltip tooltip-right">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <p className="text-black">Dashboard</p>
            </a>
          </li>
          <li>
            <a className="tooltip tooltip-right">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-black">All Courses</p>
            </a>
          </li>
          <li>
            <a className="tooltip tooltip-right">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-black">Themes</p>
            </a>
          </li>
        </ul>
      </div>
      <div className="grow-14 flex flex-col p-6 sm:p-12 bg-gray-200">
        <div className="text center mb-8">
          <div className="flex flex-col items-center gap-2 group items-start">
            <h1 className="text-2xl font-bold mt-2 text-black">
              Course Management Dashboard
            </h1>
            <h2 className="text-gray-500">
              Manage and map university curriculum frameworks
            </h2>
          </div>
        </div>
        <div className="w-full h-full grid grid-cols-3 gap-4">
          {loadedCourses.map((course) => (
            <CourseCard
              activeStatus={true}
              courseName={course.courseName}
              courseId={course.courseId}
              courseDuration={course.expectedDuration}
              numberOfUnits={32}
              onClick={() => handleViewCourse(course)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
