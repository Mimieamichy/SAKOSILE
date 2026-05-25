import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

interface AssignSupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    studentId: string,
    supervisorType: "major" | "minor" | "internal_examiner",
    lecturerId: string,
    lecturerName: string
  ) => void;
  studentId: string;
}

interface LecturerOption {
  id: string; // _id from DB
  staffId: string; // staffId field from API (useful for backend payload)
  name: string; // formatted display name (title + first + last)
}

const AssignSupervisorModal: React.FC<AssignSupervisorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  studentId,
}) => {
  const { token } = useAuthStore();

  const [supervisorType, setSupervisorType] = useState<
    "major" | "minor" | "internal_examiner"
  >("major");

  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [loadingLecturers, setLoadingLecturers] = useState(false);
  const [lecturersError, setLecturersError] = useState<string | null>(null);

  const [lecturerId, setLecturerId] = useState<string>("");
  const [lecturerName, setLecturerName] = useState<string>("");

  // Fetch and normalize lecturers whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const fetchLecturers = async () => {
      setLoadingLecturers(true);
      setLecturersError(null);
      try {
        const res = await fetch(`${baseUrl}/lecturer/department`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Failed to fetch (${res.status}) ${txt}`);
        }

        const raw = await res.json();
        console.log("Lecturers API raw response:", raw);

        // Accept multiple shapes: raw array, raw.data array, raw.lecturers array
        const arr: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw.data)
          ? raw.data
          : Array.isArray(raw.lecturers)
          ? raw.lecturers
          : [];

        // Defensive: if still not array, set empty and warn
        if (!Array.isArray(arr)) {
          console.warn("Unable to find lecturers array in response:", raw);
          if (!cancelled) setLecturers([]);
          return;
        }

        // Map to a stable shape used by the UI
        // Map to a stable shape used by the UI
        const options: LecturerOption[] = arr.map((l: any) => {
          const title = l.title ? `${l.title} ` : "";
          const first = l.user?.firstName ?? l.firstName ?? "";
          const last = l.user?.lastName ?? l.lastName ?? "";
          const name = `${title}${first} ${last}`.trim();

          return {
            id: l._id ?? l.id ?? (l.staffId ? `${l.staffId}` : ""),
            staffId: l.staffId ?? "",
            // use || to avoid mixing ?? and || without parentheses
            name: name || l.user?.email || l.staffId || l._id || "Unknown",
          };
        });

        if (!cancelled) setLecturers(options);
      } catch (err: any) {
        console.error("Failed to fetch lecturers", err);
        if (!cancelled) {
          setLecturersError(err.message ?? "Failed to fetch lecturers");
          setLecturers([]);
        }
      } finally {
        if (!cancelled) setLoadingLecturers(false);
      }
    };

    fetchLecturers();
    return () => {
      cancelled = true;
    };
  }, [isOpen, token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-gray-800">
          Assign Supervisor
        </h2>

        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">
            Supervisor Type
          </label>
          <Select
            value={supervisorType}
            onValueChange={(v) =>
              setSupervisorType(v as "major" | "minor" | "internal_examiner")
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="major">1st Supervisor</SelectItem>
              <SelectItem value="minor">2nd Supervisor</SelectItem>
              <SelectItem value="internal_examiner">
                Internal Examiner
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Lecturer</label>

          {loadingLecturers ? (
            <div className="text-sm text-gray-600">Loading lecturers…</div>
          ) : lecturersError ? (
            <div className="text-sm text-red-600">Error: {lecturersError}</div>
          ) : !Array.isArray(lecturers) || lecturers.length === 0 ? (
            <div className="text-sm text-gray-600">No lecturers found.</div>
          ) : (
            <Select
              value={lecturerId}
              onValueChange={(value) => {
                const selected = lecturers.find((l) => l.id === value);
                if (selected) {
                  setLecturerId(selected.id);
                  setLecturerName(selected.name);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Lecturer" />
              </SelectTrigger>

              {/* Make the dropdown scrollable: max height + overflow */}
              <SelectContent className="max-h-56 overflow-auto">
                {lecturers.map((lec) => (
                  <SelectItem key={lec.id} value={lec.id}>
                    {lec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto bg-amber-700 text-white hover:bg-amber-800"
            onClick={() => {
              // simple client-side validation
              if (!lecturerId) {
                setLecturersError("Please select a lecturer");
                return;
              }
              // Pass data up — parent will do the API call
              onSubmit(studentId, supervisorType, lecturerId, lecturerName);
              onClose();
            }}
            disabled={loadingLecturers}
          >
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssignSupervisorModal;
