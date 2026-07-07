import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";

const VisualTicketDesigner = () => {
  const { id } = useParams(); // event ID
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Designer Canvas elements list
  const [elements, setElements] = useState([
    { id: "qr", name: "QR Code", x: 260, y: 180, width: 80, height: 80, rotate: 0, locked: false },
    { id: "barcode", name: "Barcode", x: 50, y: 230, width: 180, height: 40, rotate: 0, locked: false },
    { id: "logo", name: "Event Logo", x: 280, y: 20, width: 50, height: 50, rotate: 0, locked: false },
    { id: "title", name: "Event Title text", x: 20, y: 20, width: 220, height: 30, rotate: 0, locked: false },
    { id: "venue", name: "Venue details label", x: 20, y: 60, width: 220, height: 20, rotate: 0, locked: false }
  ]);

  const [versions, setVersions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Undo/Redo stacks
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const loadVersions = async () => {
    try {
      const { data } = await api.get(`/api/production/events/${id}/versions`);
      setVersions(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get(`/events/${id}`),
      api.get(`/api/production/events/${id}/versions`)
    ]).then(([eventRes, versionsRes]) => {
      setEvent(eventRes.data);
      setVersions(versionsRes.data || []);
      
      // Auto-save recovery check after browser refresh
      const saved = localStorage.getItem(`draft-ticket-${id}`);
      if (saved) {
        if (window.confirm("Found an unsaved layout draft. Restore it?")) {
          setElements(JSON.parse(saved));
        }
      }
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Auto-save elements state changed
  useEffect(() => {
    if (elements) {
      localStorage.setItem(`draft-ticket-${id}`, JSON.stringify(elements));
    }
  }, [elements, id]);

  const saveStateToHistory = (newElements) => {
    setHistory([...history, JSON.stringify(elements)]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack([JSON.stringify(elements), ...redoStack]);
    setElements(JSON.parse(previous));
    setHistory(history.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory([...history, JSON.stringify(elements)]);
    setElements(JSON.parse(next));
    setRedoStack(redoStack.slice(1));
  };

  const handleUpdateElement = (field, value) => {
    if (!selectedId) return;
    saveStateToHistory();
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        if (el.locked) return el;
        return { ...el, [field]: Number(value) || value };
      }
      return el;
    }));
  };

  const handleToggleLock = () => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        return { ...el, locked: !el.locked };
      }
      return el;
    }));
  };

  const handleMove = (direction) => {
    if (!selectedId) return;
    saveStateToHistory();
    const step = snapToGrid ? 10 : 2;
    setElements(prev => prev.map(el => {
      if (el.id === selectedId && !el.locked) {
        let { x, y } = el;
        if (direction === "up") y = Math.max(0, y - step);
        if (direction === "down") y = Math.min(300, y + step);
        if (direction === "left") x = Math.max(0, x - step);
        if (direction === "right") x = Math.min(360, x + step);
        return { ...el, x, y };
      }
      return el;
    }));
  };

  const handleSaveLayout = async () => {
    const logMsg = prompt("Enter a brief change log message for this version commit:");
    if (!logMsg) return;

    try {
      // Save canvas element coordinates back to template designer configs
      await api.post(`/api/production/events/${id}/versions`, {
        elements,
        changeLog: logMsg,
        publish: true
      });
      
      // Clean draft from localStorage on successful publish save
      localStorage.removeItem(`draft-ticket-${id}`);
      
      alert("Layout template version committed and published successfully!");
      loadVersions();
    } catch (err) {
      alert("Failed to save designer template version.");
    }
  };

  const handleRollbackVersion = async (versionNum) => {
    if (!window.confirm(`Are you sure you want to rollback to Version ${versionNum}?`)) return;
    try {
      const { data } = await api.post(`/api/production/events/${id}/versions/${versionNum}/rollback`);
      alert(data.message);
      if (data.target?.elements) {
        setElements(data.target.elements);
      }
      loadVersions();
    } catch (err) {
      alert("Rollback failed.");
    }
  };

  if (loading) return <div className="loading-wrap">Loading designer canvas...</div>;
  if (!event) return <div className="section empty-state">Event not found</div>;

  const activeElement = elements.find(el => el.id === selectedId);

  return (
    <div>
      <DashboardNav role="organiser" />
      <div className="dash-body" style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>Visual Ticket Designer Editor</h2>
            <div style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "2px" }}>Event: {event.title}</div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleUndo} disabled={history.length === 0} className="btn btn-sm btn-outline">↩️ Undo</button>
            <button onClick={handleRedo} disabled={redoStack.length === 0} className="btn btn-sm btn-outline">↪️ Redo</button>
            <button onClick={handleSaveLayout} className="btn btn-sm btn-primary">Commit Version</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px 240px", gap: "20px" }}>
          
          {/* VISUAL DESIGN CANVAS */}
          <div className="card-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", minHeight: "420px", position: "relative" }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="btn btn-sm btn-outline">- Out</button>
              <span style={{ fontSize: "13px", alignSelf: "center" }}>Scale: {zoom}%</span>
              <button onClick={() => setZoom(Math.min(150, zoom + 10))} className="btn btn-sm btn-outline">+ In</button>
              <button onClick={() => setSnapToGrid(!snapToGrid)} className="btn btn-sm btn-outline" style={{ borderColor: snapToGrid ? "var(--pink)" : "var(--border)" }}>Snap Grid: {snapToGrid ? "ON" : "OFF"}</button>
            </div>

            <div style={{
              width: "380px",
              height: "300px",
              background: "#1e3c72",
              border: "3px solid #ff007f",
              borderRadius: "12px",
              position: "relative",
              overflow: "hidden",
              transform: `scale(${zoom / 100})`,
              transition: "transform 0.1s ease"
            }}>
              {elements.map((el) => {
                const isSelected = el.id === selectedId;
                return (
                  <div
                    key={el.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                    style={{
                      position: "absolute",
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      transform: `rotate(${el.rotate}deg)`,
                      border: isSelected ? "2px dashed var(--pink)" : el.locked ? "1px solid var(--danger)" : "1px dashed rgba(255,255,255,0.3)",
                      background: isSelected ? "rgba(236,30,121,0.15)" : "rgba(255,255,255,0.05)",
                      color: "#fff",
                      cursor: el.locked ? "not-allowed" : "move",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "bold",
                      textAlign: "center",
                      padding: "4px",
                      zIndex: isSelected ? 10 : 1
                    }}
                  >
                    <div>{el.name}</div>
                    {el.locked && <span style={{ fontSize: "8px", color: "var(--danger)" }}>🔒 Locked</span>}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "16px" }}>Click elements on the ticket canvas grid to edit properties.</div>
          </div>

          {/* INSPECTOR CONTROLS PROPERTIES PANEL */}
          <div className="card-panel">
            <h3>Inspector Properties</h3>
            
            {activeElement ? (
              <div>
                <h4 style={{ margin: "0 0 16px 0", color: "var(--pink)" }}>Element: {activeElement.name}</h4>
                <button onClick={handleToggleLock} className="btn btn-sm btn-block" style={{ background: activeElement.locked ? "var(--danger)" : "var(--surface-2)", color: "#fff", marginBottom: "16px" }}>
                  {activeElement.locked ? "🔓 Unlock" : "🔒 Lock"}
                </button>
                <div className="form-group"><label>X Coordinate</label><input type="number" disabled={activeElement.locked} value={activeElement.x} onChange={(e) => handleUpdateElement("x", e.target.value)} /></div>
                <div className="form-group"><label>Y Coordinate</label><input type="number" disabled={activeElement.locked} value={activeElement.y} onChange={(e) => handleUpdateElement("y", e.target.value)} /></div>
                <div className="form-group"><label>Width (px)</label><input type="number" disabled={activeElement.locked} value={activeElement.width} onChange={(e) => handleUpdateElement("width", e.target.value)} /></div>
                <div className="form-group"><label>Height (px)</label><input type="number" disabled={activeElement.locked} value={activeElement.height} onChange={(e) => handleUpdateElement("height", e.target.value)} /></div>
                <div className="form-group" style={{ marginBottom: "16px" }}><label>Rotate Angle</label><input type="number" disabled={activeElement.locked} value={activeElement.rotate} onChange={(e) => handleUpdateElement("rotate", e.target.value)} /></div>
                
                <label>Move Shortcuts</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginTop: "6px" }}>
                  <div></div><button type="button" disabled={activeElement.locked} onClick={() => handleMove("up")} className="btn btn-sm btn-outline">▲</button><div></div>
                  <button type="button" disabled={activeElement.locked} onClick={() => handleMove("left")} className="btn btn-sm btn-outline">◀</button><div></div><button type="button" disabled={activeElement.locked} onClick={() => handleMove("right")} className="btn btn-sm btn-outline">▶</button>
                  <div></div><button type="button" disabled={activeElement.locked} onClick={() => handleMove("down")} className="btn btn-sm btn-outline">▼</button><div></div>
                </div>
              </div>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: "13px" }}>No elements selected.</div>
            )}
          </div>

          {/* TEMPLATE VERSION CONTROL LOGS PANEL */}
          <div className="card-panel">
            <h3>Version History</h3>
            {versions.length === 0 ? (
              <div style={{ color: "var(--text-dim)", fontSize: "12px", marginTop: "12px" }}>No version history recorded yet. Commits will show up here.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px", maxHeight: "380px", overflowY: "auto" }}>
                {versions.map(v => (
                  <div key={v._id} style={{ padding: "10px", borderRadius: "6px", background: "var(--surface-2)", border: v.status === "published" ? "1px solid var(--purple)" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>v{v.version}</strong>
                      {v.status === "published" && <span style={{ fontSize: "10px", background: "var(--purple)", color: "#fff", padding: "1px 5px", borderRadius: "4px" }}>Published</span>}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>{v.changeLog}</div>
                    {v.status !== "published" && (
                      <button onClick={() => handleRollbackVersion(v.version)} className="btn btn-xs btn-outline" style={{ marginTop: "8px", width: "100%" }}>Restore / Rollback</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default VisualTicketDesigner;
