// src/pages/ForgetPassword.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${baseUrl}/auth/forget-password`,
        { email }
      );
      toast({
        title: "Check your inbox",
        description: "If that email is registered, you’ll receive reset instructions.",
      });
      navigate("/signin");
    } catch (err) {
      console.error("Forget password request failed", err);
      toast({
        title: "Error",
        description: "Unable to send reset email. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* optionally show a branding side image on lg */}
      <div
        className="hidden lg:block lg:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url('/images/bg.jpg')` }}
      />
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6">
          <h1 className="text-3xl font-semibold text-gray-800">Forgot Password</h1>
          <p className="text-gray-600">
            Enter your email and we’ll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Email address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-700 hover:bg-amber-800 text-white py-3 text-lg"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Remembered?{" "}
              <Link to="/signin" className="text-amber-700 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
