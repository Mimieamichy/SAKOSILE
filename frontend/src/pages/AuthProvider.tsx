
// src/AuthProvider.tsx
import { ReactNode, useEffect } from "react";
import { useAuthStore } from "../store/authStore";

/**
 * Backward compatibility provider.
 * Most logic is now in useAuthStore.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // We can still use this to initialize things if needed
  return <>{children}</>;
};

/**
 * Hook that maps the new Zustand store to the old Context API
 * so we don't have to refactor 30+ files immediately.
 */
export const useAuth = () => {
  const { user, token, login, logout, isAuthenticated } = useAuthStore();

  return {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    roles: user?.roles || [],
  };
};
