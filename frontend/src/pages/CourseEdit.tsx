import { useEffect, useState } from "react";
import { useCourseStore } from "../stores/useCourseStore";
import { Trash2 } from "lucide-react";
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

const inputClass =
  "w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

const labelClass = "text-sm font-medium text-gray-700 mb-1";

const btnOutline =
  "bg-transparent hover:bg-blue-500 text-blue-600 font-semibold hover:text-white py-2 px-6 border border-blue-500 hover:border-transparent rounded-lg transition-colors text-sm";

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

  const { currentCourse, existingCourses, createCourse, viewCourses, setCurrentCourse, updateCourse } = useCourseStore();
  const { currentCLOs, createCLO, viewCLOsByCourse, updateCLO, deleteCLO } = useCLOStore();

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
  }, [currentCLOs]);

  const handleUpdate = () => {
    updateCourse(courseData);
    setLoadedCLOs(currentCLOs);
  };

  const handleAddClo = (clo: CourseLearningOutcome) => {
    const addAndRefresh = async (clo: CourseLearningOutcome) => {
      await createCLO(clo);
    };
    addAndRefresh(clo);
    setCLOEdit(null);
  };

  const handleUpdateClo = (clo: CourseLearningOutcome) => {
    const updateAndRefresh = async (clo: CourseLearningOutcome) => {
      await updateCLO(clo);
    };
    updateAndRefresh(clo);
    setCLOEdit(null);
  };

  const handleDeleteClo = (clo: CourseLearningOutcome) => {
    deleteCLO(clo);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-10 grid lg:grid-cols-2 gap-8">

        {/* Left — Course Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col gap-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {courseData.courseId}{courseData.courseName ? `: ${courseData.courseName}` : ""}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Edit course details</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label className={labelClass}>Course Description</label>
              <input
                type="text"
                className={inputClass}
                placeholder="A course about accounting."
                value={courseData.courseDesc}
                onChange={(e) => setCourseData({ ...courseData, courseDesc: e.target.value })}
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Expected Duration (years)</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. 3"
                value={courseData.expectedDuration}
                onChange={(e) => setCourseData({ ...courseData, expectedDuration: e.target.value })}
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Number of Teaching Periods</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. 2"
                value={courseData.numberTeachingPeriods}
                onChange={(e) => setCourseData({ ...courseData, numberTeachingPeriods: e.target.value })}
              />
            </div>
          </div>

          <button className={btnOutline} onClick={handleUpdate}>
            Save Changes
          </button>
        </div>

        {/* Right — Course Learning Outcomes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Course Learning Outcomes</h2>
            <p className="text-sm text-gray-500 mt-1">{loadedCLOs.length} outcome{loadedCLOs.length !== 1 ? "s" : ""}</p>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[50vh] pr-1">
            {loadedCLOs.map((clo) => (
              <div
                key={clo.cloId}
                className="flex items-start justify-between gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-gray-400 mb-0.5">CLO {clo.cloId}</p>
                  <p className="text-sm text-gray-800 break-words">{clo.cloDesc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    onClick={() => setCLOEdit(clo)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => handleDeleteClo(clo)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {loadedCLOs.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No outcomes yet. Add one below.</p>
            )}
          </div>

          <button
            className={btnOutline}
            onClick={() => setCLOEdit({ cloDesc: "", courseId: "" })}
          >
            + Add Learning Outcome
          </button>
        </div>
      </div>

      {/* CLO Modal */}
      {cloEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {!cloEdit.cloId ? "New Learning Outcome" : `Learning Outcome ${cloEdit.cloId}`}
              </h2>
              <button
                onClick={() => setCLOEdit(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none transition-colors"
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
