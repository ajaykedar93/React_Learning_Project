import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // ✅ Restore user and token on app reload
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("auth_user");
      const savedToken = localStorage.getItem("auth_token");
      
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      if (savedToken) {
        setToken(savedToken);
      }
    } catch (error) {
      console.error("Failed to restore auth state:", error);
      // Clear corrupted data
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Login with user data and token
  const login = (userData, authToken = null) => {
    try {
      const tokenToStore = authToken || userData?.token || userData?.accessToken || null;
      
      setUser(userData);
      localStorage.setItem("auth_user", JSON.stringify(userData));
      
      if (tokenToStore) {
        setToken(tokenToStore);
        localStorage.setItem("auth_token", tokenToStore);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // ✅ Logout - clear everything
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
    localStorage.removeItem("admin_token");
  };

  // ✅ Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  // ✅ Get auth headers for API calls
  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: isAuthenticated(),
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}