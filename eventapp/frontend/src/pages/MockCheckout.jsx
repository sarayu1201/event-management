import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

const MockCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const gateway = searchParams.get("gateway") || "stripe";
  const bookingId = searchParams.get("booking_id") || "";
  const amount = searchParams.get("amount") || "0";

  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("123");
  const [upiId, setUpiId] = useState("success@pay");

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setProcessing(true);

    try {
      const response = await api.post("/payment/verify-gateway", {
        bookingId,
        gateway,
        status: "success",
        transactionId: `TXN_MOCK_${gateway.toUpperCase()}_${Date.now()}`
      });

      if (response.data?.booking) {
        navigate(`/payment/status?gateway=${gateway}&booking_id=${bookingId}&status=success`);
      } else {
        throw new Error("Failed to verify mock payment");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Mock payment confirmation failed.");
      setProcessing(false);
    }
  };

  return (
    <div className="payment-shell">
      <div className="payment-card">
        <div className="payment-provider-header" style={{ borderBottom: "1px dashed var(--border)", pb: 12 }}>
          <strong>🧪 Sandbox Portal</strong>
          <span style={{ background: "rgba(236,30,121,0.1)", color: "var(--pink)", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: "bold" }}>
            MOCK MODE
          </span>
        </div>

        <div style={{ margin: "16px 0", fontSize: 14 }}>
          You are simulating a secure payment of <strong style={{ color: "var(--success)", fontSize: 16 }}>₹{amount}</strong> using{" "}
          <strong>{gateway.toUpperCase()}</strong>.
        </div>

        <form onSubmit={handleSubmit}>
          {gateway === "stripe" ? (
            <div>
              <h4 style={{ margin: "0 0 10px 0", fontSize: 13, color: "var(--text-dim)" }}>Stripe Test Card Details</h4>
              <div className="form-group">
                <label>Card Number</label>
                <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input value={expiry} onChange={(e) => setExpiry(e.target.value)} required placeholder="MM/YY" />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input type="password" value={cvv} onChange={(e) => setCvv(e.target.value)} required placeholder="123" />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h4 style={{ margin: "0 0 10px 0", fontSize: 13, color: "var(--text-dim)" }}>Razorpay UPI Simulator</h4>
              <div className="form-group">
                <label>UPI ID (VPA)</label>
                <input value={upiId} onChange={(e) => setUpiId(e.target.value)} required placeholder="e.g. user@okaxis" />
              </div>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary btn-block" style={{ height: 48, marginTop: 14 }} disabled={processing}>
            {processing ? "Confirming transaction..." : `Authorise & Pay ₹${amount}`}
          </button>
        </form>

        <button 
          onClick={() => navigate(`/payment/${bookingId}`)}
          className="btn btn-outline btn-block" 
          style={{ marginTop: 10, borderColor: "transparent", background: "none" }}
        >
          Cancel and go back
        </button>
      </div>
    </div>
  );
};

export default MockCheckout;
