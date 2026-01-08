// src/provost/ProvostActivityLog.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Clock,
  UserCheck,
  Calendar,
  FileText,
  MessageSquareText,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";

type ActivityType =
  | "STAGE_APPROVAL"
  | "DEFENSE_SCHEDULED"
  | "SUPERVISOR_ASSIGNED"
  | "FILE_UPLOADED"
  | "COMMENT_ADDED"
  | string; // allow unknown/custom types

type ActivityLog = {
  id: string;
  type: ActivityType;
  actor: {
    name: string;
    email?: string;
  };
  target: string;
  description: string;
  timestamp: string; // ISO
};

const typeIcons: Record<string, JSX.Element> = {
  STAGE_APPROVAL: <UserCheck className="w-5 h-5 text-amber-700" />,
  DEFENSE_SCHEDULED: <Calendar className="w-5 h-5 text-blue-600" />,
  SUPERVISOR_ASSIGNED: <UserCheck className="w-5 h-5 text-green-600" />,
  FILE_UPLOADED: <FileText className="w-5 h-5 text-purple-600" />,
  COMMENT_ADDED: <MessageSquareText className="w-5 h-5 text-gray-600" />,
  STUDENT_ADDED: <UserCheck className="w-5 h-5 text-cyan-600" />,
};

const baseUrl = import.meta.env.VITE_BACKEND_URL || "";

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Build a searchable string from a raw log object by concatenating likely fields.
 * This makes the client-side fallback able to match actor names, staff IDs, matric numbers,
 * message/content/descriptions, etc.
 */
function buildSearchableString(raw: any): string {
  if (!raw || typeof raw !== "object") return "";

  const parts: string[] = [];

  // actor variants
  if (raw.actorName) parts.push(String(raw.actorName));
  if (raw.actor && typeof raw.actor === "string") parts.push(raw.actor);
  if (raw.actor && typeof raw.actor === "object") {
    if (raw.actor.name) parts.push(String(raw.actor.name));
    if (raw.actor.firstName || raw.actor.lastName)
      parts.push(`${raw.actor.firstName ?? ""} ${raw.actor.lastName ?? ""}`.trim());
    if (raw.actor.staffId) parts.push(String(raw.actor.staffId));
    if (raw.actor.staff_id) parts.push(String(raw.actor.staff_id));
    if (raw.actor.email) parts.push(String(raw.actor.email));
  }

  // student / subject / target variants
  if (raw.studentId) parts.push(String(raw.studentId));
  if (raw.student && typeof raw.student === "object") {
    if (raw.student.matricNo) parts.push(String(raw.student.matricNo));
    if (raw.student.matricNumber) parts.push(String(raw.student.matricNumber));
    if (raw.student.matNo) parts.push(String(raw.student.matNo));
    if (raw.student.studentId) parts.push(String(raw.student.studentId));
    if (raw.student.name) parts.push(String(raw.student.name));
  }
  if (raw.targetName) parts.push(String(raw.targetName));
  if (raw.target) parts.push(String(raw.target));
  if (raw.subject && (raw.subject.name || raw.subject.title))
    parts.push(String(raw.subject.name ?? raw.subject.title));

  // common id fields that backends sometimes use
  if (raw.staffId) parts.push(String(raw.staffId));
  if (raw.matricNo) parts.push(String(raw.matricNo));
  if (raw.matNo) parts.push(String(raw.matNo));
  if (raw.matricNumber) parts.push(String(raw.matricNumber));
  if (raw.studentMatricNo) parts.push(String(raw.studentMatricNo));

  // textual fields
  if (raw.description) parts.push(String(raw.description));
  if (raw.message) parts.push(String(raw.message));
  if (raw.note) parts.push(String(raw.note));
  if (raw.details) parts.push(String(raw.details));
  if (raw.text) parts.push(String(raw.text));
  if (raw.content) parts.push(String(raw.content));
  if (raw.comment) parts.push(String(raw.comment));
  if (raw.comments && Array.isArray(raw.comments))
    parts.push(raw.comments.map((c: any) => (typeof c === "string" ? c : JSON.stringify(c))).join(" "));

  // type and action
  if (raw.type) parts.push(String(raw.type));
  if (raw.eventType) parts.push(String(raw.eventType));
  if (raw.action) parts.push(String(raw.action));

  // finally, flatten and return lowercased string
  return parts.filter(Boolean).join(" ").toLowerCase();
}

