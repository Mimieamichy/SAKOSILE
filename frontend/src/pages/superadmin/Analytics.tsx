import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type MonthlyDatum = { month: string; value: number };
type Distribution = { name: string; value: number };

import axios from "axios";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

const schoolsGrowthDefault: MonthlyDatum[] = [
  { month: "Jan", value: 4 },
  { month: "Feb", value: 4 },
  { month: "Mar", value: 5 },
  { month: "Apr", value: 5 },
  { month: "May", value: 6 },
  { month: "Jun", value: 6 },
  { month: "Jul", value: 7 },
  { month: "Aug", value: 8 },
  { month: "Sep", value: 8 },
  { month: "Oct", value: 9 },
  { month: "Nov", value: 9 },
  { month: "Dec", value: 10 },
];

const studentsGrowthDefault: MonthlyDatum[] = [
  { month: "Jan", value: 900 },
  { month: "Feb", value: 980 },
  { month: "Mar", value: 1020 },
  { month: "Apr", value: 1100 },
  { month: "May", value: 1180 },
  { month: "Jun", value: 1200 },
  { month: "Jul", value: 1260 },
  { month: "Aug", value: 1320 },
  { month: "Sep", value: 1390 },
  { month: "Oct", value: 1450 },
  { month: "Nov", value: 1500 },
  { month: "Dec", value: 1600 },
];

const activeInactiveDefault: Distribution[] = [
  { name: "Active", value: 1420 },
  { name: "Inactive", value: 180 },
];

const retentionDefault: MonthlyDatum[] = [
  { month: "Jan", value: 0 },
  { month: "Feb", value: 0 },
  { month: "Mar", value: 0 },
  { month: "Apr", value: 0 },
  { month: "May", value: 0 },
  { month: "Jun", value: 0 },
  { month: "Jul", value: 0 },
  { month: "Aug", value: 0 },
  { month: "Sep", value: 0 },
  { month: "Oct", value: 0 },
  { month: "Nov", value: 0 },
  { month: "Dec", value: 0 },
];

const pieColors = ["#10b981", "#ef4444", "#f59e0b"];

export default function Analytics() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const { token } = useAuthStore();
  const [schoolsGrowth, setSchoolsGrowth] = useState<MonthlyDatum[]>(schoolsGrowthDefault);
  const [studentsGrowth, setStudentsGrowth] = useState<MonthlyDatum[]>(studentsGrowthDefault);
  const [userStatusDist, setUserStatusDist] = useState<Distribution[]>(activeInactiveDefault);

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
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [baseUrl, token]);
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">School Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={schoolsGrowth} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentsGrowth} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">User Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userStatusDist} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70}>
                    {userStatusDist.map((entry, i) => (
                      <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
