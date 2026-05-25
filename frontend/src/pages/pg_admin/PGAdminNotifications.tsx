import React from "react";
import { useNotificationStore } from "@/lib/notificationStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function PGAdminNotifications() {
  const { token } = useAuthStore();
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsReadApi = useNotificationStore((s) => s.markAsReadApi);
  const markAllAsReadApi = useNotificationStore((s) => s.markAllAsReadApi);

  const handleMarkAsRead = async (id: string) => {
    if (!token) return;
    await markAsReadApi({ baseUrl, token, id });
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;
    await markAllAsReadApi({ baseUrl, token });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-gray-600"
          onClick={handleMarkAllAsRead}
          disabled={!notifications.some(n => !n.read)}
        >
          Mark All as Read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-700" />
            System Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto text-gray-200 mb-4" />
              <p>You have no new notifications.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`p-4 rounded-lg border flex justify-between items-start gap-4 transition-colors ${
                  n.read ? "bg-white text-gray-600" : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm sm:text-base">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : "Recently"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 h-8 w-8"
                      onClick={() => handleMarkAsRead(n._id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
