import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="navbar-logo">📷</span>
          <span className="navbar-title">ShutterSaga</span>
        </div>

        <div className="navbar-links">
          <NavLink
            to="/gallery"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }>
            Gallery
          </NavLink>
          <NavLink
            to="/upload"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }>
            Upload
          </NavLink>
        </div>

        <div className="navbar-user">
          <span className="user-name">Hi, {user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
