import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import GalleryPage from "./pages/GalleryPage";
import UploadPage from "./pages/UploadPage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/upload" element={<UploadPage />} />
          </Route>

          {/* Redirect root to gallery */}
          <Route path="/" element={<Navigate to="/gallery" replace />} />
          <Route path="*" element={<Navigate to="/gallery" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
