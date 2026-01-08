// src/components/AssignCollegeRepModal.tsx
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

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export interface SimpleLecturer {
  _id: string;
  staffId?: string;
  email?: string;
  fullName: string;
  faculty?: string;
  department?: string;
  raw?: any;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // studentId is optional — parent might need it, but assignment payload is lecturerId only per your request
  studentId?: string;
  // parent will receive the selected lecturer id and do the POST
  onAssigned?: (lecturerId: string) => void;
}

export default function AssignCollegeRepModal({
  isOpen,
  onClose,

  onAssigned,
}: Props) {
  const { token } = useAuthStore();

  // filters
  const [staffIdFilter, setStaffIdFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  // full list (unfiltered) + helper
  const [allLecturers, setAllLecturers] = useState<SimpleLecturer[]>([]);

  // lists & loading
  const [faculties, setFaculties] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [departments, setDepartments] = useState<
    { _id: string; name: string }[]
  >([]);
  const [lecturers, setLecturers] = useState<SimpleLecturer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // selection (radio)
  const [selectedLecturerId, setSelectedLecturerId] = useState<string>("");

  // Clear state when modal closes / opens
  useEffect(() => {
    if (!isOpen) {
      setStaffIdFilter("");
      setNameFilter("");
      setFacultyFilter("");
      setDepartmentFilter("");
      setLecturers([]);
      setSelectedLecturerId("");
      setDepartments([]);
      setAllLecturers([]); // <- ensure you added this state
      setError(null);
    } else {
      // initial: fetch the full lecturer list and faculties once when modal opens
      fetchAllLecturers();
      fetchFaculties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // fetch faculties for filter dropdown
  const fetchFaculties = async () => {
    try {
      const res = await fetch(`${baseUrl}/faculty/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`Failed to load faculties (${res.status})`);
      const json = await res.json();
      const arr: any[] = Array.isArray(json)
        ? json
        : Array.isArray(json.data)
        ? json.data
        : [];
      setFaculties(
        arr.map((f) => ({
          _id: f._id ?? f.id ?? String(f.id ?? ""),
          name: f.name ?? f.facultyName ?? String(f.name ?? ""),
        }))
      );
    } catch (err) {
      // non-fatal — we still allow manual text entry filters
      console.warn("Failed to fetch faculties", err);
      setFaculties([]);
    }
  };

  // fetch departments when faculty filter changes
  useEffect(() => {
    if (!facultyFilter) {
      // show all departments from the full list OR clear
      const allDepts = Array.from(
        new Set(allLecturers.map((l) => l.department).filter(Boolean))
      );
      setDepartments(allDepts.map((d) => ({ _id: d, name: d })));
      setDepartmentFilter("");
      return;
    }

    // derive departments that belong to selected faculty
    const facultyNameFromId =
      faculties.find((f) => f._id === facultyFilter)?.name ?? "";
    const filtered = allLecturers.filter(
      (l) =>
        l.faculty === facultyFilter ||
        l.faculty === facultyNameFromId ||
        (facultyNameFromId === "" && l.faculty === facultyFilter)
    );

    const uniqueDeps = Array.from(
      new Set(filtered.map((l) => l.department).filter(Boolean))
    );
    setDepartments(uniqueDeps.map((d) => ({ _id: d, name: d })));
    setDepartmentFilter("");
  }, [facultyFilter, allLecturers, faculties]);

  // fetch lecturers from /api/lecturer with query params
  const fetchAllLecturers = async () => {
    setError(null);
    setLoading(true);
    try {
      const url = `${baseUrl}/lecturer`;
      console.log("[AssignCollegeRep] fetchAllLecturers ->", url);
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to fetch lecturers (${res.status})`);
      }

      const json = await res.json();
      const arr: any[] = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : [];

      const mapped = arr.map((l) => {
        const fullname =
          l.fullName ??
          (`${l.firstName ?? l.user?.firstName ?? ""} ${
            l.lastName ?? l.user?.lastName ?? ""
          }`.trim() ||
            l.name ||
            "");
        const fallback = l._id ?? l.id ?? l.staffId ?? "";
        return {
          _id: l._id ?? l.id ?? fallback,
          staffId: l.staffId ?? "",
          email: l.email ?? l.user?.email ?? "",
          fullName: fullname || fallback,
          faculty: l.faculty ?? l.facultyName ?? "",
          department: l.department ?? l.departmentName ?? "",
          raw: l,
        } as SimpleLecturer;
      });
      console.log("[AssignCollegeRep] fetched lecturers:", mapped);

      setAllLecturers(mapped);
      setLecturers(mapped); // show all by default
      // preselect if exactly one
      if (mapped.length === 1) setSelectedLecturerId(mapped[0]._id);
    } catch (err: any) {
      console.error("fetchAllLecturers error:", err);
      setError(err?.message ?? "Failed to load lecturers");
      setAllLecturers([]);
      setLecturers([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // start from full list
    let list = [...allLecturers];

    // staffId exact/contains
    if (staffIdFilter?.trim()) {
      const q = staffIdFilter.trim().toLowerCase();
      list = list.filter((l) => (l.staffId ?? "").toLowerCase().includes(q));
    }

    // name substring (fullName)
    if (nameFilter?.trim()) {
      const q = nameFilter.trim().toLowerCase();
      list = list.filter((l) => (l.fullName ?? "").toLowerCase().includes(q));
    }

    // faculty — facultyFilter contains an id (from Select) or could be a name if user typed it
    if (facultyFilter) {
      const facultyNameFromId =
        faculties.find((f) => f._id === facultyFilter)?.name ?? "";
      list = list.filter(
        (l) =>
          (l.faculty && l.faculty === facultyFilter) || // matches ID form
          (facultyNameFromId && l.faculty === facultyNameFromId) || // matches name form
          (l.faculty &&
            l.faculty
              .toLowerCase()
              .includes((facultyFilter ?? "").toString().toLowerCase())) // fallback fuzzy
      );
    }

    // department — similar handling (departmentFilter may be id or name)
    if (departmentFilter) {
      const deptNameFromId =
        departments.find((d) => d._id === departmentFilter)?.name ?? "";
      list = list.filter(
        (l) =>
          (l.department && l.department === departmentFilter) ||
          (deptNameFromId && l.department === deptNameFromId) ||
          (l.department &&
            l.department
              .toLowerCase()
              .includes((departmentFilter ?? "").toString().toLowerCase()))
      );
    }

    setLecturers(list);
    // optionally pre-select when filtered to one result
    if (list.length === 1) setSelectedLecturerId(list[0]._id);
  };

  // When the parent clicks Assign in a row, we expect them to open this modal and set currentStudentId.
  // This modal will call onAssigned(lecturerId) when the user clicks Assign below.

  const handleAssign = () => {
    if (!selectedLecturerId) return;
    if (onAssigned) {
      onAssigned(selectedLecturerId); // parent will do POST (payload is lecturer id)
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Assign College Representative
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
          <Input
            placeholder="Staff ID"
            value={staffIdFilter}
            onChange={(e) => setStaffIdFilter(e.target.value)}
          />
          <Input
            placeholder="Name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
          <Select
            value={facultyFilter || undefined}
            onValueChange={(v) => setFacultyFilter(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Faculty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>{" "}
              {/* non-empty sentinel */}
              {faculties.map((f) => (
                <SelectItem key={f._id} value={f._id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={departmentFilter || undefined}
            onValueChange={(v) => setDepartmentFilter(v === "all" ? "" : v)}
            disabled={!facultyFilter}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d._id} value={d._id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 mb-4">
          <Button onClick={applyFilters} className="bg-amber-700 text-white">
            Search
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setStaffIdFilter("");
              setNameFilter("");
              setFacultyFilter("");
              setDepartmentFilter("");
              setLecturers([]);
              setSelectedLecturerId("");
            }}
          >
            Clear
          </Button>
        </div>

        {/* Results — radio list */}
        <div className="overflow-y-auto max-h-[50vh] border rounded">
          {loading && <div className="p-4 text-center">Loading...</div>}
          {!loading && error && (
            <div className="p-4 text-center text-red-500">{error}</div>
          )}
          {!loading && !error && lecturers.length === 0 && (
            <div className="p-4 text-center">No lecturers found.</div>
          )}

          {!loading && !error && lecturers.length > 0 && (
            <ul className="divide-y">
              {lecturers.map((l) => (
                <li key={l._id} className="p-3 flex items-start gap-3">
                  <div className="flex-shrink-0 pt-1">
                    <input
                      type="radio"
                      name="collegeRep"
                      id={`lec-${l._id}`}
                      checked={selectedLecturerId === l._id}
                      onChange={() => setSelectedLecturerId(l._id)}
                      className="mr-2"
                    />
                  </div>
                  <label
                    htmlFor={`lec-${l._id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">
                      {l.fullName}{" "}
                      {l.staffId ? (
                        <span className="text-sm text-gray-500">
                          ({l.staffId})
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm text-gray-600">
                      {l.department} — {l.faculty}
                    </div>
                    <div className="text-sm text-gray-500">{l.email}</div>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            className="bg-amber-700 text-white"
            disabled={!selectedLecturerId}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
