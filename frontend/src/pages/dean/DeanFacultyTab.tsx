// src/dean/DeanFacultyTab.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { Role } from "@/config/roles";
import { useToast } from "@/hooks/use-toast";

interface FacultyStaff {
  id: string;
  _id?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  staffId?: string;
  email?: string;
  role?: string;
  faculty?: string;
  department?: string;
  isFacultyRep?: boolean;
  facultyRep?: any;
  raw?: any;
}

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function DeanFacultyTab() {
  const { token, user, hasRole } = useAuthStore();
  const { toast } = useToast();

  const isDean = hasRole(Role.DEAN);

  const [staff, setStaff] = useState<FacultyStaff[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"make" | "unmake" | null>(
    null
  );

  // filters
  const [filterName, setFilterName] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStaffId, setFilterStaffId] = useState("");

  useEffect(() => {
    if (!token) {
      toast?.({
        title: "Not authorized",
        description: "Missing token",
        variant: "destructive",
      });
      return;
    }
    // set default auth header for axios
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    loadFacultyStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadFacultyStaff() {
    try {
      setLoading(true);
      const url = `${baseUrl}/lecturer/faculty`;
      console.log("DeanFacultyTab: requesting", url);

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("DeanFacultyTab: raw response", res.status, res.data);

      // get the array from possible shapes
      const arr: any[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      // map API -> UI shape; detect faculty_pg_rep from user.roles
      const mapped: FacultyStaff[] = (arr || []).map((r: any) => {
        const id = r._id ?? r.id ?? r.user?._id ?? "";
        const staffId =
          r.staffId ?? r.staffID ?? r.staff_id ?? r.user?.staffId ?? "";
        const firstName = r.user?.firstName ?? r.firstName ?? "";
        const lastName = r.user?.lastName ?? r.lastName ?? "";
        const email = r.user?.email ?? r.email ?? "";
        const faculty = r.faculty ?? r.facultyName ?? r.user?.faculty ?? "";
        const department =
          r.department ?? r.departmentName ?? r.user?.department ?? "";

        // normalize roles from both places
        const userRoles: string[] = Array.isArray(r.user?.roles)
          ? r.user.roles
          : Array.isArray(r.roles)
          ? r.roles
          : [];

        const isFacultyRep =
          userRoles.some(
            (role) =>
              role.toLowerCase() === Role.FACULTY_PG_REP ||
              role.toLowerCase() === "faculty_pg_rep"
          ) ||
          !!r.isFacultyRep ||
          !!r.facultyRep ||
          !!r.faculty_rep ||
          false;

        return {
          id,
          _id: r._id ?? r.id,
          title: r.title ?? r.user?.title ?? "",
          firstName,
          lastName,
          staffId,
          email,
          role: userRoles[0] ?? r.role ?? "lecturer",
          faculty,
          department,
          isFacultyRep,
          facultyRep: r.facultyRep ?? r.faculty_rep ?? null,
          raw: r,
        };
      });

      setStaff(mapped);
      console.log("DeanFacultyTab: mapped staff", mapped);
    } catch (err: any) {
      console.error("DeanFacultyTab: load error", err);
      toast?.({
        title: "Error",
        description: "Failed to load faculty staff.",
        variant: "destructive",
      });
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }

  // determine the current faculty rep by checking raw.user.roles OR isFacultyRep flag
  const currentFacultyRep = useMemo(() => {
    return (
      staff.find((s) => {
        const roles: string[] = Array.isArray(s.raw?.user?.roles)
          ? s.raw.user.roles
          : [];
        return (
          roles.some(
            (r) =>
              r.toLowerCase() === Role.FACULTY_PG_REP ||
              r.toLowerCase() === "faculty_pg_rep"
          ) || !!s.isFacultyRep
        );
      }) ?? null
    );
  }, [staff]);

  // filtered list for UI
  const filtered = useMemo(() => {
    const nameTerm = filterName.trim().toLowerCase();
    const deptTerm = filterDept.trim().toLowerCase();
    const staffTerm = filterStaffId.trim().toLowerCase();

    return staff.filter((s) => {
      if (nameTerm) {
        const full = `${s.firstName ?? ""} ${s.lastName ?? ""}`.toLowerCase();
        if (!full.includes(nameTerm)) return false;
      }
      if (deptTerm && !(s.department ?? "").toLowerCase().includes(deptTerm))
        return false;
      if (staffTerm && !(s.staffId ?? "").toLowerCase().includes(staffTerm))
        return false;
      return true;
    });
  }, [staff, filterName, filterDept, filterStaffId]);

  function openConfirm(id: string, action: "make" | "unmake") {
    setConfirmId(id);
    setConfirmAction(action);
  }

  async function performMakeUnmake(id: string, action: "make" | "unmake") {
    if (!isDean) {
      toast?.({
        title: "Not allowed",
        description: "Only a Dean can perform this action.",
        variant: "destructive",
      });
      setConfirmId(null);
      setConfirmAction(null);
      return;
    }

    const item = staff.find((s) => s.id === id || s._id === id);
    if (!item) {
      toast?.({ title: "Not found", variant: "destructive" });
      setConfirmId(null);
      setConfirmAction(null);
      return;
    }

    // guard: don't allow creating a second rep
    if (
      action === "make" &&
      currentFacultyRep &&
      (currentFacultyRep.id ?? currentFacultyRep._id) !== (item.id ?? item._id)
    ) {
      toast?.({
        title: "Faculty rep exists",
        description: `There is already a faculty rep: ${
          currentFacultyRep?.firstName ?? ""
        } ${currentFacultyRep?.lastName ?? ""}. Remove them first.`,
        variant: "destructive",
      });
      setConfirmId(null);
      setConfirmAction(null);
      return;
    }

    setActionLoadingId(id);
    const prev = [...staff];

    // optimistic update: set isFacultyRep and ensure raw.user.roles contains 'faculty_pg_rep' (or remove on unmake)
    setStaff((cur) =>
      cur.map((s) => {
        if (s.id === id || s._id === id) {
          // normalize or copy roles array
          const existingRoles: string[] = Array.isArray(s.raw?.user?.roles)
            ? s.raw.user.roles.map((r: any) => String(r))
            : Array.isArray(s.raw?.roles)
            ? s.raw.roles.map((r: any) => String(r))
            : [];
          let nextRoles = [...existingRoles];
          if (action === "make") {
            if (
              !nextRoles.map((r) => r.toLowerCase()).includes("faculty_pg_rep")
            )
              nextRoles.push("faculty_pg_rep");
          } else {
            nextRoles = nextRoles.filter(
              (r) => String(r).toLowerCase() !== "faculty_pg_rep"
            );
          }
          return {
            ...s,
            isFacultyRep: action === "make",
            raw: {
              ...(s.raw ?? {}),
              user: { ...(s.raw?.user ?? {}), roles: nextRoles },
            },
          };
        }
        return s;
      })
    );

    try {
      // use staffId if available; fallback to id/_id
      const staffIdentifier =item.id ?? item._id;
      if (!staffIdentifier)
        throw new Error("Missing staff identifier for API call");
      
      if (action === "make") {
        // assign endpoint — POST /lecturer/assign-faculty-rep/:staffId
        const res = await axios.post(
          `${baseUrl}/lecturer/assign-faculty-rep/${encodeURIComponent(
            staffIdentifier
          )}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const returned = res.data?.data ?? res.data ?? null;
        // if server returned updated user/object, patch it in (prefer authoritative server data)
        if (returned) {
          setStaff((cur) =>
            cur.map((s) =>
              s.id === id || s._id === id
                ? {
                    ...s,
                    isFacultyRep:
                      returned.isFacultyRep ?? returned.facultyRep ?? true,
                    facultyRep: returned.facultyRep ?? s.facultyRep ?? null,
                    raw: returned.raw ?? returned ?? s.raw,
                  }
                : s
            )
          );
        }

        toast?.({ title: "Assigned faculty rep" });
      } else {
        // unassign: try DELETE first, fallback to POST { make: false }
        let res;
        try {
          res = await axios.delete(
            `${baseUrl}/lecturer/assign-faculty-rep/${encodeURIComponent(
              staffIdentifier
            )}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } catch (deleteErr) {
          // fallback to POST with make: false
          res = await axios.post(
            `${baseUrl}/lecturer/assign-faculty-rep/${encodeURIComponent(
              staffIdentifier
            )}`,
            { make: false },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
        }
        const returned = res.data?.data ?? res.data ?? null;
        if (returned) {
          setStaff((cur) =>
            cur.map((s) =>
              s.id === id || s._id === id
                ? {
                    ...s,
                    isFacultyRep: false,
                    facultyRep: null,
                    raw: returned.raw ?? returned ?? s.raw,
                  }
                : s
            )
          );
        } else {
          // if nothing returned assume success
          setStaff((cur) =>
            cur.map((s) =>
              s.id === id || s._id === id
                ? { ...s, isFacultyRep: false, facultyRep: null }
                : s
            )
          );
        }
        toast?.({ title: "Removed faculty rep" });
      }
    } catch (err: any) {
      console.error("DeanFacultyTab: make/unmake failed", err);
      // rollback optimistic update
      setStaff(prev);
      toast?.({
        title: "Error",
        description:
          err?.response?.data?.message ?? err?.message ?? "Action failed",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
      setConfirmId(null);
      setConfirmAction(null);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Faculty Staff</h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Filter by name"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="w-full sm:w-60"
          />
          <Input
            placeholder="Filter by department"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full sm:w-48"
          />
          <Input
            placeholder="Filter by staff id"
            value={filterStaffId}
            onChange={(e) => setFilterStaffId(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded shadow overflow-x-auto">
        <table className="min-w-[900px] w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Staff ID</th>
              <th className="p-3">Email</th>
              <th className="p-3">Faculty</th>
              <th className="p-3">Department</th>
              <th className="p-3">Role</th>
              <th className="p-3">Faculty Rep</th>
              {isDean && <th className="p-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr
                key={p.id ?? p._id ?? i}
                className={i % 2 ? "bg-white" : "bg-amber-50"}
              >
                <td className="p-3 capitalize">{`${p.title ?? ""} ${
                  p.firstName ?? ""
                } ${p.lastName ?? ""}`}</td>
                <td className="p-3">{p.staffId ?? "-"}</td>
                <td className="p-3">{p.email ?? "-"}</td>
                <td className="p-3">{p.faculty ?? "-"}</td>
                <td className="p-3">{p.department ?? "-"}</td>
                <td className="p-3">
                  {(p.role ?? "Lecturer").replace(/_/g, " ")}
                </td>
                <td className="p-3">{p.isFacultyRep ? "Yes" : "No"}</td>

                {isDean && (
                  <td className="p-3 text-right">
                    {p.isFacultyRep ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openConfirm(p.id ?? p._id ?? "", "unmake")
                        }
                        disabled={actionLoadingId === (p.id ?? p._id)}
                        title="Remove Faculty Rep"
                      >
                        <X size={14} /> Remove
                      </Button>
                    ) : (
                      <Button
                        className="bg-amber-700 text-white"
                        size="sm"
                        onClick={() => openConfirm(p.id ?? p._id ?? "", "make")}
                        disabled={
                          actionLoadingId === (p.id ?? p._id) ||
                          (!!currentFacultyRep &&
                            (currentFacultyRep.id ?? currentFacultyRep._id) !==
                              (p.id ?? p._id))
                        }
                        title={
                          !!currentFacultyRep &&
                          (currentFacultyRep.id ?? currentFacultyRep._id) !==
                            (p.id ?? p._id)
                            ? `Faculty rep already assigned: ${
                                currentFacultyRep?.firstName ?? ""
                              } ${currentFacultyRep?.lastName ?? ""}`
                            : "Make Faculty Rep"
                        }
                      >
                        <Check size={14} /> Make Rep
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}

            {!filtered.length && (
              <tr>
                <td
                  colSpan={isDean ? 8 : 7}
                  className="p-4 text-center text-gray-500"
                >
                  {loading ? "Loading..." : "No staff found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((p) => (
          <div key={p.id ?? p._id} className="bg-white rounded shadow p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-medium capitalize">{`${p.title ?? ""} ${
                  p.firstName ?? ""
                } ${p.lastName ?? ""}`}</div>
                <div className="text-sm text-gray-600">
                  {(p.role ?? "Lecturer").replace(/_/g, " ")}
                </div>
                <div className="mt-2 text-sm space-y-1">
                  <div>
                    <strong>Staff ID:</strong> {p.staffId ?? "-"}
                  </div>
                  <div>
                    <strong>Email:</strong> {p.email ?? "-"}
                  </div>
                  <div>
                    <strong>Faculty:</strong> {p.faculty ?? "-"}
                  </div>
                  <div>
                    <strong>Department:</strong> {p.department ?? "-"}
                  </div>
                </div>
              </div>

              {isDean && (
                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm">
                    {p.isFacultyRep ? "Faculty Rep" : ""}
                  </div>

                  {p.isFacultyRep ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConfirm(p.id ?? p._id ?? "", "unmake")}
                      disabled={actionLoadingId === (p.id ?? p._id)}
                      title="Remove Faculty Rep"
                    >
                      <X size={14} />
                    </Button>
                  ) : (
                    <Button
                      className="bg-amber-700 text-white"
                      size="sm"
                      onClick={() => openConfirm(p.id ?? p._id ?? "", "make")}
                      disabled={
                        actionLoadingId === (p.id ?? p._id) ||
                        (!!currentFacultyRep &&
                          (currentFacultyRep.id ?? currentFacultyRep._id) !==
                            (p.id ?? p._id))
                      }
                      title={
                        !!currentFacultyRep &&
                        (currentFacultyRep.id ?? currentFacultyRep._id) !==
                          (p.id ?? p._id)
                          ? `Faculty rep already assigned: ${
                              currentFacultyRep?.firstName ?? ""
                            } ${currentFacultyRep?.lastName ?? ""}`
                          : "Make Faculty Rep"
                      }
                    >
                      <Check size={14} />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {!filtered.length && (
          <div className="text-center text-gray-500">
            {loading ? "Loading..." : "No staff found."}
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirmId && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h4 className="text-lg font-medium mb-3">
              {confirmAction === "make"
                ? "Make Faculty Rep"
                : "Remove Faculty Rep"}
            </h4>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to{" "}
              {confirmAction === "make" ? "make" : "remove"} this staff member
              as a faculty rep?
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmId(null);
                  setConfirmAction(null);
                }}
                disabled={actionLoadingId === confirmId}
              >
                Cancel
              </Button>
              <Button
                className="bg-amber-700 text-white"
                onClick={() => performMakeUnmake(confirmId!, confirmAction!)}
                disabled={actionLoadingId === confirmId}
              >
                {actionLoadingId === confirmId
                  ? "Processing…"
                  : confirmAction === "make"
                  ? "Make Rep"
                  : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
