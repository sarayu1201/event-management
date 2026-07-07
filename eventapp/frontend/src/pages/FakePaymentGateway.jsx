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
  const [gateway, setGateway] = useState("cashfree"); // cashfree, stripe, razorpay

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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    setError("");
    setProcessing(true);
    try {
      if (gateway === "cashfree") {
        const { data } = await api.post(`/payment/create-session/${bookingId}`);
        if (!window.Cashfree) {
          throw new Error("Cashfree SDK not loaded. Check internet connection.");
        }
        const mode = (data.cfEnv || "").toLowerCase() === "production" ? "production" : "sandbox";
        const cashfree = window.Cashfree({ mode });
        await cashfree.checkout({ paymentSessionId: data.paymentSessionId });
      } 
      
      else if (gateway === "stripe") {
        const { data } = await api.post("/payment/stripe/create-session", { bookingId });
        if (data.mock) {
          navigate(`/payment/mock-checkout?gateway=stripe&booking_id=${bookingId}&amount=${booking.totalAmount}`);
        } else {
          window.location.href = data.url;
        }
      } 
      
      else if (gateway === "razorpay") {
        const { data } = await api.post("/payment/razorpay/create-order", { bookingId });
        if (data.mock) {
          navigate(`/payment/mock-checkout?gateway=razorpay&booking_id=${bookingId}&amount=${booking.totalAmount}`);
        } else {
          const loaded = await loadRazorpayScript();
          if (!loaded) {
            throw new Error("Razorpay SDK failed to load.");
          }

          const options = {
            key: data.keyId,
            amount: data.amount,
            currency: "INR",
            name: "EventHub Booking",
            description: `Ticket for ${booking.event?.title}`,
            order_id: data.orderId,
            handler: async (response) => {
              try {
                await api.post("/payment/verify-gateway", {
                  bookingId,
                  gateway: "razorpay",
                  transactionId: response.razorpay_payment_id,
                  status: "success"
                });
                navigate(`/payment/status?gateway=razorpay&booking_id=${bookingId}&status=success`);
              } catch (err) {
                setError("Payment verification failed.");
              }
            },
            prefill: {
              name: booking.user?.name || "",
              contact: booking.user?.phone || ""
            },
            theme: {
              color: "#ec1e79"
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
          setProcessing(false);
        }
      }
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
          <strong>EventHub Secure Pay</strong>
          <span className="lock">🔒 SSL Encryption</span>
        </div>

        <div className="card-visual" style={{ background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", minHeight: 120 }}>
          <div className="num" style={{ fontSize: 18, letterSpacing: 1 }}>
            {booking.event?.title || "Event Booking"}
          </div>
          <div className="row" style={{ marginTop: 15 }}>
            <span>{booking.seats} Seat(s) ({booking.ticketTypeName || "Regular"})</span>
            <span>₹{booking.totalAmount}</span>
          </div>
        </div>

        {/* Gateway Selector */}
        <div style={{ marginTop: 20 }}>
          <label style={{ fontSize: 13, fontWeight: "600", color: "var(--text-dim)", display: "block", marginBottom: 8 }}>
            Choose Payment Method
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            
            <label style={{ 
              display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 8, 
              border: `1px solid ${gateway === "cashfree" ? "var(--pink)" : "var(--border)"}`, 
              background: gateway === "cashfree" ? "rgba(236,30,121,0.03)" : "var(--surface-2)", cursor: "pointer" 
            }}>
              <input type="radio" name="gateway" checked={gateway === "cashfree"} onChange={() => setGateway("cashfree")} />
              <div>
                <strong>Cashfree Payments</strong>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Cards, UPI, Netbanking, Wallets</div>
              </div>
            </label>

            <label style={{ 
              display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 8, 
              border: `1px solid ${gateway === "stripe" ? "var(--pink)" : "var(--border)"}`, 
              background: gateway === "stripe" ? "rgba(236,30,121,0.03)" : "var(--surface-2)", cursor: "pointer" 
            }}>
              <input type="radio" name="gateway" checked={gateway === "stripe"} onChange={() => setGateway("stripe")} />
              <div>
                <strong>Stripe Gateway (International)</strong>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Sleek, global checkout portal</div>
              </div>
            </label>

            <label style={{ 
              display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 8, 
              border: `1px solid ${gateway === "razorpay" ? "var(--pink)" : "var(--border)"}`, 
              background: gateway === "razorpay" ? "rgba(236,30,121,0.03)" : "var(--surface-2)", cursor: "pointer" 
            }}>
              <input type="radio" name="gateway" checked={gateway === "razorpay"} onChange={() => setGateway("razorpay")} />
              <div>
                <strong>Razorpay Checkout</strong>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Fastest UPI & Netbanking gateway</div>
              </div>
            </label>

          </div>
        </div>

        <div className="price-total" style={{ margin: "20px 0 16px 0", borderTop: "1px dashed var(--border)", paddingTop: 14 }}>
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
              <span className="spinner" /> Redirecting...
            </>
          ) : (
            `Pay ₹${booking.totalAmount} via ${gateway.charAt(0).toUpperCase() + gateway.slice(1)}`
          )}
        </button>
      </div>
    </div>
  );
};

export default FakePaymentGateway;
