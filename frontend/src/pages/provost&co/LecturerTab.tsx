// src/hod&pgc/LecturerTab.tsx
import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { Role } from "@/config/roles";
import { useToast } from "@/hooks/use-toast";

interface Lecturer {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  staffId?: string;
  email: string;
  role: string;
  department?: string; // optional, for external examiners
}

interface Option {
  label: string;
  value: string;
}

// human-readable labels for role values
const ROLE_LABELS: Record<string, string> = {
  lecturer: "Lecturer",
  pgcord: "PG Coordinator",
  external_examiner: "External Examiner",
  hod: "HOD",
  // add other known roles here
};

function roleLabel(role?: string) {
  if (!role) return "";
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  // fallback: turn snake_case or kebab-case into Title Case
  return role
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const baseUrl = import.meta.env.VITE_BACKEND_URL;

// Titles for dropdown
const titleOptions = [
  "Dr.",
  "Prof.",
];

// Roles for dropdown
const baseRoleOptions: Option[] = [{ label: "Lecturer", value: "lecturer" }];

export default function LecturerTab() {
  const { token, user, hasRole } = useAuthStore();
  const isHod = hasRole(Role.HOD);
  const isProvost = hasRole(Role.PROVOST);
  const { toast } = useToast();

  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // form supports both add and edit. staffId is optional for external examiners
  const [form, setForm] = useState<Omit<Lecturer, "id">>({
    title: "",
    firstName: "",
    lastName: "",
    staffId: "",
    email: "",
    role: "",
    department: "",
  });

  // provost-specific: faculties & departments
  const [faculties, setFaculties] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  // edit flow: if editId is set, modal is in "edit" mode
  const [editId, setEditId] = useState<string | null>(null);

  // Build role options based on HOD/Provost
  const roleOptions: Option[] = [
    ...(!isProvost ? baseRoleOptions : []),
    ...(isHod && !isProvost
      ? [{ label: "PG Coordinator", value: "pgcord" }]
      : []),
    ...(isProvost
      ? [{ label: "External Examiner", value: "external_examiner" }]
      : []),
  ];

  useEffect(() => {
    if (!token) {
      toast({ title: "Not authorized", variant: "destructive" });
      return;
    }
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    loadLecturers();

    // if provost, also load faculties
    if (isProvost) loadFaculties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadLecturers() {
    try {
      if (!token) return;
      // Provost: load external examiners
      if (isProvost) {
        // NOTE: backend path assumed: /lecturer/get-external-examiner (adjust if different)
        const res = await axios.get<{ data: any[] }>(
          `${baseUrl}/lecturer/get-external-examiner`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // defensive mapping
        const arr = res.data?.data ?? [];
        console.log("Loaded lecturers:", arr);
        setLecturers(
          arr.map((r: any) => ({
            id: r._id ?? r.id,
            title: r.title ?? r.user?.title ?? "",
            firstName: r.user?.firstName ?? r.firstName ?? "",
            lastName: r.user?.lastName ?? r.lastName ?? "",
            staffId: r.staffId ?? "",
            email: r.user?.email ?? r.email ?? "",
            role: r.role ?? "external_examiner",
          }))
        );
      } else {
        // Non-provost: load departmental lecturers (existing behaviour)
        const res = await axios.get<{ data: any[] }>(
          `${baseUrl}/lecturer/department`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const arr = res.data?.data ?? [];
        console.log("Loaded lecturers:", arr);

        setLecturers(
          arr.map((r: any) => ({
            id: r._id ?? r.id,
            title: r.title ?? r.user?.title ?? "",
            firstName: r.user?.firstName ?? r.firstName ?? "",
            lastName: r.user?.lastName ?? r.lastName ?? "",
            staffId: r.staffId ?? "",
            email: r.user?.email ?? r.email ?? "",
            // try to read role from user.roles or r.role
            role:
              (Array.isArray(r.user?.roles) && r.user.roles.length > 0
                ? r.user.roles[0]
                : (r as any).role) ?? "lecturer",
          }))
        );
      }
    } catch (err) {
      console.error("Load lecturers failed", err);
      toast({
        title: "Error",
        description: "Failed to load lecturers/external examiners.",
        variant: "destructive",
      });
    }
  }

  // Provost: load faculties
  async function loadFaculties() {
    try {
      if (!token) return;
      const res = await axios.get(`${baseUrl}/faculty/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const arr = res.data?.data ?? res.data ?? [];
      setFaculties(
        arr.map((f: any) => ({
          label: f.name ?? f.facultyName ?? f.title ?? "",
          value: f._id ?? f.id,
        }))
      );
    } catch (err) {
      console.error("Load faculties failed", err);
      toast({
        title: "Error",
        description: "Failed to load faculties.",
        variant: "destructive",
      });
    }
  }

  // Provost: load departments for selected faculty
  useEffect(() => {
    if (!selectedFacultyId) {
      setDepartments([]);
      return;
    }
    const load = async () => {
      try {
        const res = await axios.get(
          `${baseUrl}/department/${selectedFacultyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const arr = res.data?.data ?? res.data ?? [];
        setDepartments(
          arr.map((d: any) => ({
            label: d.name ?? d.departmentName ?? d.title ?? "",
            value: d._id ?? d.id,
          }))
        );
      } catch (err) {
        console.error("Load departments failed", err);
        toast({
          title: "Error",
          description: "Failed to load departments for selected faculty.",
          variant: "destructive",
        });
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFacultyId]);

  function openAdd() {
    // For provost, open add external examiner only
    setForm({
      title: "",
      firstName: "",
      lastName: "",
      staffId: "",
      email: "",
      role: isProvost ? "external_examiner" : "",
      department: "",
    });
    setSelectedFacultyId("");
    setSelectedDepartmentId("");
    setEditId(null);
    setModalOpen(true);
  }

  function openEdit(l: Lecturer) {
    setForm({
      title: l.title ?? "",
      firstName: l.firstName ?? "",
      lastName: l.lastName ?? "",
      staffId: l.staffId ?? "",
      email: l.email ?? "",
      role: l.role ?? "",
      department: l.department ?? "",
    });
    setEditId(l.id);
    setModalOpen(true);
  }

  async function handleSubmit() {
    // Validate common fields
    for (const key of [
      "title",
      "firstName",
      "lastName",
      "email",
      "role",
    ] as const) {
      if (!form[key as keyof typeof form]) {
        toast({
          title: "Validation Error",
          description: `Please fill in the ${key} field.`,
          variant: "destructive",
        });
        return;
      }
    }

    // If we're creating an external examiner, ensure a department is chosen
    const isExternal = form.role === "external_examiner";
    if (isExternal && !selectedDepartmentId) {
      toast({
        title: "Validation Error",
        description:
          "Please choose a department to assign the external examiner to.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Edit flow
      if (editId) {
        // Build payload - backend may accept partial updates
        const payload: any = {
          title: form.title,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          role: form.role,
        };
        // only include staffId if present / applicable
        if (form.staffId) payload.staffId = form.staffId;

        // Only include department when editing an external examiner
        if (form.role === "external_examiner") {
          const deptId = selectedDepartmentId || form.department;
          const deptName =
            departments.find((d) => d.value === deptId)?.label ?? deptId;
          // send department name (or adjust to send id if your backend expects that)
          payload.department = deptName;
        }

        await axios.put(`${baseUrl}/lecturer/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // optimistic local update
        setLecturers((prev) =>
          prev.map((p) =>
            p.id === editId ? ({ ...p, ...form } as Lecturer) : p
          )
        );

        toast({ title: "Updated", description: "Lecturer updated." });
        setModalOpen(false);
        setEditId(null);
        return;
      }

      // Add flow
      if (isProvost) {
        // Provost adds external examiner
        const deptId = selectedDepartmentId || form.department;
        const departmentName =
          departments.find((d) => d.value === deptId)?.label ?? deptId;

        const payload: any = {
          email: form.email,
          title: form.title,
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role || "external_examiner",
          // include department ONLY for external examiners
          ...(form.role === "external_examiner"
            ? { department: departmentName }
            : {}),
        };

        const res = await axios.post(
          `${baseUrl}/lecturer/add-external-examiner`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const raw = res.data?.data ?? res.data;

        const created: Lecturer = {
          id: raw._id ?? raw.id,
          title: raw.title ?? payload.title,
          firstName: raw.user?.firstName ?? raw.firstName ?? payload.firstName,
          lastName: raw.user?.lastName ?? raw.lastName ?? payload.lastName,
          staffId: raw.staffId ?? "",
          email: raw.user?.email ?? raw.email ?? payload.email,
          role: raw.role ?? payload.role,
          department: raw.department ?? payload.department ?? undefined,
        };
        setLecturers((prev) => [...prev, created]);
        toast({
          title: "Added",
          description: "External Examiner added and assigned to department.",
        });
        setModalOpen(false);
        return;
      } else {
        // Regular lecturer add (existing behaviour) - do NOT send department
        const res = await axios.post(
          `${baseUrl}/lecturer/add-lecturer`,
          {
            title: form.title,
            firstName: form.firstName,
            lastName: form.lastName,
            staffId: form.staffId,
            email: form.email,
            role: form.role,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const raw = res.data?.data ?? res.data;
        const created: Lecturer = {
          id: raw._1 ?? raw._id ?? raw.id,
          title: raw.title ?? form.title,
          firstName: raw.user?.firstName ?? raw.firstName ?? form.firstName,
          lastName: raw.user?.lastName ?? raw.lastName ?? form.lastName,
          staffId: raw.staffId ?? form.staffId ?? "",
          email: raw.user?.email ?? raw.email ?? form.email,
          role: raw.role ?? form.role,
        };
        setLecturers((prev) => [...prev, created]);
        toast({ title: "Added", description: "Lecturer added." });
        setModalOpen(false);
        return;
      }
    } catch (err) {
      console.error("Submit failed", err);
      toast({
        title: "Error",
        description: editId
          ? "Failed to update lecturer."
          : "Failed to add lecturer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete(id: string) {
    setDeletingId(id);
    try {
      await axios.delete(`${baseUrl}/lecturer/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLecturers((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Deleted", description: "Lecturer removed." });
    } catch (err) {
      console.error("Delete failed", err);
      toast({
        title: "Error",
        description: "Failed to delete lecturer.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
      setDeleteModalId(null);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {isProvost ? "External Examiners" : "Lecturers"}
        </h2>
        <Button onClick={openAdd} className="bg-amber-700 text-white">
          {isProvost ? "Add External Examiner" : "Add Lecturer"}
        </Button>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-[800px] w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Staff ID</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lecturers.map((l, i) => (
              <tr key={l.id} className={i % 2 ? "bg-white" : "bg-amber-50"}>
                <td className="p-3 capitalize">
                  {l.title} {l.firstName} {l.lastName}
                </td>
                <td className="p-3">{l.staffId ?? "-"}</td>
                <td className="p-3">{l.email}</td>
                <td className="p-3">{roleLabel(l.role)}</td>
                <td className="p-3 text-right flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => openEdit(l)}
                    disabled={loading}
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </Button>

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setDeleteModalId(l.id)}
                    disabled={deletingId === l.id}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </Button>
                </td>
              </tr>
            ))}
            {!lecturers.length && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No {isProvost ? "external examiners" : "lecturers"} found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {deleteModalId && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h4 className="text-lg font-medium mb-4">
                Are you sure you want to delete this lecturer?
              </h4>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteModalId(null)}
                  disabled={deletingId === deleteModalId}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 text-white"
                  onClick={() => confirmDelete(deleteModalId!)}
                  disabled={deletingId === deleteModalId}
                >
                  {deletingId === deleteModalId ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-medium mb-4">
              {editId
                ? "Edit Lecturer"
                : isProvost
                ? "Add External Examiner"
                : "Add Lecturer"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-gray-700 mb-1">Title</label>
                <Select
                  value={form.title}
                  onValueChange={(v) => setForm((f) => ({ ...f, title: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Title" />
                  </SelectTrigger>
                  <SelectContent>
                    {titleOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* First Name */}
              <div>
                <label className="block text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                />
              </div>

              {/* Staff ID - optional for external examiner */}
              <div>
                <label className="block text-gray-700 mb-1">Staff ID</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={form.staffId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, staffId: e.target.value }))
                  }
                  placeholder={
                    isProvost ? "(optional for external examiners)" : ""
                  }
                />
              </div>

              {/* If provost: Faculty & Department selectors */}
              {isProvost && (
                <>
                  <div>
                    <label className="block text-gray-700 mb-1">Faculty</label>
                    <Select
                      value={selectedFacultyId}
                      onValueChange={(v) => {
                        setSelectedFacultyId(v);
                        setSelectedDepartmentId("");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.length ? (
                          faculties.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-faculties" disabled>
                            No faculties available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-gray-700 mb-1">
                      Department
                    </label>
                    <Select
                      value={selectedDepartmentId}
                      onValueChange={(v) => {
                        setSelectedDepartmentId(v);
                        // keep form.department in sync (stores the id)
                        setForm((f) => ({ ...f, department: v }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.length ? (
                          departments.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="select-faculty-first" disabled>
                            Select a faculty first
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Email */}
              <div>
                <label className="block text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded px-2 py-1"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-gray-700 mb-1">Role</label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(({ label, value }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                  setEditId(null);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-amber-700 text-white"
                disabled={loading}
              >
                {loading ? "Saving…" : editId ? "Save" : "Add"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
