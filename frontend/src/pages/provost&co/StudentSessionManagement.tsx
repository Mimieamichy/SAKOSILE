// src/pgc/StudentSessionManagement.tsx
import { useState, useMemo, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, X, Plus } from "lucide-react";
import AssignSupervisorModal from "./AssignSupervisorModal";
import ProvostViewStudentModal from "./ProvostViewStudentModal";
import SetDefenseModal from "./SetDefenseModal";
import EditStudentModal from "./EditStudentModal";
import { useAuthStore } from "@/store/authStore";
import { Role } from "@/config/roles";
import AssignCollegeRepModal from "./AssignCollegeRepModal";
import waterMark from "../fulafia logo.png";
import LoadingSpinner from "@/components/ui/LoadingSpinner";


interface StudentFromAPI {
  _id: string;
  matricNo: string;
  level: "msc" | "phd";
  currentStage: string;
  department: string;
  faculty: string;
  projectTopic: string;
  stageScores: Record<string, number>;
  majorSupervisor?: string;
  minorSupervisor?: string;
  internalExaminer?: string;
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

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const START_KEY = getStageKey("Start");
const COMPLETED_KEY = getStageKey("Completed");


const getLabelFromKey = (key: string, labels: string[]) => {
  const found = labels.find((l) => getStageKey(l) === key);
  if (found) return found;
  // Fallback: format the key to look like a label (e.g., proposal_defense -> Proposal Defense)
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const StudentSessionManagement = () => {
  const { token, user, hasRole } = useAuthStore();

  const isHod = hasRole(Role.HOD);
  const isProvost = hasRole(Role.PROVOST);
  const isDean = hasRole(Role.DEAN);
  const isPgc = hasRole(Role.PG_COORDINATOR);

  const { toast } = useToast();
  const noSessionWarnedRef = useRef(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewStudentId, setViewStudentId] = useState<string | null>(null);

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

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignCollegeRepOpen, setAssignCollegeRepOpen] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState<string>("");
  const [departmentName, setDepartmentName] = useState<string>("");

  const [defenseModalOpen, setDefenseModalOpen] = useState(false);
  const [defenseStage, setDefenseStage] = useState<string>(
    isProvost ? defenseOptions[3] : defenseOptions[0]
  );

  const [selectedDepartmentForDefense, setSelectedDepartmentForDefense] =
    useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [sessionsList, setSessionsList] = useState<
    { _id: string; sessionName: string }[]
  >([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [students, setStudents] = useState<StudentFromAPI[]>([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [selectedDefense, setSelectedDefense] = useState<string>(
    isProvost
      ? "all"
      : getStageKey(defenseOptions[0])
  );

  const selectedDefenseLabel = useMemo(() => {
    if (selectedDefense === "all") return "All Stages";
    return getLabelFromKey(selectedDefense, defenseOptions);
  }, [selectedDefense, defenseOptions]);

  const displayStageLabel = selectedDefenseLabel;

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [facultiesLoading, setFacultiesLoading] = useState(false);
  const [facultiesError, setFacultiesError] = useState<string | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);

  useEffect(() => {
    const apiOptions = [...defenseOptions.map((d) => getStageKey(d)), "all"];
    if (!apiOptions.includes(selectedDefense)) {
      setSelectedDefense(
        isProvost
          ? "all"
          : getStageKey(defenseOptions[0])
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defenseOptions, isProvost]);

  // fetch faculties if provost
  useEffect(() => {
    if (!isProvost) return;
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
  }, [isProvost, token]);

  // fetch departments if provost and faculty selected
  useEffect(() => {
    if (!isProvost) return;
    if (!selectedFacultyId) {
      setDepartments([]);
      setSelectedDepartmentForDefense("");
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
        setSelectedDepartmentForDefense("");
      } finally {
        if (!cancelled) setDepartmentsLoading(false);
      }
    };
    fetchDepartments();
    return () => {
      cancelled = true;
    };
  }, [isProvost, selectedFacultyId, token]);

  // fetch sessions
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

  // fetch departments if dean
  useEffect(() => {
    if (!isDean) return;
    let cancelled = false;
    const fetchDepartmentsForDean = async () => {
      setDepartmentsLoading(true);
      setDepartmentsError(null);
      try {
        const url = `${baseUrl}/department/`;
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
          if (mapped.length) setSelectedDepartmentForDefense(mapped[0]._id);
        }
      } catch (err: any) {
        if (!cancelled)
          setDepartmentsError(err?.message ?? "Failed to load departments");
        setDepartments([]);
        setSelectedDepartmentForDefense("");
      } finally {
        if (!cancelled) setDepartmentsLoading(false);
      }
    };
    fetchDepartmentsForDean();
    return () => {
      cancelled = true;
    };
  }, [isDean, token, user]);

  // fetch students when filters change
  useEffect(() => {
    const resolveDepartmentName = () => {
      if (isProvost || isDean) {
        if (!selectedDepartmentForDefense) return "";
        const found = departments.find(
          (d) => d._id === selectedDepartmentForDefense
        );
        return found?.name ?? "";
      }
      return user?.department || "";
    };

    setDepartmentName(resolveDepartmentName());
    let cancelled = false;

    const fetchStudents = async () => {
      setStudentsLoading(true);
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
        setStudentsLoading(false);
        return;
      }
      noSessionWarnedRef.current = false;

      const departmentNameLocal = resolveDepartmentName();
      if ((isProvost || isDean) && !departmentNameLocal) {
        setStudents([]);
        setTotalStudents(0);
        setStudentsLoading(false);
        return;
      }

      // Calculate stage segment for the API call
      const stageSeg = selectedDefense === "all" ? "" : selectedDefense;

      const levelSeg = degreeTab === "MSc" ? "msc" : "phd";

      const url = `${baseUrl}/student/${levelSeg}/${encodeURIComponent(
        departmentNameLocal
      )}/${encodeURIComponent(
        selectedSession
      )}?page=${page}&limit=${itemsPerPage}${
        stageSeg ? `&stage=${encodeURIComponent(stageSeg)}` : ""
      }${debouncedSearch ? `&q=${encodeURIComponent(debouncedSearch)}` : ""}`;
 console.log("url", url);
 
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const txt = await res.text();
          console.error("Failed fetching students:", res.status, txt);
          throw new Error(`Failed to fetch students (${res.status})`);
        }

        const json = await res.json();
        if (cancelled) return;
        console.log("Fetched students:", json);

        const dataArr = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json)
          ? json
          : [];
        setStudents(dataArr);

        setTotalStudents(
          typeof json.total === "number" ? json.total : dataArr.length
        );
        if (typeof json.page === "number") setPage(json.page);
        if (typeof json.limit === "number") setItemsPerPage(json.limit);
      } catch (err) {
        console.error("Error loading students:", err);
        if (!cancelled) {
          setStudents([]);
          setTotalStudents(0);
        }
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    };

    fetchStudents();
    return () => {
      cancelled = true;
    };
  }, [
    token,
    user?.department,
    selectedDepartmentForDefense,
    departments,
    isProvost,
    degreeTab,
    selectedSession,
    page,
    itemsPerPage,
    selectedDefense,
    toast,
    isDean,
    debouncedSearch,
  ]);

  const departmentNameToPass = (() => {
    const resolveIdToName = (candidate: string | undefined) => {
      if (!candidate) return "";
      const foundById = departments.find((d) => d._id === candidate);
      if (foundById?.name) return foundById.name;
      const foundByName = departments.find(
        (d) =>
          String(d.name ?? "").toLowerCase() === String(candidate).toLowerCase()
      );
      if (foundByName?.name) return foundByName.name;
      if (typeof candidate === "string" && candidate.trim() !== "")
        return candidate.trim();
      return "";
    };

    const rawSel = selectedDepartmentForDefense;
    if (rawSel && rawSel !== "none") {
      const provostResolved = resolveIdToName(rawSel);
      if (provostResolved) return provostResolved;
    }

    if (user?.department) {
      const hodResolved = resolveIdToName(user.department);
      if (hodResolved) return hodResolved;
    }

    if (Array.isArray(students) && students.length > 0) {
      const sDept = students[0].department;
      if (sDept) {
        const studentResolved = resolveIdToName(sDept);
        if (studentResolved) return studentResolved;
        if (typeof sDept === "string" && sDept.trim() !== "")
          return sDept.trim();
      }
    }

    return "";
  })();

  const handleAssign = async (
    studentId: string,
    supType: "major" | "minor" | "internal_examiner",
    lecturerId: string,
    lecturerName: string
  ) => {
    const student = students.find((s) => s._id === studentId);
    const matricNo = student?.matricNo ?? studentId;

    setStudents((prev) =>
      prev.map((s) =>
        s._id === studentId
          ? {
              ...s,
              [supType]: { staffId: lecturerId, staffName: lecturerName },
            }
          : s
      )
    );

    try {
      const res = await fetch(
        `${baseUrl}/student/assignSupervisor/${encodeURIComponent(studentId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            type: supType,
            staffId: lecturerId,
            staffName: lecturerName,
            matNo: matricNo,
          }),
        }
      );
      if (res.ok) {
        toast({
          title: "Supervisor assigned",
          description: `Supervisor assigned successfully to ${matricNo}.`,
          variant: "default",
        });
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to assign supervisor (${res.status}): ${text}`);
      }
    } catch (err) {
      console.error("Error assigning supervisor:", err);
    }
  };

