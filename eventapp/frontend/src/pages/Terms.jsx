const Terms = () => {
  return (
    <div className="section" style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <h2 className="section-title">Terms & Conditions</h2>
      
      <div className="card-panel" style={{ fontSize: 14, lineHeight: "1.7", color: "var(--text-dim)" }}>
        <p style={{ color: "#fff", fontSize: 15 }}>
          Welcome to EventHub. By accessing our platform, booking tickets, or hosting events, you agree to comply with the following Terms and Conditions. Please read them carefully.
        </p>

        <h3 style={{ color: "#fff", marginTop: 24, fontSize: 16 }}>1. Ticket Purchases and Allocation</h3>
        <p>
          All ticket bookings made via EventHub are subject to availability and payment confirmation. Once a transaction is successfully completed, your ticket details and unique Ticket ID will be generated. All prices are listed in Indian Rupees (INR) and include applicable taxes unless stated otherwise.
        </p>

        <h3 style={{ color: "#fff", marginTop: 24, fontSize: 16 }}>2. Admission & Verification</h3>
        <p>
          You must present a valid ticket (printed or electronic copy) with a clear Ticket ID at the venue to gain admission. Organisers reserve the right to verify your identity against the attendee info provided during checkout. Some events may have age restrictions or require specific identification documents.
        </p>

        <h3 style={{ color: "#fff", marginTop: 24, fontSize: 16 }}>3. Event Hosting and Listings</h3>
        <p>
          Event Organisers are solely responsible for providing accurate details regarding event titles, category, description, venue location, date, price, and seat counts. EventHub is a ticketing platform and does not assume responsibility for event scheduling changes, cancellations, or safety measures at physical venues.
        </p>

        <h3 style={{ color: "#fff", marginTop: 24, fontSize: 16 }}>4. Referrals and Promoters</h3>
        <p>
          Promoters earn commission payouts based on successfully validated bookings matching their active promo codes. Any attempts to manipulate discount codes or execute fraudulent ticket purchases will result in promoter account deactivation and forfeiture of earnings.
        </p>

        <h3 style={{ color: "#fff", marginTop: 24, fontSize: 16 }}>5. User Accounts and Security</h3>
        <p>
          Users must keep login credentials secure. Super Administrators reserve the right to suspend or block any user account (users, organisers, promoters) that is engaged in malicious, abusive, or unauthorized activities.
        </p>

        <h3 style={{ color: "#fff", marginTop: 24, fontSize: 16 }}>6. Governing Law</h3>
        <p>
          These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of the use of this website shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
        </p>

        <p style={{ marginTop: 32, fontSize: 12, color: "var(--text-dim)", textAlign: "center" }}>
          Last updated: July 2026
        </p>
      </div>
    </div>
  );
};

export default Terms;
