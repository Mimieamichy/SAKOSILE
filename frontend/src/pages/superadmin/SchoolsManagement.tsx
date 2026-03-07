import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type School = {
  _id: string;
  name: string;
  code?: string;
  adminEmail?: string;
  studentCount?: number;
  staffCount?: number;
  active?: boolean;
};

type APISchool = {};

export default function SchoolsManagement() {
  const { toast } = useToast();
  const [schools, setSchools] = useState<School[]>([
    { _id: "demo-1", name: "College of Science", adminEmail: "science-admin@example.com", studentCount: 420, staffCount: 80, active: true },
    { _id: "demo-2", name: "College of Engineering", adminEmail: "eng-admin@example.com", studentCount: 380, staffCount: 72, active: true },
    { _id: "demo-3", name: "College of Medicine", adminEmail: "medicine-admin@example.com", studentCount: 260, staffCount: 55, active: true },
    { _id: "demo-4", name: "College of Education", adminEmail: "edu-admin@example.com", studentCount: 310, staffCount: 61, active: false },
    { _id: "demo-5", name: "College of Law", adminEmail: "law-admin@example.com", studentCount: 190, staffCount: 34, active: true },
    { _id: "demo-6", name: "College of Arts", adminEmail: "arts-admin@example.com", studentCount: 220, staffCount: 40, active: true },
  ]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [catalogName, setCatalogName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const CATALOG = [
    "College of Science",
    "College of Engineering",
    "College of Medicine",
    "College of Education",
    "College of Law",
    "College of Arts",
  ];

  useEffect(() => {
    setLoading(false);
  }, []);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return schools;
    const q = debouncedSearch.toLowerCase();
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.adminEmail ?? "").toLowerCase().includes(q)
    );
  }, [schools, debouncedSearch]);

  const handleCreateSchool = async () => {
    if (!catalogName.trim()) {
      toast({ title: "Select a school", variant: "destructive" });
      return;
    }
    const newSchool: School = {
      _id: `demo-${Date.now()}`,
      name: catalogName,
      adminEmail: adminEmail || "",
      studentCount: 0,
      staffCount: 0,
      active: true,
    };
    setSchools((prev) => [newSchool, ...prev]);
    setCatalogName("");
    setAdminEmail("");
    toast({ title: "School created" });
  };

  const handleToggleActive = (id: string) => {
    setSchools((prev) =>
      prev.map((s) => (s._id === id ? { ...s, active: !s.active } : s))
    );
    toast({ title: "Status updated" });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Schools Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-3">
          <div>
            <Label>Add New School</Label>
            <select
              className="w-full border rounded-md h-10 px-3"
              value={catalogName}
              onChange={(e) => setCatalogName(e.target.value)}
            >
              <option value="">Select School</option>
              {CATALOG.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Central Admin Email</Label>
            <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@example.com" />
          </div>
          <Button className="bg-amber-700 text-white" onClick={handleCreateSchool} disabled={loading}>
            Add School
          </Button>
        </div>
        <div className="md:col-span-2 space-y-3">
          <div>
            <Label>Search</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or admin email" />
          </div>
          <div className="bg-white border rounded-lg overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-gray-600 text-sm font-medium">School</th>
                  <th className="p-3 text-gray-600 text-sm font-medium">Central Admin</th>
                  <th className="p-3 text-gray-600 text-sm font-medium">Students</th>
                  <th className="p-3 text-gray-600 text-sm font-medium">Staff</th>
                  <th className="p-3 text-gray-600 text-sm font-medium">Status</th>
                  <th className="p-3 text-gray-600 text-sm font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s._id} className={i % 2 === 0 ? "bg-white" : "bg-amber-50"}>
                    <td className="p-3">{s.name}</td>
                    <td className="p-3">{s.adminEmail || "—"}</td>
                    <td className="p-3">{s.studentCount ?? 0}</td>
                    <td className="p-3">{s.staffCount ?? 0}</td>
                    <td className="p-3">{s.active ? "Active" : "Suspended"}</td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        className={`${s.active ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"} text-white`}
                        onClick={() => handleToggleActive(s._id)}
                      >
                        {s.active ? "Suspend" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">No schools</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
