import { useState } from "react";
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
  price: "",
  totalSeats: "",
  ticketThemeColor: "#1e3c72",
  ticketHeaderImage: "",
  ticketInstructions: "Please carry a valid ID card.",
};

const CreateEvent = () => {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/events", {
        ...form,
        price: Number(form.price),
        totalSeats: Number(form.totalSeats),
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
      <div className="dash-body" style={{ maxWidth: 700 }}>
        <h2 className="section-title">Create New Event</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="card-panel">
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
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Banner Image URL</label>
              <input name="bannerImage" value={form.bannerImage} onChange={onChange} placeholder="https://..." />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Venue</label>
              <input name="venue" required value={form.venue} onChange={onChange} placeholder="Venue name" />
            </div>
            <div className="form-group">
              <label>City</label>
              <input name="city" required value={form.city} onChange={onChange} placeholder="City" />
            </div>
          </div>

          <div className="form-group">
            <label>Address (optional)</label>
            <input name="address" value={form.address} onChange={onChange} placeholder="Full address" />
          </div>

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
              <label>Ticket Price (₹)</label>
              <input type="number" name="price" required min="0" value={form.price} onChange={onChange} placeholder="0 for free" />
            </div>
            <div className="form-group">
              <label>Total Seats</label>
              <input type="number" name="totalSeats" required min="1" value={form.totalSeats} onChange={onChange} placeholder="e.g. 200" />
            </div>
          </div>

          <div style={{ margin: "24px 0 16px", borderTop: "1px dashed var(--border)", paddingTop: "16px" }}>
            <h4 style={{ margin: "0 0 12px", color: "var(--pink)", fontSize: "14px" }}>🎟️ Ticket Customization (For Attendee PDFs & Scans)</h4>
            
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
