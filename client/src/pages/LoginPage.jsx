/**
 * Login Page
 * Handles both login and registration with a toggle
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

function LoginPage() {
  // Toggle between login and signup modes
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  // UI state
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Update form field when user types
  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Clear error when user starts typing
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.username, formData.email, formData.password);
      }

      // Success! Redirect to gallery
      navigate("/gallery");
    } catch (err) {
      // Show error message from server, or a generic one
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Switch between login and signup
  function toggleMode() {
    setIsLoginMode((prev) => !prev);
    setError("");
    setFormData({ username: "", email: "", password: "" });
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header with logo */}
        <div className="login-header">
          <h1 className="logo">📷 ShutterSaga</h1>
          <p className="tagline">Your photos, beautifully organized</p>
        </div>

        {/* Login/Signup Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>{isLoginMode ? "Welcome Back" : "Create Account"}</h2>

          {/* Error message */}
          {error && <div className="error-message">{error}</div>}

          {/* Username field (only for signup) */}
          {!isLoginMode && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
                required
                minLength={3}
              />
            </div>
          )}

          {/* Email field */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>

          {/* Submit button */}
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : isLoginMode
              ? "Sign In"
              : "Sign Up"}
          </button>
        </form>

        {/* Toggle between login/signup */}
        <div className="toggle-mode">
          <p>
            {isLoginMode
              ? "Don't have an account?"
              : "Already have an account?"}
            <button type="button" onClick={toggleMode} className="toggle-btn">
              {isLoginMode ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
