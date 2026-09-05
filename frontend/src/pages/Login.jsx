import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(form.email, form.password);
      navigate("/requests");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-md max-w-sm mx-auto mt-10">
      <div className="card-body">
        <h2 className="card-title">Log in</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            className="input input-bordered"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input input-bordered"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <div className="text-right -mt-1">
            <Link to="/forgot-password" className="link link-hover text-xs text-base-content/60">
              Forgot password?
            </Link>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
          {error && <div className="alert alert-error text-sm">{error}</div>}
        </form>
        <p className="text-sm mt-2">
          No account? <Link to="/signup" className="link link-primary">Sign up</Link>
        </p>
      </div>
    </div>
  );
}