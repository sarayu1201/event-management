const Privacy = () => {
  return (
    <div className="section" style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <h2 className="section-title">Privacy Policy</h2>
      
      <div className="card-panel" style={{ fontSize: 14, lineHeight: "1.7", color: "var(--text-dim)" }}>
        <p style={{ color: "#fff", fontSize: 15 }}>
          EventHub is committed to protecting your personal data and privacy. This Privacy Policy describes how we collect, store, and process your information when you use our platform.
        </p>

        <h3 style={{ color: "#fff", marginTop: 24, fontSize: 16 }}>1. Information We Collect</h3>
        <p>
          We collect personal data that you provide to us directly during account registration, ticket booking, or event listing creation. This includes:
          <br />
          - **Account Data**: Name, email address, password, role, and optional phone number.
          *   **Organiser Data**: Company name, contact details.
          *   **Promoter Data**: Promo codes, payout settings.
          *   **Booking Data**: Number of seats, event references, transaction status, and total payable amount.
        </p>

        <h3 style={{ color: "#fff", marginTop: 24, fontSize: 16 }}>2. Payment Information Security</h3>
        <p>
          All transaction payments are processed securely via our payment gateway provider, Cashfree. EventHub **does not** collect, store, or transmit sensitive credit/debit card numbers, CVVs, net banking credentials, or UPI PINs. All financial interactions occur within Cashfree's secure environments.
        </p>

        <h3 style={{ color: "#fff", marginTop: 24, fontSize: 16 }}>3. How We Use Your Information</h3>
        <p>
          We use your data to:
          <br />
          - Facilitate event bookings and deliver ticketing confirmations.
          <br />
          - Audit transaction history and calculate promoter referrals.
          <br />
          - Allow organisers to moderate event admissions at physical venues.
          <br />
          - Block malicious activities and enforce platform security.
        </p>

        <h3 style={{ color: "#fff", marginTop: 24, fontSize: 16 }}>4. Data Protection</h3>
        <p>
          We use administrative, technical, and physical security measures to protect your personal data. We do not sell or trade your data with external marketing agencies. Data is shared only with event organisers for admission purposes.
        </p>

        <h3 style={{ color: "#fff", marginTop: 24, fontSize: 16 }}>5. Contact Information</h3>
        <p>
          If you have questions regarding your data privacy, you can contact us at **support@eventhub.com**.
        </p>

        <p style={{ marginTop: 32, fontSize: 12, color: "var(--text-dim)", textAlign: "center" }}>
          Last updated: July 2026
        </p>
      </div>
    </div>
  );
};

export default Privacy;
