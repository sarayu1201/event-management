import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";

const TableLayoutDesigner = () => {
  const { id } = useParams(); // event ID
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Designer Canvas Controls
  const [zoom, setZoom] = useState(100);
  const [floor, setFloor] = useState("Indoor"); // Indoor, Outdoor
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // New Table Input Form states
  const [form, setForm] = useState({
    tableName: "",
    category: "VIP Table",
    price: 1500,
    depositAmount: 500,
    capacity: 4,
    minPersons: 2,
    maxPersons: 6,
    shape: "round"
  });

  const loadData = async () => {
    try {
      const [evRes, tabRes] = await Promise.all([
        api.get(`/events/${id}`),
        api.get(`/api/events/${id}/tables`)
      ]);
      setEvent(evRes.data);
      setTables(tabRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!form.tableName) return;

    try {
      const { data } = await api.post("/api/tables", {
        eventId: id,
        ...form,
        positionX: 100,
        positionY: 100,
        width: form.shape === "rectangle" ? 80 : 60,
        height: 60,
        location: floor
      });
      setTables([...tables, data]);
      setForm({ ...form, tableName: "" });
      alert("Table added to floor layout!");
    } catch (err) {
      alert("Failed to add table");
    }
  };

  const handleMoveTable = async (direction) => {
    if (!selectedTableId) return;
    const target = tables.find(t => t._id === selectedTableId);
    if (!target) return;

    const step = snapToGrid ? 20 : 5;
    let newX = target.positionX;
    let newY = target.positionY;

    if (direction === "up") newY = Math.max(0, newY - step);
    if (direction === "down") newY = Math.min(400, newY + step);
    if (direction === "left") newX = Math.max(0, newX - step);
    if (direction === "right") newX = Math.min(500, newX + step);

    try {
      const { data } = await api.put(`/api/tables/${selectedTableId}`, {
        positionX: newX,
        positionY: newY
      });
      setTables(prev => prev.map(t => t._id === selectedTableId ? data : t));
    } catch (err) {
      console.error("Move error", err);
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTableId) return;
    if (!window.confirm("Remove table?")) return;
    try {
      await api.delete(`/api/tables/${selectedTableId}`);
      setTables(prev => prev.filter(t => t._id !== selectedTableId));
      setSelectedTableId(null);
      alert("Table removed successfully!");
    } catch (err) {
      alert("Failed to delete table");
    }
  };

  if (loading) return <div className="loading-wrap">Connecting to Lounge Designer...</div>;
  if (!event) return <div className="section empty-state">Event not found</div>;

  const activeTable = tables.find(t => t._id === selectedTableId);

  return (
    <div>
      <DashboardNav role="organiser" />
      <div className="dash-body" style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
        
        <div style={{ display: "flex", justifySelf: "space-between", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>Visual Lounge Floor Designer</h2>
            <div style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "2px" }}>Event: {event.title}</div>
          </div>
          <button onClick={() => navigate(`/organiser/events/${id}`)} className="btn btn-sm btn-outline">Done & Exit</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: "20px" }}>
          
          {/* LEFT SIDEBAR: ADD TABLE FORM */}
          <div className="card-panel">
            <h3>Add New Table</h3>
            <form onSubmit={handleAddTable} style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="form-group"><label>Table Name/No</label><input required value={form.tableName} onChange={(e) => setForm({ ...form, tableName: e.target.value })} placeholder="e.g. VIP-5" /></div>
              <div className="form-group"><label>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="VIP Table">VIP Table</option>
                  <option value="Standard Table">Standard Table</option>
                  <option value="Lounge Table">Lounge Table</option>
                  <option value="Couple Table">Couple Table</option>
                  <option value="Corporate Table">Corporate Table</option>
                </select>
              </div>
              <div className="form-group"><label>Shape</label>
                <select value={form.shape} onChange={(e) => setForm({ ...form, shape: e.target.value })}>
                  <option value="round">Round Table</option>
                  <option value="rectangle">Rectangle Table</option>
                  <option value="square">Square Table</option>
                </select>
              </div>
              <div className="form-group"><label>Price (₹)</label><input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div className="form-group"><label>Max Guests</label><input type="number" required value={form.maxPersons} onChange={(e) => setForm({ ...form, maxPersons: Number(e.target.value) })} /></div>
              <button className="btn btn-primary btn-sm btn-block">+ Add to Map</button>
            </form>
          </div>

          {/* MIDDLE: LOUNGE FLOOR MAP CANVAS */}
          <div className="card-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", minHeight: "450px" }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <button onClick={() => setFloor("Indoor")} className={`btn btn-sm ${floor === "Indoor" ? "btn-primary" : "btn-outline"}`}>Indoor Floor</button>
              <button onClick={() => setFloor("Outdoor")} className={`btn btn-sm ${floor === "Outdoor" ? "btn-primary" : "btn-outline"}`}>Outdoor Patio</button>
              <button onClick={() => setZoom(Math.max(60, zoom - 10))} className="btn btn-sm btn-outline">-</button>
              <span style={{ fontSize: "13px", alignSelf: "center" }}>{zoom}%</span>
              <button onClick={() => setZoom(Math.min(140, zoom + 10))} className="btn btn-sm btn-outline">+</button>
            </div>

            {/* Simulated floor layout grid */}
            <div style={{
              width: "520px",
              height: "400px",
              background: "#0f172a",
              border: "2px solid var(--border)",
              borderRadius: "10px",
              position: "relative",
              overflow: "hidden",
              transform: `scale(${zoom / 100})`,
              transition: "transform 0.1s ease"
            }}>
              {/* Restroom, exit, bar indicators */}
              <div style={{ position: "absolute", top: "10px", left: "10px", fontSize: "11px", color: "var(--text-dim)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "10px" }}>🚽 Restrooms</div>
              <div style={{ position: "absolute", top: "10px", right: "10px", fontSize: "11px", color: "#ef4444", background: "rgba(239,68,68,0.12)", padding: "2px 8px", borderRadius: "10px", border: "1px solid #ef4444" }}>🚪 EXIT</div>
              <div style={{ position: "absolute", bottom: "10px", left: "200px", fontSize: "12px", color: "#f59e0b", background: "rgba(245,158,11,0.12)", padding: "4px 20px", borderRadius: "4px", border: "1px dashed #f59e0b" }}>🍺 BAR COUNTER</div>
              <div style={{ position: "absolute", top: "150px", left: "10px", writingMode: "vertical-rl", fontSize: "14px", fontWeight: "bold", letterSpacing: "4px", opacity: 0.15 }}>DANCE FLOOR</div>

              {tables.filter(t => t.location === floor).map((t) => {
                const isSelected = t._id === selectedTableId;
                return (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTableId(t._id)}
                    style={{
                      position: "absolute",
                      left: t.positionX,
                      top: t.positionY,
                      width: t.width,
                      height: t.height,
                      borderRadius: t.shape === "round" ? "50%" : "4px",
                      background: isSelected ? "var(--pink)" : t.status === "Booked" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)",
                      border: `2px solid ${isSelected ? "var(--pink)" : t.status === "Booked" ? "#ef4444" : "#10b981"}`,
                      color: "#fff",
                      cursor: "move",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: "bold",
                      zIndex: isSelected ? 10 : 1
                    }}
                  >
                    <div>{t.tableName}</div>
                    <div style={{ fontSize: "8px", opacity: 0.8 }}>({t.capacity} pax)</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDEBAR: TABLE INSPECTOR & MOVEMENT PROPERTIES */}
          <div className="card-panel">
            <h3>Table Inspector</h3>
            {activeTable ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px" }}>
                <div><strong>Name:</strong> {activeTable.tableName}</div>
                <div><strong>Category:</strong> {activeTable.category}</div>
                <div><strong>Max capacity:</strong> {activeTable.capacity} guests</div>
                <div><strong>Base price:</strong> ₹{activeTable.price}</div>
                <div><strong>Status:</strong> {activeTable.status}</div>

                <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "12px" }}>
                  <label>Floor Position Coordinates</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginTop: "6px" }}>
                    <div></div><button type="button" onClick={() => handleMoveTable("up")} className="btn btn-sm btn-outline">▲</button><div></div>
                    <button type="button" onClick={() => handleMoveTable("left")} className="btn btn-sm btn-outline">◀</button><div></div><button type="button" onClick={() => handleMoveTable("right")} className="btn btn-sm btn-outline">▶</button>
                    <div></div><button type="button" onClick={() => handleMoveTable("down")} className="btn btn-sm btn-outline">▼</button><div></div>
                  </div>
                </div>

                <button onClick={handleDeleteTable} className="btn btn-sm btn-outline btn-block" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>Delete Table</button>
              </div>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: "13px", marginTop: "12px" }}>Click a table on the floor layout plan to inspect.</div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default TableLayoutDesigner;
