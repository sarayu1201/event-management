import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

const FakePaymentGateway = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/bookings/${bookingId}`)
      .then(({ data }) => {
        setBooking(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to fetch booking details");
        setLoading(false);
      });
  }, [bookingId]);

  const handlePay = async () => {
    setError("");
    setProcessing(true);
    try {
      // 1. Create a payment session on the backend
      const { data } = await api.post(`/payment/create-session/${bookingId}`);

      // 2. Initialize Cashfree SDK
      if (!window.Cashfree) {
        throw new Error("Cashfree SDK not loaded. Please check your internet connection.");
      }

      const cashfree = window.Cashfree({
        mode: "production", // Using production as key is prod
      });

      // 3. Trigger Cashfree checkout
      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Payment initiation failed");
      setProcessing(false);
    }
  };

  if (loading) return <div className="loading-wrap">Loading booking details...</div>;
  if (!booking) return <div className="loading-wrap">Booking not found.</div>;

  return (
    <div className="payment-shell">
      <div className="payment-card">
        <div className="payment-provider-header">
          <strong>EventHub Pay</strong>
          <span className="lock">🔒 Secure Payment via Cashfree</span>
        </div>

        <div className="card-visual" style={{ background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", minHeight: 130 }}>
          <div className="num" style={{ fontSize: 20, letterSpacing: 1 }}>
            {booking.event?.title || "Event Booking"}
          </div>
          <div className="row" style={{ marginTop: 20 }}>
            <span>{booking.seats} Ticket(s)</span>
            <span>₹{booking.totalAmount}</span>
          </div>
        </div>

        <div className="price-total" style={{ margin: "20px 0" }}>
          <span>Total Amount</span>
          <span>₹{booking.totalAmount}</span>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <button
          className="btn btn-primary btn-block"
          onClick={handlePay}
          disabled={processing}
          style={{ height: 48, fontSize: 16 }}
        >
          {processing ? (
            <>
              <span className="spinner" /> Redirecting to Cashfree...
            </>
          ) : (
            `Pay ₹${booking.totalAmount} now`
          )}
        </button>

        <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 16, textAlign: "center", lineHeight: "1.4" }}>
          You will be redirected to Cashfree's secure payment gateway to complete your transaction. Supports UPI, Cards, Net Banking, and Wallets.
        </p>
      </div>
    </div>
  );
};

export default FakePaymentGateway;
