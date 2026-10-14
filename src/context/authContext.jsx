import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setAuthLoading(true);

    try {
      const response = await axios.get("/api/auth/me", {
        withCredentials: true,
      });

      console.log(response.data);
      const currentUser = response.data.data?.user ?? response.data.data;

      setUser(currentUser);
      return currentUser;
    } catch (error) {
      setUser(null);

      if (
        error.response &&
        error.response.status !== 401 &&
        error.response.status !== 403
      ) {
        console.error("Unable to verify the session.", error);
      }

      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (credentials) => {
    const response = await axios.post(
      "/api/auth/login",
      {
        email: credentials.email,
        password: credentials.password,
      },
      { withCredentials: true },
    );
    console.log(response.data);
    const currentUser = response.data.data?.user ?? response.data.data;

    // Adapt this to your backend's response format.
    if (
      !currentUser ||
      typeof currentUser !== "object" ||
      (!currentUser.id && !currentUser._id && !currentUser.email)
    ) {
      throw new Error(
        "Login succeeded, but the response did not contain a user.",
      );
    }

    setUser(currentUser);
    return currentUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post("/api/auth/logout");
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      authLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, authLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
