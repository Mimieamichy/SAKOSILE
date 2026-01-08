// src/hod/HodDashboardOverview.tsx
import { useState, useEffect } from "react";
import { GraduationCap, Users, BookUser, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { Role } from "@/config/roles";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function HodDashboardOverview() {
  const { user, token, hasRole } = useAuthStore(); 
  const { toast } = useToast();

  const [lecturersCount, setLecturersCount] = useState<number | null>(null);
  const [studentsCount, setStudentsCount] = useState<number | null>(null);
  const [activeSessionsCount, setActiveSessionsCount] = useState<number | null>(
    null
  );
  const [loadingCounts, setLoadingCounts] = useState(false);

  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const isHod = hasRole(Role.HOD);
  const displayName = user?.userName || "User";

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        setLoadingCounts(true);
        // attach token from auth provider if available
        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        const [lectRes, studRes, sessRes] = await Promise.all([
          axios.get(`${baseUrl}/dashboard/count/lecturers-dept`),
          axios.get(`${baseUrl}/dashboard/count/students-dept`),
          axios.get(`${baseUrl}/dashboard/count/active-sessions`),
        ]);

        const extract = (r: any) =>
          r?.data?.count ?? r?.data?.data ?? r?.data ?? null;

        const toFiniteNumber = (v: any) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        };
        console.log("Lecturers:", lectRes, "Students:", studRes, "Sessions:", sessRes);
 
        setLecturersCount(toFiniteNumber(extract(lectRes)));
        setStudentsCount(toFiniteNumber(extract(studRes)));
        setActiveSessionsCount(toFiniteNumber(extract(sessRes)));
      } catch (err) {
        console.error("Failed to load dashboard counts", err);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics.",
          variant: "destructive",
        });
      } finally {
        setLoadingCounts(false);
      }
    };

    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-screen-lg mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
          Welcome,{" "}
          <span className="font-semibold capitalize">{displayName}</span> 👋
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Here’s an overview of your{" "}
          <span className="font-semibold uppercase">{user?.roles?.[0] || "HOD"}</span>,{" "}
          <span className="font-semibold">{user?.department}</span> activities
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* PG Coordinator - only for HOD */}
        {isHod && (
          <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4 border border-gray-100 hover:shadow-lg transition-shadow duration-300 ease-in-out min-w-0">
            <div className="bg-amber-50 p-3 rounded-full flex-shrink-0">
              <GraduationCap className="w-8 sm:w-10 h-8 sm:h-10 text-amber-700" />
            </div>
            <div className="truncate">
              <div className="text-sm sm:text-base text-gray-500 truncate">
                PG Coordinators
              </div>
              <div className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                1
              </div>
            </div>
          </div>
        )}

        {/* Lecturers */}
        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4 border border-gray-100 hover:shadow-lg transition-shadow duration-300 ease-in-out min-w-0">
          <div className="bg-amber-50 p-3 rounded-full flex-shrink-0">
            <Users className="w-8 sm:w-10 h-8 sm:h-10 text-amber-700" />
          </div>
          <div className="truncate">
            <div className="text-sm sm:text-base text-gray-500 truncate">
              Lecturers
            </div>
            <div className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
              {loadingCounts ? "…" : lecturersCount ?? "-"}
            </div>
          </div>
        </div>

        {/* Students */}
        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4 border border-gray-100 hover:shadow-lg transition-shadow duration-300 ease-in-out min-w-0">
          <div className="bg-amber-50 p-3 rounded-full flex-shrink-0">
            <BookUser className="w-8 sm:w-10 h-8 sm:h-10 text-amber-700" />
          </div>
          <div className="truncate">
            <div className="text-sm sm:text-base text-gray-500 truncate">
              Students
            </div>
            <div className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
              {loadingCounts ? "…" : studentsCount ?? "-"}
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4 border border-gray-100 hover:shadow-lg transition-shadow duration-300 ease-in-out min-w-0">
          <div className="bg-amber-50 p-3 rounded-full flex-shrink-0">
            <CalendarDays className="w-8 sm:w-10 h-8 sm:h-10 text-amber-700" />
          </div>
          <div className="truncate">
            <div className="text-sm sm:text-base text-gray-500 truncate">
              Active Sessions
            </div>
            <div className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
              {loadingCounts ? "…" : activeSessionsCount ?? "-"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
