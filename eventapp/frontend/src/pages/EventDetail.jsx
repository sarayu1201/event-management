import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [postingReview, setPostingReview] = useState(false);

  // Gallery slider state
  const [currentSlide, setCurrentSlide] = useState(0);

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Countdown timer state
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Tab state
  const [activeTab, setActiveTab] = useState("about"); // about, agenda, speakers, reviews

  // Fetch Event, Track Recently Viewed, Fetch Reviews
  useEffect(() => {
    const loadDetails = async () => {
      try {
        const { data } = await api.get(`/events/${id}`);
        setEvent(data);
        if (data.ticketTypes && data.ticketTypes.length > 0) {
          setSelectedTicketType(data.ticketTypes[0]);
        }

        // Track recently viewed
        if (user) {
          await api.post("/enterprise/recently-viewed", { eventId: id });
        }

        // Fetch reviews
        const revRes = await api.get(`/enterprise/reviews/event/${id}`);
        setReviews(revRes.data);
      } catch (err) {
        setError("Event not found or has been removed.");
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [id, user]);

  // Countdown Timer logic
  useEffect(() => {
    if (!event) return;
    const interval = setInterval(() => {
      const diff = new Date(event.date).getTime() - Date.now();
      if (diff <= 0) {
        clearInterval(interval);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setCountdown({ days, hours, minutes, seconds });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [event]);

  if (loading) return <div className="loading-wrap">Loading event details...</div>;
  if (error && !event) return <div className="section empty-state">{error}</div>;
  if (!event) return null;

  const soldOut = event.availableSeats <= 0;

  // Image Gallery setup
  const gallery = [event.bannerImage, ...(event.galleryImages || [])].filter(Boolean);

  const handleProceed = () => {
    if (!user) {
      navigate("/login", { state: { from: `/checkout/${id}` } });
      return;
    }
    if (user.role !== "user") {
      setError("Please log in with a user account to book tickets.");
      return;
    }
    navigate(`/checkout/${id}`, {
      state: {
        seats,
        ticketTypeName: selectedTicketType ? selectedTicketType.name : "General Admission"
      }
    });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!reviewText.trim()) return;

    setPostingReview(true);
    try {
      const { data } = await api.post("/enterprise/reviews", {
        eventId: id,
        rating: reviewRating,
        reviewText
      });
      setReviews([data.review, ...reviews]);
      setReviewText("");
      alert("Review posted successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Could not post review. Have you booked tickets for this event?");
    } finally {
      setPostingReview(false);
    }
  };

  const getPrice = () => {
    if (selectedTicketType) return selectedTicketType.price;
    return event.price;
  };

  return (
    <div className="section" style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* GALLERY / BANNER SLIDER */}
      <div className="details-gallery-container">
        {gallery.length > 0 ? (
          <div className="gallery-viewport">
            <img src={gallery[currentSlide]} alt={event.title} className="gallery-slide-img" />
            {gallery.length > 1 && (
              <>
                <button
                  className="gallery-nav prev"
                  onClick={() => setCurrentSlide((c) => (c - 1 + gallery.length) % gallery.length)}
                >
                  ◀
                </button>
                <button
                  className="gallery-nav next"
                  onClick={() => setCurrentSlide((c) => (c + 1) % gallery.length)}
                >
                  ▶
                </button>
                <div className="gallery-indicators">
                  {gallery.map((_, i) => (
                    <span
                      key={i}
                      className={`dot ${i === currentSlide ? "active" : ""}`}
                      onClick={() => setCurrentSlide(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <img
            className="event-hero-banner"
            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000"
            alt={event.title}
          />
        )}
      </div>

      {/* COUNTDOWN TIMER WIDGET */}
      <div className="countdown-widget">
        <span className="title">⏳ STARTS IN</span>
        <div className="timer-blocks">
          <div className="time-block">
            <span className="value">{countdown.days}</span>
            <span className="label">Days</span>
          </div>
          <div className="time-block">
            <span className="value">{countdown.hours}</span>
            <span className="label">Hrs</span>
          </div>
          <div className="time-block">
            <span className="value">{countdown.minutes}</span>
            <span className="label">Mins</span>
          </div>
          <div className="time-block">
            <span className="value">{countdown.seconds}</span>
            <span className="label">Secs</span>
          </div>
        </div>
      </div>

      <div className="event-detail-grid" style={{ marginTop: "24px" }}>
        {/* LEFT MAIN CONTENT */}
        <div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            <span className="badge">{event.category}</span>
            {event.visibility === "exclusive" && (
              <span className="badge" style={{ background: "var(--purple)" }}>Invite-Only Exclusive</span>
            )}
          </div>
          <h1 style={{ margin: "8px 0" }}>{event.title}</h1>

          {/* META ROW */}
          <div className="info-meta-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", margin: "20px 0", background: "var(--surface-2)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <div>📅 <strong>Date:</strong> {new Date(event.date).toDateString()}</div>
            <div>⏰ <strong>Time:</strong> {event.time}</div>
            <div>📍 <strong>Venue:</strong> {event.venue}, {event.city}</div>
            <div>👤 <strong>Organiser:</strong> {event.organiser?.companyName || event.organiser?.name || "Organiser"}</div>
          </div>

          {/* TABS SELECTOR */}
          <div className="tab-menu" style={{ display: "flex", gap: "20px", borderBottom: "1px solid var(--border)", marginBottom: "20px" }}>
            <button className={`tab-link ${activeTab === "about" ? "active" : ""}`} onClick={() => setActiveTab("about")}>About</button>
            {event.agenda && event.agenda.length > 0 && (
              <button className={`tab-link ${activeTab === "agenda" ? "active" : ""}`} onClick={() => setActiveTab("agenda")}>Agenda</button>
            )}
            {event.speakers && event.speakers.length > 0 && (
              <button className={`tab-link ${activeTab === "speakers" ? "active" : ""}`} onClick={() => setActiveTab("speakers")}>Speakers ({event.speakers.length})</button>
            )}
            <button className={`tab-link ${activeTab === "reviews" ? "active" : ""}`} onClick={() => setActiveTab("reviews")}>Reviews ({reviews.length})</button>
          </div>

          {/* TAB CONTENTS */}
          <div className="tab-content" style={{ minHeight: "150px" }}>
            {activeTab === "about" && (
              <>
                <p style={{ color: "var(--text-dim)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{event.description}</p>
                
                {/* CALENDAR ADD BUTTON */}
                <div style={{ marginTop: "20px" }}>
                  <a
                    href={`${api.defaults.baseURL || "/api"}/enterprise/events/${id}/ics`}
                    className="btn btn-outline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    📅 Add to Calendar (.ics)
                  </a>
                </div>

                {/* FAQS ACCORDION SECTION */}
                {event.faqs && event.faqs.length > 0 && (
                  <div style={{ marginTop: "32px" }}>
                    <h3>Frequently Asked Questions</h3>
                    <div className="faqs-accordion">
                      {event.faqs.map((faq, idx) => (
                        <div key={idx} className="faq-item" style={{ borderBottom: "1px solid var(--border)", padding: "12px 0" }}>
                          <div
                            className="faq-question"
                            style={{ display: "flex", justifyContent: "space-between", cursor: "pointer", fontWeight: "600" }}
                            onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                          >
                            <span>{faq.question}</span>
                            <span>{openFaqIndex === idx ? "−" : "+"}</span>
                          </div>
                          {openFaqIndex === idx && (
                            <div className="faq-answer" style={{ marginTop: "8px", color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.6" }}>
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DIRECTIONS & GOOGLE MAPS */}
                {event.latitude && event.longitude && (
                  <div style={{ marginTop: "32px" }}>
                    <h3>Venue Location & Directions</h3>
                    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", marginTop: 12 }}>
                      <iframe
                        title="Google Maps Location"
                        width="100%"
                        height="280"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://maps.google.com/maps?q=${event.latitude},${event.longitude}&z=15&output=embed`}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>
                        GPS: {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                      </span>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline"
                      >
                        🚗 Get Directions
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "agenda" && (
              <div className="agenda-timeline" style={{ borderLeft: "2px dashed var(--border)", paddingLeft: "20px", marginLeft: "10px" }}>
                {event.agenda.map((ag, idx) => (
                  <div key={idx} className="agenda-timeline-item" style={{ position: "relative", marginBottom: "20px" }}>
                    <div style={{ position: "absolute", left: "-27px", top: "2px", width: "12px", height: "12px", borderRadius: "50%", background: "var(--pink)" }} />
                    <span style={{ color: "var(--pink)", fontSize: "13px", fontWeight: "600" }}>{ag.time}</span>
                    <h4 style={{ margin: "4px 0" }}>{ag.title}</h4>
                    {ag.description && <p style={{ color: "var(--text-dim)", fontSize: "14px", margin: 0 }}>{ag.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "speakers" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                {event.speakers.map((sp, idx) => (
                  <div key={idx} className="card-panel" style={{ textAlign: "center" }}>
                    <img
                      src={sp.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      alt={sp.name}
                      style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px" }}
                    />
                    <h4 style={{ margin: "4px 0" }}>{sp.name}</h4>
                    <div style={{ fontSize: "12px", color: "var(--pink)", fontWeight: "500", marginBottom: "8px" }}>{sp.role}</div>
                    {sp.bio && <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: 0 }}>{sp.bio}</p>}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <h3>User Feedback</h3>
                
                {/* Review Form */}
                {user ? (
                  <form onSubmit={submitReview} style={{ marginBottom: "24px", background: "var(--surface-2)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                    <h4 style={{ margin: "0 0 12px" }}>Write a Review</h4>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
                      <label style={{ margin: 0 }}>Rating:</label>
                      <select value={reviewRating} onChange={(e) => setReviewRating(e.target.value)} style={{ width: "60px" }}>
                        <option value="5">5 ★</option>
                        <option value="4">4 ★</option>
                        <option value="3">3 ★</option>
                        <option value="2">2 ★</option>
                        <option value="1">1 ★</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Share your experience booking or attending this event..."
                      rows="3"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      required
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "var(--surface)", border: "1px solid var(--border)", color: "#fff", marginBottom: "12px" }}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={postingReview}>
                      {postingReview ? "Posting..." : "Submit Review"}
                    </button>
                  </form>
                ) : (
                  <p style={{ color: "var(--text-dim)" }}>Please <Link to="/login" style={{ color: "var(--pink)" }}>login</Link> to write a review.</p>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <div style={{ color: "var(--text-dim)" }}>No reviews yet. Be the first to leave a review!</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {reviews.map((rev) => (
                      <div key={rev._id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontWeight: "600" }}>👤 {rev.user?.name || "Attendee"}</span>
                          <span style={{ color: "var(--pink)" }}>{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</span>
                        </div>
                        <p style={{ margin: "4px 0", color: "var(--text)" }}>{rev.reviewText}</p>
                        
                        {rev.organiserReply && (
                          <div style={{ marginLeft: "20px", background: "var(--surface-2)", borderLeft: "3px solid var(--pink)", padding: "10px", borderRadius: "4px", marginTop: "10px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--pink)", marginBottom: "4px" }}>Organiser Response:</div>
                            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-dim)" }}>{rev.organiserReply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT STICKY TICKET BOOKING PANEL */}
        <div className="sticky-card">
          <h3 style={{ marginTop: 0 }}>Select Ticket Package</h3>

          {/* Ticket packages tiers selector */}
          {event.ticketTypes && event.ticketTypes.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {event.ticketTypes.map((tier) => (
                <div
                  key={tier.name}
                  className={`ticket-tier-selector ${selectedTicketType?.name === tier.name ? "active" : ""}`}
                  onClick={() => setSelectedTicketType(tier)}
                  style={{
                    border: `1px solid ${selectedTicketType?.name === tier.name ? "var(--pink)" : "var(--border)"}`,
                    borderRadius: "8px",
                    padding: "12px",
                    cursor: "pointer",
                    background: selectedTicketType?.name === tier.name ? "rgba(236,30,121,0.05)" : "none"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600" }}>
                    <span>{tier.name}</span>
                    <span>₹{tier.price}</span>
                  </div>
                  {tier.benefits && (
                    <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>
                      ⭐ {tier.benefits}
                    </div>
                  )}
                  <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>
                    Limit: {tier.bookingLimit || 10} tickets
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="price-line">
            <span>Price per ticket</span>
            <span>₹{getPrice()}</span>
          </div>

          {soldOut ? (
            <div className="alert alert-error" style={{ marginTop: 16, textAlign: "center" }}>
              Sold Out
            </div>
          ) : (
            <>
              <div className="seat-stepper">
                <button onClick={() => setSeats((s) => Math.max(1, s - 1))}>−</button>
                <span>{seats}</span>
                <button onClick={() => setSeats((s) => Math.min(event.availableSeats, selectedTicketType?.bookingLimit || 10, s + 1))}>+</button>
              </div>

              <div className="price-total">
                <span>Total Amount</span>
                <span>₹{getPrice() * seats}</span>
              </div>

              {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}

              <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={handleProceed}>
                Proceed to Checkout
              </button>

              <Link to={`/events/${id}/tables`} className="btn btn-outline btn-block" style={{ marginTop: 10, display: "block", textAlign: "center", textDecoration: "none", color: "#f59e0b", borderColor: "#f59e0b" }}>
                🎉 Book VIP Lounge Tables & Sofas
              </Link>

              {!user && (
                <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 12, textAlign: "center" }}>
                  <Link to="/login" style={{ color: "var(--pink)" }}>
                    Login
                  </Link>{" "}
                  or continue to checkout directly
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
