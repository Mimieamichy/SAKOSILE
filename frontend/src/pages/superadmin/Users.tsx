import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";

type Role = string; // More flexible for dynamic roles from API

type UserRow = {
  id: string;
  name: string;
  email: string;
  school: string;
  role: Role;
  active: boolean;
};


const pieColors = ["#f59e0b", "#10b981", "#6366f1", "#ef4444", "#3b82f6", "#a855f7", "#06b6d4"];

export default function Users() {
  const { toast } = useToast();
  const { token } = useAuthStore();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [roleStatsFromApi, setRoleStatsFromApi] = useState<any[]>([]);

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
    // If we have roleStats from API, use them
    if (roleStatsFromApi.length > 0 && roleStatsFromApi.some(s => s._id !== null)) {
      return roleStatsFromApi
        .filter(s => s._id !== null)
        .map(s => ({ 
          name: String(s._id).replace("_", " "), 
          value: s.total 
        }));
    }

    // Fallback to counting from rows
    const map = new Map<string, number>();
    rows.forEach((u) => map.set(u.role, (map.get(u.role) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ 
      name: name.replace("_", " "), 
      value 
    }));
  }, [rows, roleStatsFromApi]);

  const toggleActive = async (id: string) => {
    const target = rows.find((u) => u.id === id);
    if (!target) return;
    const next = target.active ? "Suspended" : "Active";
    try {
      await axios.patch(`${baseUrl}/user/${encodeURIComponent(id)}/status`, {
        status: next,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRows((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
      toast({ title: "Account status updated" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const run = async () => {
      try {
        const res = await axios.get(`${baseUrl}/user/users-report`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data;
        console.log("users:", res);
        
        
        // The API returns { users: [...], roleStats: [...] }
        const users = Array.isArray(data.data.users) ? data.data.users : [];
        const roleStats = Array.isArray(data.data.roleStats) ? data.data.roleStats : [];  

        if (!cancelled) {
          const updatedRows: UserRow[] = users.map((u: any) => ({
            id: u._id,
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
            email: u.email,
            school: u.school?.name || "—",
            role: (u.roles && u.roles.length > 0) ? u.roles[0] : "general",
            active: u.status !== "suspended",
          }));
          
          setRows(updatedRows);
          setRoleStatsFromApi(roleStats);

          // Calculate total from roleStats if available, otherwise from users length
          const total = roleStats.length > 0 
            ? roleStats.reduce((acc: number, curr: any) => acc + (curr.total || 0), 0)
            : updatedRows.length;
          
          setTotalUsers(total);
        }
      } catch (err) {
        console.error("Failed to fetch users report", err);
        toast({ title: "Fetch failed", description: "Failed to load user directory", variant: "destructive" });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [baseUrl, token]);

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
