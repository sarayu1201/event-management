import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const PromoterSignup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    promoCode: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.promoCode.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/auth/register", {
        ...form,
        role: "promoter",
      });

      localStorage.setItem("eventhub_token", data.token);
      localStorage.setItem("eventhub_user", JSON.stringify(data.user));

      alert("Promoter account registered successfully!");
      navigate("/promoter/dashboard");
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2>Promoter Registration</h2>
        <p className="sub">Register to promote events and start earning commissions</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input 
              name="name" 
              required 
              value={form.name} 
              onChange={onChange} 
              placeholder="e.g. Priya Nair" 
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email"
              name="email" 
              required 
              value={form.email} 
              onChange={onChange} 
              placeholder="you@example.com" 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password"
              name="password" 
              required 
              value={form.password} 
              onChange={onChange} 
              placeholder="••••••••" 
            />
          </div>
          <div className="form-group">
            <label>Mobile Number (Optional)</label>
            <input 
              type="tel"
              name="phone" 
              value={form.phone} 
              onChange={onChange} 
              placeholder="9876543210" 
            />
          </div>
          <div className="form-group">
            <label>Promo Code (Your Referral Code)</label>
            <input 
              name="promoCode" 
              required 
              value={form.promoCode} 
              onChange={onChange} 
              placeholder="e.g. PRIYA10" 
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Creating account..." : "Sign Up as Promoter"}
          </button>
        </form>

        <div className="auth-switch">
          Already have a promoter account? <Link to="/promoter/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default PromoterSignup;
