"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { AuthUser } from "./types";
import { API_BASE } from "./api";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  setUser: (u: AuthUser | null) => void;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  refresh: async () => null,
  logout: async () => {},
  setUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const userRef = useRef<AuthUser | null>(null); // Ref to track latest user value
  const [loading, setLoading] = useState(true);

  // Update the ref whenever user changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        // Case 1: HTTP 200 → update user
        const u = await res.json();
        setUser(u);
        return u;
      } else if (res.status === 401) {
        // Case 2: HTTP 401 → clear user
        setUser(null);
        return null;
      } else {
        // Case 3 & 4: HTTP 403, 500, etc. → keep current user
        return userRef.current;
      }
    } catch {
      // Case 5 & 6: Network error, timeout → keep current user
      return userRef.current;
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies now!

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
