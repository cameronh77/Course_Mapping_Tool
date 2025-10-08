import { Routes, Route, Navigate } from "react-router-dom";
//import { useAuthStore } from "./store/useAuthStore"
import { useEffect } from "react";
//import { Loader } from "lucide-react"
import { HomePage } from "./pages/HomePage";
//import { useThemeStore } from "./store/useThemeStore"

const App = () => {
  //const {authUser, checkAuth, isCheckingAuth} = useAuthStore()

  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </div>
  );
};

export default App;