  const handleAssignCollegeRep = async (lecturerId: string) => {
    if (!lecturerId) return;
    if (!currentStudentId) {
      toast({
        title: "No student selected",
        description: "Please select a student before assigning.",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = `${baseUrl}/student/assign-college-rep/${encodeURIComponent(
        lecturerId
      )}/${encodeURIComponent(currentStudentId)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Assign failed (${res.status})`);
      }

      setStudents((prev) =>
        prev.map((s) =>
          s._id === currentStudentId
            ? { ...s, collegeRep: { staffId: lecturerId } }
            : s
        )
      );

      toast({
        title: "Assigned",
        description: "College representative assigned successfully.",
        variant: "default",
      });
    } catch (err: any) {
      console.error("handleAssignCollegeRep error:", err);
      toast({
        title: "Assign failed",
        description: err?.message ?? "Could not assign college representative.",
        variant: "destructive",
      });
    } finally {
      setAssignCollegeRepOpen(false);
    }
  };





  const filteredStudents = useMemo(() => {
    let result = students;

    // First filter by stage if not "all"
    if (selectedDefense !== "all") {
      result = result.filter((s) => s.currentStage === selectedDefense);
    }

    // Then filter by search term if provided
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      result = result.filter((s) => {
        const fullName = `${s.user?.firstName ?? ""} ${s.user?.lastName ?? ""}`.toLowerCase();
        const matric = (s.matricNo ?? "").toLowerCase();
        const topic = (s.projectTopic ?? "").toLowerCase();
        const dept = (s.department ?? "").toLowerCase();
        const faculty = (s.faculty ?? "").toLowerCase();

        return (
          fullName.includes(term) ||
          matric.includes(term) ||
          topic.includes(term) ||
          dept.includes(term) ||
          faculty.includes(term)
        );
      });
    }

    return result;
  }, [students, search, selectedDefense]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      (search.trim() || selectedDefense !== "all"
        ? filteredStudents.length
        : totalStudents) / itemsPerPage
    )
  );

  const paginated =
    search.trim() || selectedDefense !== "all"
      ? filteredStudents.slice((page - 1) * itemsPerPage, page * itemsPerPage)
      : students;

  const closeDefenseModal = () => {
    setDefenseModalOpen(false);
    setSelectedDepartmentForDefense("");
  };

 const getStageScore = (
  s: StudentFromAPI
): { value: number; label: string } => {
  // normalize stage: "proposal_defense" -> "proposal defense"
  const rawStage = String(s.currentStage ?? "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();

  // safe reader for numeric keys
  const read = (k?: string) => {
    if (!k) return 0;
    const v = (s.stageScores ?? {})[k];
    return typeof v === "number" && !isNaN(v) ? Math.round(v) : 0;
  };

  // ordered, specific mappings (most specific first)
  if (/\bproposal defense\b/.test(rawStage) || /\bproposal defense\b/.test(rawStage)) {
    if ("firstSeminarScore" in (s.stageScores ?? {})) {
      return { value: read("firstSeminarScore"), label: "Proposal Defense" };
    }
    if ("proposalScore" in (s.stageScores ?? {})) {
      return { value: read("proposalScore"), label: "Proposal" };
    }
  }

  if (/\bproposal\b/.test(rawStage)) {
    if ("proposalScore" in (s.stageScores ?? {})) {
      return { value: read("proposalScore"), label: "Proposal" };
    }
    if ("firstSeminarScore" in (s.stageScores ?? {})) {
      // fallback if backend uses firstSeminarScore for proposal
      return { value: read("firstSeminarScore"), label: "Proposal Defense" };
    }
  }

  if (/\b2nd seminar\b|\bsecond seminar\b|\b2nd\b|\bsecond\b/.test(rawStage)) {
    if ("secondSeminarScore" in (s.stageScores ?? {})) {
      return { value: read("secondSeminarScore"), label: "2nd Seminar" };
    }
  }

  if (/\b3rd seminar\b|\bthird seminar\b|\b3rd\b|\bthird\b/.test(rawStage)) {
    if ("thirdSeminarScore" in (s.stageScores ?? {})) {
      return { value: read("thirdSeminarScore"), label: "3rd Seminar" };
    }
  }

  if (/\binternal\b/.test(rawStage)) {
    if ("internalScore" in (s.stageScores ?? {})) {
      return { value: read("internalScore"), label: "Internal" };
    }
  }

  if (/\bexternal\b/.test(rawStage)) {
    if ("externalDefenseScore" in (s.stageScores ?? {})) {
      return { value: read("externalDefenseScore"), label: "External Defense" };
    }
    if ("externalScore" in (s.stageScores ?? {})) {
      return { value: read("externalScore"), label: "External" };
    }
  }

  // prefer common keys if stage text didn't match
  const prefer = [
    "firstSeminarScore",
    "proposalScore",
    "internalScore",
    "externalScore",
    "externalDefenseScore",
    "secondSeminarScore",
    "thirdSeminarScore",
  ];
  for (const k of prefer) {
    if (k in (s.stageScores ?? {})) {
      const label =
        k === "firstSeminarScore"
          ? "Proposal Defense"
          : k === "proposalScore"
          ? "Proposal"
          : k === "internalScore"
          ? "Internal"
          : k === "externalScore"
          ? "External"
          : k === "externalDefenseScore"
          ? "External Defense"
          : k === "secondSeminarScore"
          ? "2nd Seminar"
          : k === "thirdSeminarScore"
          ? "3rd Seminar"
          : "Score";
      return { value: read(k), label };
    }
  }

  // final fallback: first numeric key found
  const firstNumericKey = Object.entries(s.stageScores ?? {}).find(
    ([, v]) => typeof v === "number" && !isNaN(v)
  )?.[0];
  if (firstNumericKey) {
    const prettyLabel = firstNumericKey
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .trim();
    return { value: read(firstNumericKey), label: prettyLabel || "Score" };
  }

  // nothing available
  return { value: 0, label: "Score" };
};

  const defenseStudentIds = useMemo(() => {
    if (!Array.isArray(students) || !selectedDefense || selectedDefense === "all") return [];
    return students
      .filter((s) => String(s.currentStage) === String(selectedDefense))
      .map((s) => s._id ?? (s as any).id)
      .filter(Boolean) as string[];
  }, [students, selectedDefense]);

  

  return (
    <div className="space-y-6">
      {/* Top header: degree tabs + title + Create button */}
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
            {degreeTab} Ready for {displayStageLabel}
          </h2>
        </div>


      </div>

      {/* Card containing filters + table */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        {/* Filters grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
          <div className={isProvost ? "md:col-span-1" : "md:col-span-1"}>
            <Label className="text-sm text-gray-600">Search</Label>
            <div className="relative">
              <Input
                placeholder={
                  isProvost
                    ? "Search Mat. No, Name, Topic or Stage"
                    : "Search Mat. No, Name or Topic"
                }
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

        {/* Provost-only second row filters (faculty & department) */}
        {isProvost && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Faculty</Label>
              <Select
                value={selectedFacultyId}
                onValueChange={setSelectedFacultyId}
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
                    <SelectItem value="none" disabled>Loading faculties...</SelectItem>
                  ) : facultiesError ? (
                    <SelectItem value="none" disabled>{facultiesError}</SelectItem>
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
                value={selectedDepartmentForDefense}
                onValueChange={setSelectedDepartmentForDefense}
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
                    <SelectItem value="none" disabled>Loading departments...</SelectItem>
                  ) : departmentsError ? (
                    <SelectItem value="none" disabled>{departmentsError}</SelectItem>
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
        )}

        {isDean && (
          <div className="mt-4">
            <Label className="text-sm text-gray-600">Department</Label>
            <Select
              value={selectedDepartmentForDefense}
              onValueChange={setSelectedDepartmentForDefense}
              disabled={
                departmentsLoading ||
                departments.length === 0 ||
                Boolean(user?.department && departments.length === 1)
              } // optional: disable if single assigned dept
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    departmentsLoading
                      ? "Loading departments..."
                      : departments.length
                      ? "Select Department"
                      : "No departments"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {departmentsLoading ? (
                  <SelectItem value="none" disabled>Loading departments...</SelectItem>
                ) : departmentsError ? (
                  <SelectItem value="none" disabled>{departmentsError}</SelectItem>
                ) : departments.length ? (
                  departments.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No departments</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Schedule buttons row */}
        <div className="mt-4 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            {(isHod || isPgc) && selectedDefense !== "all" && selectedDefense !== START_KEY && selectedDefense !== COMPLETED_KEY && (
              <Button
                className="bg-amber-700 hover:bg-amber-800 text-white"
                onClick={() => {
                  setDefenseStage(selectedDefense);
                  setDefenseModalOpen(true);
                }}
              >
                Schedule {selectedDefenseLabel}
              </Button>
            )}
          </div>
        </div>

        {/* Students Table */}
        <div className="mt-6 overflow-x-auto">
          {studentsLoading ? (
            <div className="py-10">
              <LoadingSpinner text="Loading students..." />
            </div>
          ) : (
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                {isProvost ? (
                  <>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Matric No
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Full Name
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Project Topic
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Current Stage
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Department
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Faculty
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Assign
                    </th>
                  </>
                ) : isDean ? (
                  <>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Matric No
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Full Name
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Project Topic
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Current Stage
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Department
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Faculty
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Assign
                    </th>
                  </>
                ) : (
                  <>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      MAT NO.
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Full Name
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Topic
                    </th>
                    {!isPgc && (
                      <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                        Score for {selectedDefenseLabel}
                      </th>
                    )}
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      1st Supervisor
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      2nd Supervisor
                    </th>
                    <th className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                      Assign
                    </th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {paginated.map((s, idx) => {
                const rowBg = idx % 2 === 0 ? "bg-white" : "bg-amber-50";
                const { value: score } = getStageScore(s);
                if (isProvost || isDean) {
                  return (
                    <tr key={s._id} className={rowBg}>
                      <td className="p-2 sm:p-4 border-t text-xs sm:text-sm">{s.matricNo}</td>
                      <td className="p-2 sm:p-4 border-t">
                        <button
                          title="View student"
                          className="text-amber-700 underline capitalize text-xs sm:text-sm"
                          onClick={() => {
                            setViewStudentId(s._id);
                            setViewModalOpen(true);
                          }}
                        >
                          {s.user
                            ? `${s.user.firstName} ${s.user.lastName}`
                            : ""}
                        </button>
                      </td>
                      <td className="p-2 sm:p-4 border-t text-xs sm:text-sm">{s.projectTopic}</td>
                      <td className="p-2 sm:p-4 border-t text-xs sm:text-sm">
                        {getLabelFromKey(s.currentStage, defenseOptions)}
                      </td>
                      <td className="p-2 sm:p-4 border-t text-xs sm:text-sm">{s.department}</td>
                      <td className="p-2 sm:p-4 border-t text-xs sm:text-sm">{s.faculty}</td>
                      {(isProvost || isDean) && (
                        <td className="p-2 sm:p-4 border-t">
                          <Button
                            size="sm"
                            className="bg-amber-700 text-white rounded-md px-2 py-1 text-xs sm:px-4 sm:text-sm"
                            onClick={() => {
                              setCurrentStudentId(s._id);
                              setAssignCollegeRepOpen(true);
                            }}
                          >
                            Assign
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                }

                return (
                  <tr key={s._id} className={rowBg}>
                    <td className="p-2 sm:p-4 border-t text-xs sm:text-sm">{s.matricNo}</td>
                    <td className="p-2 sm:p-4 border-t">
                      {isPgc ? (
                        <button
                          title="Edit student"
                          className="text-amber-700 underline capitalize text-xs sm:text-sm"
                          onClick={() => {
                            setCurrentStudentId(s._id);
                            setEditModalOpen(true);
                          }}
                        >
                          {s.user
                            ? `${s.user.firstName} ${s.user.lastName}`
                            : ""}
                        </button>
                      ) : s.user ? (
                        <button
                          title="View student"
                          className="text-amber-700 underline capitalize text-xs sm:text-sm"
                          onClick={() => {
                            setViewStudentId(s._id);
                            setViewModalOpen(true);
                          }}
                        >
                          {s.user
                            ? `${s.user.firstName} ${s.user.lastName}`
                            : ""}
                        </button>
                      ) : (
                        ""
                      )}
                    </td>

                    <td className="p-2 sm:p-4 border-t capitalize text-xs sm:text-sm">
                      {s.projectTopic}
                    </td>
                    {!isPgc && (
                      <td className="p-2 sm:p-4 border-t text-xs sm:text-sm">{score ?? "—"}</td>
                    )}
                    <td className="p-2 sm:p-4 border-t text-xs sm:text-sm">
                      {s.majorSupervisor || "Not Assigned"}
                    </td>
                    <td className="p-2 sm:p-4 border-t text-xs sm:text-sm">
                      {s.minorSupervisor || "Not Assigned"}
                    </td>

                    <td className="p-2 sm:p-4 border-t">
                      <Button
                        size="sm"
                        className="bg-amber-700 text-white rounded-md px-2 py-1 text-xs sm:px-4 sm:text-sm"
                        onClick={() => {
                          setCurrentStudentId(s._id);
                          setAssignModalOpen(true);
                        }}
                      >
                        Assign
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={isProvost || isDean ? 7 : (isPgc ? 6 : 7)}
                    className="text-center p-8 text-gray-500"
                  >
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-2 border rounded hover:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
          >
            <ChevronLeft />
          </button>
          <span className="text-sm text-gray-600">
            Showing page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="p-2 border rounded hover:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Modals */}
      <AssignSupervisorModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        studentId={currentStudentId}
        onSubmit={handleAssign}
      />

      <AssignCollegeRepModal
        isOpen={assignCollegeRepOpen}
        onClose={() => setAssignCollegeRepOpen(false)}
        studentId={currentStudentId}
        onAssigned={handleAssignCollegeRep}
      />

      <SetDefenseModal
        isOpen={defenseModalOpen}
        onClose={closeDefenseModal}
        defenseStage={defenseStage}
        defenseLabel={selectedDefenseLabel}
        studentIds={defenseStudentIds}
        program={degreeTab}
        session={selectedSession}
        baseUrl={baseUrl}
        department={departmentNameToPass}
        onScheduled={(resp) => {
          console.log("schedule created:", resp);
        }}
      />

      <EditStudentModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        studentId={currentStudentId}
        baseUrl={baseUrl}
        onUpdated={(updated) =>
          setStudents((prev) =>
            prev.map((p) =>
              p._id === (updated._id ?? currentStudentId)
                ? { ...p, ...updated }
                : p
            )
          )
        }
      />

      <ProvostViewStudentModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        studentId={viewStudentId ?? ""}
        baseUrl={import.meta.env.VITE_BACKEND_URL}
        watermarkUrl={waterMark}
      />


    </div>
  );
};

export default StudentSessionManagement;
