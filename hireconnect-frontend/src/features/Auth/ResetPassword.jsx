import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const token = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get("token") || "";
    }, [location.search]);

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!token) {
            setError("Invalid or missing reset token.");
            return;
        }

        if (!newPassword || newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await res.json();
            if (!res.ok || !data?.success) {
                setError("Unable to reset password. Please try again.");
                return;
            }

            setSuccess("Password reset successful. You can now log in.");
        } catch (_err) {
            setError("Unable to reset password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F7FF] px-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-md p-6">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Enter a new password for your account.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/70 focus:border-[#011A8B]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#011A8B]/70 focus:border-[#011A8B]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-2.5 rounded-full bg-[#011A8B] text-white font-semibold text-sm shadow-md hover:bg-[#010E5C] transition disabled:opacity-70"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                {success && (
                    <p className="mt-4 text-xs text-green-600 text-center">{success}</p>
                )}
                {error && (
                    <p className="mt-4 text-xs text-red-600 text-center">{error}</p>
                )}

                <div className="mt-6 text-center text-xs text-slate-500">
                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="text-[#011A8B] hover:underline"
                    >
                        Back to login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
