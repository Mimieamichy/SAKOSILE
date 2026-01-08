import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { useAuthStore } from "@/store/authStore";

interface ProvostViewStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  baseUrl: string; // import.meta.env.VITE_BACKEND_URL
  watermarkUrl?: string;
}

export default function ProvostViewStudentModal({
  isOpen,
  onClose,
  studentId,
  baseUrl,
  watermarkUrl,
}: ProvostViewStudentModalProps) {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<any | null>(null);
  // contentRef targets the scrollable content area
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStudent = async () => {
      if (!isOpen || !studentId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${baseUrl}/student/${encodeURIComponent(studentId)}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to fetch student (${res.status}): ${txt}`);
        }
        const json = await res.json();
        const payload = json?.data ?? json ?? {};
        console.log("Fetched student data:", payload);
        if (!cancelled) setStudent(payload);
      } catch (err: any) {
        console.error("ProvostViewStudentModal fetch error:", err);
        if (!cancelled) setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStudent();
    return () => {
      cancelled = true;
    };
  }, [isOpen, studentId, baseUrl, token]);

  // helper: wait until images inside `root` have finished loading (resolves even on error)
  async function waitForImages(root: HTMLElement) {
    const imgs = Array.from(root.querySelectorAll("img"));
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((res) => {
            if ((img as HTMLImageElement).complete) return res();
            img.addEventListener("load", () => res(), { once: true });
            img.addEventListener("error", () => res(), { once: true });
            // in case src is empty or something weird
            setTimeout(res, 3000);
          })
      )
    );
  }

  /** Replaces previous downloadPDF -- captures full scrollable content by cloning it off-screen */
  const downloadPDF = async () => {
    if (!student || !contentRef.current) return;
    setPdfLoading(true);
    try {
      const original = contentRef.current;
      // clone the node so we can remove height limits without affecting UI
      const clone = original.cloneNode(true) as HTMLElement;

      // Force the clone to expand fully (no scrollbars)
      clone.style.maxHeight = "none";
      clone.style.height = "auto";
      clone.style.overflow = "visible";
      clone.style.pointerEvents = "none";
      // ensure background is white for PDF
      clone.style.background = "white";

      // Create a wrapper and append off-screen
      const wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.top = "-99999px";
      wrapper.style.left = "0";
      // set width to the original's width so layout matches
      const origWidth =
        original.getBoundingClientRect().width || original.offsetWidth;
      wrapper.style.width = `${origWidth}px`;
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      // wait for images inside the clone to load (watermark, etc)
      await waitForImages(clone);

      // render full clone to canvas
      const canvas = await html2canvas(clone, {
        scale: 2, // increase for better resolution
        useCORS: true, // requires images to have CORS headers if external
        allowTaint: false,
        logging: false,
      });

      // cleanup the off-screen clone
      document.body.removeChild(wrapper);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      // first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // extra pages if necessary
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `${student?.matricNo ?? student?._id ?? "student"}.pdf`;
      pdf.save(fileName);
      toast({ title: "Exported", description: `PDF saved as ${fileName}` });
    } catch (err) {
      console.error("downloadPDF error:", err);
      toast({
        title: "Export failed",
        description: "Could not generate PDF.",
        variant: "destructive",
      });
    } finally {
      setPdfLoading(false);
    }
  };

  if (!isOpen) return null;

  const user = student?.user ?? {};
  const fullName = `${(user.firstName ?? user.first_name ?? "").trim()} ${(
    user.lastName ??
    user.last_name ??
    ""
  ).trim()}`.trim();
  const stageScores = student?.stageScores ?? student?.stage_scores ?? {};
  const totalScore = Object.values(stageScores || {}).reduce(
    (s: number, v: any) => s + (Number(v) || 0),
    0
  );

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* modal container: limit height so inner area can scroll */}
      <div
        className="relative z-10 max-w-2xl w-full mx-4 bg-amber-50 rounded-lg shadow-xl overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-medium">Student details</h3>
          <div className="flex items-center gap-2">
            <Button
              className="bg-amber-700 text-white w-full sm:w-auto"
              onClick={downloadPDF}
              disabled={!student || pdfLoading}
            >
              {pdfLoading ? "Generating PDF..." : "Download PDF"}
            </Button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded hover:bg-gray-100"
            >
              <X />
            </button>
          </div>
        </div>

        {/* scrollable content area */}
        <div
          ref={contentRef}
          className="p-4 space-y-4 overflow-auto max-h-[72vh] text-black"
        >
          {typeof watermarkUrl !== "undefined" && watermarkUrl && (
            <img
              src={watermarkUrl}
              alt=""
              crossOrigin="anonymous"
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 w-3/4 h-auto"
              style={{ maxWidth: "90%", maxHeight: "90%" }}
            />
          )}
          {loading ? (
            <div className="text-sm text-gray-500">Loading student...</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : student ? (
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500 w-40">Name</div>
                <div className="font-medium capitalize">{fullName || "-"}</div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500 w-40">Matric No</div>
                <div className="font-medium">
                  {student.matricNo ?? student.matric_no ?? "-"}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500 w-40">Level</div>
                <div className="font-medium">
                  {(student.level ?? "").toUpperCase() || "-"}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500 w-40">Faculty</div>
                <div className="font-medium">{student.faculty ?? "-"}</div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500 w-40">Department</div>
                <div className="font-medium">{student.department ?? "-"}</div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500 w-40">College Rep</div>
                <div className="font-medium">
                  {student.collegeRep ?? student.college_rep ?? "-"}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500 w-40">Internal Examiner</div>
                <div className="font-medium">
                  {student.internalExaminer ?? "-"}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500 w-40">
                  Major Supervisor
                </div>
                <div className="font-medium">
                  {student.majorSupervisor ?? student.major_supervisor ?? "-"}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500 w-40">
                  Minor Supervisor
                </div>
                <div className="font-medium">
                  {student.minorSupervisor ?? student.minor_supervisor ?? "-"}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500 w-40">Current Stage</div>
                <div className="font-medium">
                  {student.currentStage ?? student.current_stage ?? "-"}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500 w-40">Total Score</div>
                <div className="font-medium">{totalScore}</div>
              </div>

              <div className="pt-2">
                <div className="text-sm text-gray-500">Stage scores</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {Object.keys(stageScores || {}).length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No scores recorded
                    </div>
                  ) : (
                    Object.entries(stageScores).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2">
                        <div className="text-xs text-gray-500 w-48">{k}</div>
                        <div className="text-sm font-medium">{v}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-400">
                Record created:{" "}
                {student.createdAt
                  ? new Date(student.createdAt).toLocaleString()
                  : "-"}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No student data.</div>
          )}
        </div>
      </div>
    </div>
  );
}