const ProvostActivityLog: React.FC = () => {
  const { token } = useAuthStore();
  const { toast } = useToast();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  // search state + debounce
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  // abort controller ref to cancel in-flight requests
  const abortRef = useRef<AbortController | null>(null);

  // defensive mapper: convert various backend shapes into ActivityLog
  const mapRawToLog = useCallback((raw: any): ActivityLog => {
    const id = String(
      raw.id ?? raw._id ?? raw.logId ?? Math.random().toString(36).slice(2)
    );
    // type may be under `type`, `event`, `action`
    let type = (raw.type ?? raw.eventType ?? raw.action ?? "UNKNOWN").toString();
    
    // Heuristic: if message contains "added student", set type to STUDENT_ADDED
    if (raw.message?.toLowerCase().includes("added student")) {
      type = "STUDENT_ADDED";
    }

    // actor extraction
    let actorObj = { name: "Unknown", email: "" };
    if (raw.actor && typeof raw.actor === "object") {
      actorObj = {
        name: (raw.actor.name ?? `${raw.actor.firstName ?? ""} ${raw.actor.lastName ?? ""}`.trim()) || "Unknown",
        email: raw.actor.email ?? ""
      };
    } else if (raw.actor && typeof raw.actor === "string") {
      actorObj = { name: raw.actor, email: "" };
    } else if (raw.actorName) {
      actorObj = { name: raw.actorName, email: "" };
    }

    const target =
      raw.targetName ??
      raw.target ??
      (raw.subject && (raw.subject.name ?? raw.subject.title)) ??
      raw.entity ??
      "";
    const description = raw.description ?? raw.message ?? raw.note ?? raw.details ?? raw.text ?? raw.content ?? "";
    const timestamp = raw.time ?? raw.timestamp ?? raw.createdAt ?? raw.date ?? new Date().toISOString();

    return {
      id,
      type,
      actor: actorObj,
      target: String(target),
      description: String(description),
      timestamp: String(timestamp),
    };
  }, []);

  // loadLogs now accepts optional searchQuery, cancels previous requests,
  // queries backend with q=<searchQuery>, then applies a safe client-side
  // filter (fallback) that matches names, staff IDs, matric IDs inside content/actor.
  const loadLogs = useCallback(
    async (searchQuery?: string) => {
      setLoading(true);

      // abort previous
      try {
        abortRef.current?.abort();
      } catch {
        // ignore
      }

      const controller = new AbortController();
      abortRef.current = controller;
      const signal = controller.signal;

      try {
        const url = new URL(`${baseUrl}/user/activity-logs`);
        if (searchQuery && String(searchQuery).trim()) {
          // primary server query param — change 'q' to your API's param if different
          url.searchParams.set("q", String(searchQuery).trim());
        }

        const res = await fetch(url.toString(), {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Failed to load activity logs (${res.status}) ${text}`);
        }

        const payload = await res.json().catch(() => null);
        console.log("loadLogs payload:", payload);

        // payload may be an array, or { data: [...] }, or { logs: [...] }
        let arr: any[] = [];
        if (Array.isArray(payload)) arr = payload;
        else if (Array.isArray(payload?.data)) arr = payload.data;
        else if (Array.isArray(payload?.logs)) arr = payload.logs;
        else if (Array.isArray(payload?.activity)) arr = payload.activity;
        else if (typeof payload === "object" && payload !== null) {
          // maybe the object itself is a single log
          arr = Object.values(payload).filter(
            (v: any) => v && typeof v === "object" && (v.id || v._id || v.type)
          );
          // fallback: if couldn't collect, treat payload as single
          if (arr.length === 0) arr = [payload];
        }

        // --- CLIENT-SIDE FALLBACK FILTER ---
        // If a search query exists, additionally ensure each raw log contains the query
        // in likely fields (actor name, actor.staffId, student matric no, description, etc.).
        // This helps when the backend doesn't search those specific fields.
        if (searchQuery && String(searchQuery).trim()) {
          const q = String(searchQuery).trim().toLowerCase();
          arr = arr.filter((raw) => {
            const hay = buildSearchableString(raw);
            return hay.includes(q);
          });
        }

        const mapped = arr.map(mapRawToLog).sort((a, b) => {
          // newest first
          const ta = Date.parse(a.timestamp) || 0;
          const tb = Date.parse(b.timestamp) || 0;
          return tb - ta;
        });

        setLogs(mapped);
      } catch (err: any) {
        if (err && err.name === "AbortError") {
          // request was cancelled — ignore
          console.debug("loadLogs aborted");
        } else {
          console.error("loadLogs error:", err);
          toast({
            title: "Error loading activity log",
            description: err?.message ?? "See console for details",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [mapRawToLog, token, toast]
  );

  // initial load and reload when debounced search changes
  useEffect(() => {
    void loadLogs(debouncedSearch || undefined);

    return () => {
      // cleanup on unmount
      abortRef.current?.abort();
    };
  }, [loadLogs, debouncedSearch]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">School-wide Activity Log</h2>
          <p className="text-gray-600 text-sm mt-1">
            Real-time overview of academic and administrative activity across all faculties.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Search input */}
          <div className="relative flex-1 sm:flex-initial">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity..."
              aria-label="Search activity logs"
              className="pl-9 pr-8 py-2 rounded-lg border bg-white text-sm w-full sm:w-72 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2 top-2.5 p-0.5 hover:bg-gray-100 rounded-full transition-colors"
                title="Clear"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          <button
            onClick={() => void loadLogs(debouncedSearch || undefined)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all disabled:opacity-50 shadow-sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="text-sm font-medium">{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <Clock className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            {loading ? "Loading activity…" : search ? `No matches for “${search}”` : "No activity logged yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col sm:flex-row items-start gap-4 p-5 hover:bg-amber-50/50 transition-colors group"
            >
              <div className="hidden sm:flex p-2.5 rounded-full bg-gray-50 group-hover:bg-white transition-colors">
                {typeIcons[log.type] ?? <Clock className="w-5 h-5 text-gray-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="sm:hidden p-1.5 rounded-full bg-gray-50">
                      {typeIcons[log.type] ?? <Clock className="w-4 h-4 text-gray-400" />}
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {log.actor.name}
                    </h4>
                    {log.actor.email && (
                      <span className="hidden lg:inline text-xs text-gray-400 font-normal">
                        ({log.actor.email})
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : ""}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {log.description}
                  </p>
                  {log.target && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100/50 text-amber-800 text-[11px] font-medium">
                      <UserCheck className="w-3 h-3" />
                      Target: {log.target}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProvostActivityLog;
