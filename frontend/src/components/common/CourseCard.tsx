interface CourseCardProps {
  activeStatus: boolean;
  courseName: string;
  courseId: string;
  courseDesc?: string;
  courseDuration: number;
  numberOfUnits: number;
  onClick: () => void;
  onDelete?: () => void;
}

export const CourseCard = ({
  activeStatus,
  courseName,
  courseId,
  courseDesc,
  courseDuration,
  numberOfUnits,
  onClick,
  onDelete,
}: CourseCardProps) => {
  return (
    <div className="bg-white flex flex-col h-[25rem] rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex-1 flex flex-col gap-1 overflow-hidden">
        <p className="text-base font-semibold text-gray-900 leading-tight">{courseName}</p>
        <p className="text-xs text-gray-400 font-mono mb-2">{courseId}</p>
        {courseDesc && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-5">{courseDesc}</p>
        )}
      </div>

      <hr className="border-gray-100 my-4" />

      <div className="flex justify-around text-center mb-6">
        <div>
          <p className="text-lg font-bold text-gray-800">{courseDuration}</p>
          <p className="text-xs text-gray-400">Years</p>
        </div>
        <div className="w-px bg-gray-100" />
        <div>
          <p className="text-lg font-bold text-gray-800">{numberOfUnits}</p>
          <p className="text-xs text-gray-400">Units</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className="flex-1 bg-transparent hover:bg-blue-500 text-blue-600 font-semibold hover:text-white py-2 px-4 border border-blue-400 hover:border-transparent rounded-lg transition-colors text-sm"
          onClick={onClick}
        >
          {activeStatus ? "View Course Map" : "Continue Editing"}
        </button>
        {onDelete && (
          <button
            className="bg-transparent hover:bg-red-500 text-red-500 hover:text-white py-2 px-3 border border-red-400 hover:border-transparent rounded-lg transition-colors text-sm"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete course"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
