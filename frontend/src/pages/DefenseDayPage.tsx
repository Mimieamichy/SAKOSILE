// DefenseDayPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { Role } from "@/config/roles";
import { Button } from "@/components/ui/button";
import ScoreSheetPanel from "./ScoreSheetDefense";
import StudentsPanel from "./StudentsPanel";
import AssessmentPanel from "./AssessmentPanel";
import StudentCommentModal from "./StudentCommentModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";

type Level = "MSC" | "PHD";

// --- add after imports ---
const STAGE_LABELS: Record<string, string> = {
  // generic map — keep keys normalized (lowercase, spaces)
  start: "Start",
  proposal: "Proposal",
  "proposal defense": "Proposal Defense",
  "internal defense": "Internal Defense",
  internal: "Internal Defense",
  "external defense": "External Defense",
  external: "External Defense",
  "2nd seminar": "2nd Seminar",
  "second seminar": "2nd Seminar",
  "3rd seminar": "3rd Seminar",
  "third seminar": "3rd Seminar",
  "first seminar": "Proposal Defense", // helpful alias
  firstseminar: "Proposal Defense",
};

function formatStage(raw?: string | null, _level?: "MSC" | "PHD") {
  if (!raw) return "Unknown";
  const key = String(raw)
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // direct lookup
  if (STAGE_LABELS[key]) return STAGE_LABELS[key];

  // fuzzy: if the raw contains a known token
  const found = Object.keys(STAGE_LABELS).find((k) => key.includes(k));
  if (found) return STAGE_LABELS[found];

  // fallback: title-case the normalized key
  return key
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

interface Criterion {
  title: string;
  percentage: number;
}

interface Student {
  id: string;
  name: string;
  matNo: string;
  topic: string;
  fileUrl: string;
  currentStage: string;
  comments: { by: string; text: string }[];
  scores: Record<string, number | null>;
  approved?: boolean;
  defenceMarked?: boolean;
}

interface DefenseDay {
  id: string;
  title: string;
  date: string; // ISO string
  durationMinutes: string;
  level: Level;
  sessionActive?: boolean;
  students: Student[];
  currentStage: string;
  criteria?: Criterion[];
  time?: string;
  defenceMarked?: boolean;
}

const baseUrl = import.meta.env.VITE_BACKEND_URL ?? "";

export default function DefenseDayPage() {
  const { user, token, hasRole } = useAuthStore();
  const { toast } = useToast();
  const userName = user?.userName;

  // state for the confirm dialog
  const [confirmingSession, setConfirmingSession] = useState<{
    defenseId: string;
    action: "start" | "end";
    title?: string;
  } | null>(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);

  const isPanel = React.useMemo(
    () =>
      hasRole([
        "panel_member",
        "internal_examiner",
        "supervisor",
        "major_supervisor",
        "provost",
        "faculty_pg_rep",
      ]),
    [hasRole]
  );

  const isHodOrProvost = React.useMemo(
    () => hasRole(["hod", "provost"]),
    [hasRole]
  );


  console.log("isHodOrProvost", isHodOrProvost);

  // --- hooks (always declared, never conditional) ---
  const [defenseCache, setDefenseCache] = useState<Record<Level, DefenseDay[]>>(
    {
      MSC: [],
      PHD: [],
    }
  );
  const [defenseDays, setDefenseDays] = useState<DefenseDay[]>([]);
  const [activeDefenseIdx, setActiveDefenseIdx] = useState(0);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [level, setLevel] = useState<Level>("MSC"); // controls which level to fetch
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "students" | "scores" | "assessment"
  >("students");

  const [selectedStudent, setSelectedStudent] = useState<{
    student: Student;
    defenseId: string;
  } | null>(null);
  const [toggling, setToggling] = useState(false);
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>(
    {}
  );

  // ------- helpers to map API shapes to our UI model -------
  const mapRawStudent = (s: any, fallbackStage = ""): Student => {
    const sid = s?.id ?? s?._id ?? s?.studentId ?? s?.matricId ?? "s_unknown";
    const name =
      s?.name ??
      (s?.user
        ? `${s.user.firstName ?? ""} ${s.user.lastName ?? ""}`.trim()
        : "") ??
      s?.fullName ??
      "";
    const matNo = s?.matricNo ?? s?.matNo ?? s?.registration ?? s?.regNo ?? "";
    const topic =
      s?.projectTopic ?? s?.topic ?? s?.title ?? s?.researchTopic ?? "";
    const fileUrl = s?.latestFile ?? s?.fileUrl ?? s?.file ?? "";
    const currentStageStudent =
      s?.currentStage ?? s?.stage ?? s?.status ?? fallbackStage ?? "";
    const comments = Array.isArray(s?.comments) ? s.comments : [];
    const scores = s?.scores ?? s?.stageScores ?? {};
    const approved = Boolean(s?.approved ?? s?.isApproved ?? false);
    return {
      id: String(sid),
      name: String(name),
      matNo: String(matNo),
      topic: String(topic),
      fileUrl: String(fileUrl),
      currentStage: String(currentStageStudent),
      comments,
      scores,
      approved,
    };
  };

  const mapDefenseFromDefenceObj = (def: any, extraData?: any): DefenseDay => {
    const id = def?._id ?? def?.id ?? "unknown";
    const title = def?.title ?? def?.name ?? def?.label ?? `Defense ${id}`;
    const time = def?.time;
    const date = new Date(def?.date).toISOString().split("T")[0];
    const durationMinutes = def?.time;
    const levelRaw = (def?.program ??
      def?.level ??
      def?.levelName ??
      "MSC") as string;
    const levelMapped: Level = String(levelRaw).toUpperCase().includes("PHD")
      ? "PHD"
      : "MSC";
    const sessionActive = Boolean(
      def?.started ??
        def?.sessionActive ??
        def?.active ??
        def?.isActive ??
        false
    );
    const currentStage =
      def?.stage ?? def?.currentStage ?? def?.defenseStage ?? "";

    const defLevelMarked =
      def?.defenceMarked === true ||
      String(def?.defenceMarked).toLowerCase() === "true";

    // students: try def.students first, then extraData.students
    const rawStudents = Array.isArray(def?.students)
      ? def.students
      : Array.isArray(extraData?.students)
      ? extraData.students
      : [];
    const students = (rawStudents as any[]).map((s) =>
      mapRawStudent(s, currentStage)
    );

    // criteria: from extraData.criteria or extraData.data.criteria or def.criteria
    const rawCriteria =
      extraData?.criteria ??
      extraData?.data?.criteria ??
      def?.criteria ??
      extraData?.criteria?.criteria ??
      null;

    const criteriaMapped: Criterion[] = Array.isArray(rawCriteria)
      ? rawCriteria.map((c: any) => ({
          title: String(c?.name ?? c?.title ?? ""),
          percentage: Number(c?.weight ?? c?.percentage ?? 0),
        }))
      : Array.isArray(extraData?.criteria?.criteria)
      ? extraData.criteria.criteria.map((c: any) => ({
          title: String(c?.name ?? c?.title ?? ""),
          percentage: Number(c?.weight ?? c?.percentage ?? 0),
        }))
      : [];

    return {
      id: String(id),
      title: String(title),
      date: String(date),
      durationMinutes: String(durationMinutes),
      level: levelMapped,
      sessionActive: Boolean(sessionActive),
      students,
      currentStage: String(currentStage),
      defenceMarked: defLevelMarked,
      criteria: criteriaMapped.length ? criteriaMapped : undefined,
      time: String(time),
    };
  };

  const formatHoursCountdown = (ms: number) => {
    if (ms <= 0) return "0h";
    const totalHours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${totalHours}h ${minutes}m`;
  };

  const getCountdownFor = (def: DefenseDay) => {
    // Combine date + time into ISO string
    const dateTimeString = `${def.date}T${def.time}:00`;
    // Example: "2025-10-12T09:00:00"

    const start = new Date(dateTimeString).getTime();
    return Math.max(0, start - Date.now()); // milliseconds until start
  };

  const fetchIdsAndDetails = useCallback(async (isCancelled = () => false) => {
    let isStillLoading = true;
    setLoading(true);
    setError(null);

    // Set a timeout for error handling
    const timeoutId = setTimeout(() => {
      if (isStillLoading && !isCancelled()) {
        setError(
          "Fetching defense details is taking longer than expected. Please check your connection."
        );
        setLoading(false);
      }
    }, 15000); // 15 seconds timeout

    try {
      const recentUrl = `${baseUrl}/defence/panel-member/${encodeURIComponent(
        level
      )}`;
      console.log(
        `[DefenseDayPage] GET /defence/panel-member -> ${recentUrl}`
      );
      const resRecent = await fetch(recentUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!resRecent.ok) {
        // Handle 400 or 404 as "no defenses" if the body is empty or suggests it
        if (resRecent.status === 400 || resRecent.status === 404) {
          console.warn(`[DefenseDayPage] ${resRecent.status} received for level ${level}. Treating as empty list.`);
          setDefenseDays([]);
          setDefenseCache(prev => ({ ...prev, [level]: [] }));
          return;
        }
        throw new Error(`Failed to fetch defense list: ${resRecent.status}`);
      }

      const textRecent = await resRecent.text();
      console.log(
        "[DefenseDayPage] /defence/recent status:",
        resRecent.status
      );

      console.log("[DefenseDayPage] /defence/recent raw text:", textRecent);

      let parsedRecent: any = null;
      try {
        parsedRecent = textRecent ? JSON.parse(textRecent) : null;
      } catch {
        parsedRecent = textRecent;
      }
      console.log("[DefenseDayPage] /defence/recent parsed:", parsedRecent);

      if (isCancelled()) return;

      // robust extraction of ids:
      let ids: string[] = [];
      if (!parsedRecent) {
        ids = [];
      } else if (Array.isArray(parsedRecent)) {
        if (
          parsedRecent.every(
            (it) => typeof it === "string" || typeof it === "number"
          )
        ) {
          ids = parsedRecent.map(String);
        } else {
          ids = parsedRecent
            .map(
              (it: any) =>
                it?.id ?? it?._id ?? it?.defenceId ?? it?.defenseId ?? null
            )
            .filter(Boolean)
            .map(String);
        }
      } else if (typeof parsedRecent === "object") {
        // single-object case like: { _id: "68d5b548...", department: "Computer Science" }
        if (
          parsedRecent._id ||
          parsedRecent.id ||
          parsedRecent.defenceId ||
          parsedRecent.defenseId
        ) {
          ids = [
            String(
              parsedRecent._id ??
                parsedRecent.id ??
                parsedRecent.defenceId ??
                parsedRecent.defenseId
            ),
          ];
        } else {
          const cand =
            parsedRecent?.data ??
            parsedRecent?.ids ??
            parsedRecent?.defenseIds ??
            parsedRecent?.result ??
            parsedRecent?.items ??
            null;

          if (Array.isArray(cand)) {
            if (
              cand.every(
                (it: any) => typeof it === "string" || typeof it === "number"
              )
            ) {
              ids = cand.map(String);
            } else {
              ids = cand
                .map(
                  (it: any) =>
                    it?.id ??
                    it?._id ??
                    it?.defenceId ??
                    it?.defenseId ??
                    null
                )
                .filter(Boolean)
                .map(String);
            }
          } else {
            const maybeArray = Object.values(parsedRecent).find((v: any) =>
              Array.isArray(v)
            );
            if (Array.isArray(maybeArray)) {
              ids = maybeArray
                .map((it: any) =>
                  typeof it === "string" || typeof it === "number"
                    ? String(it)
                    : it?.id ?? it?._id ?? null
                )
                .filter(Boolean);
            }
          }
        }
      }

      console.log("[DefenseDayPage] extracted defence IDs:", ids);

      if (isCancelled()) return;

      if (!ids || ids.length === 0) {
        console.warn(
          "[DefenseDayPage] no defence IDs returned for level",
          level
        );
        setDefenseDays([]);
        setDefenseCache(prev => ({ ...prev, [level]: [] }));
        return;
      }

      // fetch details for each id in parallel
      const fetchDetailForId = async (did: string) => {
        try {
          const dUrl = `${baseUrl}/defence/${encodeURIComponent(did)}`;
          console.log(`[DefenseDayPage] GET /defence/${did} -> ${dUrl}`);
          const res = await fetch(dUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });

          const text = await res.text();
          console.log(`[DefenseDayPage] /defence/${did} raw text:`, text);

          let parsed: any = null;
          try {
            parsed = text ? JSON.parse(text) : null;
          } catch {
            parsed = text;
          }
          console.log(`[DefenseDayPage] /defence/${did} parsed:`, parsed);

          // API returns { success: true, data: { defence, students, criteria } }
          const defObj =
            parsed?.data?.defence ??
            parsed?.defence ??
            parsed?.data ??
            parsed;
          const extra = parsed?.data ?? parsed;
          // map using the defence object and extra data (students + criteria)
          const mapped = mapDefenseFromDefenceObj(defObj, extra);
          return mapped;
        } catch (err) {
          console.error(
            `[DefenseDayPage] failed to fetch details for ${did}:`,
            err
          );
          return null;
        }
      };

      const detailPromises = ids.map((id) => fetchDetailForId(id));
      const results = await Promise.all(detailPromises);
      const normalizedDefs = results.filter(Boolean) as DefenseDay[];

      if (isCancelled()) return;

      if (normalizedDefs.length === 0) {
        console.warn(
          "[DefenseDayPage] could not normalize any defence details for ids:",
          ids
        );
        setDefenseDays([]);
        setDefenseCache(prev => ({ ...prev, [level]: [] }));
        return;
      }

      // update cache for this level and immediately show
      setDefenseCache((prev) => {
        const next = { ...prev, [level]: normalizedDefs };
        return next;
      });
      setDefenseDays(normalizedDefs);
      setActiveDefenseIdx(0);

      // seed criteria from first defense if available
      if (normalizedDefs[0]?.criteria) {
        setCriteria(normalizedDefs[0].criteria ?? []);
      } else {
        setCriteria([]);
      }

      console.log(
        "[DefenseDayPage] normalized defenseDays for level",
        level,
        normalizedDefs
      );
    } catch (err: any) {
      console.error(
        "[DefenseDayPage] error fetching recent ids or details:",
        err
      );
      if (!isCancelled()) {
        setError(err.message || "Failed to load defense details. Please try again.");
      }
    } finally {
      isStillLoading = false;
      if (!isCancelled()) {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    }
  }, [level, token, baseUrl]);

  useEffect(() => {
    let cancelled = false;

    // Immediately show cached data for this level if we have it
    setDefenseDays(defenseCache[level] ?? []);
    setActiveDefenseIdx(0);
    if (
      (defenseCache[level] ?? []).length > 0 &&
      (defenseCache[level] ?? [])[0].criteria
    ) {
      setCriteria((defenseCache[level] ?? [])[0].criteria ?? []);
    } else {
      setCriteria([]);
    }

    if (!token || !isPanel) {
      return;
    }

    fetchIdsAndDetails(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [level, token, isPanel, fetchIdsAndDetails]);

  if (!isPanel) {
    return (
      <div className="p-6 text-center text-red-600">
        <div className="text-lg font-semibold">
          Only panel members can access this page.
        </div>
        <p className="text-sm mt-1">
          If you believe this is an error, refresh to pick up any updated
          permissions.
        </p>
        <div className="mt-4">
          <Button
            onClick={() => window.location.reload()}
            className="bg-amber-700 text-white"
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  // --- UI helpers & actions ---
  const activeDefense = defenseDays[activeDefenseIdx];

  const updateStudentNested = (
    defenseId: string,
    studentId: string,
    updater: (s: Student) => Student
  ) => {
    setDefenseCache((prev) => {
      const updatedCache = { ...prev };
      const list = (updatedCache[level] ?? []).map((d) =>
        d.id !== defenseId
          ? d
          : {
              ...d,
              students: d.students.map((s) =>
                s.id === studentId ? updater(s) : s
              ),
            }
      );
      updatedCache[level] = list;
      setDefenseDays(list);
      return updatedCache;
    });
  };

  // open the confirm dialog (no network call here)
  const handleToggleSession = (defenseId: string) => {
    const def = defenseDays.find((d) => d.id === defenseId);
    if (!def) return;
    if (toggling) return; // global throttle
    const currentlyActive = !!def.sessionActive;
    const action = currentlyActive ? "end" : "start";
    setConfirmingSession({ defenseId, action, title: def.title });
  };

  // called when user confirms in the dialog
  const performToggleSession = async () => {
    if (!confirmingSession) return;
    const { defenseId, action } = confirmingSession;

    setConfirmProcessing(true);
    setToggling(true); // reuse existing toggling flag
    try {
      const url = `${baseUrl}/defence/${action}/${encodeURIComponent(
        defenseId
      )}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        let errText = `Failed to ${action} session (${res.status})`;
        try {
          const j = await res.json();
          if (j?.message) errText = j.message;
        } catch {}
        throw new Error(errText);
      }

      // update cache + UI (toggle sessionActive)
      setDefenseCache((prev) => {
        const updated = { ...prev };
        updated[level] = (updated[level] ?? []).map((d) =>
          d.id === defenseId
            ? { ...d, sessionActive: !(d.sessionActive ?? false) }
            : d
        );
        setDefenseDays(updated[level] ?? []);
        return updated;
      });

      toast({
        title: `Session ${action === "start" ? "Started" : "Ended"}`,
        description: `The defense session has been ${
          action === "start" ? "started" : "ended"
        } successfully.`,
        variant: "default",
      });

      // close the dialog
      setConfirmingSession(null);
    } catch (err: any) {
      console.error("Failed to toggle session:", err);
      toast({
        title: "Session Toggle Failed",
        description: err?.message ?? "Network error while toggling session.",
        variant: "destructive",
      });
    } finally {
      setConfirmProcessing(false);
      setToggling(false);
    }
  };

  const handleScoreChange = (
    defenseId: string,
    studentId: string,
    criterion: string,
    value: number
  ) => {
    updateStudentNested(defenseId, studentId, (s) => ({
      ...s,
      scores: { ...s.scores, [criterion]: isNaN(value) ? null : value },
    }));
  };

  const handleAddCommentFromModal = (text: string) => {
    if (!selectedStudent || !text.trim()) return;
    const { defenseId, student } = selectedStudent;
    updateStudentNested(defenseId, student.id, (s) => ({
      ...s,
      comments: [...s.comments, { by: userName, text: text.trim() }],
    }));
    setSelectedStudent((prev) =>
      prev
        ? {
            defenseId: prev.defenseId,
            student: {
              ...prev.student,
              comments: [
                ...prev.student.comments,
                { by: userName, text: text.trim() },
              ],
            },
          }
        : null
    );
  };

  // replace or add these handlers in DefenseDayPage.tsx

  const setProcessing = (studentId: string, v: boolean) =>
    setProcessingIds((p) => ({ ...p, [studentId]: v }));

  const handleApprove = async (studentId: string) => {
    if (!studentId) return;
    setProcessing(studentId, true);
    try {
      const url = `${baseUrl}/defence/approve/${encodeURIComponent(studentId)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        let txt = await res.text().catch(() => "");
        try {
          const parsed = txt ? JSON.parse(txt) : null;
          txt = parsed?.message ?? parsed?.error ?? txt;
        } catch {}
        throw new Error(txt || `Server ${res.status}`);
      }

      // update UI cache: mark approved true
      // we don't need to know defenseId here; update all defenses in current level where student exists
      setDefenseCache((prev) => {
        const updated = { ...prev };
        updated[level] = (updated[level] ?? []).map((d) => ({
          ...d,
          students: d.students.map((s) =>
            s.id === studentId ? { ...s, approved: true } : s
          ),
        }));

        setDefenseDays(updated[level] ?? []);
        return updated;
      });

      toast({
        title: "Student approved",
        description: "The student has been approved.",
        variant: "default",
      });
    } catch (err: any) {
      console.error("approve error", err);
      toast({
        title: "Approve failed",
        description: err?.message ?? "Network error while approving student.",
        variant: "destructive",
      });
    } finally {
      setProcessing(studentId, false);
    }
  };

  const handleReject = async (studentId: string) => {
    if (!studentId) return;
    setProcessing(studentId, true);
    try {
      const url = `${baseUrl}/defence/reject/${encodeURIComponent(studentId)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        let txt = await res.text().catch(() => "");
        try {
          const parsed = txt ? JSON.parse(txt) : null;
          txt = parsed?.message ?? parsed?.error ?? txt;
        } catch {}
        throw new Error(txt || `Server ${res.status}`);
      }

      // update UI cache: mark approved false (rejected)
      setDefenseCache((prev) => {
        const updated = { ...prev };
        updated[level] = (updated[level] ?? []).map((d) => ({
          ...d,
          students: d.students.map((s) =>
            s.id === studentId ? { ...s, approved: false } : s
          ),
        }));
        setDefenseDays(updated[level] ?? []);
        return updated;
      });

      toast({
        title: "Student rejected",
        description: "The student has been rejected.",
        variant: "default",
      });
    } catch (err: any) {
      console.error("reject error", err);
      toast({
        title: "Reject failed",
        description: err?.message ?? "Network error while rejecting student.",
        variant: "destructive",
      });
    } finally {
      setProcessing(studentId, false);
    }
  };

  const handleSubmitScores = async (defenseId: string) => {
    if (!defenseId) {
      toast({
        title: "No defense selected",
        description: "Cannot submit scores: no defense ID provided.",
        variant: "destructive",
      });
      return;
    }

    const def = defenseDays.find((d) => d.id === defenseId);
    if (!def) {
      toast({
        title: "Defense not found",
        description: "Could not find the selected defense.",
        variant: "destructive",
      });
      return;
    }

    // Only criteria that belong to this defence (use title as key)
    const allowedCriteria = new Set(
      (def.criteria ?? []).map((c) => String(c.title))
    );
    if (allowedCriteria.size === 0) {
      toast({
        title: "No criteria available",
        description:
          "This defense does not have criteria configured — cannot submit scores.",
        variant: "destructive",
      });
      return;
    }

    const panelMemberId = String(user?.id ?? "");
    if (!panelMemberId) {
      toast({
        title: "No panel member id",
        description: "You must be signed in to submit scores.",
        variant: "destructive",
      });
      return;
    }

    // criteria meta to include in each payload (only the criteria for this defense)
    const criteriaForApi = (def.criteria ?? []).map((c) => ({
      title: c.title,
      percentage: c.percentage,
    }));

    // Build per-student payloads: only include scores for allowed criteria
    const payloads = def.students
      .map((s) => {
        const scoresArray: Array<{ criterion: string; score: number }> = [];

        Object.entries(s.scores ?? {}).forEach(([k, v]) => {
          if (!allowedCriteria.has(k)) return;
          const n = Number(v);
          if (v !== null && v !== undefined && !Number.isNaN(n)) {
            scoresArray.push({ criterion: k, score: n });
          }
        });

        if (scoresArray.length === 0) return null;

        return {
          studentId: s.id,
          panelMemberId,
          // only include the criteria for this defense and the scores array
          criteria: criteriaForApi,
          scores: scoresArray,
        };
      })
      .filter(Boolean) as Array<any>;

    if (payloads.length === 0) {
      toast({
        title: "No scores to submit",
        description: "There are no entered scores for this defense's criteria.",
        variant: "destructive",
      });
      return;
    }

    try {
      const results = await Promise.all(
        payloads.map(async (pl) => {
          const url = `${baseUrl}/defence/submit-score/${encodeURIComponent(
            defenseId
          )}`;

          console.log("Submitting score payload:", url, pl);

          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(pl),
          });

          const raw = await res.text().catch(() => "");
          let parsed: any = null;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            parsed = raw;
          }

          console.log("submit result", { status: res.status, parsed, raw });

          if (!res.ok) {
            const msg =
              (parsed && (parsed.message || parsed.error)) ||
              `HTTP ${res.status}`;
            return { ok: false, studentId: pl.studentId, msg };
          }
          return { ok: true, studentId: pl.studentId, data: parsed };
        })
      );

      const failed = results.filter((r) => !r.ok);
      const succeeded = results.filter((r) => r.ok).map((r) => r.studentId);

      // Clear scores for succeeded students only
      if (succeeded.length > 0) {
        succeeded.forEach((studentId) => {
          updateStudentNested(defenseId, studentId, (s) => ({
            ...s,
            scores: {},
          }));
        });
      }

      if (failed.length === 0) {
        toast({
          title: "Scores Submitted",
          description: `Submitted scores for ${results.length} student(s).`,
          variant: "default",
        });
      } else {
        const failSummary = failed
          .map((f) => `${f.studentId}${f.msg ? ` (${f.msg})` : ""}`)
          .slice(0, 6)
          .join(", ");
        toast({
          title: "Partial failure",
          description: `Failed for ${failed.length} student(s): ${failSummary}${
            failed.length > 6 ? ", ..." : ""
          }`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("submit scores error", err);
      toast({
        title: "Submit failed",
        description:
          err?.message || "Network or server error while submitting scores.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 min-h-[60vh] flex flex-col">
      {/* Level toggle */}
      <div className="flex gap-2 items-center justify-end">
        <div className="text-sm text-gray-600 mr-2">Level:</div>
        <div className="flex gap-2">
          <button
            onClick={() => setLevel("MSC")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              level === "MSC"
                ? "bg-amber-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            MSc
          </button>
          <button
            onClick={() => setLevel("PHD")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              level === "PHD"
                ? "bg-amber-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            PhD
          </button>
        </div>
      </div>

      <div className="relative flex-1 flex flex-col min-h-[400px]">
        {/* Loading Overlay - only show as overlay if we have data to show underneath */}
        {loading && defenseDays.length > 0 && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-xl transition-all duration-300 animate-in fade-in">
            <LoadingSpinner size="xl" text="Updating defense details..." />
          </div>
        )}

        {/* Initial Loading State - show if loading and no data yet */}
        {loading && defenseDays.length === 0 && !error && (
          <div className="flex-1 flex items-center justify-center py-20 animate-in fade-in duration-500">
            <LoadingSpinner size="xl" text="Loading defense details..." />
          </div>
        )}

        {/* Error State */}
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4 animate-in fade-in">
            <div className="bg-red-50 p-6 rounded-xl border border-red-100 max-w-md">
            <h3 className="text-red-800 font-semibold text-lg mb-2">Something went wrong</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => {
                setError(null);
                fetchIdsAndDetails();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Try Again
            </Button>
          </div>
          </div>
        ) : (
          /* Main Content or Empty State */
          <div className={cn(
            "flex-1 flex flex-col space-y-6 transition-all duration-500",
            loading && defenseDays.length > 0 ? "opacity-50 pointer-events-none" : "opacity-100"
          )}>
            {defenseDays.length === 0 && !loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-200 animate-in fade-in">
                <p className="text-lg font-medium">No defense days found for {level}.</p>
                <p className="text-sm">Check back later or try a different level.</p>
              </div>
            ) : (
              defenseDays.length > 0 && (
                <>
                  {/* Defence day tabs */}
                  <div className="flex gap-2 items-center overflow-x-auto">
                    {defenseDays.map((d, i) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          setActiveDefenseIdx(i);
                          setActiveTab("students");
                          setCriteria(d.criteria ?? []);
                        }}
                        title={`${d.title ?? `Defense ${i + 1}`} • ${new Date(
                          d.date
                        ).toLocaleString()}`}
                        aria-label={`Defense ${i + 1}`}
                        className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                          i === activeDefenseIdx
                            ? "bg-amber-700 text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {`Defense ${i + 1}`}
                      </button>
                    ))}
                  </div>

                  {/* Active defense header */}
                  {activeDefense && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="bg-white border border-amber-100 rounded-lg p-6 w-full flex sm:flex-1 items-center justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="text-3xl font-extrabold text-gray-900">
                            Defense Day Details
                          </h2>
                          <p className="text-sm text-amber-700/90 mt-1">
                            {activeDefense.date}, {activeDefense.time} | Level:{" "}
                            <strong>{activeDefense.level}</strong> | Defense:{" "}
                            <strong className="capitalize">
                              {formatStage(activeDefense.currentStage, activeDefense.level)}
                            </strong>
                          </p>
                          <p className="text-sm text-gray-700 mt-3">
                            Countdown:{" "}
                            <strong className="text-amber-700">
                              {formatHoursCountdown(getCountdownFor(activeDefense))}
                            </strong>{" "}
                            {activeDefense.sessionActive
                              ? " (Session active)"
                              : " (Not started)"}
                          </p>
                          <p className="text-sm text-gray-700 mt-3">
                            {user?.userName} | Role: {user?.roles?.[0] || "User"}
                          </p>
                        </div>

                        {isHodOrProvost && (
                          <div className="flex-shrink-0">
                            <Button
                              onClick={() => handleToggleSession(activeDefense.id)}
                              disabled={toggling}
                              className={`flex items-center px-4 py-2 rounded-full shadow-sm ${
                                activeDefense.sessionActive
                                  ? "bg-amber-50 border border-amber-100 text-amber-700"
                                  : "bg-amber-700 text-white"
                              }`}
                            >
                              {toggling
                                ? activeDefense.sessionActive
                                  ? "Ending..."
                                  : "Starting..."
                                : activeDefense.sessionActive
                                ? "End Session"
                                : "Start Session"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Secondary controlled tabs */}
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab("students")}
                      className={`px-4 py-2 -mb-px font-medium text-sm ${
                        activeTab === "students"
                          ? "border-b-2 border-amber-700 text-amber-700"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Students
                    </button>
                    <button
                      onClick={() => setActiveTab("scores")}
                      className={`px-4 py-2 -mb-px font-medium text-sm ${
                        activeTab === "scores"
                          ? "border-b-2 border-amber-700 text-amber-700"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Score Sheet
                    </button>
                    {isHodOrProvost && (
                      <button
                        onClick={() => setActiveTab("assessment")}
                        className={`px-4 py-2 -mb-px font-medium text-sm ${
                          activeTab === "assessment"
                            ? "border-b-2 border-amber-700 text-amber-700"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Assessment
                      </button>
                    )}
                  </div>

                  <div>
                    {activeTab === "students" && (
                      <StudentsPanel
                        students={activeDefense?.students ?? []}
                        onOpen={(s) =>
                          setSelectedStudent({
                            student: s,
                            defenseId: activeDefense?.id ?? "",
                          })
                        }
                      />
                    )}

                    {activeTab === "scores" && (
                      <ScoreSheetPanel
                        defense={activeDefense ?? ({} as any)}
                        criteria={activeDefense?.criteria ?? criteria}
                        canScore={isPanel}
                        onScoreChange={(studentId, crit, value) =>
                          handleScoreChange(activeDefense?.id ?? "", studentId, crit, value)
                        }
                        onSubmit={() => handleSubmitScores(activeDefense?.id ?? "")}
                      />
                    )}

                    {activeTab === "assessment" && isHodOrProvost && (
                      <AssessmentPanel
                        students={activeDefense?.students ?? []}
                        criteria={activeDefense?.criteria ?? criteria}
                        onApprove={(studentId) => handleApprove(studentId)}
                        onReject={(studentId) => handleReject(studentId)}
                        processingIds={processingIds}
                        defenseStage={activeDefense?.currentStage}
                        defense={activeDefense ?? ({} as any)}
                        defenseStageLabel={formatStage(
                          activeDefense?.currentStage,
                          activeDefense?.level
                        )}
                      />
                    )}
                  </div>

                  {/* Confirm dialog for starting/ending session */}
                  <Dialog
                    open={!!confirmingSession}
                    onOpenChange={() => {
                      if (!confirmProcessing) setConfirmingSession(null);
                    }}
                  >
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {confirmingSession?.action === "start"
                            ? "Start Defense Session"
                            : "End Defense Session"}
                        </DialogTitle>
                      </DialogHeader>

                      <div className="py-4">
                        <p className="text-sm text-gray-700">
                          {confirmingSession?.action === "start" ? (
                            <>
                              You are about to <strong>start</strong> the session for{" "}
                              <span className="font-medium">
                                {confirmingSession?.title ?? ""}
                              </span>
                              . Panel members will be able to submit scores.
                            </>
                          ) : (
                            <>
                              You are about to <strong>end</strong> the session for{" "}
                              <span className="font-medium">
                                {confirmingSession?.title ?? ""}
                              </span>
                              . Ending will stop further submissions.
                            </>
                          )}
                        </p>
                      </div>

                      <DialogFooter className="flex gap-2 justify-end">
                        <Button
                          onClick={() => {
                            if (confirmProcessing) return;
                            setConfirmingSession(null);
                          }}
                          variant="secondary"
                          className="px-4 py-2"
                        >
                          Cancel
                        </Button>

                        <Button
                          onClick={performToggleSession}
                          disabled={confirmProcessing}
                          className="bg-amber-700 text-white px-4 py-2"
                        >
                          {confirmProcessing
                            ? confirmingSession?.action === "start"
                              ? "Starting..."
                              : "Ending..."
                            : confirmingSession?.action === "start"
                            ? "Start Session"
                            : "End Session"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <StudentCommentModal
                    openItem={selectedStudent}
                    onClose={() => setSelectedStudent(null)}
                    onAddComment={handleAddCommentFromModal}
                    canComment={isPanel}
                    baseUrl={baseUrl}
                    token={token}
                    currentUserName={userName}
                  />
                </>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
