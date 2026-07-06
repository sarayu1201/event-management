const Refunds = () => {
  return (
    <div className="section" style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <h2 className="section-title">Refunds & Cancellations</h2>
      
      <div className="card-panel" style={{ fontSize: 14, lineHeight: "1.7", color: "var(--text-dim)" }}>
        <p style={{ color: "#fff", fontSize: 15 }}>
          Our goal at EventHub is to make event booking as easy and clear as possible. Please review our refunds and cancellations policy before purchasing tickets.
        </p>

        <h3 style={{ color: "#fff", marginTop: 24, fontSize: 16 }}>1. Ticket Cancellation by Attendee</h3>
        <p>
          Unless explicitly stated otherwise by the event organiser on the event details page, all tickets booked on EventHub are non-refundable and cannot be cancelled once purchase is completed. Tickets cannot be exchanged or transferred to other events.
        </p>

        <h3 style={{ color: "#fff", marginTop: 24, fontSize: 16 }}>2. Event Cancellation or Postponement</h3>
        <p>
          If an event is cancelled or postponed by the organiser due to unforeseen circumstances, attendees will be notified via the email address registered during booking. 
          In case of cancellation, you will receive a full refund of the face value of the ticket. Refunds will be processed back to the original source payment method (e.g. UPI, Card, Net Banking) via Cashfree within 5 to 7 working days.
        </p>

        <h3 style={{ color: "#fff", marginTop: 24, fontSize: 16 }}>3. Processing Fees</h3>
        <p>
          Please note that convenience fees, booking fees, or payment gateway transaction charges are generally non-refundable unless specified.
        </p>

        <h3 style={{ color: "#fff", marginTop: 24, fontSize: 16 }}>4. How to Request Refund Assistance</h3>
        <p>
          For any issues or support regarding cancelled events, please reach out to us:
          <br />
          ✉️ **Email Support**: support@eventhub.com
          <br />
          📞 **Phone Support**: +91 98765 00000
        </p>

        <p style={{ marginTop: 32, fontSize: 12, color: "var(--text-dim)", textAlign: "center" }}>
          Last updated: July 2026
        </p>
      </div>
    </div>
  );
};

export default Refunds;
