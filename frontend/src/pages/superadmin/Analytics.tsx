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

const revenue: MonthlyDatum[] = [
  { month: "Jan", value: 120000 },
  { month: "Feb", value: 135000 },
  { month: "Mar", value: 142500 },
  { month: "Apr", value: 155000 },
  { month: "May", value: 171000 },
  { month: "Jun", value: 165000 },
  { month: "Jul", value: 182000 },
  { month: "Aug", value: 194000 },
  { month: "Sep", value: 201000 },
  { month: "Oct", value: 210000 },
  { month: "Nov", value: 218000 },
  { month: "Dec", value: 230000 },
];

const schoolsGrowth: MonthlyDatum[] = [
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

const studentsGrowth: MonthlyDatum[] = [
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

const activeInactive: Distribution[] = [
  { name: "Active", value: 1420 },
  { name: "Inactive", value: 180 },
];

const retention: MonthlyDatum[] = [
  { month: "Jan", value: 78 },
  { month: "Feb", value: 79 },
  { month: "Mar", value: 81 },
  { month: "Apr", value: 80 },
  { month: "May", value: 82 },
  { month: "Jun", value: 83 },
  { month: "Jul", value: 84 },
  { month: "Aug", value: 83 },
  { month: "Sep", value: 85 },
  { month: "Oct", value: 86 },
  { month: "Nov", value: 86 },
  { month: "Dec", value: 87 },
];

const pieColors = ["#10b981", "#ef4444"];

export default function Analytics() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
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
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active vs Inactive Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={activeInactive} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70}>
                    {activeInactive.map((entry, i) => (
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

      <div className="grid gap-4 grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Retention Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={retention} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
