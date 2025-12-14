import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/login") {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.08)] border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <button
          onClick={() => navigate("/gallery")}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer bg-transparent border-0 hover:opacity-80 transition-opacity">
          <span className="text-xl sm:text-2xl">📷</span>
          <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            ShutterSaga
          </span>
        </button>

        <div className="hidden sm:flex gap-1">
          <NavLink
            to="/gallery"
            className={({ isActive }) =>
              isActive
                ? "px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold transition-all shadow-lg text-sm"
                : "px-4 py-2 rounded-full text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-100 transition-all text-sm"
            }>
            Gallery
          </NavLink>
          <NavLink
            to="/upload"
            className={({ isActive }) =>
              isActive
                ? "px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold transition-all shadow-lg text-sm"
                : "px-4 py-2 rounded-full text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-100 transition-all text-sm"
            }>
            Upload
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive
                ? "px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold transition-all shadow-lg text-sm"
                : "px-4 py-2 rounded-full text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-100 transition-all text-sm"
            }>
            About
          </NavLink>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <NavLink
            to="/profile"
            className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white cursor-pointer hover:scale-110 hover:shadow-lg transition-all duration-300"
            aria-label="Profile">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover cursor-pointer"
              />
            ) : (
              <span className="text-white font-bold text-sm sm:text-base cursor-pointer">
                {user?.username?.[0]?.toUpperCase() || "U"}
              </span>
            )}
          </NavLink>
          <button
            onClick={handleLogout}
            className="hidden sm:block px-4 py-2 rounded-full bg-gray-100 text-gray-600 font-medium text-sm hover:bg-red-500 hover:text-white hover:shadow-md transition-all duration-300">
            Logout
          </button>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 px-2 py-2 flex justify-around items-center z-50">
        <NavLink
          to="/gallery"
          className={({ isActive }) =>
            isActive
              ? "flex flex-col items-center gap-1 text-purple-600 font-medium text-xs"
              : "flex flex-col items-center gap-1 text-gray-500 font-medium text-xs"
          }>
          <span className="text-lg">🖼️</span>
          Gallery
        </NavLink>
        <NavLink
          to="/upload"
          className={({ isActive }) =>
            isActive
              ? "flex flex-col items-center gap-1 text-purple-600 font-medium text-xs"
              : "flex flex-col items-center gap-1 text-gray-500 font-medium text-xs"
          }>
          <span className="text-lg">📤</span>
          Upload
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive
              ? "flex flex-col items-center gap-1 text-purple-600 font-medium text-xs"
              : "flex flex-col items-center gap-1 text-gray-500 font-medium text-xs"
          }>
          <span className="text-lg">ℹ️</span>
          About
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-gray-500 font-medium text-xs bg-transparent border-0">
          <span className="text-lg">🚪</span>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
