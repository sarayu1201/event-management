import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendOtp, verifyOtp } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: location.state?.phone || "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Full Name is required.");
      return;
    }

    const cleanPhone = form.phone.replace(/[\s\-\(\)\+]/g, "");
    const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    setSubmitting(true);
    try {
      await sendOtp(form.phone);
      setOtpSent(true);
      setTimer(30);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.otp || form.otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP code.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await verifyOtp({
        phone: form.phone,
        otp: form.otp,
        name: form.name,
        email: form.email,
        role: "user",
      });

      if (res.exists) {
        navigate("/");
      } else {
        setError("Failed to register account. Please check your OTP.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Invalid OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2>Create your account</h2>
        <p className="sub">Sign up to start booking tickets to premium events</p>

        {error && <div className="alert alert-error">{error}</div>}

        {!otpSent ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                name="name" 
                required 
                value={form.name} 
                onChange={onChange} 
                placeholder="Your name" 
              />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-dim)" }}>+91</span>
                <input
                  name="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={onChange}
                  placeholder="9876543210"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email Address (optional)</label>
              <input 
                type="email" 
                name="email" 
                value={form.email} 
                onChange={onChange} 
                placeholder="you@example.com" 
              />
            </div>
            <button className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Enter 6-Digit OTP</label>
              <input
                type="text"
                name="otp"
                required
                maxLength={6}
                value={form.otp}
                onChange={onChange}
                placeholder="######"
                style={{ letterSpacing: "12px", textAlign: "center", fontSize: "20px", fontWeight: "bold" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px", fontSize: "13px" }}>
                {timer > 0 ? (
                  <span style={{ color: "var(--text-dim)" }}>Resend in {timer}s</span>
                ) : (
                  <span 
                    onClick={handleSendOtp} 
                    style={{ color: "var(--purple)", cursor: "pointer", fontWeight: "600" }}
                  >
                    Resend OTP
                  </span>
                )}
              </div>
            </div>
            <button className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Creating account..." : "Verify & Sign Up"}
            </button>
          </form>
        )}

        <div className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
