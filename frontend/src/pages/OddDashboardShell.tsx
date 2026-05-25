// src/DashboardShell.tsx
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Menu, Power, Bell, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/lib/notificationStore";
import UpdatePasswordModal from "./UpdatePasswordModal";
import DefenseDayPage from "./DefenseDayPage";
import NotificationCenter from "./NotificationCenter";
import FacultyScoreSheets from "./faculty/FacultyScoreSheets";
import { useNavigate } from "react-router-dom";
import { Role } from "@/config/roles";
export type DashboardView = "notifications" | "defenseDay" | "facultyScoreSheets";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function OddDashboardShell() {
  const { user, logout, token, hasRole } = useAuthStore();
  const userName = user?.userName || "User";

  const isFacultyRep = hasRole(Role.FACULTY_PG_REP);
  const isSupervisor = hasRole([Role.SUPERVISOR, Role.MAJOR_SUPERVISOR]);

  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<DashboardView>("defenseDay");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const notifications = useNotificationStore((s) => s.notifications);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMenuOpen]);

  useEffect(() => {
    if (token) {
      const isInitialFetch = notifications.length === 0;
      fetchNotifications({ baseUrl, token, silent: !isInitialFetch });
    }
  }, [token, fetchNotifications]);

  
  const renderView = () => {
    switch (currentView) {
      case "notifications":
        return <NotificationCenter />;

      case "defenseDay":
        return <DefenseDayPage />;
      case "facultyScoreSheets":
        return <FacultyScoreSheets onBack={() => setCurrentView("defenseDay")} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center relative">
        <div className="flex items-center gap-4">
          <Menu
            className="w-6 h-6 text-gray-600 cursor-pointer"
            onClick={() => setIsMenuOpen((o) => !o)}
          />
          <span className="text-gray-700 capitalize">Welcome, {userName}</span>
        </div>

        {/* Side‑menu */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute top-16 left-4 bg-white shadow-lg rounded-lg p-4 w-64 z-10"
          >
            <ul className="space-y-2 text-gray-700">
              
              <li
                onClick={() => {
                  setCurrentView("defenseDay");
                  setIsMenuOpen(false);
                }}
                className={`cursor-pointer hover:text-amber-700 p-2 rounded-md transition-colors ${currentView === 'defenseDay' ? 'bg-amber-50 text-amber-700 font-medium' : ''}`}
              >
                Defense Day
              </li>
              {isFacultyRep && !isSupervisor && (
                <li
                  onClick={() => {
                    setCurrentView("facultyScoreSheets");
                    setIsMenuOpen(false);
                  }}
                  className={`cursor-pointer hover:text-amber-700 p-2 rounded-md transition-colors ${currentView === 'facultyScoreSheets' ? 'bg-amber-50 text-amber-700 font-medium' : ''}`}
                >
                  Score Sheets
                </li>
              )}
              <li
                onClick={() => {
                  setCurrentView("notifications");
                  setIsMenuOpen(false);
                }}
                className={`cursor-pointer hover:text-amber-700 p-2 rounded-md transition-colors ${currentView === 'notifications' ? 'bg-amber-50 text-amber-700 font-medium' : ''}`}
              >
                Notifications
              </li>
            </ul>
          </div>
        )}

        {/* Right‑side icons */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell
              className="w-6 h-6 text-gray-600 cursor-pointer"
              onClick={() => setCurrentView("notifications")}
            />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 cursor-pointer -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium leading-none text-white bg-amber-600 rounded-full"
                aria-label={`${unreadCount} unread notifications`}
                onClick={() => setCurrentView("notifications")}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          <Lock
            className="w-6 h-6 text-gray-600 cursor-pointer"
            onClick={() => setResetModalOpen(true)}
          />
          <Power
            className="w-6 h-6 text-red-500 cursor-pointer"
            onClick={() => setLogoutModalOpen(true)}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">{renderView()}</main>

     

      {/* Reset Password Modal */}
      <UpdatePasswordModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
          </DialogHeader>
          <p className="p-4">Are you sure you want to log out?</p>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLogoutModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 text-white" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
