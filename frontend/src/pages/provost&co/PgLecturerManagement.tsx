// src/hod&pgc/PgLecturerManagement.tsx
import { useState } from "react";
import PgCoordinatorTab from "./PgCoordinatorTab";
import LecturerTab from "./LecturerTab";
import AddStudentForm from "./AddStudentForm";
import { useAuthStore } from "@/store/authStore";
import { Role } from "@/config/roles";

const PgLecturerManagement = () => {
  const { user, hasRole } = useAuthStore(); // 'HOD', 'PGC', or 'PROVOST'
  const isHod = hasRole(Role.HOD);
  const isProvost = hasRole(Role.PROVOST);
  const isPgc = hasRole(Role.PG_COORDINATOR);

  // Default tab choice
  const defaultTab = isHod ? "pg" : isProvost ? "lecturers" : "students";
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          {isHod
            ? "PG Coordinator & Lecturer Management"
            : isProvost
            ? "External Examiners"
            : "Student & Lecturer"}
        </h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 space-x-2">
          {isHod && (
            <>
              <button
                onClick={() => setActiveTab("pg")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "pg"
                    ? "border-amber-700 text-amber-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                PG Coordinators
              </button>
              <button
                onClick={() => setActiveTab("lecturers")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "lecturers"
                    ? "border-amber-700 text-amber-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Lecturers
              </button>
            </>
          )}

          {!isHod && !isProvost && (
            <>
              <button
                onClick={() => setActiveTab("students")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "students"
                    ? "border-amber-700 text-amber-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Students
              </button>
              <button
                onClick={() => setActiveTab("lecturers")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "lecturers"
                    ? "border-amber-700 text-amber-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Lecturers
              </button>
            </>
          )}

          {isProvost && (
            <button
              onClick={() => setActiveTab("lecturers")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "lecturers"
                  ? "border-amber-700 text-amber-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              External Examiners
            </button>
          )}
        </div>
      </div>

      {/* Render tabs */}
      <div>
        {isHod && activeTab === "pg" && <PgCoordinatorTab />}
        {activeTab === "lecturers" && <LecturerTab />}
        {!isHod && !isProvost && activeTab === "students" && <AddStudentForm />}
      </div>
    </div>
  );
};

export default PgLecturerManagement;
