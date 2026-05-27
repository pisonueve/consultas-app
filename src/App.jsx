import { useState, useEffect } from "react";

const SUCURSALES = ["San Martín 673", "Godoy Cruz 261", "Galponazo Las Heras", "San Martín", "San Juan"];
const ADMIN_PIN = "1234";
const SHEETDB_URL = "https://sheetdb.io/api/v1/0ncqptkescgza";

const todayStr = () => new Date().toISOString().split("T")[0];

const last7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
};

const fmtDate = (iso) => {
  const hoy = todayStr();
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
  const ayerStr = ayer.toISOString().split("T")[0];
  if (iso === hoy) return "Hoy";
  if (iso === ayerStr) return "Ayer";
  return new Date(iso + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
};

const fmtFull = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

const nowTime = () =>
  new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

// SheetDB helpers
async function fetchAll() {
  try {
    const r = await fetch(SHEETDB_URL);
    const rows = await r.json();
    // Convert array to { date: { sucursal: { cantidad, hora } } }
    const data = {};
    for (const row of rows) {
      if (!row.fecha) continue;
      if (!data[row.fecha]) data[row.fecha] = {};
      data[row.fecha][row.sucursal] = { cantidad: parseInt(row.cantidad) || 0, hora: row.hora };
    }
    return data;
  } catch { return {}; }
}

async function saveEntry(fecha, sucursal, cantidad, hora) {
  // Check if row exists
  try {
    const searchUrl = `${SHEETDB_URL}/search?fecha=${encodeURIComponent(fecha)}&sucursal=${encodeURIComponent(sucursal)}`;
    const r = await fetch(searchUrl);
    const existing = await r.json();
    if (existing && existing.length > 0) {
      // Update
      await fetch(`${SHEETDB_URL}/fecha/${encodeURIComponent(fecha)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { cantidad: String(cantidad), hora }, searchColumn: "sucursal", searchValue: sucursal })
      });
    } else {
      // Insert
      await fetch(SHEETDB_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { fecha, sucursal, cantidad: String(cantidad), hora } })
      });
    }
    return true;
  } catch { return false; }
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0c0e13;--surf:#13161d;--card:#181c25;--border:#252a38;
  --accent:#f5c842;--green:#3de8a0;--red:#f05565;
  --text:#e4e7f0;--muted:#5c6478;--muted2:#8892a4;--r:13px;
}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
.app{min-height:100vh;display:flex;flex-direction:column}
.header{background:var(--surf);border-bottom:1px solid var(--border);padding:14px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20}
.logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1rem;letter-spacing:-.3px}
.logo span{color:var(--accent)}
.header-right{display:flex;align-items:center;gap:10px}
.date-chip{font-size:.72rem;color:var(--muted2);background:var(--card);border:1px solid var(--border);padding:4px 10px;border-radius:20px}
.admin-chip{font-family:'Syne',sans-serif;font-weight:700;font-size:.68rem;background:var(--accent);color:#0c0e13;padding:4px 10px;border-radius:20px}
.main{flex:1;padding:22px 18px;max-width:500px;margin:0 auto;width:100%}
.page-title{font-family:'Syne',sans-serif;font-weight:800;font-size:1.6rem;line-height:1.1;margin-bottom:5px}
.page-title em{color:var(--accent);font-style:normal}
.page-sub{color:var(--muted2);font-size:.85rem;margin-bottom:28px}
.section-label{font-family:'Syne',sans-serif;font-size:.65rem;font-weight:700;letter-spacing:1.8px;color:var(--muted);text-transform:uppercase;margin-bottom:10px}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:18px}
.list{display:flex;flex-direction:column;gap:7px;margin-bottom:20px}
.row-btn{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:all .15s;color:var(--text);font-family:'DM Sans',sans-serif;font-size:.92rem;font-weight:500;width:100%;text-align:left}
.row-btn:hover{border-color:var(--accent);background:#1d2230;transform:translateX(3px)}
.row-btn.done{border-color:var(--green)}
.row-left{display:flex;align-items:center;gap:11px}
.dot{width:7px;height:7px;border-radius:50%;background:var(--border);flex-shrink:0}
.row-btn.done .dot{background:var(--green)}
.done-tag{display:flex;align-items:center;gap:4px;font-size:.72rem;color:var(--green);font-weight:500}
.admin-row{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;display:flex;align-items:center;gap:11px;cursor:pointer;transition:all .15s;color:var(--accent);font-family:'Syne',sans-serif;font-weight:700;font-size:.88rem;width:100%;text-align:left}
.admin-row:hover{border-color:var(--accent);background:#1d2230}
.back-btn{display:flex;align-items:center;gap:5px;color:var(--muted2);font-size:.83rem;cursor:pointer;margin-bottom:22px;background:none;border:none;font-family:'DM Sans',sans-serif;transition:color .15s}
.back-btn:hover{color:var(--text)}
.form-head{margin-bottom:22px}
.form-name{font-family:'Syne',sans-serif;font-weight:800;font-size:1.4rem;margin-bottom:3px}
.form-date{color:var(--muted2);font-size:.83rem;text-transform:capitalize}
.input-label{font-size:.78rem;color:var(--muted2);margin-bottom:7px;font-weight:500}
.counter-wrap{display:flex;align-items:center;margin-bottom:20px}
.cnt-btn{width:46px;height:52px;background:var(--surf);border:1px solid var(--border);color:var(--text);font-size:1.3rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;font-family:'Syne',sans-serif;font-weight:700}
.cnt-btn:first-child{border-radius:10px 0 0 10px}
.cnt-btn:last-child{border-radius:0 10px 10px 0}
.cnt-btn:hover{background:var(--border);color:var(--accent)}
.cnt-num{flex:1;height:52px;background:var(--surf);border-top:1px solid var(--border);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:2rem;color:var(--accent)}
.submit-btn{width:100%;background:var(--accent);color:#0c0e13;border:none;border-radius:10px;padding:14px;font-family:'Syne',sans-serif;font-weight:800;font-size:.95rem;cursor:pointer;transition:opacity .15s}
.submit-btn:hover{opacity:.9}
.submit-btn:disabled{opacity:.4;cursor:not-allowed}
.saved-box{background:#1a2e22;border:1px solid #2a5040;border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:10px;margin-bottom:16px;color:var(--green);font-size:.87rem;font-weight:500}
.history-title{font-family:'Syne',sans-serif;font-size:.7rem;font-weight:700;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin:20px 0 10px}
.hist-row{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surf);border:1px solid var(--border);border-radius:9px;margin-bottom:6px}
.hist-day{font-size:.82rem;color:var(--muted2)}
.hist-val{font-family:'Syne',sans-serif;font-weight:700;font-size:.95rem}
.hist-val.empty{color:var(--muted);font-weight:400;font-size:.82rem}
.pin-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:28px 24px;text-align:center}
.pin-title{font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;margin-bottom:6px}
.pin-sub{color:var(--muted2);font-size:.83rem;margin-bottom:22px}
.pin-input{width:100%;background:var(--surf);border:1px solid var(--border);border-radius:9px;padding:13px 16px;font-family:'Syne',sans-serif;font-weight:700;font-size:1.4rem;color:var(--accent);text-align:center;letter-spacing:8px;outline:none;margin-bottom:14px}
.pin-input:focus{border-color:var(--accent)}
.pin-btn{width:100%;background:var(--accent);color:#0c0e13;border:none;border-radius:9px;padding:13px;font-family:'Syne',sans-serif;font-weight:800;font-size:.9rem;cursor:pointer}
.pin-err{color:var(--red);font-size:.8rem;margin-bottom:10px}
.day-selector{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:22px;scrollbar-width:none}
.day-selector::-webkit-scrollbar{display:none}
.day-pill{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:6px 14px;font-size:.78rem;font-weight:500;cursor:pointer;white-space:nowrap;transition:all .15s;color:var(--muted2);flex-shrink:0}
.day-pill.active{background:var(--accent);color:#0c0e13;border-color:var(--accent);font-family:'Syne',sans-serif;font-weight:700}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:14px}
.stat-label{font-size:.72rem;color:var(--muted2);margin-bottom:4px}
.stat-val{font-family:'Syne',sans-serif;font-weight:800;font-size:1.6rem;color:var(--accent)}
.stat-val.green{color:var(--green)}
.admin-suc-row{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:13px 16px;display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.admin-suc-name{font-size:.88rem;font-weight:500;display:flex;align-items:center;gap:8px}
.admin-suc-val{font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem}
.admin-suc-val.empty{color:var(--muted);font-weight:400;font-size:.8rem}
.admin-suc-time{font-size:.68rem;color:var(--muted);display:block;margin-top:1px}
.bar-wrap{height:4px;background:var(--border);border-radius:4px;margin-top:6px;overflow:hidden}
.bar-fill{height:100%;background:var(--accent);border-radius:4px}
.loading{text-align:center;padding:40px;color:var(--muted2);font-size:.9rem}
.spinner{display:inline-block;width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin-bottom:10px}
@keyframes spin{to{transform:rotate(360deg)}}
`;

const IcoBack = () => <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoCheck = () => <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoLock = () => <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;

export default function App() {
  const [data, setData] = useState(null);
  const [screen, setScreen] = useState("home");
  const [selectedSuc, setSelectedSuc] = useState(null);
  const [adminDay, setAdminDay] = useState(todayStr());
  const [cantidad, setCantidad] = useState(0);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const days = last7Days();
  const today = todayStr();

  useEffect(() => { fetchAll().then(setData); }, []);

  const getEntry = (date, suc) => data?.[date]?.[suc] ?? null;
  const getVal = (date, suc) => getEntry(date, suc)?.cantidad ?? null;

  const dayTotal = (d) => SUCURSALES.reduce((t, s) => t + (getVal(d, s) || 0), 0);
  const maxDayVal = () => Math.max(1, ...SUCURSALES.map(s => getVal(adminDay, s) || 0));

  const openRegistro = (suc) => {
    setSelectedSuc(suc);
    const existing = getVal(today, suc);
    setCantidad(existing !== null ? existing : 0);
    setSaved(false);
    setScreen("registro");
  };

  const handleSave = async () => {
    setSaving(true);
    const hora = nowTime();
    const ok = await saveEntry(today, selectedSuc, cantidad, hora);
    if (ok) {
      const newData = { ...data };
      if (!newData[today]) newData[today] = {};
      newData[today][selectedSuc] = { cantidad, hora };
      setData(newData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (data === null) return (
    <>
      <style>{CSS}</style>
      <div className="loading"><div className="spinner"/><br/>Cargando datos...</div>
    </>
  );

  const renderHome = () => (
    <div className="main">
      <div className="page-title">Registrá tus<br/><em>consultas</em> del día</div>
      <div className="page-sub" style={{textTransform:"capitalize"}}>{fmtFull(today)}</div>
      <div className="section-label">Seleccioná tu sucursal</div>
      <div className="list">
        {SUCURSALES.map(suc => {
          const done = getVal(today, suc) !== null;
          const entry = getEntry(today, suc);
          return (
            <button key={suc} className={`row-btn${done ? " done" : ""}`} onClick={() => openRegistro(suc)}>
              <div className="row-left"><div className="dot"/><span>{suc}</span></div>
              {done ? (
                <div className="done-tag"><IcoCheck/>{entry.cantidad} consultas · {entry.hora}</div>
              ) : <span style={{color:"var(--muted)"}}>›</span>}
            </button>
          );
        })}
      </div>
      <div className="section-label">Panel de gestión</div>
      <button className="admin-row" onClick={() => setScreen("pin")}>
        <IcoLock/>Acceso administrador
        <span style={{marginLeft:"auto",fontSize:".75rem",color:"#f5c84288"}}>solo vos</span>
      </button>
    </div>
  );

  const renderRegistro = () => (
    <div className="main">
      <button className="back-btn" onClick={() => setScreen("home")}><IcoBack/> Volver</button>
      <div className="card">
        <div className="form-head">
          <div className="form-name">{selectedSuc}</div>
          <div className="form-date" style={{textTransform:"capitalize"}}>{fmtFull(today)}</div>
        </div>
        {saved && <div className="saved-box"><IcoCheck/> Guardado correctamente a las {getEntry(today, selectedSuc)?.hora}</div>}
        <div className="input-label">¿Cuántas consultas recibiste hoy?</div>
        <div className="counter-wrap">
          <button className="cnt-btn" onClick={() => setCantidad(c => Math.max(0, c - 1))}>−</button>
          <div className="cnt-num">{cantidad}</div>
          <button className="cnt-btn" onClick={() => setCantidad(c => c + 1)}>+</button>
        </div>
        <button className="submit-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : getVal(today, selectedSuc) !== null ? "Actualizar registro" : "Guardar registro"}
        </button>
      </div>
      <div className="history-title">Últimos 7 días</div>
      {days.map(d => {
        const v = getVal(d, selectedSuc);
        const entry = getEntry(d, selectedSuc);
        return (
          <div className="hist-row" key={d}>
            <span className="hist-day" style={{textTransform:"capitalize"}}>{fmtDate(d)}</span>
            {v !== null ? (
              <div style={{display:"flex",alignItems:"baseline",gap:"4px"}}>
                <span className="hist-val">{v}</span>
                <span style={{fontSize:".72rem",color:"var(--muted)"}}>consultas · {entry.hora}</span>
              </div>
            ) : <span className="hist-val empty">Sin registro</span>}
          </div>
        );
      })}
    </div>
  );

  const renderPin = () => (
    <div className="main">
      <button className="back-btn" onClick={() => { setScreen("home"); setPin(""); setPinErr(false); }}><IcoBack/> Volver</button>
      <div className="pin-card">
        <div style={{marginBottom:"14px",color:"var(--accent)"}}><IcoLock/></div>
        <div className="pin-title">Acceso Administrador</div>
        <div className="pin-sub">Ingresá el PIN para ver el panel</div>
        {pinErr && <div className="pin-err">PIN incorrecto.</div>}
        <input className="pin-input" type="password" maxLength={4} value={pin}
          onChange={e => { setPin(e.target.value); setPinErr(false); }}
          onKeyDown={e => { if (e.key === "Enter") { if (pin === ADMIN_PIN) { setScreen("admin"); setPin(""); } else { setPinErr(true); setPin(""); } } }}
          placeholder="····" autoFocus/>
        <button className="pin-btn" onClick={() => {
          if (pin === ADMIN_PIN) { setScreen("admin"); setPin(""); setPinErr(false); }
          else { setPinErr(true); setPin(""); }
        }}>Ingresar</button>
      </div>
    </div>
  );

  const renderAdmin = () => {
    const maxV = maxDayVal();
    const reported = SUCURSALES.filter(s => getVal(adminDay, s) !== null).length;
    const total = dayTotal(adminDay);
    return (
      <div className="main">
        <button className="back-btn" onClick={() => setScreen("home")}><IcoBack/> Volver</button>
        <div className="page-title" style={{marginBottom:"5px"}}>Panel <em>Admin</em></div>
        <div className="page-sub">Datos guardados en Google Sheets</div>
        <div className="day-selector">
          {days.map(d => (
            <button key={d} className={`day-pill${adminDay === d ? " active" : ""}`} onClick={() => setAdminDay(d)}>
              {fmtDate(d)}
            </button>
          ))}
        </div>
        <div className="stat-grid">
          <div className="stat-card"><div className="stat-label">Total del día</div><div className="stat-val">{total}</div></div>
          <div className="stat-card"><div className="stat-label">Sucursales reportadas</div><div className="stat-val green">{reported}<span style={{fontSize:"1rem",color:"var(--muted2)"}}>/{SUCURSALES.length}</span></div></div>
        </div>
        <div className="section-label">Detalle por sucursal</div>
        {SUCURSALES.map(suc => {
          const v = getVal(adminDay, suc);
          const entry = getEntry(adminDay, suc);
          const pct = v !== null && maxV > 0 ? (v / maxV) * 100 : 0;
          return (
            <div className="admin-suc-row" key={suc}>
              <div style={{flex:1}}>
                <div className="admin-suc-name">
                  <div className="dot" style={{background: v !== null ? "var(--green)" : "var(--border)"}}/>
                  {suc}
                </div>
                <div className="bar-wrap"><div className="bar-fill" style={{width:`${pct}%`}}/></div>
              </div>
              <div style={{textAlign:"right",marginLeft:"12px"}}>
                {v !== null ? (<><div className="admin-suc-val">{v}</div><span className="admin-suc-time">{entry.hora}</span></>) : <div className="admin-suc-val empty">Sin dato</div>}
              </div>
            </div>
          );
        })}
        <div style={{marginTop:"20px",padding:"12px",background:"var(--surf)",borderRadius:"10px",border:"1px solid var(--border)",fontSize:".78rem",color:"var(--muted2)"}}>
          📊 Los datos se guardan en tu Google Sheets en tiempo real.
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="header">
          <div><div className="logo">Consultas <span>Daily</span></div></div>
          <div className="header-right">
            <div className="date-chip">{new Date().toLocaleDateString("es-AR",{day:"numeric",month:"short"})}</div>
            {screen === "admin" && <div className="admin-chip">ADMIN</div>}
          </div>
        </div>
        {screen === "home" && renderHome()}
        {screen === "registro" && renderRegistro()}
        {screen === "pin" && renderPin()}
        {screen === "admin" && renderAdmin()}
      </div>
    </>
  );
}
