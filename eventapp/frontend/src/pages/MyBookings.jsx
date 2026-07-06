import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const statusClass = {
  success: "status-success",
  pending: "status-pending",
  failed: "status-failed",
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/bookings/mine")
      .then(({ data }) => setBookings(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dash-body">
      <h2 className="section-title">My Bookings</h2>

      {loading && <div className="loading-wrap">Loading...</div>}

      {!loading && bookings.length === 0 && (
        <div className="empty-state">
          You haven't booked any events yet. <Link to="/">Browse events</Link>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Ticket ID</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>{b.event?.title}</td>
                  <td>{b.event ? new Date(b.event.date).toDateString() : "-"}</td>
                  <td>{b.seats}</td>
                  <td>₹{b.totalAmount}</td>
                  <td>
                    <span className={`status-pill ${statusClass[b.paymentStatus]}`}>{b.paymentStatus}</span>
                  </td>
                  <td>{b.ticketId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
