// src/stores/notificationStore.ts
import {create} from "zustand";

export type NotificationItem = {
  _id: string;
  id?: string;
  recipient?: string;
  role?: string | string[];
  message: string;
  read?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: any;
};

type State = {
  notifications: NotificationItem[];
  loading: boolean;
  error: string | null;

  // actions
  setNotifications: (notes: NotificationItem[]) => void;
  fetchNotifications: (opts: { baseUrl: string; token?: string; silent?: boolean }) => Promise<void>;
  markAsReadLocal: (id: string) => void;
  markAllAsReadLocal: () => void;
  // changed to return boolean so callers can know success/failure
  markAsReadApi: (opts: { baseUrl: string; token?: string; id: string }) => Promise<boolean>;
  markAllAsReadApi: (opts: { baseUrl: string; token?: string }) => Promise<boolean>;
  // utility selectors (derived)
  unreadCount: () => number;
  visibleForUser: (userId?: string | null, userRoles?: string[] | null) => NotificationItem[];
};

export const useNotificationStore = create<State>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,

  setNotifications: (notes) => set({ notifications: notes, error: null }),

  fetchNotifications: async ({ baseUrl, token, silent = false }) => {
    if (!silent) set({ loading: true, error: null });
    try {
      const res = await fetch(`${baseUrl}/notification`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const txt = await res.text();
        const err = `Failed to fetch notifications (${res.status}): ${txt}`;
        set({ error: err, loading: false });
        console.warn("[notificationStore] fetch error:", err);
        return;
      }

      const json = await res.json();
      const payload = json?.data ?? json ?? [];
      if (!Array.isArray(payload)) {
        set({ error: "Unexpected payload shape", loading: false });
        console.error("[notificationStore] unexpected payload:", payload);
        return;
      }

      // Normalize each notification so it has both _id and id fields
      const normalized = (payload as NotificationItem[]).map((n) => {
        const _id = (n as any)._id ?? (n as any).id ?? undefined;
        const id = (n as any).id ?? (n as any)._id ?? undefined;
        return {
          ...n,
          _id,
          id,
        };
      });

      set({ notifications: normalized as NotificationItem[], loading: false });
      console.log("[notificationStore] fetched notifications:", normalized);
    } catch (err: any) {
      console.error("[notificationStore] fetch exception:", err);
      set({ error: err?.message ?? String(err), loading: false });
    }
  },

  // defensive local updater — will only mark the matching item (requires truthy id)
  markAsReadLocal: (id) => {
    if (!id) {
      console.warn("[notificationStore] markAsReadLocal called with empty id, ignoring.");
      return;
    }
    set((state) => ({
      notifications: state.notifications.map((n) => {
        const nid = (n as any)._id ?? (n as any).id ?? undefined;
        if (!nid) return n; // don't accidentally match undefined === undefined
        return String(nid) === String(id) ? { ...n, read: true } : n;
      }),
    }));
  },

  markAllAsReadLocal: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  // tries several common request shapes, re-fetches on success, returns true on success
  markAsReadApi: async ({ baseUrl, token, id }) => {
    if (!id) {
      console.warn("[notificationStore] markAsReadApi called with empty id.");
      return false;
    }

    const candidates = [
      { url: `${baseUrl}/notification`, method: "PATCH", body: { _id: id, read: true } },
      { url: `${baseUrl}/notification`, method: "PATCH", body: { id, read: true } },
      { url: `${baseUrl}/notification`, method: "PATCH", body: { notificationId: id, read: true } },
      { url: `${baseUrl}/notification/${encodeURIComponent(id)}`, method: "PATCH", body: { read: true } },
      { url: `${baseUrl}/notification/${encodeURIComponent(id)}`, method: "PUT", body: { read: true } },
    ];

    for (const c of candidates) {
      try {
        const res = await fetch(c.url, {
          method: c.method,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(c.body),
        });

        console.log("[notificationStore] tried", c.method, c.url, "status:", res.status, res.statusText);

        const txt = await res.text();
        let parsed: any = null;
        try {
          parsed = txt ? JSON.parse(txt) : null;
          console.log("[notificationStore] response payload:", parsed);
        } catch {
          console.log("[notificationStore] response text:", txt);
        }

        // heuristics: server returned updated item(s) with read:true
        const looksUpdated =
          parsed &&
          ((parsed.read === true && (String(parsed._id) === String(id) || String(parsed.id) === String(id))) ||
            (Array.isArray(parsed) && parsed.some((x) => (x._id === id || x.id === id) && x.read === true)));

        if (res.ok && looksUpdated) {
          // success — re-fetch canonical list to be safe
          if (typeof get().fetchNotifications === "function") {
            await get().fetchNotifications({ baseUrl, token, silent: true });
          }
          return true;
        }

        // if res.ok but server didn't return updated object, try re-fetching and check store
        if (res.ok) {
          if (typeof get().fetchNotifications === "function") {
            await get().fetchNotifications({ baseUrl, token, silent: true });
            const n = get().notifications.find((x) => {
              const nid = (x as any)._id ?? (x as any).id ?? undefined;
              return nid && String(nid) === String(id);
            });
            if (n && n.read) return true;
          }
        }

        // try next candidate
      } catch (err) {
        console.warn("[notificationStore] attempt failed:", err);
      }
    }

    console.warn("[notificationStore] none of the request shapes produced an apparent update. Check server API.");
    return false;
  },

  markAllAsReadApi: async ({ baseUrl, token }) => {
    try {
      // 1. Try bulk endpoint first
      const res = await fetch(`${baseUrl}/notification/read-all`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        console.log("[notificationStore] bulk read-all success");
        if (typeof get().fetchNotifications === "function") {
          await get().fetchNotifications({ baseUrl, token, silent: true });
        }
        return true;
      }
      
      console.warn("[notificationStore] bulk read-all failed (status:", res.status, "). Falling back to individual updates.");

      // 2. Fallback: Identify unread notifications and mark them individually
      const unreadIds = get().notifications
        .filter(n => !n.read)
        .map(n => (n as any)._id ?? (n as any).id)
        .filter(Boolean);

      if (unreadIds.length === 0) return true;

      // Process in small batches or sequentially to avoid overwhelming server
      for (const id of unreadIds) {
        // We use the most likely candidate from markAsReadApi
        const candidates = [
          { url: `${baseUrl}/notification`, method: "PATCH", body: { _id: id, read: true } },
          { url: `${baseUrl}/notification/${encodeURIComponent(id)}`, method: "PATCH", body: { read: true } },
          { url: `${baseUrl}/notification`, method: "PATCH", body: { id, read: true } },
        ];
        
        let successForThisId = false;
        for (const c of candidates) {
          try {
            const r = await fetch(c.url, {
              method: c.method,
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(c.body),
            });
            if (r.ok) {
              successForThisId = true;
              break; 
            }
          } catch (e) {
            // ignore and try next candidate
          }
        }
        if (!successForThisId) {
           console.warn(`[notificationStore] could not mark notification ${id} as read in fallback.`);
        }
      }

      // Final re-fetch to sync canonical state from server
      if (typeof get().fetchNotifications === "function") {
        await get().fetchNotifications({ baseUrl, token, silent: true });
      }
      return true; 
    } catch (err) {
      console.error("[notificationStore] markAllAsReadApi exception:", err);
      return false;
    }
  },

  unreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },

  visibleForUser: (userId?: string | null, userRoles?: string[] | null) => {
    const rolesNorm = (r?: string[] | string | null) => {
      if (!r) return [];
      if (Array.isArray(r)) return r.map((x) => String(x).toLowerCase());
      return [String(r).toLowerCase()];
    };
    const userRolesArr = rolesNorm(userRoles);
    const roleMatches = (notifRole?: string | string[] | null) => {
      if (!notifRole) return true;
      const notifRoles = Array.isArray(notifRole)
        ? notifRole.map((r) => String(r).toLowerCase())
        : [String(notifRole).toLowerCase()];
      if (userRolesArr.length === 0) return false;
      for (const nr of notifRoles) {
        if (userRolesArr.includes(nr)) return true;
        if ((nr === "supervisor" || nr === "hod" || nr === "provost") && userRolesArr.some((ur) => ur.includes("supervisor") || ur.includes("hod") || ur.includes("provost"))) return true;
        if (userRolesArr.some((ur) => ur.includes(nr) || nr.includes(ur))) return true;
      }
      return false;
    };

    return get().notifications.filter((n) => {
      if (n.recipient) {
        if (!userId) return false;
        if (String(n.recipient) === String(userId)) return true;
        return false;
      }
      return roleMatches(n.role as any);
    });
  },
}));
