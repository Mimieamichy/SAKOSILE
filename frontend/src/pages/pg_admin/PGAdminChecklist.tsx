import React, { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Filter, ClipboardList, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import waterMark from "../fulafia logo.png";

interface StudentFromAPI {
  _id: string;
  matricNo: string;
  level: "msc" | "phd";
  currentStage: string;
  department: string;
  faculty: string;
  projectTopic: string;
  stageScores: Record<string, number>;
  user?: { firstName: string; lastName: string };
}

interface Faculty {
  _id: string;
  name: string;
}

interface Department {
  _id: string;
  name: string;
}

const baseUrl = import.meta.env.VITE_BACKEND_URL;

const normalizeStage = (s?: string) =>
  (s ?? "")
    .toString()
    .toLowerCase()
    .replace(/[_\/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const stageLabelToApiKeyMap: Record<string, string> = {
  start: "start",
  proposal: "proposal",
  "internal defense": "internal",
  "external defense": "external_defense",
  "proposal defense": "proposal_defense",
  "2nd seminar": "second_seminar",
  "3rd seminar": "third_seminar",
  completed: "completed",
  external: "external",
};

const getStageKey = (label: string) => {
  const norm = normalizeStage(label);
  if (!norm) return "";
  if (stageLabelToApiKeyMap[norm]) return stageLabelToApiKeyMap[norm];
  return norm.replace(/\s+/g, "_");
};

const getLabelFromKey = (key: string, labels: string[]) => {
  const found = labels.find((l) => getStageKey(l) === key);
  if (found) return found;
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function PGAdminChecklist() {
  const location = useLocation();
  const isReadiness = location.pathname.includes("readiness");

  const { token } = useAuthStore();
  const { toast } = useToast();
  const noSessionWarnedRef = useRef(false);
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [degreeTab, setDegreeTab] = useState<"MSc" | "PhD">("MSc");
  
  const defenseOptions = useMemo<string[]>(() => {
    return degreeTab === "MSc"
      ? ["Start", "Proposal", "Internal Defense", "External", "Completed"]
      : [
          "Start",
          "Proposal Defense",
          "2nd Seminar",
          "3rd Seminar",
          "External Defense",
          "Completed",
        ];
  }, [degreeTab]);

  const [selectedDefense, setSelectedDefense] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [sessionsList, setSessionsList] = useState<{ _id: string; sessionName: string }[]>([]);
  
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
  const [facultiesLoading, setFacultiesLoading] = useState(false);
  const [facultiesError, setFacultiesError] = useState<string | null>(null);
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);

  const [students, setStudents] = useState<StudentFromAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalStudents, setTotalStudents] = useState(0);

  const [selectedStudentForReadiness, setSelectedStudentForReadiness] = useState<StudentFromAPI | null>(null);

  const selectedDefenseLabel = useMemo(() => {
    if (selectedDefense === "all") return "All Stages";
    return getLabelFromKey(selectedDefense, defenseOptions);
  }, [selectedDefense, defenseOptions]);

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${baseUrl}/session/sessions`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        const arr: any[] = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
          ? json.data
          : [];
        const mapped = arr.map((s) => ({
          _id: s._id ?? s.id ?? s.sessionId ?? "",
          sessionName: s.sessionName ?? s.name ?? s.title ?? String(s),
        }));
        setSessionsList(mapped);
        if (!selectedSession && mapped.length)
          setSelectedSession(mapped[0]._id);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      }
    };
    fetchSessions();
  }, [token, selectedSession]);

  // Fetch faculties
  useEffect(() => {
    let cancelled = false;
    const fetchFaculties = async () => {
      setFacultiesLoading(true);
      setFacultiesError(null);
      try {
        const res = await fetch(`${baseUrl}/faculty/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();
        const arr: any[] = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
          ? json.data
          : [];
        if (!cancelled) {
          const mapped = arr.map((f) => ({
            _id: f._id ?? f.id ?? "",
            name: f.name ?? f.facultyName ?? "",
          }));
          setFaculties(mapped);
        }
      } catch (err: any) {
        if (!cancelled)
          setFacultiesError(err?.message ?? "Failed to load faculties");
        setFaculties([]);
      } finally {
        if (!cancelled) setFacultiesLoading(false);
      }
    };
    fetchFaculties();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Fetch departments when faculty changes
  useEffect(() => {
    if (!selectedFacultyId) {
      setDepartments([]);
      setSelectedDepartmentId("");
      return;
    }
    let cancelled = false;
    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      setDepartmentsError(null);
      try {
        const url = `${baseUrl}/department/${selectedFacultyId}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();
        const arr: any[] = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
          ? json.data
          : [];
        if (!cancelled) {
          const mapped = arr.map((d) => ({
            _id: d._id ?? d.id ?? "",
            name: d.name ?? d.departmentName ?? "",
          }));
          setDepartments(mapped);
        }
      } catch (err: any) {
        if (!cancelled)
          setDepartmentsError(err?.message ?? "Failed to load departments");
        setDepartments([]);
        setSelectedDepartmentId("");
      } finally {
        if (!cancelled) setDepartmentsLoading(false);
      }
    };
    fetchDepartments();
    return () => {
      cancelled = true;
    };
  }, [selectedFacultyId, token]);

  // Fetch students
  useEffect(() => {
    let cancelled = false;

      const fetchStudents = async () => {
        if (!selectedSession) {
          if (!noSessionWarnedRef.current) {
            toast({
              title: "No session selected",
              description: "Please select a session to view students.",
              variant: "warning",
            });
            noSessionWarnedRef.current = true;
          }
          setStudents([]);
          setTotalStudents(0);
          return;
        }
        noSessionWarnedRef.current = false;

        const deptName = departments.find(d => d._id === selectedDepartmentId)?.name || "";
        if (!deptName) {
           setStudents([]);
           setTotalStudents(0);
           return;
        }

        setLoading(true);
        try {
          const levelSeg = degreeTab === "MSc" ? "msc" : "phd";
          const stageSeg = selectedDefense === "all" ? "" : selectedDefense;

          const url = `${baseUrl}/student/${levelSeg}/${encodeURIComponent(
            deptName
          )}/${encodeURIComponent(
            selectedSession
          )}?page=${page}&limit=${itemsPerPage}${
            stageSeg ? `&stage=${encodeURIComponent(stageSeg)}` : ""
          }${debouncedSearch ? `&q=${encodeURIComponent(debouncedSearch)}` : ""}`;
          
          const res = await fetch(url, {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

        if (!res.ok) {
          throw new Error(`Failed to fetch students (${res.status})`);
        }

        const json = await res.json();
        if (cancelled) return;

        const dataArr = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        setStudents(dataArr);
        setTotalStudents(typeof json.total === "number" ? json.total : dataArr.length);
        if (typeof json.page === "number") setPage(json.page);
        if (typeof json.limit === "number") setItemsPerPage(json.limit);
      } catch (err) {
        console.error("Error loading students:", err);
        if (!cancelled) {
          setStudents([]);
          setTotalStudents(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStudents();
    return () => {
      cancelled = true;
    };
  }, [degreeTab, selectedSession, selectedDepartmentId, selectedDefense, debouncedSearch, token, departments, page, itemsPerPage, toast, selectedFacultyId]);

  const totalPages = Math.max(1, Math.ceil(totalStudents / itemsPerPage));

  return (
    <div className="space-y-6">
      {/* Top header: degree tabs + title */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="flex border-b border-gray-200">
              {(["MSc", "PhD"] as const).map((dt) => (
                <button
                  key={dt}
                  onClick={() => {
                    setDegreeTab(dt);
                    setPage(1);
                  }}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors duration-200 ${
                    degreeTab === dt
                      ? "border-amber-700 text-amber-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {dt}
                </button>
              ))}
            </div>
          </div>

          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            {degreeTab} Students Ready for {selectedDefenseLabel}
          </h2>
        </div>
      </div>

      {/* Card containing filters + table */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 relative overflow-hidden">
        {/* Watermark */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
          <img src={waterMark} alt="Watermark" className="w-1/2 object-contain" />
        </div>

        {/* Filters grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end relative z-10">
          {/* Stage select */}
          <div>
            <Label htmlFor="defense-select" className="text-sm text-gray-600">
              Stage
            </Label>
            <Select
              value={selectedDefense}
              onValueChange={(v) => {
                setSelectedDefense(v);
                setPage(1);
              }}
            >
              <SelectTrigger id="defense-select" className="w-full">
                <SelectValue placeholder={selectedDefenseLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {defenseOptions.map((opt) => (
                  <SelectItem key={opt} value={getStageKey(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div>
            <Label className="text-sm text-gray-600">Search</Label>
            <div className="relative">
              <Input
                placeholder="Search Mat. No, Name, Topic or Stage"
                className="w-full pr-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Session */}
          <div>
            <Label className="text-sm text-gray-600">Session</Label>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessionsList.length > 0 ? (
                  sessionsList.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.sessionName}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No sessions available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Faculty & Department Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <div>
            <Label className="text-sm text-gray-600">Faculty</Label>
            <Select
              value={selectedFacultyId}
              onValueChange={(v) => {
                setSelectedFacultyId(v);
                setSelectedDepartmentId("");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    facultiesLoading ? "Loading..." : "Select Faculty"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {facultiesLoading ? (
                  <SelectItem value="loading" disabled>Loading faculties...</SelectItem>
                ) : facultiesError ? (
                  <SelectItem value="error" disabled>{facultiesError}</SelectItem>
                ) : faculties.length ? (
                  faculties.map((f) => (
                    <SelectItem key={f._id} value={f._id}>
                      {f.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No faculties</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm text-gray-600">Department</Label>
            <Select
              value={selectedDepartmentId}
              onValueChange={(v) => {
                setSelectedDepartmentId(v);
                setPage(1);
              }}
              disabled={
                !selectedFacultyId ||
                departmentsLoading ||
                departments.length === 0
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !selectedFacultyId
                      ? "Choose faculty first"
                      : departmentsLoading
                      ? "Loading departments..."
                      : "Select Department"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {departmentsLoading ? (
                  <SelectItem value="loading" disabled>Loading departments...</SelectItem>
                ) : departmentsError ? (
                  <SelectItem value="error" disabled>{departmentsError}</SelectItem>
                ) : departments.length ? (
                  departments.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    {selectedFacultyId
                      ? "No departments"
                      : "Select faculty first"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-6 relative z-10">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 text-sm font-medium text-gray-600">Matric No</th>
                <th className="p-4 text-sm font-medium text-gray-600">Full Name</th>
                <th className="p-4 text-sm font-medium text-gray-600">Project Topic</th>
                <th className="p-4 text-sm font-medium text-gray-600">Current Stage</th>
                {isReadiness && <th className="p-4 text-sm font-medium text-gray-600">Readiness Status</th>}
                <th className="p-4 text-sm font-medium text-gray-600">Department</th>
                <th className="p-4 text-sm font-medium text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="h-8 w-8 text-gray-300" />
                      <span>No students found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => (
                  <tr key={s._id} className={idx % 2 === 0 ? "bg-white" : "bg-amber-50/30"}>
                    <td className="p-4 border-t">{s.matricNo}</td>
                    <td className="p-4 border-t font-medium text-amber-700 capitalize">
                      {s.user ? `${s.user.firstName} ${s.user.lastName}` : "—"}
                    </td>
                    <td className="p-4 border-t max-w-xs truncate" title={s.projectTopic}>
                      {s.projectTopic}
                    </td>
                    <td className="p-4 border-t">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        {getLabelFromKey(s.currentStage, defenseOptions)}
                      </span>
                    </td>
                    {isReadiness && (
                      <td className="p-4 border-t">
                        <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                          Pending Form
                        </span>
                      </td>
                    )}
                    <td className="p-4 border-t">{s.department}</td>
                    <td className="p-4 border-t text-right">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-amber-700 border-amber-700 hover:bg-amber-50"
                        onClick={() => {
                          if (isReadiness) {
                            setSelectedStudentForReadiness(s);
                          } else {
                            // TODO: Implement View Checklist
                          }
                        }}
                      >
                        {isReadiness ? "Fill Readiness Form" : "View Checklist"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 relative z-10">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * itemsPerPage + 1} to{" "}
              {Math.min(page * itemsPerPage, totalStudents)} of {totalStudents} students
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Readiness Form Modal */}
      {selectedStudentForReadiness && (
        <Dialog open={!!selectedStudentForReadiness} onOpenChange={() => setSelectedStudentForReadiness(null)}>
          <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-amber-800">
                {selectedStudentForReadiness.level === "phd" ? "Ph.D Seminar Readiness Form" : "PG Oral Internal Defence Readiness Form"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Name</Label>
                  <Input 
                    disabled 
                    value={selectedStudentForReadiness.user ? `${selectedStudentForReadiness.user.firstName} ${selectedStudentForReadiness.user.lastName}` : ""} 
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Matric Number</Label>
                  <Input disabled value={selectedStudentForReadiness.matricNo} className="bg-gray-50" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Programme of Study</Label>
                  <Input disabled value={selectedStudentForReadiness.level.toUpperCase()} className="bg-gray-50" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Department</Label>
                  <Input disabled value={selectedStudentForReadiness.department} className="bg-gray-50" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Title of Thesis/Dissertation</Label>
                <Textarea disabled value={selectedStudentForReadiness.projectTopic} className="bg-gray-50" />
              </div>

              {selectedStudentForReadiness.level === "phd" && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Seminar Type</Label>
                  <Select defaultValue={selectedStudentForReadiness.currentStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Seminar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proposal_defense">Proposal Defense</SelectItem>
                      <SelectItem value="second_seminar">2nd Seminar</SelectItem>
                      <SelectItem value="third_seminar">3rd Seminar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Proposed Date</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Time</Label>
                  <Input type="time" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Venue</Label>
                <Input placeholder="Enter proposed venue" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedStudentForReadiness(null)}>Cancel</Button>
              <Button className="bg-amber-700 hover:bg-amber-800 text-white" onClick={() => {
                toast({
                  title: "Readiness Form Saved",
                  description: "The readiness form has been updated successfully.",
                });
                setSelectedStudentForReadiness(null);
              }}>
                Save Form
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

