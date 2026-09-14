import React, { createContext, useContext, useEffect, useState } from "react";
import { loginUser, logoutUser } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [apsScore, setApsScore] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    const storedAps = Number(localStorage.getItem("apsScore") || 0);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        setUser(parsedUser);
        setApsScore(Number(parsedUser.aps_score ?? storedAps ?? 0));
        setIsLoggedIn(parsedUser.role === "student");
        setIsAdmin(parsedUser.role === "admin");
      } catch {
        localStorage.removeItem("user");
      }
    } else if (storedAps) {
      setApsScore(storedAps);
    }

    if (!storedToken) {
      localStorage.removeItem("token");
    }

    setLoading(false);
  }, []);

  const login = async (email, password, expectedRole) => {
    const data = await loginUser(email, password);

    if (expectedRole === "admin" && data.user.role !== "admin") {
      throw new Error("This account is not an admin user.");
    }

    if (expectedRole === "student" && data.user.role !== "student") {
      throw new Error("Please use the admin portal for admin accounts.");
    }

    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("apsScore", String(data.user.aps_score ?? 0));

    setUser(data.user);
    setApsScore(data.user.aps_score ?? 0);

    if (data.user.role === "admin") {
      setIsAdmin(true);
      setIsLoggedIn(false);
    } else {
      setIsLoggedIn(true);
      setIsAdmin(false);
    }

    return data;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // The server-side cookie clear is best effort for production sessions.
    }

    const retainedAps = Number(apsScore || Number(localStorage.getItem("apsScore") || 0));
    localStorage.setItem("apsScore", String(retainedAps));

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setIsLoggedIn(false);
    setIsAdmin(false);
    setUser(null);
    setApsScore(retainedAps);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isAdmin,
        apsScore,
        setApsScore,
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
