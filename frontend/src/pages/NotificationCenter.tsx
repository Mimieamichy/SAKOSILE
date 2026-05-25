// src/components/NotificationCenter.tsx (simplified parts)
import  { useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/lib/notificationStore";
import { Bell } from "lucide-react";

export default function NotificationCenter() {
  const { user, token } = useAuthStore();
  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  
  const loading = useNotificationStore((s) => s.loading);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAsReadLocal = useNotificationStore((s) => s.markAsReadLocal);
  const markAllAsReadLocal = useNotificationStore((s) => s.markAllAsReadLocal);
  const markAsReadApi = useNotificationStore((s) => s.markAsReadApi);
  const markAllAsReadApi = useNotificationStore((s) => s.markAllAsReadApi);
  const visibleForUser = useNotificationStore((s) => s.visibleForUser);
  const notifications = useNotificationStore((s) => s.notifications);

  // compute visible and unread
  const userId = user?.id ?? null;
  const roles = user?.roles ?? [];
  
  const visible = useMemo(() => {
    return visibleForUser(userId, roles).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [notifications, userId, roles, visibleForUser]);

  const unreadVisible = useMemo(() => {
    return visible.filter(n => !n.read).length;
  }, [visible]);

  // fetch if store empty (or just rely on DashboardShell to fetch)
  useEffect(() => {
    if (token) {
      // If we already have notifications, fetch silently in the background
      const isInitialFetch = notifications.length === 0;
      fetchNotifications({ baseUrl, token, silent: !isInitialFetch });
    }
  }, [token, fetchNotifications]); // intentional: don't re-run just because notifications.length changes, unless we want to refresh on every mount anyway (which we do, but silently)

  const handleClick = async (id: string) => {
    markAsReadLocal(id); // optimistic update in store
    // persist
    await markAsReadApi({ baseUrl, token, id });
    // optionally re-fetch canonical state:
    // await fetchNotifications({ baseUrl, token });
  };

  const handleReadAll = async () => {
    try {
      console.log("[NotificationCenter] Mark all as read clicked");
      markAllAsReadLocal();
      const success = await markAllAsReadApi({ baseUrl, token: token || undefined });
      if (!success) {
        console.warn("[NotificationCenter] API mark all as read failed, but local state was updated.");
      }
    } catch (err) {
      console.error("[NotificationCenter] handleReadAll error:", err);
    }
  };

  const displayRole = user?.roles?.[0] || "User";
  const displayRoleLabel = displayRole.replace("_", " ");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold uppercase">
          {displayRoleLabel} Notifications
        </h1>
        {unreadVisible > 0 && (
          <button
            onClick={handleReadAll}
            className="text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-md transition-colors w-full sm:w-auto text-center"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4 max-w-2xl">
        {loading ? (
          <div className="text-sm text-gray-500">Loading notifications...</div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-center text-gray-500">No notifications.</p>
        ) : (
          visible.map((note) => (
            <div
              key={note._id}
              onClick={() => handleClick(note._id)}
              className={`flex items-start gap-4 border-b pb-4 last:border-0 cursor-pointer ${note.read ? "" : "bg-amber-50"}`}
            >
              <div>
                {note.read ? <Bell size={20} className="text-gray-400" /> : <Bell size={20} className="text-amber-600" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{note.message}</p>
                {note.createdAt && <div className="text-xs text-gray-400 mt-1">{new Date(note.createdAt).toLocaleString()}</div>}
              </div>
              {!note.read && <span className="ml-auto bg-amber-600 text-white text-xs rounded-full px-2 py-0.5">New</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
