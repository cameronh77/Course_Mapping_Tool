import { Routes, Route, useLocation } from "react-router-dom";
//import { useAuthStore } from "./store/useAuthStore"
//import { Loader } from "lucide-react"
import { HomePage } from "./pages/HomePage";
import { CanvasPage } from "./pages/UnitCanvas";
import { WhiteboardCanvas } from "./pages/WhiteboardCanvas";
import Navbar from "./components/navbar";
import { useCourseStore } from "./stores/useCourseStore";
import { CourseEdit } from "./pages/CourseEdit";
import UnitInternalCanvas from "./pages/UnitInternalCanvas";

const App = () => {
  const { currentCourse } = useCourseStore();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div>
      {currentCourse && !isHome && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/UnitCanvas" element={<CanvasPage />} />
        <Route path="/WhiteboardCanvas" element={<WhiteboardCanvas />} />
        <Route path="/CourseEdit" element={<CourseEdit />} />
        <Route path="/UnitInternalCanvas" element={<UnitInternalCanvas />} />
      </Routes>
    </div>
  );
};

export default App;
