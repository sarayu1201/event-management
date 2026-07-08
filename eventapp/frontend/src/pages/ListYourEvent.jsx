import { useNavigate } from "react-router-dom";

const ListYourEvent = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: "#000000", color: "#ffffff", minHeight: "100vh", fontFamily: "sans-serif" }}>
      
      {/* HERO BANNER SECTION */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "80px 24px 60px",
        textAlign: "left",
        position: "relative"
      }}>
        <h1 style={{
          fontSize: "clamp(3rem, 7vw, 5.5rem)",
          fontWeight: "800",
          lineHeight: "1.05",
          letterSpacing: "-2px",
          margin: "0 0 24px 0",
          textTransform: "uppercase"
        }}>
          GROW <span style={{ fontStyle: "italic", fontWeight: "300", WebkitTextStroke: "1px #ffffff", color: "transparent" }}>YOUR</span> <br />
          EVENTS EMPIRE
        </h1>
        
        <p style={{
          fontSize: "18px",
          color: "var(--text-dim)",
          lineHeight: "1.6",
          maxWidth: "600px",
          margin: "0 0 40px 0"
        }}>
          More than just a ticket system, our innovative ticketing and marketing engine is purpose built 
          to accelerate your brand's growth and help take your events business to the next level.
        </p>

        {/* SPINNING BADGE SIMULATION / GET STARTED TRIGGER */}
        <div 
          onClick={() => navigate("/organiser/login")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "16px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            padding: "16px 28px",
            borderRadius: "50px",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--pink)";
            e.currentTarget.style.background = "rgba(236, 30, 121, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          }}
        >
          <span style={{ fontSize: "16px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
            Get Started Now
          </span>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            background: "#ffffff",
            color: "#000000",
            borderRadius: "50%",
            fontSize: "18px",
            fontWeight: "bold"
          }}>
            ↗
          </span>
        </div>
      </div>

      {/* TICKETS & ATTENDEE STRIP BANNER */}
      <div style={{
        background: "#000000",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "16px 0",
        overflow: "hidden",
        whiteSpace: "nowrap"
      }}>
        <div style={{
          display: "inline-block",
          fontSize: "14px",
          fontWeight: "bold",
          letterSpacing: "2px",
          textTransform: "uppercase",
          opacity: 0.8
        }}>
          🎫 AND COUNTING &nbsp;•&nbsp; 🚀 30,000+ EVENT ORGANISERS &nbsp;•&nbsp; 🎟️ AND COUNTING &nbsp;•&nbsp; 🚀 30,000+ EVENT ORGANISERS &nbsp;•&nbsp; 🎫 AND COUNTING
        </div>
      </div>

      {/* DETAILED FEATURES GRID */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "80px 24px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "40px"
      }}>
        
        {/* Feature 1 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "14px", color: "var(--pink)", fontWeight: "bold" }}>01. SELL TICKETS</div>
          <h3 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>OPTIMIZED CHECKOUTS</h3>
          <p style={{ color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
            Increase conversions and give your customers a premium buying experience. Our optimized, 
            intuitive ticketing and marketing features give you everything you need to maximize ticket sales.
          </p>
        </div>

        {/* Feature 2 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "14px", color: "var(--pink)", fontWeight: "bold" }}>02. BUILD A FOLLOWING</div>
          <h3 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>FAN RETENTION</h3>
          <p style={{ color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
            Grow your audience with every ticket you sell. Every time a customer purchases a ticket to your event, 
            they become part of your following, giving you a stronger foundation to launch your next event.
          </p>
        </div>

      </div>

      {/* CORE CAPABILITIES GRID */}
      <div style={{
        background: "var(--surface-2)",
        borderTop: "1px solid var(--border)",
        padding: "80px 24px"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "40px"
        }}>
          <div>
            <h4 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", textTransform: "uppercase" }}>
              Sell Tickets
            </h4>
            <p style={{ color: "var(--text-dim)", lineHeight: "1.6", fontSize: "14px" }}>
              Our ticketing experience is optimized for you and your customers. Our web pages are designed 
              for speed and search, so your events are found quicker, and customers checkout faster.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", textTransform: "uppercase" }}>
              Market Your Events
            </h4>
            <p style={{ color: "var(--text-dim)", lineHeight: "1.6", fontSize: "14px" }}>
              Reach more customers with our unique promotional tools. Integrate with the most popular 
              ad and analytics platforms so you can optimize all your marketing channels.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", textTransform: "uppercase" }}>
              Manage Operations
            </h4>
            <p style={{ color: "var(--text-dim)", lineHeight: "1.6", fontSize: "14px" }}>
              Get customers through the door faster with robust scanning integrations, gate check-in logs feeds, 
              and scanner assignments.
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM CALL TO ACTION */}
      <div style={{
        textAlign: "center",
        padding: "100px 24px",
        borderTop: "1px solid var(--border)"
      }}>
        <h2 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "30px" }}>
          Ready to Host Your Next Event?
        </h2>
        <button 
          onClick={() => navigate("/organiser/login")}
          className="btn btn-primary"
          style={{ padding: "16px 40px", fontSize: "16px" }}
        >
          Create Event Now
        </button>
      </div>

    </div>
  );
};

export default ListYourEvent;
