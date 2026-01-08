// src/pages/Admin.tsx
import { useState, useEffect } from "react";
import { Power, Lock, EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddHodModal, { NewHodData } from "@/components/AddHodModal";
import AdminStaffManagement from "./AdminStaffManagement";
import UpdatePasswordModal from "./UpdatePasswordModal";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function Admin() {
  const { user, token, logout } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // 1️⃣ Inject / remove axios Authorization header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <span className="text-gray-600">
          {new Date().toLocaleDateString(undefined, {
            weekday: "short",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 uppercase">{user?.roles?.[0] || "Admin"}</span>
          <Lock
            className="w-6 h-6 text-gray-600 cursor-pointer"
            onClick={() => setResetModalOpen(true)}
          />
          <button onClick={() => setShowLogoutModal(true)}>
            <Power className="w-6 h-6 text-red-500 hover:text-red-600" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">

          <div className="flex justify-end">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-amber-700 text-white"
          >
            Add HOD, Dean or Provost
          </Button>
        </div>
        <AdminStaffManagement />

      
      </main>

      {/* Add HOD/Provost/Dean Modal */}
      <AddHodModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (payload: NewHodData) => {
          if (!token) {
            toast({ title: "Not authorized", variant: "destructive" });
            return;
          }

          // Build payload: include faculty & department for all roles (modal now provides names)
          const body: Partial<NewHodData> = {
            title: payload.title,
            firstName: payload.firstName,
            lastName: payload.lastName,
            staffId: payload.staffId,
            email: payload.email,
            role: payload.role,
            faculty: payload.faculty ?? "",
            department: payload.department ?? "",
          };

          // Choose endpoint based on role
          const endpoint =
            payload.role === "provost"
              ? "/lecturer/add-provost"
              : payload.role === "dean"
              ? "/lecturer/add-dean"
              : "/lecturer/add-hod";

          try {
            const res = await axios.post(`${baseUrl}${endpoint}`, body, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            // consider success if backend returns 200/201 or { success: true }
            const ok =
              res.status === 200 ||
              res.status === 201 ||
              (res.data &&
                (res.data.success === true || typeof res.data === "object"));

            if (!ok) {
              throw new Error(
                res.data?.message ?? `Unexpected response (${res.status})`
              );
            }

            toast({ title: "Success", description: "Staff added." });
            setIsAddModalOpen(false);

            // TODO: trigger a reload of AdminStaffManagement so the new staff appears immediately.
            // If you have a loadStaff() or refresh callback, call it here:
            // await loadStaff?.();
          } catch (err: any) {
            console.error("Add staff failed", err);
            const serverMsg =
              err?.response?.data?.message ??
              err?.message ??
              "Failed to add staff";
            toast({
              title: "Error",
              description: serverMsg,
              variant: "destructive",
            });
          }
        }}
      />

      {/* Update Password Modal */}
      <UpdatePasswordModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
      />

      {/* Logout Confirmation Modal */}
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
