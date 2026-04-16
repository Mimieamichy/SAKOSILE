import { useState, useRef, useEffect } from "react";
import { Menu, Bell, Lock, Power } from "lucide-react";
import { useNotificationStore } from "@/lib/notificationStore";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import UpdatePasswordModal from "../UpdatePasswordModal";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function PGAdminDashboardShell() {
  const { user, logout, token } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isMenuOpen]);

  useEffect(() => {
    if (token) {
      fetchNotifications({ baseUrl, token });
    }
  }, [token, fetchNotifications]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { label: "Dashboard", path: "/pg_admin/dashboard", show: true },
    { label: "Student Checklist", path: "/pg_admin/checklist", show: true },
    { label: "Student Readiness", path: "/pg_admin/readiness", show: true },
    { label: "Notifications", path: "/pg_admin/notifications", show: true },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-4 sm:px-6 py-4 flex justify-between items-center relative">
        <div className="flex items-center gap-4">
          <Menu
            className="w-6 h-6 text-gray-600 cursor-pointer"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          />
          <h1 className="text-xl font-bold text-amber-800">PG Admin Portal</h1>
        </div>
        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute top-16 left-4 bg-white shadow-lg rounded-lg p-4 w-56 z-20"
          >
            <ul className="space-y-2 text-gray-700">
              {navItems.map(
                (item) =>
                  item.show && (
                    <li
                      key={item.path}
                      className={`cursor-pointer hover:text-amber-700 p-2 rounded ${
                        location.pathname === item.path
                          ? "bg-amber-50 text-amber-700 font-bold"
                          : ""
                      }`}
                      onClick={() => {
                        navigate(item.path);
                        setIsMenuOpen(false);
                      }}
                    >
                      {item.label}
                    </li>
                  )
              )}
            </ul>
          </div>
        )}
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-gray-600">
            Welcome, {user?.userName}
          </span>
          <div className="relative">
            <Bell
              className="w-6 h-6 text-gray-600 cursor-pointer"
              onClick={() => navigate("/pg_admin/notifications")}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <Lock
            className="w-6 h-6 text-gray-600 cursor-pointer"
            onClick={() => setResetModalOpen(true)}
          />
          <Power
            className="w-6 h-6 text-red-600 cursor-pointer"
            onClick={() => setShowLogoutModal(true)}
          />
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-7xl mx-auto">
        <Outlet />
      </main>

      <UpdatePasswordModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
      />

      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="max-w-md bg-white rounded-lg">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 mt-2">
            Are you sure you want to log out?
          </p>
          <DialogFooter className="mt-6 flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 text-white" onClick={handleLogout}>
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
