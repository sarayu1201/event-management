import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        padding: "30px 20px",
        marginTop: "60px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "24px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <Link to="/contact" style={{ color: "var(--text-dim)", fontSize: "14px", fontWeight: "500" }}>
          Contact Us
        </Link>
        <Link to="/terms" style={{ color: "var(--text-dim)", fontSize: "14px", fontWeight: "500" }}>
          Terms & Conditions
        </Link>
        <Link to="/refunds" style={{ color: "var(--text-dim)", fontSize: "14px", fontWeight: "500" }}>
          Refunds & Cancellations
        </Link>
        <Link to="/privacy" style={{ color: "var(--text-dim)", fontSize: "14px", fontWeight: "500" }}>
          Privacy Policy
        </Link>
      </div>
      <p style={{ color: "var(--text-dim)", fontSize: "12px", margin: 0 }}>
        © 2026 EventHub / Sunburn Events Pvt Ltd. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
