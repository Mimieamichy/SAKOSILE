
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { Role } from "../config/roles";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

interface UserProfile {
  userName: string;
  role: string;
  email: string;
  id: string;
  department: string;
  faculty?: string;
  roles: string[];
  lecturerId?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: Role | Role[] | string | string[]) => boolean;
  getHomePath: () => string;
}

// given a raw role value (array | json-string | comma-separated string | single string)
// return a normalized deduped array of lowercase role strings
function normalizeRoles(raw: any): string[] {
  if (!raw && raw !== "") return [];
  if (Array.isArray(raw)) {
    return Array.from(new Set(raw.map((r) => String(r).trim().toLowerCase()).filter(Boolean)));
  }
  if (typeof raw === "string") {
    const str = raw.trim();
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return Array.from(new Set(parsed.map((r) => String(r).trim().toLowerCase()).filter(Boolean)));
      }
    } catch {
      // not JSON
    }
    return Array.from(new Set(str.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)));
  }
  return Array.from(new Set(String(raw).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)));
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const res = await axios.post(`${baseUrl}/auth/login`, { email, password });
          const { user: rawUser, token: authToken } = res.data.data;

          const roles = normalizeRoles(rawUser?.roles || rawUser?.role || []);
          console.log("[AuthStore] User login roles:", roles);
          const roleValue = roles.length > 0 ? roles[0] : "unknown";

          const userProfile: UserProfile = {
            userName: `${rawUser.firstName ?? ""} ${rawUser.lastName ?? ""}`.trim(),
            role: roleValue,
            roles: roles,
            email: rawUser.email,
            id: rawUser.id,
            department: rawUser.department,
            faculty: rawUser.faculty,
            lecturerId: rawUser.lecturer,
          };

          set({ user: userProfile, token: authToken, isAuthenticated: true });
          axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
          return userProfile;
        } catch (err: any) {
          const message = err?.response?.data?.message || err?.message || "Login failed";
          throw new Error(message);
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        delete axios.defaults.headers.common["Authorization"];
      },

      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        return user.roles.includes("admin") || user.role === "admin";
      },

      hasRole: (role) => {
        const { user } = get();
        if (!user) return false;
        
        const requiredRoles = Array.isArray(role) ? role : [role];
        return requiredRoles.some(r => 
          user.role === r || (user.roles && user.roles.includes(r as string))
        );
      },

      getHomePath: () => {
        const { user } = get();
        if (!user) return "/";
        
        const roles = user.roles;
        
        if (roles.includes("admin")) return "/admin";
        if (roles.includes("dean")) return "/dean";
        if (roles.includes("hod") || roles.includes("pgcord") || roles.includes("provost")) return "/portal";
        if (roles.some(r => ["supervisor", "major_supervisor", "college_rep", "internal_examiner"].includes(r))) return "/supervisor";
        if (roles.includes("student")) return "/student";
        if (roles.some(r => ["external_examiner", "faculty_pg_rep", "panel_member", "lecturer"].includes(r))) return "/defense-day";
        
        return "/portal";
      }
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
        }
      },
    }
  )
);
