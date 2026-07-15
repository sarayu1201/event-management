import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const OrganiserLogin = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "");
    const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setSubmitting(true);
    try {
      await sendOtp(phone);
      setOtpSent(true);
      setTimer(30);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP code.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await verifyOtp({ phone, otp, role: "organiser" });
      if (res.exists) {
        navigate("/organiser/dashboard");
      } else {
        navigate("/organiser/signup", { state: { phone } });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2>Organiser Login</h2>
        <p className="sub">Manage your events, view check-in statistics, and withdrawals</p>

        {error && <div className="alert alert-error">{error}</div>}

        {!otpSent ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Mobile Number</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-dim)" }}>+91</span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <button className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Enter 6-Digit OTP</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
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
              {submitting ? "Verifying..." : "Verify & Login"}
            </button>
          </form>
        )}

        <div className="auth-switch">
          New organiser? <Link to="/organiser/signup" state={{ phone }}>Create an account</Link>
        </div>
      </div>
    </div>
  );
};

export default OrganiserLogin;
