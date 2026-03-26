import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import RoleBasedControl from "@/components/auth/RoleBasedControl";
import { Role } from "@/config/roles";
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
import CreateSession from "./provost&co/CreateSession";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function DashboardShell() {
  const { user, logout, token } = useAuthStore();
  const { hasRole } = useAuthStore();

  const isHod = hasRole(Role.HOD);
  const isProvost = hasRole(Role.PROVOST);
  const isFacultyRep = hasRole(Role.FACULTY_PG_REP);
  const userName = user?.userName;

  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
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

  const navItems = [
    {
      label: "Portal Overview",
      path: isProvost ? "/portal/provost-overview" : "/portal/overview",
      show: true,
    },
    {
      label: isProvost
        ? "External Examiners"
        : isHod
        ? "PG Coordinators & Lecturers"
        : "Students & Lecturers",
      path: isProvost ? "/portal/external-examiners" : "/portal/pg-lecturers",
      show: true,
    },
    {
      label: "Student Management",
      path: "/portal/student-management",
      show: true,
    },
    {
      label: "My Students",
      path: "/portal/my-students",
      show: true,
    },
    {
      label: "Activity Log",
      path: "/portal/activity-log",
      show: isHod || isProvost,
    },
    {
      label: "Defense Page",
      path: "/portal/defense-day",
      show: true,
    },
    {
      label: "Faculty Score Sheets",
      path: "/portal/faculty-score-sheets",
      show: isFacultyRep,
    },
    {
      label: "Notifications",
      path: "/portal/notifications",
      show: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center relative">
        <div className="flex items-center gap-4">
          <Menu
            className="w-6 h-6 text-gray-600 cursor-pointer"
            onClick={() => setIsMenuOpen((o) => !o)}
          />
          <span className="text-gray-700 capitalize">Welcome to {isProvost ? 'Provost' : isHod ? 'HOD' : isFacultyRep ? 'Faculty Rep' : 'PG'} Portal</span>
        </div>

        {/* Side‑menu */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute top-16 left-4 bg-white shadow-lg rounded-lg p-4 w-64 z-10"
          >
            <ul className="space-y-2 text-gray-700">
              {navItems.map(
                (item) =>
                  item.show && (
                    <li
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsMenuOpen(false);
                      }}
                      className={`cursor-pointer hover:text-amber-700 ${
                        location.pathname === item.path ? "text-amber-700 font-bold" : ""
                      }`}
                    >
                      {item.label}
                    </li>
                  )
              )}
            </ul>
          </div>
        )}

        {/* Right‑side icons */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell
              className="w-6 h-6 text-gray-600 cursor-pointer"
              onClick={() => navigate("/portal/notifications")}
            />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 cursor-pointer -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium leading-none text-white bg-amber-600 rounded-full"
                aria-label={`${unreadCount} unread notifications`}
                onClick={() => navigate("/portal/notifications")}
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
      <main className="container mx-auto px-4 py-8">
        <Outlet context={{ setSessionModalOpen }} />
      </main>

      {/* Create Session Modal (HOD only) */}
      {(isHod || isProvost) && (
        <CreateSession
          isOpen={sessionModalOpen}
          onClose={() => setSessionModalOpen(false)}
          onCreated={() => {
            /* ... */
          }}
        />
      )}

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
