// src/hod/CreateSession.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";


const baseUrl = import.meta.env.VITE_BACKEND_URL;
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (session: Session) => void;
}

export interface Session {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}



const CreateSession = ({ isOpen, onClose, onCreated }: Props) => {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { token } = useAuthStore();

  if (!isOpen) return null;

 const handleSubmit = async () => {
  if (!name || !startDate || !endDate) return;

  setLoading(true);
  try {
    const response = await fetch(`${baseUrl}/session/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionName: name,
        startDate,
        endDate,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create session");
    }

    const result = await response.json();
    onCreated({
      id: result.data._id,
      name: result.data.sessionName,
      startDate: result.data.startDate,
      endDate: result.data.endDate,
    });
    toast({
      title: "Success",
      description: "Session created successfully.",
      variant: "default",
    });

    onClose();
    console.log("Session created successfully:", result.data);
    
  } catch (err: any) {
    console.error(err);
    
    toast({
      title: "Error",
      description: err.message || "Failed to create session.",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50 p-4 sm:p-6">
      <div
        className="
          bg-white rounded-lg shadow-md
          w-full max-w-xl
          sm:max-w-lg
          md:max-w-md
          p-4 sm:p-6 md:p-8
          flex flex-col
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-session-title"
      >
        <h2
          id="create-session-title"
          className="text-xl sm:text-2xl font-semibold mb-5 text-center sm:text-left"
        >
          Create New Session
        </h2>

        <div className="space-y-5 flex-grow">
          <div>
            <label className="block text-sm sm:text-base text-gray-700 mb-1">
              Session Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 2025/2026"
              className="w-full text-base sm:text-lg"
            />
          </div>

          <div>
            <label className="block text-sm sm:text-base text-gray-700 mb-1">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm sm:text-base text-gray-700 mb-1">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            className="bg-amber-700 text-white w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={loading || !name || !startDate || !endDate}
          >
            {loading ? "Creating..." : "Create Session"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateSession;
