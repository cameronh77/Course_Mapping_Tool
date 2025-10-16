import { useState } from "react";
import type { CourseLearningOutcome } from "../../pages/CourseEdit";
import type { Tag } from "../../pages/UnitCanvas";

interface AddTagMenuProps {
  x: number;
  y: number;
  data: { name: string; id: number }[];
  onClose: () => void;
  onSave: (tag: number) => void;
}

export const AddTagMenu = ({
  x,
  y,
  data,
  onClose,
  onSave,
}: AddTagMenuProps) => {
  const [selectedTag, setSelectedTag] = useState(data[0]);
  return (
    <div
      className="fixed bg-white border border-gray-300 shadow-lg rounded-md text-black flex flex-col justify-between min-h-[10rem] w-[20rem]"
      style={{
        top: y,
        left: x,
        minWidth: "150px",
        padding: "0.5rem",
      }}
    >
      <h2 className="text-black text-xl font-bold">Add Connection</h2>
      <select
        name="select"
        onChange={(e) =>
          setSelectedTag(data.find((d) => d.id === Number(e.target.value))!)
        }
      >
        {data.map((data) => {
          console.log(data);
          return <option value={data.id}>{data.name}</option>;
        })}
      </select>
      <div className="flex flex-row">
        <button
          className="px-6 py-2 bg-red-600 text-white font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors grow-50"
          onClick={onClose}
        >
          Close
        </button>
        <button
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors grow-50"
          onClick={() => onSave(selectedTag.id)}
        >
          Save Unit
        </button>
      </div>
    </div>
  );
};
