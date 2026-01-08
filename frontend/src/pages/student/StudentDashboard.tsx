import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function StudentDashboard() {
  const { user, token } = useAuthStore();
  const userName = user?.userName || "Student";
  const [loadingProject, setLoadingProject] = useState(false);
  const [project, setProject] = useState<any>(null);

  

  const fetchProject = async () => {
    if (!user) return;
    setLoadingProject(true);
    try {
      const studentId = String(user.id ?? "");
      const url = `${baseUrl}/student`;
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const payload = await res.json().catch(() => null);
      console.log("payload:", payload);

      if (!res.ok) {
        console.warn("fetchProject non-OK", res.status);

        return;
      }

      const projectObj = payload?.data
      setProject(projectObj);
      console.log("Fetched project:", projectObj);
    } catch (err) {
      console.error("fetchProject error:", err);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    void fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold capitalize text-gray-800 break-words">
        Welcome, {userName}
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-md space-y-6 w-full">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Program</p>
          <p className="text-lg font-semibold text-gray-800 uppercase">
            {project?.level}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Faculty</p>
          <p className="text-lg font-semibold text-gray-800">
            {project?.faculty}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Department</p>
          <p className="text-lg font-semibold text-gray-800">
            {project?.department}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-gray-500">Current Research Stage</p>
          <p className="text-lg font-semibold text-gray-800 capitalize">
            {project?.currentStage}
          </p>
        </div>

        <div className="text-sm text-gray-600 pt-4">
          Make sure to upload your work as you progress through each stage.
        </div>
      </div>
    </div>
  );
}
