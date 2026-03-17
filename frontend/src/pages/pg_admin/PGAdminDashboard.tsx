import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, Bell } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/lib/notificationStore";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function PGAdminDashboard() {
  const { token } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  
  const [totalStudents, setTotalStudents] = useState(0);
  const [pendingChecklists, setPendingChecklists] = useState(0);

  useEffect(() => {
    if (token) {
      // Refresh notifications to get latest unread count
      fetchNotifications({ baseUrl, token, silent: true });
      
      // Fetch stats
      const fetchStats = async () => {
        try {
          const res = await fetch(`${baseUrl}/dashboard/count/students-all`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const json = await res.json();
          setTotalStudents(json.count || 0);
        } catch (err) {
          console.error("Failed to fetch dashboard stats", err);
        }
      };
      
      fetchStats();
    }
  }, [token, fetchNotifications]);

  const stats = [
    { title: "Total Students", value: totalStudents.toString(), icon: Users, color: "text-blue-600" },
    { title: "Pending Checklists", value: pendingChecklists.toString(), icon: ClipboardList, color: "text-amber-600" },
    { title: "Unread Notifications", value: unreadCount.toString(), icon: Bell, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">PG Admin Dashboard</h2>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Activity</h3>
        <p className="text-gray-500">No recent activity to display.</p>
      </div>
    </div>
  );
}
