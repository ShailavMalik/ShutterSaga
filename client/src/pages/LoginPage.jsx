import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

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
      navigate("/gallery");
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSuccess(response) {
    try {
      await loginWithGoogle(response.credential);
      navigate("/gallery");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Google sign-in failed. Please try again."
      );
    }
  }

  function handleGoogleError() {
    setError("Google sign-in was cancelled or failed");
  }

  function toggleMode() {
    setIsLoginMode((prev) => !prev);
    setError("");
    setFormData({ username: "", email: "", password: "" });
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500 p-4 sm:p-5">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600">
            📷 ShutterSaga
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Your photos, beautifully organized
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <h2 className="text-center text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
            {isLoginMode ? "Welcome Back" : "Create Account"}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 sm:mb-5 text-center text-sm font-medium border border-red-200">
              {error}
            </div>
          )}

          {!isLoginMode && (
            <div className="mb-4 sm:mb-5">
              <label
                htmlFor="username"
                className="block mb-2 text-gray-600 font-medium text-sm">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
                required
                minLength={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          )}

          <div className="mb-5">
            <label
              htmlFor="email"
              className="block mb-2 text-gray-600 font-medium text-sm">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block mb-2 text-gray-600 font-medium text-sm">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              minLength={6}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-xl font-semibold text-base shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl hover:cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0">
            {isSubmitting
              ? "Please wait..."
              : isLoginMode
              ? "Sign In"
              : "Sign Up"}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            {isLoginMode
              ? "Don't have an account?"
              : "Already have an account?"}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-1 text-indigo-600 font-semibold hover:underline hover:cursor-pointer bg-transparent border-0 cursor-pointer">
              {isLoginMode ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>

        {/* OAuth divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="px-4 text-gray-400 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Google login */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
          />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
