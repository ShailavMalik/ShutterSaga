/**
 * Authentication Context
 * Manages user authentication state across the app
 */

import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

// Create the context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Wraps the app and provides authentication state to all children
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Helper to clear auth data from storage
   */
  function clearStoredAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  // Check if user is already logged in when app loads
  useEffect(() => {
    let isMounted = true;

    async function checkExistingSession() {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          // Verify the token is still valid by fetching user data
          const response = await authAPI.getMe();
          if (isMounted) {
            setUser(response.data.user);
          }
        } catch {
          // Token is invalid or expired, clean up
          clearStoredAuth();
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    checkExistingSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in with email and password
   */
  async function login(email, password) {
    const response = await authAPI.login(email, password);
    const { token, user: userData } = response.data;

    // Store auth data
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return response.data;
  }

  /**
   * Register a new account
   */
  async function register(username, email, password) {
    const response = await authAPI.register(username, email, password);
    const { token, user: userData } = response.data;

    // Store auth data (user is logged in immediately after registration)
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return response.data;
  }

  /**
   * Log in with Google credential
   */
  async function loginWithGoogle(credential) {
    const response = await authAPI.googleLogin(credential);
    const { token, user: userData } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return response.data;
  }

  /**
   * Refresh current user from backend
   */
  async function refreshUser() {
    try {
      const res = await authAPI.getMe();
      setUser(res.data.user);
    } catch {
      // ignore
    }
  }

  /**
   * Log out the current user
   */
  function logout() {
    clearStoredAuth();
    setUser(null);
  }

  // Values available to consuming components
  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    refreshUser,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use auth context
 * Makes it easy to access auth state from any component
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}
