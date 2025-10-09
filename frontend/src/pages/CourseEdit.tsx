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
import Navbar from "../components/navbar";

export interface Course {
  courseId: String;
  courseName: String;
  courseDesc: String;
  expectedDuration: number;
  numberTeachingPeriods: number;
}

export const CourseEdit = () => {
  const [courseData, setCourseData] = useState({
    courseId: "",
    courseName: "",
    courseDesc: "",
    expectedDuration: "",
    numberTeachingPeriods: "",
  });
  const [loadedCourses, setLoadedCourses] = useState<Course[]>([]);

  const {
    currentCourse,
    existingCourses,
    createCourse,
    viewCourses,
    setCurrentCourse,
    updateCourse,
  } = useCourseStore();

  useEffect(() => {
    console.log(currentCourse);
    setCourseData(currentCourse);
  }, []);

  const handleUpdate = (e) => {
    console.log(courseData);
    //e.preventDefault();
    //const success = validateForm();

    updateCourse(courseData);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <Navbar />
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <h1 className="text-2xl font-bold mt-2">
                {courseData.courseId}:{courseData.courseName}
              </h1>
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

          <button
            type="submit"
            className="btn btn-primary w-full"
            onClick={handleUpdate}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
