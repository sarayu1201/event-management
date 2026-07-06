import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, failed
  const [errorMsg, setErrorMsg] = useState("");
  const [bookingId, setBookingId] = useState("");

  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (!orderId) {
      setStatus("failed");
      setErrorMsg("Order reference ID is missing.");
      return;
    }

    const bId = orderId.split("_")[0];
    setBookingId(bId);

    // Call backend to verify the status
    api
      .post("/payment/verify", { order_id: orderId })
      .then(({ data }) => {
        setStatus("success");
        // Redirect to booking confirmation after a short delay
        setTimeout(() => {
          navigate(`/booking-confirmation/${bId}`);
        }, 2000);
      })
      .catch((err) => {
        setStatus("failed");
        setErrorMsg(err.response?.data?.message || "Verification failed. Cashfree might be processing your transaction.");
      });
  }, [orderId, navigate]);

  return (
    <div className="payment-shell">
      <div className="payment-card" style={{ textAlign: "center", padding: "40px 20px" }}>
        {status === "verifying" && (
          <div>
            <div className="spinner" style={{ width: 40, height: 40, border: "3px solid var(--primary-light)", borderTopColor: "var(--primary)", margin: "0 auto 20px" }} />
            <h3>Verifying Payment</h3>
            <p style={{ color: "var(--text-dim)", marginTop: 8 }}>
              Please do not refresh this page or click back. We are checking the transaction status with Cashfree.
            </p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div style={{ fontSize: 48, color: "#10b981", marginBottom: 16 }}>✔️</div>
            <h3>Payment Successful!</h3>
            <p style={{ color: "var(--text-dim)", marginTop: 8 }}>
              Thank you! Your payment has been received and verified. Redirecting to your tickets...
            </p>
          </div>
        )}

        {status === "failed" && (
          <div>
            <div style={{ fontSize: 48, color: "#ef4444", marginBottom: 16 }}>⚠️</div>
            <h3>Payment Verification Failed</h3>
            <p style={{ color: "#ef4444", marginTop: 8, fontSize: 14 }}>{errorMsg}</p>
            <p style={{ color: "var(--text-dim)", marginTop: 12, fontSize: 13 }}>
              If your amount was debited, it will be refunded, or you can contact support.
            </p>
            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
              {bookingId && (
                <button className="btn btn-primary" onClick={() => navigate(`/payment/${bookingId}`)}>
                  Try Payment Again
                </button>
              )}
              <button className="btn btn-outline" onClick={() => navigate("/my-bookings")}>
                Go to My Bookings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
