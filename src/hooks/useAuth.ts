import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export function useAuth() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("demoUser");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Listen for login/logout changes in other tabs
    const handler = () => {
      const stored = localStorage.getItem("demoUser");
      setUser(stored ? JSON.parse(stored) : null);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const login = (username: string, password: string) => {
    // Dummy login: only allow 'host'/'host123' or 'admin'/'admin123'
    if (username === "host" && password === "host123") {
      const user = { username: "host", role: "host", firstName: "Host", lastName: "User" };
      localStorage.setItem("demoUser", JSON.stringify(user));
      setUser(user);
      return { success: true };
    }
    if (username === "admin" && password === "admin123") {
      const user = { username: "admin", role: "admin", firstName: "Admin", lastName: "User" };
      localStorage.setItem("demoUser", JSON.stringify(user));
      setUser(user);
      return { success: true };
    }
    return { success: false, message: "Invalid credentials" };
  };

  const logout = () => {
    localStorage.removeItem("demoUser");
    setUser(null);
    setLocation("/staff-login");
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
