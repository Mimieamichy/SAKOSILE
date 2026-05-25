import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";

const pieColors = ["#f59e0b", "#6366f1", "#10b981", "#ef4444", "#3b82f6"];

export default function SuperAdminOverview() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const { token } = useAuthStore();
  
  const [schoolsGrowth, setSchoolsGrowth] = useState<any[]>([]);
  const [studentsGrowth, setStudentsGrowth] = useState<any[]>([]);
  const [userStatusDist, setUserStatusDist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const totals = useMemo(() => {
    const totalSchools = schoolsGrowth.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const totalStudents = studentsGrowth.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const totalUsers = userStatusDist.reduce((acc, curr) => acc + (curr.value || 0), 0);
    return { totalSchools, totalStudents, totalUsers };
  }, [schoolsGrowth, studentsGrowth, userStatusDist]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const run = async () => {
      try {
        const res = await axios.get(`${baseUrl}/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data.data;
        
        if (data && !cancelled) {
          if (Array.isArray(data.schools)) setSchoolsGrowth(data.schools);
          if (Array.isArray(data.students)) setStudentsGrowth(data.students);
          if (Array.isArray(data.userStatus)) {
            setUserStatusDist(
              data.userStatus.map((x: any) => ({
                name: x._id === null ? "General" : String(x._id),
                value: Number(x.count || 0),
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [baseUrl, token]);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Super Admin Overview</h2>
        <span className="text-sm text-gray-500">Overview</span>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-gray-900">{totals.totalSchools}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-gray-900">{totals.totalStudents.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-gray-900">{totals.totalUsers.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Student Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentsGrowth} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userStatusDist} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70}>
                    {userStatusDist.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schools Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={schoolsGrowth} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
