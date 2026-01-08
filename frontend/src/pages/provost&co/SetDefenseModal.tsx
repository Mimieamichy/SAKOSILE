import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface Lecturer {
  _id: string;
  fullName?: string;
  staffId?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    roles: string;
  };
  email?: string;
  name?: string;
}

// added optional student object type (only _id and currentStage are needed)
interface StudentObj {
  _id: string;
  currentStage?: string;
}

// interface changes — remove level, add allStudents
interface SetDefenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defenseStage: string;
  defenseLabel?: string; // optional label for display (e.g., "Proposal Defense")
  lecturers?: Lecturer[]; // optional preloaded lecturers
  studentIds: string[]; // required: students to schedule (fallback)
  // optional: full student objects from parent so we can filter by currentStage here
  allStudents?: StudentObj[];
  program: string;
  session: string;
  baseUrl: string;
  onScheduled?: (resp: any) => void;
  // department is used for college-rep lookup (optional — pass from parent)
  department?: string;
}

// helper (add if not already present)
const normalizeProgram = (p?: string): string | undefined => {
  if (!p) return p;
  const normalized = String(p).trim();

  // normalize common variants, then return lowercase
  const up = normalized.toUpperCase();
  if (up === "MSC" || up === "MSc".toUpperCase()) return "msc";
  if (up === "PHD" || up === "PhD".toUpperCase()) return "phd";

  return normalized.toLowerCase();
};
// convert role keys like "external_examiner" -> "External Examiner"
const prettyRole = (role?: string) => {
  if (!role) return "";
  return String(role)
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const normalizeProgram2 = (p?: string) => {
  if (!p) return p;
  const normalized = String(p).trim().toUpperCase();
  if (normalized === "MSC" || normalized === "PHD") return normalized;
  if (normalized === "MSc".toUpperCase()) return "MSC";
  if (normalized === "PhD".toUpperCase()) return "PHD";
  return normalized;
};

const SetDefenseModal: React.FC<SetDefenseModalProps> = ({
  isOpen,
  onClose,
  defenseLabel, // <-- new optional prop
  defenseStage,
  lecturers: initialLecturers,
  studentIds,
  allStudents, // <-- new optional prop
  program,
  session,
  baseUrl,
  onScheduled,
  department,
}) => {
  const { token, hasRole } = useAuthStore();
  const isProvost = hasRole("provost");
  const isHod = hasRole("hod");
  const isPgc = hasRole("pg_coordinator");
  const { toast } = useToast();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [panel, setPanel] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [lecturers, setLecturers] = useState<Lecturer[]>(
    initialLecturers ?? []
  );
  const [loadingLecturers, setLoadingLecturers] = useState(false);
  const departmentName = String(department).trim();

  const facultyRepEndpoint = `${baseUrl}/lecturer/get-faculty-rep`;
  const externalExaminerEndpoint = `${baseUrl}/lecturer/get-external-examiner?department=${encodeURIComponent(
    departmentName
  )}`;

  const collegeRepEndpoint = `${baseUrl}/lecturer/get-college-rep`;
  const provostEndpoint = `${baseUrl}/lecturer/get-provost`;

  const departmentLecturersEndpoint = `${baseUrl}/defence/lecturers/${encodeURIComponent(
    defenseStage
  )}/${encodeURIComponent(normalizeProgram(program))}/${encodeURIComponent(
    departmentName
  )}`;

  const normalizePayloadCandidates = (raw: any): Lecturer[] => {
    const payload = raw?.data ?? raw;
    if (Array.isArray(payload)) return payload as Lecturer[];
    if (Array.isArray(payload?.lecturers))
      return payload.lecturers as Lecturer[];

    const maybeArray = Object.values(payload || {}).find((v: any) =>
      Array.isArray(v)
    );
    if (Array.isArray(maybeArray)) return maybeArray as Lecturer[];

    // if it's a single object (like a provost object), wrap it in an array
    if (payload && typeof payload === "object") return [payload as Lecturer];

    return [];
  };

  const mergeUnique = (lists: Lecturer[][]) => {
    const map = new Map<string, Lecturer>();
    for (const list of lists) {
      for (const l of list) {
        const key = l._id || l.email || l.staffId || JSON.stringify(l);
        if (!map.has(key)) map.set(key, l);
      }
    }
    return Array.from(map.values());
  };

  // --- NEW: compute the actual student IDs to schedule filtered by currentStage
  const studentIdsToSchedule = useMemo(() => {
    if (Array.isArray(allStudents) && allStudents.length > 0) {
      const matched = allStudents
        .filter(
          (s) =>
            String(s.currentStage ?? "").trim() !== "" &&
            String(s.currentStage) === String(defenseStage)
        )
        .map((s) => s._id)
        .filter(Boolean);
      // if none matched, fall back to incoming studentIds to avoid emptying unexpectedly
      return matched.length > 0 ? matched : studentIds;
    }
    // fallback if allStudents not provided
    return studentIds;
  }, [allStudents, studentIds, defenseStage]);

  const fetchLecturers = useCallback(async () => {
    setLoadingLecturers(true);
    console.groupCollapsed("[SetDefenseModal] GET lecturers (combined)");

    // start with any initial lecturers passed from props
    const seed: Lecturer[] = Array.isArray(initialLecturers)
      ? initialLecturers
      : [];

    try {
      // always attempt multiple relevant endpoints and merge results
      const results: Lecturer[][] = [seed];

      // 1) Faculty reps
      try {
        console.log(`[SetDefenseModal] GET -> ${facultyRepEndpoint}`);
        const res = await fetch(facultyRepEndpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const text = await res.text();
        let parsed: any = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = text;
        }
        console.log("Raw response (faculty reps):", parsed);
        const arr = normalizePayloadCandidates(parsed);
        results.push(arr);
      } catch (err) {
        console.warn("[SetDefenseModal] faculty reps fetch failed:", err);
      }

      // 2) External examiners (department-aware)
      try {
        console.log(`[SetDefenseModal] GET -> ${externalExaminerEndpoint}`);
        const resEx = await fetch(externalExaminerEndpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const textEx = await resEx.text();
        let parsedEx: any = null;
        try {
          parsedEx = textEx ? JSON.parse(textEx) : null;
        } catch {
          parsedEx = textEx;
        }
        console.log("Raw response (external examiners):", parsedEx);
        const arrEx = normalizePayloadCandidates(parsedEx);
        results.push(arrEx);
      } catch (err) {
        console.warn("[SetDefenseModal] external examiners fetch failed:", err);
      }

      // 2b) NEW: department-specific lecturers from /lecturer/:department
      if (departmentName) {
        try {
          console.log(
            `[SetDefenseModal] GET -> ${departmentLecturersEndpoint}`
          );
          const resDept = await fetch(departmentLecturersEndpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const textDept = await resDept.text();
          let parsedDept: any = null;
          try {
            parsedDept = textDept ? JSON.parse(textDept) : null;
          } catch {
            parsedDept = textDept;
          }
          console.log("Raw response (department lecturers):", parsedDept);
          const arrDept = normalizePayloadCandidates(parsedDept);
          results.push(arrDept);
        } catch (err) {
          console.warn(
            "[SetDefenseModal] department lecturers fetch failed:",
            err
          );
        }
      } else {
        console.log(
          "[SetDefenseModal] skipping /lecturer/:department — departmentName empty"
        );
      }

      // 3) College rep (only if department provided)
      if (department && String(department).trim() !== "") {
        try {
          const params = new URLSearchParams({
            department: String(department).trim(),
            level: String((normalizeProgram(program) || "").trim()),
            stage: String(defenseStage || ""),
          });

          const url = `${collegeRepEndpoint}?${params.toString()}`;
          console.log(`[SetDefenseModal] GET -> ${url}`);

          const res2 = await fetch(url, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });

          const text2 = await res2.text();
          let parsed2: any = null;
          try {
            parsed2 = text2 ? JSON.parse(text2) : null;
          } catch {
            parsed2 = text2;
          }

          console.log("Raw response (college rep):", parsed2);
          const arr2 = normalizePayloadCandidates(parsed2);
          results.push(arr2);
        } catch (err) {
          console.warn("[SetDefenseModal] college rep fetch failed:", err);
        }
      } else {
        console.log(
          "[SetDefenseModal] skipping college rep fetch — department name not provided"
        );
      }

      // 4) Provost — include provost in the merged list so HOD/PGC can also see it
      try {
        console.log(`[SetDefenseModal] GET -> ${provostEndpoint}`);
        const resProv = await fetch(provostEndpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const textProv = await resProv.text();
        let parsedProv: any = null;
        try {
          parsedProv = textProv ? JSON.parse(textProv) : null;
        } catch {
          parsedProv = textProv;
        }
        console.log("Raw response (provost):", parsedProv);
        const arrProv = normalizePayloadCandidates(parsedProv);
        results.push(arrProv);
      } catch (err) {
        console.warn("[SetDefenseModal] provost fetch failed:", err);
      }

      const merged = mergeUnique(results);
      setLecturers(merged);
    } catch (err) {
      console.error("[SetDefenseModal] fetchLecturers error:", err);
      setLecturers([]);
      toast({
        title: "Failed to load panel members",
        description: "Could not fetch lecturers. Check your network or auth.",
        variant: "destructive",
      });
    } finally {
      console.groupEnd();
      setLoadingLecturers(false);
    }
  }, [
    initialLecturers,
    facultyRepEndpoint,
    externalExaminerEndpoint,
    departmentLecturersEndpoint, // <-- added here
    collegeRepEndpoint,
    provostEndpoint,
    department,
    program,
    defenseStage,
    token,
    departmentName,
    toast,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    fetchLecturers();
    setPanel([]); // reset panel selection on open
  }, [isOpen, fetchLecturers]);

  if (!isOpen) return null;

  // POST handler for scheduling defense
  const handleSave = async (): Promise<void> => {
    if (!date || !time) {
      toast({
        title: "Missing fields",
        description: "Please provide date and time.",
        variant: "destructive",
      });
      return;
    }

    const programForApi = normalizeProgram2(program);

    if (!["MSC", "PHD"].includes(programForApi)) {
      toast({
        title: "Invalid program",
        description: `Program must be MSC or PHD (got "${String(program)}").`,
        variant: "destructive",
      });
      return;
    }

    // Inform user when scheduling without panel members (non-blocking)
    if (panel.length === 0) {
      toast({
        title: "No panel selected",
        description:
          "Scheduling without panel members — you can add them later.",
        variant: "default",
      });
    }

    const payload: any = {
      stage: defenseStage,
      session,
      date,
      time,
      studentIds: studentIdsToSchedule,
      program: programForApi,
      // include panelMemberIds only when there are selected panel members
      ...(panel.length > 0 ? { panelMemberIds: panel } : {}),
    };

    console.groupCollapsed("[SetDefenseModal] POST /defence/schedule");
    console.log("payload:", payload);

    setSaving(true);
    try {
      const res = await fetch(`${baseUrl}/defence/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let parsed: any = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = text;
      }

      // explicit log of the raw response from the schedule API
      console.log("Raw response (schedule):", parsed);

      if (!res.ok) {
        const msg =
          (parsed && (parsed.message || parsed.error)) ??
          `Server ${res.status}`;
        throw new Error(msg);
      }

      toast({
        title: "Defense scheduled",
        description: "Defense saved successfully.",
        variant: "default",
      });

      onScheduled?.(parsed);
      onClose();
    } catch (err: any) {
      console.groupEnd();
      console.error("[SetDefenseModal] schedule error:", err);
      toast({
        title: "Save failed",
        description: err?.message ?? "An error occurred while saving.",
        variant: "destructive",
      });
    } finally {
      console.groupEnd();
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="w-full max-w-3xl bg-white rounded-xl p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
          Schedule {defenseLabel}
        </h2>

        <div className="mb-4">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full"
          />
        </div>

        <div className="mb-4">
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 w-full"
          />
        </div>

        <div className="mb-4">
          <Label>Panel Members</Label>

          {loadingLecturers ? (
            <p className="text-sm text-gray-500 mt-2">Loading panel members…</p>
          ) : Array.isArray(lecturers) && lecturers.length === 0 ? (
            <p className="text-sm text-gray-500 mt-2">
              No lecturers found for this role/department
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {lecturers.map((lec) => {
                const displayName =
                  lec.fullName ||
                  `${lec.user?.firstName ?? ""} ${
                    lec.user?.lastName ?? ""
                  }`.trim() ||
                  lec.name ||
                  lec._id;

                // Get first role from user.roles
                const firstRole =
                  Array.isArray(lec.user?.roles) && lec.user.roles.length
                    ? lec.user.roles[0]
                    : "";

                // human friendly label
                const roleLabel = prettyRole(firstRole);

                return (
                  <label
                    key={lec._id}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <Checkbox
                      checked={panel.includes(lec._id)}
                      onCheckedChange={(checked) => {
                        if (checked)
                          setPanel((p) => Array.from(new Set([...p, lec._id])));
                        else setPanel((p) => p.filter((id) => id !== lec._id));
                      }}
                    />
                    <span>
                      {displayName} | {roleLabel}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="min-w-[90px]"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              try {
                await handleSave();
              } catch (err) {
                console.error("Save aborted:", err);
              }
            }}
            disabled={saving}
            className="bg-amber-700 hover:bg-amber-800 text-white min-w-[90px]"
          >
            {saving ? "Scheduling..." : "Schedule"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetDefenseModal;
