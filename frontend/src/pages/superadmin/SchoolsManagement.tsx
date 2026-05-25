import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import axios from "axios";
import { log } from "console";

type School = {
  _id: string;
  name: string;
  code?: string;
  adminEmail?: string;
  studentCount?: number;
  staffCount?: number;
  active?: boolean;
};

export default function SchoolsManagement() {
  const { toast } = useToast();
  const { token } = useAuthStore();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [catalogName, setCatalogName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const [catalog, setCatalog] = useState<string[]>([]);
  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  // Fetch Added Schools
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const fetchSchools = async () => {
      try {
        const res = await axios.get(`${baseUrl}/school`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data as any;
        const schoolList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        
        const mappedSchools: School[] = schoolList.map((s: any) => ({
          _id: s._id || s.id,
          name: s.name,
          adminEmail: s.centralAdminEmail || s.adminEmail || "—",
          studentCount: s.studentCount || 0,
          staffCount: s.staffCount || 0,
          active: s.status === "Active" || s.active === true
        }));

        if (!cancelled) setSchools(mappedSchools);
      } catch (err) {
        console.error("Failed to fetch schools", err);
      }
    };
    fetchSchools();
    return () => {
      cancelled = true;
    };
  }, [baseUrl, token]);

  // Fetch Institution Catalog
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await axios.get(`${baseUrl}/institution/`);
        console.log(res);
        
        const data = res.data as unknown;
        const arr: unknown =
          typeof data === "object" && data !== null && "data" in (data as any)
            ? (data as any).data
            : data;
        const names =
          Array.isArray(arr)
            ? arr
                .map((it) => {
                  if (it && typeof it === "object") {
                    const name =
                      (it as any).name ??
                      (it as any).institutionName ??
                      (it as any).schoolName;
                    return typeof name === "string" ? name : "";
                  }
                  return "";
                })
                .filter(Boolean)
            : [];
        if (!cancelled) setCatalog(names);
      } catch {
        if (!cancelled) setCatalog([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    setLoading(true);
    run();
    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

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
    if (!firstName.trim() || !lastName.trim() || !adminEmail.trim()) {
      toast({ title: "Admin details required", description: "First name, last name, and email are mandatory.", variant: "destructive" });
      return;
    }
    try {
      const payload = { 
        name: catalogName, 
        centralAdminEmail: adminEmail,
        firstName: firstName,
        lastName: lastName
      };
      const res = await axios.post(`${baseUrl}/school`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("response:", res);
      
      const data = res.data as unknown;
      const obj =
        typeof data === "object" && data !== null && "data" in (data as any)
          ? (data as any).data
          : data;
      const created = (obj ?? {}) as Record<string, unknown>;
      const newSchool: School = {
        _id: String(created.id ?? created._id ?? `demo-${Date.now()}`),
        name: String(created.name ?? catalogName),
        adminEmail: String(created.centralAdminEmail ?? adminEmail ?? ""),
        studentCount:
          typeof created.studentCount === "number" ? (created.studentCount as number) : 0,
        staffCount:
          typeof created.staffCount === "number" ? (created.staffCount as number) : 0,
        active:
          typeof created.status === "string"
            ? String(created.status).toLowerCase() === "active"
            : true,
      };
      setSchools((prev) => [newSchool, ...prev]);
      setCatalogName("");
      setAdminEmail("");
      setFirstName("");
      setLastName("");
      toast({ title: "School created" });
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create failed";
      toast({ title: "Create failed", description: message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (id: string) => {
    const target = schools.find((s) => s._id === id);
    if (!target) return;
    const nextStatus = target.active ? "Suspended" : "Active";
    try {
      await axios.patch(`${baseUrl}/school/${encodeURIComponent(id)}/status`, {
        status: nextStatus,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      
      setSchools((prev) =>
        prev.map((s) => (s._id === id ? { ...s, active: !s.active } : s))
      );
      toast({ title: "Status updated" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Schools Management</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-700 text-white">Add School</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New School</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label>School</Label>
                <Select value={catalogName} onValueChange={setCatalogName}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select School" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom">
                    {catalog.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Admin First Name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
                </div>
                <div>
                  <Label>Admin Last Name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                </div>
              </div>
              <div>
                <Label>Central Admin Email</Label>
                <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@example.com" />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button className="bg-amber-700 text-white" onClick={handleCreateSchool} disabled={loading}>
                Add School
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
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
