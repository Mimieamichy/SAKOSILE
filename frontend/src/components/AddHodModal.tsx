// src/components/AddHodModal.tsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";

export interface NewHodData {
  title: string;
  firstName: string;
  lastName: string;
  staffId: string;
  email: string;
  faculty: string; // will be the faculty NAME when submitting
  department: string; // will be the department NAME when submitting
  role: "hod" | "provost" | "dean";
}
const baseUrl = import.meta.env.VITE_BACKEND_URL;
interface AddHodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewHodData) => Promise<void>;
}

type ApiItem = Record<string, any>;
type Fac = { id: string; name: string };
type Dept = { id: string; name: string };

export default function AddHodModal({
  isOpen,
  onClose,
  onSubmit,
}: AddHodModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    lastName: "",
    staffId: "",
    email: "",
    faculty: "", // stores faculty ID for fetching departments
    department: "", // stores department ID
    role: "hod" as "hod" | "provost" | "dean",
  });

  // New: store the selected names (used only for submission)
  const [selectedFacultyName, setSelectedFacultyName] = useState("");
  const [selectedDepartmentName, setSelectedDepartmentName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthStore();

  // API lists + loading/errors
  const [faculties, setFaculties] = useState<Fac[]>([]);
  const [facLoading, setFacLoading] = useState(false);
  const [facError, setFacError] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Dept[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);

  // Helper to normalize API items into {id, name}
  const normalize = (item: ApiItem): { id: string; name: string } => {
    const id = String(
      item.id ?? item._id ?? item.facultyId ?? item.departmentId ?? item.idStr ?? ""
    );
    const name = String(
      item.name ?? item.title ?? item.facultyName ?? item.departmentName ?? item.label ?? id
    );
    return { id, name };
  };

  const handleChange = (
    field:
      | keyof Omit<NewHodData, "faculty" | "department">
      | "faculty"
      | "department",
    value: string
  ) => {
    setFormData((f) => ({ ...f, [field]: value }));
  };

  // Fetch faculties when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const controller = new AbortController();
    setFacLoading(true);
    setFacError(null);

    (async () => {
      try {
        const res = await fetch(`${baseUrl}/faculty/`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to load faculties (${res.status})`);
        }
        const data = await res.json();
        if (!mounted) return;

        let arr: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : typeof data === "object"
          ? Object.values(data)
          : [];

        const normalized = arr.map(normalize);
        setFaculties(normalized);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Fetch faculties error", err);
        setFacError(err.message || "Failed to load faculties");
        setFaculties([]);
      } finally {
        if (mounted) setFacLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [isOpen, token]);

  // Fetch departments whenever faculty selection changes (for all roles)
  useEffect(() => {
    const facultyId = formData.faculty;
    // clear departments if no faculty selected
    if (!facultyId) {
      setDepartments([]);
      setDeptError(null);
      setDeptLoading(false);
      setFormData((f) => ({ ...f, department: "" }));
      setSelectedDepartmentName("");
      return;
    }

    let mounted = true;
    const controller = new AbortController();
    setDeptLoading(true);
    setDeptError(null);

    (async () => {
      try {
        const res = await fetch(
          `${baseUrl}/department/${encodeURIComponent(facultyId)}`,
          {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) {
          throw new Error(`Failed to load departments (${res.status})`);
        }
        const data = await res.json();

        let arr: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : typeof data === "object"
          ? Object.values(data)
          : [];

        const normalized = arr.map(normalize);
        if (!mounted) return;
        setDepartments(normalized);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Fetch departments error", err);
        setDeptError(err.message || "Failed to load departments");
        setDepartments([]);
      } finally {
        if (mounted) setDeptLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [formData.faculty, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Resolve names: prefer the stored selected names, fallback to lookup from lists
      const facultyName =
        selectedFacultyName ||
        faculties.find((f) => f.id === formData.faculty)?.name ||
        "";
      const departmentName =
        selectedDepartmentName ||
        departments.find((d) => d.id === formData.department)?.name ||
        "";

      // validate required fields
      if (!facultyName || !departmentName) {
        throw new Error("Please select both faculty and department.");
      }

      const payload: NewHodData = {
        title: formData.title,
        firstName: formData.firstName,
        lastName: formData.lastName,
        staffId: formData.staffId,
        email: formData.email,
        role: formData.role,
        // now include faculty & department for all roles
        faculty: facultyName,
        department: departmentName,
      };

      await onSubmit(payload);

      // reset form
      setFormData({
        title: "",
        firstName: "",
        lastName: "",
        staffId: "",
        email: "",
        faculty: "",
        department: "",
        role: "hod",
      });
      setSelectedFacultyName("");
      setSelectedDepartmentName("");
      onClose();
    } catch (err: any) {
      console.error("Add staff failed", err);
      setError(err.message || "Failed to add staff");
    } finally {
      setLoading(false);
    }
  };

  // Removed role-clearing effect so faculty/department remain available for all roles.
  const roleLabel =
    formData.role === "hod" ? "HOD" : formData.role === "provost" ? "Provost" : "Dean";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-800">
            Add New HOD, Dean or Provost
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="text-red-500 text-sm px-2" role="alert">
              {error}
            </p>
          )}

          {/* Row 1: Title / First / Last */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Title</label>
              <Select
                value={formData.title}
                onValueChange={(val) => handleChange("title", val)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Title" />
                </SelectTrigger>
                <SelectContent>
                  {[                   
                    "DR.",                    
                    "PROF.",
                  ].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">First Name</label>
              <Input
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Last Name</label>
              <Input
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Row 2: Staff ID / Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Staff ID</label>
              <Input
                value={formData.staffId}
                onChange={(e) => handleChange("staffId", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Role</label>
            <Select
              value={formData.role}
              onValueChange={(val) =>
                handleChange("role", val as "hod" | "dean" | "provost")
              }
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hod">HOD</SelectItem>
                <SelectItem value="dean">Dean</SelectItem>
                <SelectItem value="provost">Provost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Faculty / Department - now required for ALL roles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Faculty</label>
              <Select
                value={formData.faculty || undefined}
                onValueChange={(val) => {
                  // set the ID for fetching depts
                  handleChange("faculty", val);
                  // also capture the human-friendly name for submission
                  const f = faculties.find((x) => x.id === val);
                  setSelectedFacultyName(f?.name ?? "");
                  // clear selected dept when faculty changes
                  setFormData((prev) => ({ ...prev, department: "" }));
                  setSelectedDepartmentName("");
                }}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((fac) => (
                    <SelectItem key={fac.id} value={fac.id}>
                      {fac.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {facError && <p className="text-sm text-red-500 mt-1">{facError}</p>}
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Department</label>
              <Select
                value={formData.department || undefined}
                onValueChange={(val) => {
                  handleChange("department", val);
                  const d = departments.find((x) => x.id === val);
                  setSelectedDepartmentName(d?.name ?? "");
                }}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {deptError && <p className="text-sm text-red-500 mt-1">{deptError}</p>}
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-700 text-white min-w-[100px]"
              disabled={loading}
            >
              {loading ? "Adding..." : `Add ${roleLabel}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
