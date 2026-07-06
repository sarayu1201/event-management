import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const OrganiserSignup = () => {
  const [form, setForm] = useState({ name: "", companyName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register({ ...form, role: "organiser" });
      navigate("/organiser/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2>List Your Event</h2>
        <p className="sub">Create an organiser account to sell tickets and grow your audience</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Name</label>
            <input name="name" required value={form.name} onChange={onChange} placeholder="Full name" />
          </div>
          <div className="form-group">
            <label>Company / Brand Name</label>
            <input name="companyName" required value={form.companyName} onChange={onChange} placeholder="e.g. Sunburn Events Pvt Ltd" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input name="phone" required value={form.phone} onChange={onChange} placeholder="9876543210" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" required value={form.email} onChange={onChange} placeholder="you@company.com" />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" required minLength={6} value={form.password} onChange={onChange} placeholder="At least 6 characters" />
          </div>
          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Creating account..." : "Signup"}
          </button>
        </form>

        <div className="auth-switch">
          Already have an organiser account? <Link to="/organiser/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default OrganiserSignup;
