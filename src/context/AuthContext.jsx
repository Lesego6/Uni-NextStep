import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearAuthToken, getCurrentUser, loginUser, logoutUser, setAuthToken } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null);
  const [apsScore, setApsScore] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(user && role);
  const isAdmin = role === "admin";
  const isLoggedIn = role === "student";

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const data = await getCurrentUser();
        const sessionUser = data.user;
        setUser(sessionUser);
        setRole(sessionUser.role);
        setApsScore(Number(sessionUser.aps_score ?? 0));
      } catch {
        setUser(null);
        setRole(null);
        setApsScore(0);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = useCallback(async (email, password, expectedRole) => {
    const data = await loginUser(email, password);
    setAuthToken(data.token);

    if (expectedRole === "admin" && data.user.role !== "admin") {
      clearAuthToken();
      await logoutUser().catch(() => {});
      throw new Error("This account is not an admin user.");
    }

    if (expectedRole === "student" && data.user.role !== "student") {
      clearAuthToken();
      await logoutUser().catch(() => {});
      throw new Error("Please use the admin portal for admin accounts.");
    }

    setUser(data.user);
    setRole(data.user.role);
    setApsScore(Number(data.user.aps_score ?? 0));

    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Cookie-based sessions can still be cleared best-effort on the client.
    }

    setUser(null);
    setRole(null);
    setApsScore(0);
    clearAuthToken();
  }, []);

  const value = useMemo(() => ({
    isAuthenticated,
    isAdmin,
    isLoggedIn,
    role,
    apsScore,
    setApsScore,
    user,
    loading,
    login,
    logout,
  }), [isAuthenticated, isAdmin, isLoggedIn, role, apsScore, user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
