import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

const USER_KEY = "auth_user";
const TOKEN_KEY = "token";
const LEGACY_TOKEN_KEY = "auth_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // RESTORE AUTHENTICATION
  // =========================================================
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);

      // Support the current token key first,
      // then the old auth_token key.
      const savedToken =
        localStorage.getItem(TOKEN_KEY) ||
        localStorage.getItem(LEGACY_TOKEN_KEY);

      let parsedUser = null;

      if (savedUser) {
        try {
          parsedUser = JSON.parse(savedUser);
        } catch (error) {
          console.error("Invalid saved user data.");
          localStorage.removeItem(USER_KEY);
        }
      }

      if (savedToken) {
        setToken(savedToken);

        // Keep old and new token storage synchronized.
        localStorage.setItem(TOKEN_KEY, savedToken);
        localStorage.setItem(LEGACY_TOKEN_KEY, savedToken);
      }

      if (parsedUser) {
        setUser(parsedUser);
      }

      // If one exists without the other, do not consider
      // the session authenticated.
      if (!savedToken || !parsedUser) {
        if (!savedToken) {
          setToken(null);
        }

        if (!parsedUser) {
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Failed to restore auth state:", error);

      setUser(null);
      setToken(null);

      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // LOGIN
  // =========================================================
  const login = (userData, authToken = null) => {
    try {
      if (!userData) {
        throw new Error("User data is missing.");
      }

      /*
       * Accept token from:
       * login(userData, token)
       * userData.token
       * userData.accessToken
       * userData.jwt
       */
      const tokenToStore =
        authToken ||
        userData?.token ||
        userData?.accessToken ||
        userData?.jwt ||
        null;

      if (!tokenToStore) {
        throw new Error(
          "Authentication token was not provided."
        );
      }

      // Keep token OUT of duplicated user object where possible.
      const cleanUser = {
        ...userData,
      };

      delete cleanUser.token;
      delete cleanUser.accessToken;
      delete cleanUser.jwt;

      // React state
      setUser(cleanUser);
      setToken(tokenToStore);

      // Persistent storage
      localStorage.setItem(
        USER_KEY,
        JSON.stringify(cleanUser)
      );

      // Store same fresh token under both keys.
      // This prevents old pages from breaking.
      localStorage.setItem(
        TOKEN_KEY,
        tokenToStore
      );

      localStorage.setItem(
        LEGACY_TOKEN_KEY,
        tokenToStore
      );

      return true;
    } catch (error) {
      console.error("Login failed:", error);

      setUser(null);
      setToken(null);

      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);

      return false;
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================
  const logout = () => {
    setUser(null);
    setToken(null);

    // Remove every authentication token key used by the app.
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem("admin_token");

    // Do not remove saved_email / saved_password here.
    // Those belong to the "Trust Device" login feature.
  };

  // =========================================================
  // AUTHENTICATION STATUS
  // =========================================================
  const isAuthenticated =
    !loading &&
    !!user &&
    !!token;

  // =========================================================
  // AUTH HEADERS
  // =========================================================
  const getAuthHeaders = () => {
    const currentToken =
      token ||
      localStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem(LEGACY_TOKEN_KEY) ||
      "";

    if (!currentToken) {
      return {};
    }

    return {
      Authorization: `Bearer ${currentToken}`,
      "Content-Type": "application/json",
    };
  };

  // =========================================================
  // GET CURRENT TOKEN
  // =========================================================
  const getToken = () => {
    return (
      token ||
      localStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem(LEGACY_TOKEN_KEY) ||
      null
    );
  };

  // =========================================================
  // CONTEXT VALUE
  // =========================================================
  const value = {
    user,
    token,
    loading,
    isAuthenticated,

    login,
    logout,

    getToken,
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ===========================================================
// HOOK
// =========================================================
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}