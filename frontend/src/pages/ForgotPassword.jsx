import { useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // null | "sending" | "sent" | error string
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const { data } = await axiosClient.post("/auth/forgot-password", { email });
      setMessage(data.message);
      setStatus("sent");
    } catch (err) {
      setStatus(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="card bg-base-100 shadow-md max-w-sm mx-auto mt-10">
      <div className="card-body">
        <h2 className="card-title">Forgot Password</h2>
        <p className="text-sm text-base-content/70">
          Enter your account email and we'll send you a link to reset your password.
        </p>

        {status === "sent" ? (
          <div className="alert alert-success text-sm mt-2">{message}</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
            <input
              type="email"
              placeholder="Email"
              className="input input-bordered"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : "Send Reset Link"}
            </button>
            {status && status !== "sending" && status !== "sent" && (
              <div className="alert alert-error text-sm">{status}</div>
            )}
          </form>
        )}

        <p className="text-sm mt-2">
          Remembered your password? <Link to="/login" className="link link-primary">Log in</Link>
        </p>
      </div>
    </div>
  );
}
