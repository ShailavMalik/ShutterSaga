import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import Navbar from "./components/shared/Navbar";
import LoginPage from "./pages/LoginPage";
import GalleryPage from "./pages/GalleryPage";
import UploadPage from "./pages/UploadPage";
import AboutPage from "./pages/AboutPage";
import ProfilePage from "./pages/ProfilePage";

function AnimatedRoutes() {
  const location = useLocation();

  const variants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        className={`min-h-screen text-gray-800 ${
          location.pathname !== "/login" ? "pt-16" : ""
        }`}>
        {location.pathname !== "/login" && <Navbar />}
        <Routes location={location}>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="/about" element={<AboutPage />} />

          {/* Redirect root to gallery */}
          <Route path="/" element={<Navigate to="/gallery" replace />} />
          <Route path="*" element={<Navigate to="/gallery" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
