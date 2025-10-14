import { useEffect, useState } from "react";
import { useCourseStore } from "../stores/useCourseStore";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Trash2,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar";
import { useCLOStore } from "../stores/useCLOStore";
import CLOForm from "../components/common/CLOForm";

export interface Course {
  courseId: String;
  courseName: String;
  courseDesc: String;
  expectedDuration: number;
  numberTeachingPeriods: number;
}

export interface CourseLearningOutcome {
  cloId?: number | null;
  cloDesc: string;
  courseId: string | undefined;
}

export const CourseEdit = () => {
  const [courseData, setCourseData] = useState({
    courseId: "",
    courseName: "",
    courseDesc: "",
    expectedDuration: "",
    numberTeachingPeriods: "",
  });
  const [loadedCLOs, setLoadedCLOs] = useState<CourseLearningOutcome[]>([]);
  const [addingCLO, setAddingCLO] = useState<boolean>();
  const [cloEdit, setCLOEdit] = useState<CourseLearningOutcome | null>(null);

  const {
    currentCourse,
    existingCourses,
    createCourse,
    viewCourses,
    setCurrentCourse,
    updateCourse,
  } = useCourseStore();

  const { currentCLOs, createCLO, viewCLOsByCourse, updateCLO, deleteCLO } =
    useCLOStore();

  useEffect(() => {
    setCourseData(currentCourse);
    const loadValues = async (course) => {
      await viewCLOsByCourse(course);
    };
    loadValues(currentCourse);
    setLoadedCLOs(currentCLOs);
  }, []);

  useEffect(() => {
    setLoadedCLOs(currentCLOs);
    console.log(currentCLOs);
  }, [currentCLOs]);

  const handleUpdate = (e) => {
    updateCourse(courseData);
    setLoadedCLOs(currentCLOs);
  };

  const handleAddClo = (clo: CourseLearningOutcome) => {
    const addAndRefresh = async (clo: CourseLearningOutcome) => {
      await createCLO(clo);
      //await viewCLOsByCourse(courseData.courseId);
    };
    console.log("Adding CLO", clo);
    addAndRefresh(clo);
    setCLOEdit(null);
  };

  const handleUpdateClo = (clo: CourseLearningOutcome) => {
    const updateAndRefresh = async (clo: CourseLearningOutcome) => {
      await updateCLO(clo);
      //await viewCLOsByCourse(courseData.courseId);
    };
    console.log("course data", courseData);
    console.log("Updating CLO", clo);
    updateAndRefresh(clo);
    setCLOEdit(null);
  };

  const handleDeleteClo = (clo: CourseLearningOutcome) => {
    const deleteAndRefresh = async (clo: CourseLearningOutcome) => {
      await deleteCLO(clo);
    };
    console.log("deleting clo", clo);
    deleteAndRefresh(clo);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
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
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="text center mb-8">
          <div className="flex flex-col items-center gap-2 group">
            <h1 className="text-2xl font-bold mt-2">
              Current Course Learning Outcomes
            </h1>
          </div>
        </div>
        <div className="w-full max-w-md outline-solid max-h-[50vh] overflow-y-auto">
          {loadedCLOs.map((clo) => (
            <div className="card card-dash bg-base-100 w-96">
              <div className="card-body">
                <h2 className="card-title">{clo.cloId}</h2>
                <p>{clo.cloDesc}</p>
                <div className="card-actions justify-end">
                  <button onClick={() => handleDeleteClo(clo)}>
                    <Trash2 />
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => setCLOEdit(clo)}
                  >
                    View Outcome
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-center items-center p-6 sm:p-12">
          <button
            className="btn btn-xs sm:btn-sm md:btn-md lg:btn-lg xl:btn-xl"
            onClick={() =>
              setCLOEdit({
                cloDesc: "",
                courseId: "",
              })
            }
          >
            Add Course Learning Outcome
          </button>
        </div>
      </div>
      {cloEdit && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-black text-xl font-bold">
                {!cloEdit.cloId
                  ? "New Learning Outcome"
                  : `Learning Outcome ${cloEdit.cloId}`}
              </h2>
              <button
                onClick={() => setCLOEdit(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            <CLOForm
              onSave={!cloEdit.courseId ? handleAddClo : handleUpdateClo}
              initialData={cloEdit}
              courseId={courseData.courseId}
            />
          </div>
        </div>
      )}
    </div>
  );
};
