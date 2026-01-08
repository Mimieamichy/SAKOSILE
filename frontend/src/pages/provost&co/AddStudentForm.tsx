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

interface AddStudentFormProps {
  onClose?: () => void;
}

const degreeOptions = ["MSc", "PhD"];

const baseUrl = import.meta.env.VITE_BACKEND_URL;

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onClose }) => {
  const [degree, setDegree] = useState<"MSc" | "PhD">("MSc");
  const [matNo, setMatNo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [session, setSession] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [projectTopic, setProjectTopic] = useState("");

  const { token } = useAuthStore(); // 🔐 Get token from auth context
  const { toast } = useToast();


  useEffect(() => {
    const fetchLatestSession = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${baseUrl}/session/sessions`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();
        const sessions = Array.isArray(result) ? result : result?.data || [];

        const sorted = [...sessions].sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

        const latest = sorted[0];
        if (latest) {
          setSessionId(latest._id); // for backend
          setSessionName(latest.sessionName); // for display
        }
        console.log("Latest session fetched:", latest);
        
      } catch (error) {
        console.error("Error fetching latest session:", error);
      }
    };

    fetchLatestSession();
  }, []);

  const handleSubmit = async () => {
    const payload = {
      email,
      firstName,
      lastName,
      matNo,
      degree: degree.toLowerCase(),
      session: sessionId, // 👈 ObjectId goes to backend
      projectTopic,
    };

    try {
      const response = await fetch(`${baseUrl}/student/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 🔐 include if required
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to add student. Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Student added:", result);
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

      setSession("");
      setProjectTopic("");

      if (onClose) onClose();
    } catch (error) {
      console.error("Submission error:", error);
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
          Current Session: <strong>{sessionName}</strong>
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
        >
          Add Student
        </Button>
      </div>
    </div>
  );
};

export default AddStudentForm;
