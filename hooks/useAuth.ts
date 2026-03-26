import { useState } from "react";
import { loginUser, registerUser } from "../services/api";
import { useAuth as useGlobalAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { user, token, loading, login: setTokenAndUser, logout } = useGlobalAuth();
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: any) => {
    setAuthLoading(true);
    setError(null);
    try {
      const data = await loginUser(credentials);
      if (data.success !== false) {
        setTokenAndUser(data.token, data.data || data);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (credentials: any) => {
    setAuthLoading(true);
    setError(null);
    try {
      const data = await registerUser(credentials);
      if (data.success !== false) {
        // According to PRD, register doesn't automatically login. Optional flow control:
        // We'll redirect to login page for them to login
        router.push("/login?registered=true");
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || "Registration failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return {
    user,
    token,
    loading: loading || authLoading,
    error,
    login,
    register,
    logout: handleLogout,
  };
}
