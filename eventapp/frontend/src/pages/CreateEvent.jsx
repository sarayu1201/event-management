import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";

const categories = ["Movies", "Concerts", "Plays", "Sports", "Comedy", "Workshops", "Festivals", "Other"];

const emptyForm = {
  title: "",
  description: "",
  category: "Concerts",
  bannerImage: "",
  venue: "",
  city: "",
  address: "",
  date: "",
  time: "",
  price: 0,
  totalSeats: 100,
  latitude: 17.3850,
  longitude: 78.4867,
  ageRestriction: "",
  dressCode: "",
  parkingInfo: "",
  website: "",
  socialLinks: { facebook: "", instagram: "", twitter: "" },
  visibility: "public",
  eventStatus: "upcoming",
  ticketThemeColor: "#1e3c72",
  ticketHeaderImage: "",
  ticketInstructions: "Please carry a valid ID card.",
  payoutProfile: ""
};

const CreateEvent = () => {
  const [form, setForm] = useState(emptyForm);
  const [payoutProfiles, setPayoutProfiles] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([
    { name: "Regular", price: 0, quantity: 100, bookingLimit: 10, benefits: "General admission entry", gstRate: 0 }
  ]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Load payout profiles
  useEffect(() => {
    api.get("/api/business/payout-profiles")
      .then(({ data }) => {
        setPayoutProfiles(data);
        if (data.length > 0) {
          const def = data.find(p => p.isDefault) || data[0];
          setForm(f => ({ ...f, payoutProfile: def._id }));
        }
      })
      .catch(() => {});
  }, []);

  const onChange = (e) => {
    if (e.target.name.startsWith("social_")) {
      const field = e.target.name.split("_")[1];
      setForm({
        ...form,
        socialLinks: { ...form.socialLinks, [field]: e.target.value }
      });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleAddTicketType = () => {
    setTicketTypes([...ticketTypes, { name: "", price: 0, quantity: 50, bookingLimit: 10, benefits: "", gstRate: 0 }]);
  };

  const handleRemoveTicketType = (index) => {
    if (ticketTypes.length === 1) return;
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  const handleTicketTypeChange = (index, field, value) => {
    const updated = [...ticketTypes];
    if (field === "price" || field === "quantity" || field === "bookingLimit" || field === "gstRate") {
      updated[index][field] = Number(value);
    } else {
      updated[index][field] = value;
    }
    setTicketTypes(updated);
  };

  const handleFetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm({
            ...form,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          setError("Failed to fetch location. Please enter coordinates manually.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const totalSeatsSum = ticketTypes.reduce((sum, t) => sum + t.quantity, 0);
    const minPrice = Math.min(...ticketTypes.map((t) => t.price));

    try {
      await api.post("/events", {
        ...form,
        price: minPrice,
        totalSeats: totalSeatsSum,
        ticketTypes: ticketTypes.map((t) => ({
          ...t,
          availableQuantity: t.quantity
        })),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      });
      navigate("/organiser/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <DashboardNav role="organiser" />
      <div className="dash-body" style={{ maxWidth: 750 }}>
        <h2 className="section-title">Create New Event</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="card-panel">
          <h3 style={{ marginTop: 0, fontSize: "16px", color: "var(--pink)" }}>General Info</h3>
          <div className="form-group">
            <label>Event Title</label>
            <input name="title" required value={form.title} onChange={onChange} placeholder="e.g. Sunburn Arena ft. Headliners" />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" required value={form.description} onChange={onChange} placeholder="Tell people what to expect..." />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={form.category} onChange={onChange}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Banner Image URL</label>
              <input name="bannerImage" value={form.bannerImage} onChange={onChange} placeholder="https://..." />
            </div>
          </div>

          <h3 style={{ marginTop: 24, fontSize: "16px", color: "var(--pink)" }}>Date, Time & Geolocation</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="date" required value={form.date} onChange={onChange} />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" name="time" required value={form.time} onChange={onChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Venue Name</label>
              <input name="venue" required value={form.venue} onChange={onChange} placeholder="Venue name" />
            </div>
            <div className="form-group">
              <label>City</label>
              <input name="city" required value={form.city} onChange={onChange} placeholder="City" />
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <input name="address" value={form.address} onChange={onChange} placeholder="Full address" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input type="number" step="any" name="latitude" value={form.latitude} onChange={onChange} />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input type="number" step="any" name="longitude" value={form.longitude} onChange={onChange} />
            </div>
          </div>
          <button type="button" className="btn btn-outline" style={{ marginBottom: 24 }} onClick={handleFetchLocation}>
            📍 Get Current Coordinates
          </button>

          {/* PAYOUT PROFILE SELECTOR */}
          <h3 style={{ marginTop: 24, fontSize: "16px", color: "var(--pink)" }}>🏦 Payout Settlement Account</h3>
          <div className="form-group">
            <label>Select Payout Profile</label>
            {payoutProfiles.length === 0 ? (
              <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>
                No payout profiles linked. Go to your <Link to="/organiser/dashboard" style={{ color: "var(--pink)" }}>Dashboard Settlements</Link> first.
              </div>
            ) : (
              <select name="payoutProfile" value={form.payoutProfile} onChange={onChange}>
                {payoutProfiles.map((p) => (
                  <option key={p._id} value={p._id}>{p.label} - {p.accountHolderName} ({p.bankName || p.upiId})</option>
                ))}
              </select>
            )}
          </div>

          {/* TICKET OPTIONS & TICKET GST */}
          <h3 style={{ marginTop: 24, fontSize: "16px", color: "var(--pink)" }}>🎟️ Ticket Tiers & Pricing GST</h3>
          {ticketTypes.map((t, index) => {
            const needsGSTSelection = t.price > 499;
            return (
              <div key={index} className="card-panel" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontWeight: "600", fontSize: "14px" }}>Ticket Option #{index + 1}</span>
                  {ticketTypes.length > 1 && (
                    <button type="button" className="btn btn-sm btn-outline" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => handleRemoveTicketType(index)}>
                      Remove Option
                    </button>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ticket Name</label>
                    <input required value={t.name} onChange={(e) => handleTicketTypeChange(index, "name", e.target.value)} placeholder="e.g. VIP, Early Bird, General" />
                  </div>
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input type="number" min="0" required value={t.price} onChange={(e) => handleTicketTypeChange(index, "price", e.target.value)} placeholder="0 for free" />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity (Capacity)</label>
                    <input type="number" min="1" required value={t.quantity} onChange={(e) => handleTicketTypeChange(index, "quantity", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Max Limit Per Booking</label>
                    <input type="number" min="1" value={t.bookingLimit} onChange={(e) => handleTicketTypeChange(index, "bookingLimit", e.target.value)} />
                  </div>
                </div>

                {/* GST SELECTOR DROPDOWN */}
                {needsGSTSelection ? (
                  <div className="form-group">
                    <label>GST Rate % (Required for tickets above ₹499)</label>
                    <select value={t.gstRate} onChange={(e) => handleTicketTypeChange(index, "gstRate", e.target.value)}>
                      <option value="5">5% GST (CGST 2.5% + SGST 2.5%)</option>
                      <option value="12">12% GST (CGST 6% + SGST 6%)</option>
                      <option value="18">18% GST (CGST 9% + SGST 9%)</option>
                    </select>
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "12px" }}>
                    ℹ️ GST Rate defaults to 0% for ticket prices below ₹499.
                  </div>
                )}

                <div className="form-group">
                  <label>Benefits / Inclusion Description</label>
                  <input value={t.benefits} onChange={(e) => handleTicketTypeChange(index, "benefits", e.target.value)} placeholder="e.g. Complimentary drinks, backstage access" />
                </div>
              </div>
            );
          })}
          <button type="button" className="btn btn-outline" style={{ marginBottom: "24px" }} onClick={handleAddTicketType}>
            ➕ Add Ticket Option
          </button>

          <h3 style={{ marginTop: 24, fontSize: "16px", color: "var(--pink)" }}>Event Rules & Social Links</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Age Restriction</label>
              <input name="ageRestriction" value={form.ageRestriction} onChange={onChange} placeholder="e.g. 18+ only, family friendly" />
            </div>
            <div className="form-group">
              <label>Dress Code</label>
              <input name="dressCode" value={form.dressCode} onChange={onChange} placeholder="e.g. Smart casuals" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Parking Details</label>
              <input name="parkingInfo" value={form.parkingInfo} onChange={onChange} placeholder="e.g. Valet parking available" />
            </div>
            <div className="form-group">
              <label>Official Website</label>
              <input name="website" value={form.website} onChange={onChange} placeholder="https://..." />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Facebook URL</label>
              <input name="social_facebook" value={form.socialLinks.facebook} onChange={onChange} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label>Instagram URL</label>
              <input name="social_instagram" value={form.socialLinks.instagram} onChange={onChange} placeholder="https://..." />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Visibility</label>
              <select name="visibility" value={form.visibility} onChange={onChange}>
                <option value="public">Public (Visible to all)</option>
                <option value="exclusive">Exclusive (Featured/Invite-only)</option>
                <option value="private">Private (Not in listing)</option>
                <option value="draft">Draft (Do not publish)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Event status</label>
              <select name="eventStatus" value={form.eventStatus} onChange={onChange}>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <h3 style={{ margin: "24px 0 12px", borderTop: "1px dashed var(--border)", paddingTop: "16px", fontSize: "16px", color: "var(--pink)" }}>🎟️ Ticket Customization</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Ticket Theme Color</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input 
                  type="color" 
                  name="ticketThemeColor" 
                  value={form.ticketThemeColor} 
                  onChange={onChange} 
                  style={{ width: "50px", height: "38px", padding: "2px", cursor: "pointer", border: "1px solid var(--border)", borderRadius: "6px" }} 
                />
                <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>{form.ticketThemeColor}</span>
              </div>
            </div>
            <div className="form-group">
              <label>Ticket Header Image URL (optional)</label>
              <input name="ticketHeaderImage" value={form.ticketHeaderImage} onChange={onChange} placeholder="https://..." />
            </div>
          </div>

          <div className="form-group">
            <label>Special Instructions / Guidelines</label>
            <textarea 
              name="ticketInstructions" 
              value={form.ticketInstructions} 
              onChange={onChange} 
              placeholder="e.g. Please carry a valid physical ID card. Gates open 1 hour before showtime." 
              style={{ minHeight: "60px" }}
            />
          </div>

          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Publishing..." : "Publish Event"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
