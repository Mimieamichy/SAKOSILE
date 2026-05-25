import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

type Category = "schools" | "payments" | "admin" | "security";
type Severity = "info" | "warning" | "error";

type LogEntry = {
  id: string;
  ts: string; // ISO or display
  category: Category;
  school?: string;
  actor: string;
  action: string;
  details: string;
  severity: Severity;
};

const seed: LogEntry[] = [
  // School creation logs
  { id: "L-1001", ts: "2026-03-01 09:20", category: "schools", school: "College of Science", actor: "Demo Super Admin", action: "School Created", details: "Added school from catalog with central admin.", severity: "info" },
  { id: "L-1002", ts: "2026-03-03 14:02", category: "schools", school: "College of Education", actor: "Demo Super Admin", action: "Status Changed", details: "Suspended school (maintenance).", severity: "warning" },
  // Payment logs
  { id: "L-2001", ts: "2026-03-02 11:31", category: "payments", school: "College of Law", actor: "Payments Service", action: "Refund Processed", details: "RR-01 refund completed (₦30,000).", severity: "info" },
  { id: "L-2002", ts: "2026-03-03 16:12", category: "payments", school: "College of Medicine", actor: "Payments Service", action: "Payout Queued", details: "Queued payout PO-003 for ₦60,000.", severity: "info" },
  // Admin activity logs
  { id: "L-3001", ts: "2026-03-03 10:10", category: "admin", school: "Platform", actor: "Platform Admin", action: "Feature Toggle", details: "Disabled Notifications temporarily.", severity: "warning" },
  { id: "L-3002", ts: "2026-03-04 08:30", category: "admin", school: "College of Engineering", actor: "Dean Engineering", action: "User Deactivated", details: "Deactivated student U-0008 for policy violation.", severity: "info" },
  // Security events
  { id: "L-4001", ts: "2026-03-04 07:45", category: "security", school: "Platform", actor: "Auth Service", action: "Failed Login", details: "Multiple failed attempts for admin@example.com", severity: "warning" },
  { id: "L-4002", ts: "2026-03-04 07:50", category: "security", school: "Platform", actor: "Auth Service", action: "Lockout Triggered", details: "Account temporarily locked (admin@example.com).", severity: "error" },
];

export default function AuditLogs() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | Category>("all");
  const [severity, setSeverity] = useState<"all" | Severity>("all");
  const [logs, setLogs] = useState<LogEntry[]>(seed);
  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  const filtered = useMemo(() => {
    let list = logs;
    if (tab !== "all") list = list.filter((l) => l.category === tab);
    if (severity !== "all") list = list.filter((l) => l.severity === severity);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (l) =>
          l.id.toLowerCase().includes(q) ||
          (l.school ?? "").toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q)
      );
    }
    return list;
  }, [logs, tab, severity, query]);

  const downloadCsv = () => {
    const header = ["Time", "Category", "School", "Actor", "Action", "Details", "Severity"];
    const rows = filtered.map((l) => [l.ts, l.category, l.school ?? "", l.actor, l.action, l.details, l.severity]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Audit logs downloaded" });
  };

  const clearLogs = () => {
    setLogs([]);
    toast({ title: "Logs cleared" });
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await axios.get(`${baseUrl}/user/activity-logs`);
        const data = res.data as unknown;
        const arr =
          typeof data === "object" && data !== null && "data" in (data as any)
            ? (data as any).data
            : data;
        const parsed: LogEntry[] = Array.isArray(arr)
          ? arr
              .map((x: unknown) => {
                if (!x || typeof x !== "object") return null;
                const o = x as any;
                const cat = String(o.category || o.type || "admin").toLowerCase() as Category;
                const sev = String(o.severity || "info").toLowerCase() as Severity;
                return {
                  id: String(o.id || o._id || crypto.randomUUID()),
                  ts: String(o.ts || o.time || o.createdAt || ""),
                  category: cat,
                  school: o.school || o.institution || undefined,
                  actor: String(o.actor || o.user || "system"),
                  action: String(o.action || o.event || ""),
                  details: String(o.details || o.message || ""),
                  severity: sev,
                } as LogEntry;
              })
              .filter(Boolean) as LogEntry[]
          : [];
        if (!cancelled && parsed.length > 0) setLogs(parsed);
      } catch {
        // keep seed
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <Input
            className="w-full sm:w-72"
            placeholder="Search logs by actor, action, details, school"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="border rounded-md h-10 px-3"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as any)}
          >
            <option value="all">All severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <Button className="bg-amber-700 text-white" onClick={downloadCsv}>
            Download CSV
          </Button>
          <Button variant="outline" onClick={clearLogs}>
            Clear
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="schools">School Creation</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="admin">Admin Activity</TabsTrigger>
              <TabsTrigger value="security">Security Events</TabsTrigger>
            </TabsList>
            <TabsContent value="all" />
            <TabsContent value="schools" />
            <TabsContent value="payments" />
            <TabsContent value="admin" />
            <TabsContent value="security" />
          </Tabs>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-gray-600 text-sm font-medium">Time</th>
                  <th className="p-3 text-gray-600 text-sm font-medium">Category</th>
                  <th className="p-3 text-gray-600 text-sm font-medium">School</th>
                  <th className="p-3 text-gray-600 text-sm font-medium">Actor</th>
                  <th className="p-3 text-gray-600 text-sm font-medium">Action</th>
                  <th className="p-3 text-gray-600 text-sm font-medium">Details</th>
                  <th className="p-3 text-gray-600 text-sm font-medium">Severity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr key={l.id} className={i % 2 === 0 ? "bg-white" : "bg-amber-50"}>
                    <td className="p-3">{l.ts}</td>
                    <td className="p-3 capitalize">{l.category}</td>
                    <td className="p-3">{l.school ?? "—"}</td>
                    <td className="p-3">{l.actor}</td>
                    <td className="p-3">{l.action}</td>
                    <td className="p-3">{l.details}</td>
                    <td className="p-3 capitalize">{l.severity}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={7}>
                      No logs
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
