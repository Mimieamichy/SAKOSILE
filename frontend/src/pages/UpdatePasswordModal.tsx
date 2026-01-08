// src/components/UpdatePasswordModal.tsx
import { useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function UpdatePasswordModal({ isOpen, onClose }: Props) {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const oldPassword = (
      form.elements.namedItem("oldPassword") as HTMLInputElement
    ).value;
    const newPassword = (
      form.elements.namedItem("newPassword") as HTMLInputElement
    ).value;

    if (!oldPassword || !newPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in both fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await axios.put(
        `${baseUrl}/user/update-password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: "Success", description: "Password updated." });
      onClose();
      console.log("Password updated successfully");
    } catch (err) {
      console.error("Password update failed", err);
      toast({
        title: "Error",
        description: "Failed to update password. Check credentials.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-lg">
        <DialogHeader>
          <DialogTitle>Update Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="relative">
            <label className="block text-sm text-gray-700 mb-1">
              Old Password
            </label>
            <input
              name="oldPassword"
              type={showOld ? "text" : "password"}
              required
              className="w-full border rounded px-3 py-2 pr-10"
              placeholder="Enter old password"
            />
            <button
              type="button"
              onClick={() => setShowOld((prev) => !prev)}
              className="absolute top-9 right-3 text-gray-500"
              tabIndex={-1}
            >
              {showOld ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="relative">
            <label className="block text-sm text-gray-700 mb-1">
              New Password
            </label>
            <input
              name="newPassword"
              type={showNew ? "text" : "password"}
              required
              className="w-full border rounded px-3 py-2 pr-10"
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowNew((prev) => !prev)}
              className="absolute top-9 right-3 text-gray-500"
              tabIndex={-1}
            >
              {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <DialogFooter className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button className="bg-amber-700 text-white" type="submit">
              Update Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
