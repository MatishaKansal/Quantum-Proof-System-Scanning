import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  clearAuthToken,
  getCurrentUser,
  login as loginRequest,
  setAuthToken,
  type AuthUser,
} from "@/lib/api";

interface RoleContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isSecurityAdmin: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  switchToPublic: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const switchToPublic = async () => {
    const payload = await loginRequest("checker", "checker123");
    setAuthToken(payload.token);
    setUser(payload.user);
  };

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        clearAuthToken();
        const payload = await loginRequest("checker", "checker123");
        if (active) setUser(payload.user);
      } catch (_error) {
        clearAuthToken();
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const login = async (username: string, password: string) => {
    const payload = await loginRequest(username, password);
    setAuthToken(payload.token);
    setUser(payload.user);
    return payload.user;
  };

  return (
    <RoleContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === "security_admin",
        isSecurityAdmin: user?.role === "security_admin",
        login,
        switchToPublic,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
}
