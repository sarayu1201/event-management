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
  const queryGateway = searchParams.get("gateway");
  const queryBookingId = searchParams.get("booking_id");
  const queryStatus = searchParams.get("status");

  useEffect(() => {
    // 1. Stripe/Razorpay direct mock success confirmations
    if (queryBookingId && queryStatus === "success") {
      setBookingId(queryBookingId);
      setStatus("success");
      const timer = setTimeout(() => {
        navigate(`/booking-confirmation/${queryBookingId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // 2. Cashfree payment confirmations
    if (orderId) {
      const bId = orderId.split("_")[0];
      setBookingId(bId);

      api
        .post("/payment/verify", { order_id: orderId })
        .then(() => {
          setStatus("success");
          const timer = setTimeout(() => {
            navigate(`/booking-confirmation/${bId}`);
          }, 2000);
          return () => clearTimeout(timer);
        })
        .catch((err) => {
          setStatus("failed");
          setErrorMsg(err.response?.data?.message || "Verification failed. Cashfree might be processing your transaction.");
        });
      return;
    }

    // 3. Fallback error
    setStatus("failed");
    setErrorMsg("Reference transaction identification details are missing.");
  }, [orderId, queryBookingId, queryGateway, queryStatus, navigate]);

  return (
    <div className="payment-shell">
      <div className="payment-card" style={{ textAlign: "center", padding: "40px 20px" }}>
        {status === "verifying" && (
          <div>
            <div className="spinner" style={{ width: 40, height: 40, border: "3px solid var(--primary-light)", borderTopColor: "var(--primary)", margin: "0 auto 20px" }} />
            <h3>Verifying Payment</h3>
            <p style={{ color: "var(--text-dim)", marginTop: 8 }}>
              Please do not refresh this page. We are verifying the payment status with your gateway.
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
              If your account was debited, it will be automatically credited/refunded, or you can contact support.
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
