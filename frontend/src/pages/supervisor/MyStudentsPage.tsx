import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";
import { Role } from "@/config/roles";
import { Download, Send, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ---------- add after imports ----------
/** Convert a stage key like "proposal_defense" to "Proposal Defense" */
const stageDisplayMap: Record<string, string> = {
  start: "Start",
  proposal: "Proposal",
  "internal defense": "Internal Defense",
  "external defense": "External Defense",
  "proposal defense": "Proposal Defense",
  "2nd seminar": "2nd Seminar",
  "3rd seminar": "3rd Seminar",
};

function formatStage(raw: string | undefined | null): string {
  if (!raw) return "Unknown";

  const key = String(raw).trim().toLowerCase();

  if (stageDisplayMap[key]) return stageDisplayMap[key];

  // fallback: replace underscore/dash with space, split camelCase, then title-case each word
  const withSpaces = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2");

  return withSpaces
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
// ---------------------------------------

type Student = {
  id: string; // derived from student._id
  matNo: string;
  name: string;
  topic: string; // project topic (fallback to project.latest.topic)
  stage: string;
  stageKey?: string; // raw key from backend, e.g. "proposal_defense"
  stageLabel?: string; // human-friendly label, e.g. "Proposal Defense"
  department?: string;

  majorSupervisor?: string | { _id?: string };
  minorSupervisor?: string | { _id?: string };

  defenceMarked?: boolean;

  scores: {
    proposal: number | null;
    internal: number | null;
    external: number | null;
    proposalDefense: number | null;
    secondSeminar: number | null;
    thirdSeminar: number | null;
    externalDefense: number | null;
  };
  approvalStatus?: string;
  // project-specific:
  projectId?: string;
  projectVersions?: Array<{
    versionNumber: number;
    fileUrl?: string;
    topic?: string;
    comments?: {
      by?: string;
      text: string;
      uploadedAt?: string;
      version?: number;
    }[];
  }>;
  latestVersionIndex?: number; // index into projectVersions (latest)
  // UI-only:
  supervisorFileUrl?: string;
  comments: {
    by: string;
    text: string;
    uploadedAt?: string;
    version?: number;
  }[]; // comments from latest version
};

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function MyStudentsPage() {
  const { user, token, hasRole } = useAuthStore();
  const userName = user?.userName || "Supervisor";
  const { toast } = useToast();
  // students + loading / error

  // two separate lists
  const [studentsMsc, setStudentsMsc] = useState<Student[]>([]);
  const [studentsPhd, setStudentsPhd] = useState<Student[]>([]);

  // track which students are currently being approved (to disable button)
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());

  // loading / error per degree
  const [loadingMsc, setLoadingMsc] = useState<boolean>(true);
  const [loadingPhd, setLoadingPhd] = useState<boolean>(true);
  const [errorMsc, setErrorMsc] = useState<string | null>(null);
  const [errorPhd, setErrorPhd] = useState<string | null>(null);

  // which degree tab is active
  const [selectedDegree, setSelectedDegree] = useState<"MSc" | "PhD">("MSc");

  // modal / comment UI state
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  // upload UI state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const displayedStudents =
    selectedDegree === "MSc" ? studentsMsc : studentsPhd;

  const selected = selectedIdx !== null ? displayedStudents[selectedIdx] : null;

  const isSupervisor = hasRole(Role.SUPERVISOR);

  // helper: check if current user is the major supervisor for a student
 const isMajorSupervisorOf = (stu: Student | null | undefined) => {
    if (!stu || !user) return false;
    const myId = String((user as any).lecturerId ?? (user as any).id ?? "");
    const maj = stu.majorSupervisor;
    const majId =
      typeof maj === "string"
        ? maj
        : maj && (maj as any).stu.majorSupervisor
        ? (maj as any).stu.majorSupervisor
        : "";
    return Boolean(myId && majId && String(majId) === myId);
  };

  // fetching my students
  const fetchMyStudentsByDegree = async (degree: "msc" | "phd") => {
    const controller = new AbortController(); // local controller for this call
    try {
      if (degree === "msc") {
        setLoadingMsc(true);
        setErrorMsc(null);
      } else {
        setLoadingPhd(true);
        setErrorPhd(null);
      }

      const res = await fetch(`${baseUrl}/student/getMyStudents/${degree}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Server returned ${res.status}: ${txt}`);
      }

      const raw = await res.json();
      const arr: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.data)
        ? raw.data
        : Array.isArray(raw.students)
        ? raw.students
        : [];

      console.log("Fetched students:", arr);

      // normalization
      const normalized: Student[] = arr.map((item: any) => {
        const studentObj = item.student ?? item;
        const projectObj = item.project ?? undefined;

        const stageScores = studentObj.stageScores ?? studentObj.scores ?? {};
        const proposal =
          stageScores.proposalScore ?? stageScores.proposalDefense ?? null;
        const internal =
          stageScores.internalScore ?? stageScores.internalDefense ?? null;
        const external =
          stageScores.externalScore ?? stageScores.externalDefense ?? null;
        const proposalDefense =
          stageScores.proposalDefenceScore ?? stageScores.proposalDefense ?? null;
        const secondSeminar =
          stageScores.secondSeminarScore ?? stageScores.secondSeminar ?? null;
        const thirdSeminar =
          stageScores.thirdSeminarScore ?? stageScores.thirdSeminar ?? null;
        const externalDefense =
          stageScores.externalDefenseScore ??
          stageScores.externalDefense ??
          null;

        const first = studentObj.user?.firstName ?? studentObj.firstName ?? "";
        const last = studentObj.user?.lastName ?? studentObj.lastName ?? "";

        const versions: any[] =
          Array.isArray(projectObj?.versions) && projectObj.versions.length > 0
            ? projectObj.versions.slice()
            : [];

        const latestIdx = versions.length > 0 ? versions.length - 1 : -1;
        const latest = latestIdx >= 0 ? versions[latestIdx] : null;

        // Collect comments across all versions
        const allComments: {
          by: string;
          text: string;
          uploadedAt?: string;
          version?: number | null;
        }[] = versions.flatMap((v: any) =>
          Array.isArray(v.comments)
            ? v.comments.map((c: any) => ({
                by: c.by ?? c.authorName ?? c.author ?? "Unknown",
                text: c.text ?? c.comment ?? "",
                uploadedAt: c.date ?? c.uploadedAt ?? c.createdAt,
                version: v.versionNumber ?? v.version ?? null,
              }))
            : []
        );

        // Sort oldest → newest
        allComments.sort((a, b) => {
          const ta = a.uploadedAt ? Date.parse(a.uploadedAt) : Infinity;
          const tb = b.uploadedAt ? Date.parse(b.uploadedAt) : Infinity;
          return ta - tb;
        });

        return {
          id:
            studentObj._id ??
            studentObj.id ??
            studentObj.matricNo ??
            Math.random().toString(36).slice(2),
          matNo: studentObj.matricNo ?? studentObj.matNo ?? "",
          name: `${first} ${last}`.trim(),
          department: studentObj.department,
          topic:
            studentObj.projectTopic ??
            latest?.topic ??
            projectObj?.topic ??
            studentObj.topic ??
            "",

          stage: (studentObj.currentStage ?? "").toLowerCase(),
          stageKey: (studentObj.currentStage ?? "").toLowerCase(),
          stageLabel: formatStage(studentObj.currentStage),

          majorSupervisor:
            studentObj.majorSupervisor ??
            studentObj.majorSupervisorId ??
            undefined,
          minorSupervisor:
            studentObj.minorSupervisor ??
            studentObj.minorSupervisorId ??
            undefined,

          defenceMarked: Boolean(
            studentObj.defenceMarked === true ||
              studentObj.defenceMarked === "true"
          ),

          approvalStatus: (studentObj.approvalStatus ?? "").toLowerCase(),
          scores: {
            proposal: typeof proposal === "number" ? proposal : null,
            internal: typeof internal === "number" ? internal : null,
            external: typeof external === "number" ? external : null,
            proposalDefense:
              typeof proposalDefense === "number" ? proposalDefense : null,
            secondSeminar:
              typeof secondSeminar === "number" ? secondSeminar : null,
            thirdSeminar:
              typeof thirdSeminar === "number" ? thirdSeminar : null,
            externalDefense:
              typeof externalDefense === "number" ? externalDefense : null,
          },
          projectId: projectObj?._id ?? projectObj?.id ?? undefined,
          projectVersions: versions.map((v: any) => ({
            versionNumber: v.versionNumber ?? v.version ?? 0,
            fileUrl: v.fileUrl ?? v.fileUrlPath ?? "",
            topic: v.topic ?? "",
            comments: Array.isArray(v.comments)
              ? v.comments.map((c: any) => ({
                  by: c.by ?? c.author ?? "Unknown",
                  text: c.text ?? c.comment ?? "",
                  uploadedAt: c.date ?? c.uploadedAt ?? c.createdAt,
                }))
              : [],
          })),
          latestVersionIndex: latestIdx,
          supervisorFileUrl: "",
          comments: allComments,
        };
      });

      if (degree === "msc") setStudentsMsc(normalized);
      else setStudentsPhd(normalized);
    } catch (err: any) {
      console.error(`Failed to fetch ${degree} students:`, err);
      if (degree === "msc") {
        setStudentsMsc([]);
        setErrorMsc(err?.message ?? "Failed to load MSc students");
      } else {
        setStudentsPhd([]);
        setErrorPhd(err?.message ?? "Failed to load PhD students");
      }
    } finally {
      if (degree === "msc") setLoadingMsc(false);
      else setLoadingPhd(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setStudentsMsc([]);
      setStudentsPhd([]);
      setLoadingMsc(false);
      setLoadingPhd(false);
      return;
    }

    fetchMyStudentsByDegree("msc");
    fetchMyStudentsByDegree("phd");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // handle comment submission

  const handleComment = async () => {
    if (!selected || !commentText.trim()) return;

    // compute real versionNumber
    const versions = selected.projectVersions ?? [];
    const latestIdx =
      selected.latestVersionIndex ??
      (versions.length > 0 ? versions.length - 1 : -1);
    const latestVersion = versions[latestIdx];
    const versionNumber = latestVersion?.versionNumber ?? latestIdx + 1; // fallback

    if (!versionNumber && versionNumber !== 0) {
      console.error("No versionNumber found for selected student");
      return;
    }

    try {
      const postRes = await fetch(
        `${baseUrl}/project/comment/${selected.id}/${versionNumber}`, // plural 'comments'
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ text: commentText.trim(), by: userName }),
        }
      );

      if (!postRes.ok) {
        const txt = await postRes.text().catch(() => "");
        throw new Error(`Failed to post comment: ${postRes.status} ${txt}`);
      }

      setCommentText("");
      if (postRes.ok) {
        toast({
          title: "Comment sent",
          description: "Your comment was sent.",
          variant: "default",
        });
      }

      // refresh the appropriate degree list so selected.comments is refreshed from server
      const degreeToRefresh = selectedDegree.toLowerCase() as "msc" | "phd";
      await fetchMyStudentsByDegree(degreeToRefresh);
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  // handle project file download

  const handleDownload = async (studentId: string, versionNumber: number) => {
    try {
      const res = await fetch(`${baseUrl}/project/download/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // 👈 token included
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to download: ${res.status}`);
      }

      // Convert response to blob
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      // Create hidden link and click it
      const link = document.createElement("a");
      link.href = url;
      link.download = `project-${studentId}-v${versionNumber}`; // optional file name
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      toast({
        title: "Download failed",
        description: "See console for details.",
        variant: "destructive",
      });
    }
  };

  // ---------- NEW: Supervisor upload handler ----------
  const validateFile = (file: File) => {
    const allowedMimeTypes = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);
    const allowedExt = new Set([".pdf", ".doc", ".docx"]);
    const getExt = (n: string) => {
      const i = n.lastIndexOf(".");
      return i >= 0 ? n.slice(i).toLowerCase() : "";
    };
    const ext = getExt(file.name);
    const mimeOk = allowedMimeTypes.has(file.type);
    const extOk = allowedExt.has(ext);
    const MAX_BYTES = 1024 ** 3;
    if (!mimeOk && !extOk) {
      return "Only PDF and Word documents are allowed.";
    }
    if (file.size > MAX_BYTES) {
      return "Maximum file size is 1 GB.";
    }
    return null;
  };

  const handleUploadClick = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    const validationErr = validateFile(file);
    if (validationErr) {
      toast({
        title: "Invalid file",
        description: validationErr,
        variant: "destructive",
      });
      e.currentTarget.value = ""; // reset input
      return;
    }

    if (!selected) {
      toast({
        title: "No student selected",
        description: "Please open a student before uploading.",
        variant: "destructive",
      });
      e.currentTarget.value = ""; // reset input
      return;
    }

    // compute version number to attach (prefer latest.versionNumber or increment)
    const versions = selected.projectVersions ?? [];
    const latestIdx =
      selected.latestVersionIndex ??
      (versions.length > 0 ? versions.length - 1 : -1);
    const latestVersion = versions[latestIdx];
    const versionNumber = latestVersion?.versionNumber ?? latestIdx + 1;

    setUploading(true);
    try {
      const form = new FormData();

      // IMPORTANT: append using the exact field name server expects
      // You asked to send only 'fileUrl' — so we append with that key.
      form.append("project", file);

      // If backend expects versionNumber in the form (optional), you can include it:
      if (typeof versionNumber === "number" && !Number.isNaN(versionNumber)) {
        form.append("versionNumber", String(versionNumber));
      }

      // Do NOT set Content-Type header — let the browser set multipart boundary.
      const res = await fetch(
        `${baseUrl}/project/upload/${encodeURIComponent(selected.id)}`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: form,
        }
      );

      // Read as text then try to parse JSON for better error messages
      const text = await res.text().catch(() => "");
      let parsed: any = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = text;
      }

      if (!res.ok) {
        // Helpful error message shown to user + console for debugging
        const serverMsg =
          (parsed && (parsed.message || parsed.error)) ||
          text ||
          `HTTP ${res.status}`;
        throw new Error(serverMsg);
      }

      toast({
        title: "Upload successful",
        description: "File uploaded.",
        variant: "default",
      });

      // refresh current degree list to pick up new file/comments
      const degreeToRefresh = selectedDegree.toLowerCase() as "msc" | "phd";
      await fetchMyStudentsByDegree(degreeToRefresh);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({
        title: "Upload failed",
        description: err?.message ?? "See console for details.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // reset input so user can re-select same file later if needed
      if (e.currentTarget) e.currentTarget.value = "";
      // also reset ref if you use it for clicking
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ---------- end upload handler ----------

  // handle student approval
  const handleApproveStudent = async (
    studentId: string,
    degree: "msc" | "phd"
  ) => {
    // normalize degree
    const deg = (degree ?? "msc").toLowerCase() as "msc" | "phd";

    setApprovingIds((prev) => {
      const next = new Set(prev);
      next.add(studentId);
      return next;
    });

    const url = `${baseUrl}/project/approve/${encodeURIComponent(studentId)}`;
    console.log("Approving student:", { studentId, degree: deg, url });

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          // no body required by backend
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Approve failed: ${res.status} ${txt}`);
      }

      // On success: prefer to re-fetch the degree list if that function exists
      if (typeof fetchMyStudentsByDegree === "function") {
        await fetchMyStudentsByDegree(deg);
      } else {
        // fallback: optimistic update of the proper list so UI reflects the change
        if (deg === "msc") {
          setStudentsMsc((prev) =>
            prev.map((s) =>
              s.id === studentId
                ? {
                    ...s,
                    approvalStatus: "approved",
                    stage: "proposal defense",
                  }
                : s
            )
          );
        } else {
          setStudentsPhd((prev) =>
            prev.map((s) =>
              s.id === studentId
                ? {
                    ...s,
                    approvalStatus: "approved",
                    stage: "proposal defense",
                  }
                : s
            )
          );
        }
      }
    } catch (err) {
      console.error("Error approving student:", err);
    } finally {
      // clear in-flight flag
      setApprovingIds((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-6">
      <h2 className="text-2xl font-semibold text-gray-800">My Students</h2>

      <div className="flex gap-2">
        {(["MSc", "PhD"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDegree(d)}
            className={`px-3 py-1 rounded ${
              selectedDegree === d
                ? "bg-amber-700 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {d} ({d === "MSc" ? studentsMsc.length : studentsPhd.length})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg shadow bg-white">
        {displayedStudents.length === 0 ? (
          <div className="p-6 bg-white rounded shadow text-gray-600 text-center">
            No students assigned yet.
          </div>
        ) : (
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-sm">
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Matric No</th>
                <th className="p-3 border">Topic</th>
                <th className="p-3 border">Stage</th>
                {selectedDegree === "PhD" ? (
                  <>
                    <th className="p-3 border">Proposal Defense</th>
                    <th className="p-3 border">2nd Seminar</th>
                    <th className="p-3 border">3rd Seminar</th>
                    <th className="p-3 border">External Defense</th>
                  </>
                ) : (
                  <>
                    <th className="p-3 border">Proposal</th>
                    <th className="p-3 border">Internal</th>
                    <th className="p-3 border">External</th>
                  </>
                )}
                <th className="p-3 border">Department</th>
                <th className="p-3 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.map((stu, idx) => (
                <tr
                  key={stu.id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-amber-50"}
                >
                  <td className="p-3 border capitalize">{stu.name}</td>
                  <td className="p-3 border text-sm">{stu.matNo}</td>
                  <td
                    className="p-3 border text-sm text-amber-700 hover:underline cursor-pointer capitalize"
                    onClick={() => setSelectedIdx(idx)}
                  >
                    {stu.topic}
                  </td>
                  <td className="p-3 border text-sm">{stu.stageLabel}</td>
                  {selectedDegree === "PhD" ? (
                    <>
                      <td className="p-3 border text-sm">
                        {stu.scores.proposalDefense ?? "—"}
                      </td>
                      <td className="p-3 border text-sm">
                        {stu.scores.secondSeminar ?? "—"}
                      </td>
                      <td className="p-3 border text-sm">
                        {stu.scores.thirdSeminar ?? "—"}
                      </td>
                      <td className="p-3 border text-sm">
                        {stu.scores.externalDefense ?? "—"}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 border text-sm">
                        {stu.scores.proposal ?? "—"}
                      </td>
                      <td className="p-3 border text-sm">
                        {stu.scores.internal ?? "—"}
                      </td>
                      <td className="p-3 border text-sm">
                        {stu.scores.external ?? "—"}
                      </td>
                    </>
                  )}
                  <td className="p-3 border text-sm">
                    {stu.department ?? "—"}
                  </td>
                  <td className="p-3 border">
                    <Button
                      size="sm"
                      className="bg-amber-700 text-white"
                      onClick={() =>
                        handleApproveStudent(
                          stu.id,
                          selectedDegree.toLowerCase() as "msc" | "phd"
                        )
                      }
                      disabled={
                        approvingIds.has(stu.id) ||
                        !isMajorSupervisorOf(stu) ||
                        !stu.defenceMarked
                      }
                    >
                      {approvingIds.has(stu.id)
                        ? "Approving..."
                        : !isMajorSupervisorOf(stu)
                        ? "Cant Approve"
                        : !stu.defenceMarked
                        ? "Awaiting"
                        : "Approve"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <Dialog
        open={selected !== null}
        onOpenChange={() => setSelectedIdx(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {selected?.name}'s Submission
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-6">
              {/* Latest project version file link */}
              <div className="p-4 border rounded bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">
                  Latest Project File:
                </p>
                {selected.projectVersions &&
                selected.projectVersions.length > 0 ? (
                  <>
                    {(() => {
                      const latest =
                        selected.projectVersions?.[
                          selected.latestVersionIndex ?? -1
                        ];

                      const versionNumber =
                        latest?.versionNumber ??
                        (selected.latestVersionIndex ?? -1) + 1;

                      return (
                        <>
                          <div className="flex items-center gap-3">
                            <Button
                              className="bg-amber-700 text-white"
                              onClick={() =>
                                handleDownload(selected.id, versionNumber)
                              }
                            >
                              <Download className="mr-1 h-4 w-4" />
                              Download
                            </Button>

                            {/* Upload button (visible only to supervisors) */}

                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,application/pdf,.doc,application/msword,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              onChange={handleFileSelected}
                              className="hidden"
                            />
                            <Button
                              className="bg-white border text-amber-700 hover:bg-amber-50"
                              onClick={handleUploadClick}
                              disabled={uploading}
                              title="Upload document for student"
                            >
                              <Upload className="mr-1 h-4 w-4" />
                              {uploading ? "Uploading…" : "Upload"}
                            </Button>
                          </div>

                          <div className="text-xs text-gray-500 mt-1">
                            Version #{latest.versionNumber}
                          </div>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div className="text-sm text-gray-500">
                    No project file uploaded yet.
                    {/* allow upload even if no version yet */}
                    {isSupervisor && (
                      <>
                        <div className="mt-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf,.doc,application/msword,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleFileSelected}
                            className="hidden"
                          />
                          <Button
                            className="bg-white border text-amber-700 hover:bg-amber-50"
                            onClick={handleUploadClick}
                            disabled={uploading}
                            title="Upload document for student"
                          >
                            <Upload className="mr-1 h-4 w-4" />
                            {uploading ? "Uploading…" : "Upload"}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Comments (from latest version) */}

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Comments :</p>

                <div className="h-64 overflow-y-auto border rounded p-3 bg-gray-50 flex flex-col gap-2">
                  {!selected?.comments || selected.comments.length === 0 ? (
                    <p className="text-gray-500 italic text-sm self-center">
                      No comments yet.
                    </p>
                  ) : (
                    selected.comments.map((c, i) => (
                      <div
                        key={i}
                        className={`relative p-2 capitalize rounded-lg max-w-[80%] text-sm ${
                          c.by === userName
                            ? "bg-amber-200 self-end text-right"
                            : "bg-white self-start text-left border"
                        }`}
                      >
                        <div className="font-medium text-xs text-gray-600 mb-1">
                          {c.by}
                        </div>
                        <div>{c.text}</div>

                        {/* timestamp bottom-right */}
                        <div className="text-[10px] text-gray-500 mt-1 text-right">
                          {c.uploadedAt
                            ? `v${c.version ?? "?"} • ${new Date(
                                c.uploadedAt
                              ).toLocaleString([], {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : ""}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add new comment textarea */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Write your comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-end">
                  <Button
                    className="bg-amber-700 text-white"
                    onClick={handleComment}
                  >
                    <Send className="mr-1 h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
