// src/pages/ResetPassword.tsx
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get("token") || "";
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast({ title: "Token required", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Must be ≥8 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${baseUrl}/auth/reset-password`, {
        token,
        newPassword,
      });
      toast({ title: "Success", description: "Your password has been reset." });
      navigate("/signin");
    } catch (err: any) {
      console.error("Reset failed", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Unable to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left-side illustration (optional) */}
      <div
        className="hidden lg:block lg:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url('/images/bg.jpg')` }}
      />

      {/* Right-side form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
          <h1 className="text-3xl font-semibold text-gray-800">Reset Password</h1>
          <p className="text-gray-600">
            Enter the token you received and set a new password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Token */}
            <div>
              <label className="block text-gray-700 mb-1">Reset Token</label>
              <Input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your reset token"
                required
                className="w-full"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-amber-700 hover:bg-amber-800 text-white py-3 text-lg"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Remembered?{" "}
            <Link to="/signin" className="text-amber-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
