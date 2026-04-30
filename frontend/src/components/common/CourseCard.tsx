interface CourseCardProps {
  activeStatus: boolean;
  courseName: string;
  courseId: string;
  courseDuration: number;
  numberOfUnits: number;
  onClick: () => void;
}

export const CourseCard = ({
  activeStatus,
  courseName,
  courseId,
  courseDuration,
  numberOfUnits,
  onClick,
}: CourseCardProps) => {
  return (
    <div className="bg-white flex flex-col h-[25rem] rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex-1 flex flex-col gap-1">
        <p className="text-base font-semibold text-gray-900 leading-tight">{courseName}</p>
        <p className="text-xs text-gray-400 font-mono">{courseId}</p>
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

      <button
        className="w-full bg-transparent hover:bg-blue-500 text-blue-600 font-semibold hover:text-white py-2 px-4 border border-blue-400 hover:border-transparent rounded-lg transition-colors text-sm"
        onClick={onClick}
      >
        {activeStatus ? "View Course Map" : "Continue Editing"}
      </button>
    </div>
  );
};
