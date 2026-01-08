// src/provost/ProvostDashboardOverview.tsx
import React, { useEffect, useState } from "react";
import { UserPlus, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";

interface HodDashboardOverviewProps {
  onCreateSessionClick: () => void;
}

export default function ProvostDashboardOverview({
  onCreateSessionClick,
}: HodDashboardOverviewProps) {
  const { user, token } = useAuthStore(); 
  const { toast } = useToast();

  const [externalCount, setExternalCount] = useState<number | null>(null);
  const [collegeRepsCount, setCollegeRepsCount] = useState<number | null>(null);
  const [upcomingDefencesCount, setUpcomingDefencesCount] = useState<number | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);



  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  const extract = (r: any) => r?.data?.count ?? r?.data?.data ?? r?.data ?? null;
  const toFiniteNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoadingCounts(true);
        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        const [extRes, repsRes, upcomingRes] = await Promise.all([
          axios.get(`${baseUrl}/dashboard/count/external-examiners`),
          axios.get(`${baseUrl}/dashboard/count/college-reps`),
          axios.get(`${baseUrl}/dashboard/upcoming-defences`), // adjust if your actual path differs
        ]);

        setExternalCount(toFiniteNumber(extract(extRes)));
        setCollegeRepsCount(toFiniteNumber(extract(repsRes)));

        const upcomingRaw = extract(upcomingRes);
        if (Array.isArray(upcomingRaw)) {
          setUpcomingDefencesCount(upcomingRaw.length);
        } else {
          setUpcomingDefencesCount(toFiniteNumber(upcomingRaw));
        }
      } catch (err) {
        console.error("Failed to load provost dashboard counts", err);
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
  }, [token, user]);

  return (
    <div className="space-y-6 px-4 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-800">
          Welcome, Provost 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Here’s an overview of your school-wide responsibilities
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* External Examiners */}
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 border border-gray-100 hover:shadow-lg transition-all">
          <div className="bg-amber-50 p-3 rounded-full">
            <UserPlus className="w-10 h-10 text-amber-700" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-500">External Examiners</div>
            <div className="text-xl font-semibold text-gray-800">
              {loadingCounts ? "…" : externalCount ?? "-"}
            </div>
            <div className="text-sm text-gray-400">added across departments</div>
          </div>
        </div>

        {/* Final Defenses */}
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 border border-gray-100 hover:shadow-lg transition-all">
          <div className="bg-amber-50 p-3 rounded-full">
            <Calendar className="w-10 h-10 text-amber-700" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-500">Scheduled Defenses</div>
            <div className="text-xl font-semibold text-gray-800">
              {loadingCounts ? "…" : upcomingDefencesCount ?? "-"}
            </div>
            <div className="text-sm text-gray-400">scheduled defence</div>
          </div>
        </div>

        {/* College Reps */}
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 border border-gray-100 hover:shadow-lg transition-all">
          <div className="bg-amber-50 p-3 rounded-full">
            <Users className="w-10 h-10 text-amber-700" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-500">College Reps</div>
            <div className="text-xl font-semibold text-gray-800">
              {loadingCounts ? "…" : collegeRepsCount ?? "-"}
            </div>
            <div className="text-sm text-gray-400">assigned from lecturers</div>
          </div>
        </div>


      </div>

      <div className="flex justify-end">
        <Button
          className="bg-amber-700 text-white w-full sm:w-auto py-2 px-4 text-sm sm:text-base rounded-md transition hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2"
          onClick={onCreateSessionClick}
        >
          + New Session
        </Button>
      </div>
    </div>
  );
}
