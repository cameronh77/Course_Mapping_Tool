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
    <div className="bg-white flex flex-col w-[%30] h-[50%] rounded-xl justify-evenly">
      <p className="text-black">{courseName}</p>
      <p className="text-gray-500">ID: {courseId}</p>
      <hr />
      <div className="flex flex-row justify-evenly">
        <p className="text-gray-500">{courseDuration} Years</p>
        <p className="text-gray-500">{numberOfUnits} Units</p>
      </div>

      <div className="flex justify-center items-center">
        <button
          className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded w-[80%]"
          onClick={onClick}
        >
          {activeStatus ? `View Course Map` : `Continue Editing`}
        </button>
      </div>
    </div>
  );
};
