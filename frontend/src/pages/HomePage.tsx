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
import { Link } from "react-router-dom";

export interface Course {
  courseId: String;
  courseName: String;
  courseDesc: String;
  expectedDuration: number;
  numberTeachingPeriods: number;
}

export const HomePage = () => {
  const [courseData, setCourseData] = useState({
    courseId: "",
    courseName: "",
    courseDesc: "",
    expectedDuration: "",
    numberTeachingPeriods: "",
  });
  const [loadedCourses, setLoadedCourses] = useState<Course[]>([]);

  const { existingCourses, createCourse, viewCourses } = useCourseStore();

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
    console.log(courseData);
    //e.preventDefault();
    //const success = validateForm();
    createCourse(courseData);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <h1 className="text-2xl font-bold mt-2">Create A New Course</h1>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Course ID</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="size-5 text-base-content/40" />
              </div>
              <input
                type="text"
                className={`input input-bordered w-full pl-10`}
                placeholder="B2029"
                value={courseData.courseId}
                onChange={(e) =>
                  setCourseData({ ...courseData, courseId: e.target.value })
                }
              />
            </div>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Course Name</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="size-5 text-base-content/40" />
              </div>
              <input
                type="text"
                className={`input input-bordered w-full pl-10`}
                placeholder="Bachelor of Accounting"
                value={courseData.courseName}
                onChange={(e) =>
                  setCourseData({ ...courseData, courseName: e.target.value })
                }
              />
            </div>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Course Description</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="size-5 text-base-content/40" />
              </div>
              <input
                type="text"
                className={`input input-bordered w-full pl-10`}
                placeholder="A course about accounting."
                value={courseData.courseDesc}
                onChange={(e) =>
                  setCourseData({ ...courseData, courseDesc: e.target.value })
                }
              />
            </div>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Expected Duration</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="size-5 text-base-content/40" />
              </div>
              <input
                type="text"
                className={`input input-bordered w-full pl-10`}
                placeholder="5"
                value={courseData.expectedDuration}
                onChange={(e) =>
                  setCourseData({
                    ...courseData,
                    expectedDuration: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">
                Number of Teaching Periods
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="size-5 text-base-content/40" />
              </div>
              <input
                type="text"
                className={`input input-bordered w-full pl-10`}
                placeholder="2"
                value={courseData.numberTeachingPeriods}
                onChange={(e) =>
                  setCourseData({
                    ...courseData,
                    numberTeachingPeriods: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <Link to="/UnitCanvas" className="link link-primary">
            <button
              type="submit"
              className="btn btn-primary w-full"
              onClick={handleSubmit}
            >
              CREATE COURSE
            </button>
          </Link>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="text center mb-8">
          <div className="flex flex-col items-center gap-2 group">
            <h1 className="text-2xl font-bold mt-2">Current Courses</h1>
          </div>
        </div>
        <div className="w-full max-w-md outline-solid ">
          {loadedCourses.map((course) => (
            <div className="card card-dash bg-base-100 w-96">
              <div className="card-body">
                <h2 className="card-title">{course.courseName}</h2>
                <p>{course.courseDesc}</p>
                <div className="card-actions justify-end">
                  <Link to="/UnitCanvas" className="link link-primary">
                    <button className="btn btn-primary">View Course</button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
