import { Routes, Route, Navigate } from "react-router-dom";
//import { useAuthStore } from "./store/useAuthStore"
import { useEffect } from "react";
//import { Loader } from "lucide-react"
import { HomePage } from "./pages/HomePage";
import { CanvasPage } from "./pages/UnitCanvas";
import Navbar from "./components/navbar";
import { useCourseStore } from "./stores/useCourseStore";
import { CourseEdit } from "./pages/CourseEdit";

const App = () => {
  const { currentCourse } = useCourseStore();

  return (
    <div>
      {currentCourse && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/UnitCanvas" element={<CanvasPage />} />
        <Route path="/CourseEdit" element={<CourseEdit />} />
      </Routes>
    </div>
  );
};

export default App;
