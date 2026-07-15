import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminLogin = () => {
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
      const res = await verifyOtp({ phone, otp, role: "admin" });
      if (res.exists) {
        navigate("/admin/dashboard");
      } else {
        setError("Admin registration not permitted. Please contact database administrator.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ borderTop: "4px solid #8b5cf6" }}>
        <h2 style={{ color: "#8b5cf6" }}>Super Admin Portal</h2>
        <p className="sub">Access administrative functions using your registered mobile number and OTP</p>

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
                  placeholder="9876522222"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <button className="btn btn-primary btn-block" disabled={submitting} style={{ backgroundColor: "#8b5cf6", borderColor: "#8b5cf6" }}>
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
                    style={{ color: "#8b5cf6", cursor: "pointer", fontWeight: "600" }}
                  >
                    Resend OTP
                  </span>
                )}
              </div>
            </div>
            <button className="btn btn-primary btn-block" disabled={submitting} style={{ backgroundColor: "#8b5cf6", borderColor: "#8b5cf6" }}>
              {submitting ? "Verifying..." : "Verify & Login"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
