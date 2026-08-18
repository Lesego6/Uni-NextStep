import React, { createContext, useContext, useEffect, useState } from "react";
import { loginUser } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [apsScore, setApsScore] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        setUser(parsedUser);
        setApsScore(parsedUser.aps_score ?? 0);
        setIsLoggedIn(parsedUser.role === "student");
        setIsAdmin(parsedUser.role === "admin");
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
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

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
    setIsAdmin(false);
    setUser(null);
    setApsScore(0);
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
