import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface AddStudentFormProps {
  onClose?: () => void;
}

const degreeOptions = ["MSc", "PhD"];

const baseUrl = import.meta.env.VITE_BACKEND_URL;

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onClose }) => {
  type SimpleSession = {
    _id: string;
    sessionName?: string;
    department?: string;
    isActive?: boolean;
    startDate?: string | Date;
  };
  const [degree, setDegree] = useState<"MSc" | "PhD">("MSc");
  const [matNo, setMatNo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [projectTopic, setProjectTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { token, user } = useAuthStore();
  const { toast } = useToast();


  useEffect(() => {
    const fetchLatestSession = async () => {
      try {
        const response = await fetch(`${baseUrl}/session/sessions`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json().catch(() => null);
        console.log("GET /session/sessions response:", result);
        const raw = (Array.isArray(result) ? result : result?.data || []) as SimpleSession[];

        const dept = (user?.department || "").trim().toLowerCase();
        const byDept = dept
          ? raw.filter((s) => (s?.department || "").trim().toLowerCase() === dept)
          : raw;
        const base = byDept.length > 0 ? byDept : raw;
        const active = base.filter((s) => s?.isActive === true);
        const sessions = active.length > 0 ? active : base;

        const sorted = [...sessions].sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

        const latest = sorted[0];
        if (latest) {
          setSessionId(latest._id);
          setSessionName(latest.sessionName);
        }
      } catch (error) {
        // ignore
      }
    };

    fetchLatestSession();
  }, [token, user?.department]);

  const handleSubmit = async () => {
    if (!sessionId) {
      toast({
        title: "No session",
        description: "No active session found for your department. Create a session first.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const payload = {
      email,
      firstName,
      lastName,
      matNo,
      degree: degree.toLowerCase(),
      session: sessionId,
      projectTopic,
    };

    try {
      const response = await fetch(`${baseUrl}/student/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to add student. Status: ${response.status}`);
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `Student ${firstName} ${lastName} added successfully!`,
        variant: "default",
      });

      // Optionally reset
      setMatNo("");
      setFirstName("");
      setLastName("");
      setEmail("");

      setProjectTopic("");

      if (onClose) onClose();
    } catch (error) {
      toast({
        title: "Failed",
        description: "Could not add student. Check details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6 sm:p-8">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Add {degree} Student
      </h2>

      {/* Degree */}
      <div className="mb-5">
        <label className="block text-sm font-medium mb-1">Degree</label>
        <Select
          value={degree}
          onValueChange={(val) => setDegree(val as "MSc" | "PhD")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={degree} />
          </SelectTrigger>
          <SelectContent>
            {degreeOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Matric No */}
      <div className="mb-5">
        <label className="block text-sm font-medium mb-1">
          Matriculation No.
        </label>
        <Input
          value={matNo}
          onChange={(e) => setMatNo(e.target.value)}
          placeholder="e.g. 220976762"
        />
      </div>
      {/* Topic */}
      <div className="mb-5">
        <label className="block text-sm font-medium mb-1">Project Topic</label>
        <Input
          value={projectTopic}
          onChange={(e) => setProjectTopic(e.target.value)}
          placeholder="e.g. Machine Learning"
        />
      </div>

      {/* First and Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium mb-1">First Name</label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name</label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      {/* Email */}
      <div className="mb-5">
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Latest Session */}
      <div className="mb-5">
        <p className="text-sm text-gray-700 mb-4">
          Current Session: <strong>{sessionName || "None"}</strong>
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        {onClose && (
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </Button>
        )}
        <Button
          className="w-full sm:w-auto bg-amber-700 hover:bg-amber-800 text-white"
          onClick={handleSubmit}
          disabled={!sessionId || isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner size="sm" text="" />
              Adding...
            </span>
          ) : (
            "Add Student"
          )}
        </Button>
      </div>
    </div>
  );
};

export default AddStudentForm;
