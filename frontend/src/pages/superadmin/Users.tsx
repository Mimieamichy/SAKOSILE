import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

type Role =
  | "super_admin"
  | "admin"
  | "dean"
  | "hod"
  | "pgcord"
  | "lecturer"
  | "student";

type UserRow = {
  id: string;
  name: string;
  email: string;
  school: string;
  role: Role;
  active: boolean;
};

const seed: UserRow[] = [
  { id: "U-0001", name: "Demo Super Admin", email: "superadmin@example.com", school: "Platform", role: "super_admin", active: true },
  { id: "U-0002", name: "Platform Admin", email: "admin@example.com", school: "Platform", role: "admin", active: true },
  { id: "U-0003", name: "Dean Science", email: "dean.science@example.com", school: "College of Science", role: "dean", active: true },
  { id: "U-0004", name: "HOD CS", email: "hod.cs@example.com", school: "College of Science", role: "hod", active: true },
  { id: "U-0005", name: "PG Coord Eng", email: "pg.eng@example.com", school: "College of Engineering", role: "pgcord", active: true },
  { id: "U-0006", name: "Dr. Ada", email: "ada.lect@example.com", school: "College of Science", role: "lecturer", active: true },
  { id: "U-0007", name: "Gloria Andrew", email: "gloria@gmail.com", school: "College of Computing", role: "student", active: true },
  { id: "U-0008", name: "Amichy Ezeh", email: "amichy0@gmail.com", school: "College of Computing", role: "student", active: false },
];

const pieColors = ["#f59e0b", "#10b981", "#6366f1", "#ef4444", "#3b82f6", "#a855f7", "#06b6d4"];

export default function Users() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<UserRow[]>(seed);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const totalUsers = rows.length;

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.school.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const roleDist = useMemo(() => {
    const map = new Map<Role, number>();
    rows.forEach((u) => map.set(u.role, (map.get(u.role) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [rows]);

  const toggleActive = (id: string) => {
    setRows((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
    toast({ title: "Account status updated" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search users by name, email, school or role"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-gray-900">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleDist} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70}>
                    {roleDist.map((entry, i) => (
                      <Cell key={String(entry.name)} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Directory (High-Level)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-gray-600 text-sm font-medium">Name</th>
                  <th className="p-3 text-gray-600 text-sm font-medium">Email</th>
                  <th className="p-3 text-gray-600 text-sm font-medium">Role</th>
                  <th className="p-3 text-gray-600 text-sm font-medium">School</th>
                  <th className="p-3 text-gray-600 text-sm font-medium">Status</th>
                  <th className="p-3 text-gray-600 text-sm font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((u, i) => (
                  <tr key={u.id} className={i % 2 === 0 ? "bg-white" : "bg-amber-50"}>
                    <td className="p-3">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3 capitalize">{u.role.replace("_", " ")}</td>
                    <td className="p-3">{u.school}</td>
                    <td className="p-3">{u.active ? "Active" : "Deactivated"}</td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        className={`${u.active ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"} text-white`}
                        onClick={() => toggleActive(u.id)}
                      >
                        {u.active ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={6}>
                      No users
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Rows per page</span>
              <select
                className="border rounded-md h-9 px-2"
                value={pageSize}
                onChange={(e) => {
                  const size = Number(e.target.value) || 6;
                  setPageSize(size);
                  setPage(1);
                }}
              >
                {[5, 6, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-3">
            High-level only — detailed editing belongs to School Admin.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
