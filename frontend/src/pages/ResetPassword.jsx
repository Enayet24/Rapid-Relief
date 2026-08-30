import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [status, setStatus] = useState(null); // null | "submitting" | "success" | error string

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      setStatus("Passwords do not match");
      return;
    }
    if (form.newPassword.length < 6) {
      setStatus("Password must be at least 6 characters");
      return;
    }

    setStatus("submitting");
    try {
      await axiosClient.post("/auth/reset-password", { token, newPassword: form.newPassword });
      setStatus("success");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setStatus(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="card bg-base-100 shadow-md max-w-sm mx-auto mt-10">
      <div className="card-body">
        <h2 className="card-title">Reset Password</h2>

        {status === "success" ? (
          <div className="alert alert-success text-sm mt-2">
            Password reset successfully. Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
            <input
              type="password"
              placeholder="New password"
              className="input input-bordered"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className="input input-bordered"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={status === "submitting"}>
              {status === "submitting" ? "Resetting..." : "Reset Password"}
            </button>
            {status && status !== "submitting" && status !== "success" && (
              <div className="alert alert-error text-sm">{status}</div>
            )}
          </form>
        )}

        <p className="text-sm mt-2">
          <Link to="/login" className="link link-primary">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
