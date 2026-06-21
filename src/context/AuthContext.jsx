import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [apsScore, setApsScore] = useState(38);
  const [user, setUser] = useState(null);

  const login = (email, password, asAdmin = false) => {
    if (asAdmin) {
      setIsAdmin(true);
      setUser({ name: "Admin User", email: "admin@uninextstep.co.za", role: "Admin" });
    } else {
      setIsLoggedIn(true);
      setUser({ name: "Thabo Nkosi", email: "thabo.nkosi@gmail.com", grade: "Grade 12", aps: 38 });
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUser(null);
    setApsScore(38);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, apsScore, setApsScore, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}