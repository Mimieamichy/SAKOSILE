// src/supervisor/SupervisorDashboard.tsx
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Role } from "@/config/roles";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Users, Calendar1, FileText, ArrowRight } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function SupervisorDashboard() {
  const { user, token, hasRole } = useAuthStore(); 
  const navigate = useNavigate();
  const isFacultyRep = hasRole(Role.FACULTY_PG_REP);
  const { toast } = useToast();
  const userName = user?.userName || "User";

  const [assignedStudentsCount, setAssignedStudentsCount] = useState<
    number | null
  >(null);
  const [upcomingDefencesCount, setUpcomingDefencesCount] = useState<
    number | null
  >(null);
  const [sessionsCount, setSessionsCount] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  const extract = (r: any) =>
    r?.data?.count ?? r?.data?.data ?? r?.data ?? null;
  const toFiniteNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);

        // Build per-request headers (safe even if token is undefined)
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        // Fire the requests and get the raw responses
        const [assignedRes, upcomingRes, sessionsRes] = await Promise.all([
          axios.get(`${baseUrl}/dashboard/assigned-students`, { headers }),
          axios.get(`${baseUrl}/dashboard/upcoming-defences`, { headers }),
          axios.get(`${baseUrl}/dashboard/count/active-sessions`, { headers }),
        ]);

        // Log the raw responses (useful for debugging)
        console.log("assignedRes.data:", assignedRes.data);
        console.log("upcomingRes.data:", upcomingRes.data);
        console.log("sessionsRes.data:", sessionsRes.data);

        // assigned students: expect either { count: N } or data: N
        const assignedRaw = extract(assignedRes);
        const assigned = Number.isFinite(Number(assignedRaw))
          ? Number(assignedRaw)
          : 0;
        setAssignedStudentsCount(assigned);
        // log the derived value (not the state) so you see the exact thing you're setting
        console.log("Assigned Students (derived):", assigned);

        // upcoming defences might return an array or count
        const upcomingRaw = extract(upcomingRes);
        const upcoming = Array.isArray(upcomingRaw)
          ? upcomingRaw.length
          : Number.isFinite(Number(upcomingRaw))
          ? Number(upcomingRaw)
          : 0;
        setUpcomingDefencesCount(upcoming);
        console.log("Upcoming Defences (derived):", upcoming);

        // sessions might return an array or count
        const sessionsRaw = extract(sessionsRes);
        const sessions = Array.isArray(sessionsRaw)
          ? sessionsRaw.length
          : Number.isFinite(Number(sessionsRaw))
          ? Number(sessionsRaw)
          : 0;
        setSessionsCount(sessions);
        console.log("Sessions (derived):", sessions);
      } catch (err) {
        console.error("Failed to load supervisor dashboard counts", err);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  return (
    <div className="space-y-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 capitalize">
          Welcome back, {userName}
        </h1>
        
        {isFacultyRep && (
          <Button 
            onClick={() => navigate("/supervisor/faculty-score-sheets")}
            className="bg-amber-700 hover:bg-amber-600 text-white flex items-center gap-2 shadow-md transition-all active:scale-95 group"
          >
            <FileText size={18} />
            <span>Score Sheets</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* Assigned Students */}
        <div className="bg-white shadow rounded-xl p-6 flex flex-col items-start">
          <Users className="text-amber-700 mb-3" size={32} />
          <h2 className="text-lg font-semibold text-gray-800">
            Assigned Students
          </h2>
          <p className="text-3xl font-bold text-amber-700 mt-2">
            {loading ? "…" : assignedStudentsCount ?? "-"}
          </p>
          <p className="text-gray-500 text-sm">students assigned to you</p>
        </div>

        {/* Upcoming Defenses */}
        <div className="bg-white shadow rounded-xl p-6 flex flex-col items-start">
          <CalendarCheck className="text-amber-700 mb-3" size={32} />
          <h2 className="text-lg font-semibold text-gray-800">
            Upcoming Defenses
          </h2>
          <p className="text-3xl font-bold text-amber-700 mt-2">
            {loading ? "…" : upcomingDefencesCount ?? "-"}
          </p>
          <p className="text-gray-500 text-sm">defenses scheduled</p>
        </div>

        {/* Number of Sessions (replaces Pending Reviews) */}
        <div className="bg-white shadow rounded-xl p-6 flex flex-col items-start">
          <Calendar1 className="text-amber-700 mb-3" size={32} />
          <h2 className="text-lg font-semibold text-gray-800">
            Number of Sessions
          </h2>
          <p className="text-3xl font-bold text-amber-700 mt-2">
            {loading ? "…" : sessionsCount ?? "-"}
          </p>
          <p className="text-gray-500 text-sm">sessions you are involved in</p>
        </div>
      </div>
    </div>
  );
}
