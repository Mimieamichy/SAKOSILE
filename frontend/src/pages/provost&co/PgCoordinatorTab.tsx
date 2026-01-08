import { useState, useEffect } from "react";

import { useAuthStore } from "@/store/authStore";
import { Role } from "@/config/roles";

interface PGCoordinator {
  id: string;
  name: string;
}

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function PgCoordinatorTab() {
  const { token, user, hasRole } = useAuthStore();
  const isHod = hasRole(Role.HOD);

  
  const [currentCord, setCurrentCord] = useState<PGCoordinator | null>(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCoordinators() {
      setLoading(true);
      try {
        const res = await fetch(`${baseUrl}/lecturer/department`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const { data } = await res.json();
        console.log("raw payload:", data);
        // filter by user.roles includes 'pg_coordinator'
        const pgList: PGCoordinator[] = data
          .filter((item: any) => {
            const roles: string[] = Array.isArray(item.user?.roles)
              ? item.user.roles
              : [];
            return roles.some(
              (r) =>
                r.toLowerCase() === Role.PG_COORDINATOR ||
                r.toLowerCase() === "pgcord" ||
                r.toLowerCase() === "pg_coordinator" ||
                r.toLowerCase() === "pgcoordinator"
            );
          })
          .map((item: any) => ({
            id: item._id,
            name: `${item.user.title} ${item.user.firstName} ${item.user.lastName}`,
          }));
        console.log("pgcord filtered:", pgList);
        
        setCurrentCord(pgList[0] || null);
      } catch (err) {
        console.error("Error fetching PG Coordinators:", err);
      } finally {
        setLoading(false);
      }
    }
    if (isHod) fetchCoordinators();
  }, [isHod, token]);

  if (!isHod) return null;

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
        PG Coordinator
      </h2>

      <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : currentCord ? (
          <>
            <div>
              <p className="text-sm text-gray-500">Current Coordinator:</p>
              <p className="mt-1 text-lg font-medium text-gray-800 capitalize">
                {currentCord.name}
              </p>
            </div>
          </>
        ) : (
          <p className="text-gray-600">No PG Coordinators assigned.</p>
        )}
      </div>
    </div>
  );
}
