import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { useAuthStore } from "@/store/authStore";

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string; // API id (used in GET and PUT)
  baseUrl: string; // pass import.meta.env.VITE_BACKEND_URL from parent
  onUpdated?: (updatedStudent: any) => void; // optional callback to update parent state
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  studentId,
  baseUrl,
  onUpdated,
}) => {
  const { token } = useAuthStore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [matricNo, setMatricNo] = useState("");
  const [projectTopic, setProjectTopic] = useState("");
  const [email, setEmail] = useState("");

  // load student when modal opens
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
        if (cancelled) return;

        // normalize fields from common shapes
        const stu = json?.data ?? json ?? {};
        // user could be nested (user.firstName/lastName)
        const u = stu.user ?? {};
        console.log("EditStudentModal fetched student:", stu);

        setFirstName(
          String(u.firstName ?? u.first_name ?? u.firstname ?? "").trim()
        );
        setLastName(
          String(u.lastName ?? u.last_name ?? u.lastname ?? "").trim()
        );
        setMatricNo(
          String(stu.matricNo ?? stu.matric_no ?? stu.matric ?? "").trim()
        );
        setProjectTopic(
          String(
            stu.projectTopic ?? stu.project_topic ?? stu.topic ?? ""
          ).trim()
        );
        setEmail(String(u.email ?? stu.email ?? "").trim());
      } catch (err: any) {
        console.error("EditStudentModal fetch error:", err);
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

  const handleSave = async () => {
    // minimal validation
    if (!matricNo) {
      toast({
        title: "Validation",
        description: "Matric number is required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Adjust payload to match your backend shape. Common shapes:
      // { matricNo, projectTopic, email, user: { firstName, lastName } }
      const payload: any = {
        matricNo: String(matricNo).trim(),
        projectTopic: String(projectTopic).trim(),
        email: String(email).trim(),
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
      };

      const res = await fetch(
        `${baseUrl}/student/${encodeURIComponent(studentId)}`,
        {
          method: "PUT", // if your API expects PATCH change to 'PATCH'
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      const text = await res.text();
      let parsed: any = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = text;
      }
      console.log("EditStudentModal save response:", res.status, parsed);

      if (!res.ok) {
        const errMsg = parsed?.message ?? parsed ?? `HTTP ${res.status}`;
        throw new Error(errMsg);
      }

      toast({
        title: "Saved",
        description: "Student updated successfully.",
        variant: "default",
      });

      // call parent to update local list if provided
      const updatedStudent = parsed?.data ?? parsed ?? null;
      if (onUpdated)
        onUpdated(
          updatedStudent ?? {
            _id: studentId,
            matricNo,
            projectTopic,
            user: { firstName, lastName, email },
          }
        );

      onClose();
    } catch (err: any) {
      console.error("EditStudentModal save error:", err);
      toast({
        title: "Save failed",
        description: err?.message ?? String(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative z-10 max-w-xl w-full mx-4 bg-white rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-medium">Edit Student</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded hover:bg-gray-100"
          >
            <X />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-sm text-gray-500">Loading student...</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm block mb-1">First name</label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm block mb-1">Last name</label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm block mb-1">Matric No</label>
                <Input
                  value={matricNo}
                  onChange={(e) => setMatricNo(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm block mb-1">Project Topic</label>
                <Input
                  value={projectTopic}
                  onChange={(e) => setProjectTopic(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm block mb-1">Email</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="secondary" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditStudentModal;
