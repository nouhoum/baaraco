import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { authMe, authLogout, type User } from "~/components/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = async () => {
    try {
      const response = await authMe();
      if (response?.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await authLogout();
    } finally {
      setUser(null);
      navigate("/fr/login");
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        setUser,
        logout,
        refreshUser,
      }}
    >
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

// Hook for requiring authentication
export function useRequireAuth(redirectTo = "/fr/login") {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isLoading, isAuthenticated, navigate, redirectTo]);

  return { user, isLoading, isAuthenticated };
}

// Hook for requiring a specific role
export function useRequireRole(
  allowedRoles: User["role"][],
  redirectTo = "/fr"
) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate("/fr/login");
      } else if (user && !allowedRoles.includes(user.role)) {
        navigate(redirectTo);
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, navigate, redirectTo]);

  return { user, isLoading, isAuthenticated };
}
