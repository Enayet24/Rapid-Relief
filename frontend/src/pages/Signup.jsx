import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "citizen" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(form);
      navigate("/requests");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-md max-w-sm mx-auto mt-10">
      <div className="card-body">
        <h2 className="card-title">Sign up</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input name="name" placeholder="Full name" className="input input-bordered" value={form.name} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" className="input input-bordered" value={form.email} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" className="input input-bordered" value={form.password} onChange={handleChange} required />
          <select name="role" className="select select-bordered" value={form.role} onChange={handleChange}>
            <option value="citizen">Citizen</option>
            <option value="volunteer">Volunteer</option>
          </select>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </button>
          {error && <div className="alert alert-error text-sm">{error}</div>}
        </form>
        <p className="text-sm mt-2">
          Already have an account? <Link to="/login" className="link link-primary">Log in</Link>
        </p>
      </div>
    </div>
  );
}