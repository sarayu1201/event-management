import { useState } from "react";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="section" style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <h2 className="section-title">Contact Us</h2>
      <p style={{ color: "var(--text-dim)", lineHeight: "1.6", marginBottom: 30 }}>
        Have questions about tickets, event hosting, or billing? Get in touch with the EventHub support team. We're here to help.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, flexWrap: "wrap" }}>
        
        {/* Contact Info */}
        <div className="card-panel" style={{ height: "fit-content" }}>
          <h3 style={{ marginTop: 0, fontSize: 18, color: "var(--pink)" }}>Get in Touch</h3>
          
          <div style={{ margin: "20px 0" }}>
            <strong>📍 Location</strong>
            <p style={{ margin: "6px 0", color: "var(--text-dim)", fontSize: 14 }}>
              Sunburn Events Pvt Ltd / EventHub<br />
              Sector 7, Nerul, Navi Mumbai,<br />
              Maharashtra - 400706, India
            </p>
          </div>

          <div style={{ margin: "20px 0" }}>
            <strong>✉️ Email Support</strong>
            <p style={{ margin: "6px 0", color: "var(--text-dim)", fontSize: 14 }}>
              support@eventhub.com
            </p>
          </div>

          <div style={{ margin: "20px 0" }}>
            <strong>📞 Phone Contact</strong>
            <p style={{ margin: "6px 0", color: "var(--text-dim)", fontSize: 14 }}>
              +91 98765 00000
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="card-panel">
          <h3 style={{ marginTop: 0, fontSize: 18, color: "var(--purple)" }}>Send a Message</h3>
          
          {sent ? (
            <div className="alert alert-success" style={{ margin: "20px 0" }}>
              Thank you! Your message has been sent. Our team will contact you shortly.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Your Name</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea required value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type your query here..." style={{ minHeight: 120 }} />
              </div>
              <button className="btn btn-primary btn-block">Send Message</button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default Contact;
