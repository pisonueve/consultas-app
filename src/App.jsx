import { useState, useEffect } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SUCURSALES = ["San Martín 673", "Godoy Cruz 261", "Galponazo Las Heras", "San Martín", "San Juan"];
const ADMIN_PIN = "1234";
const STORAGE_KEY = "consultas_v2";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
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
  const d = new Date(iso + "T12:00:00");
  const hoy = todayStr();
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
  const ayerStr = ayer.toISOString().split("T")[0];
  if (iso === hoy) return "Hoy";
  if (iso === ayerStr) return "Ayer";
  return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
};

const fmtFull = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
  });

const nowTime = () =>
  new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

// ─── STORAGE ─────────────────────────────────────────────────────────────────
async function loadData() {
  try {
    const r = await window.storage.get(STORAGE_KEY, true);
    return r ? JSON.parse(r.value) : {};
  } catch { return {}; }
}
async function saveData(data) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(data), true); }
  catch (e) { console.error(e); }
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 18, stroke = 2 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    {d}
  </svg>
);
const IcoBack    = () => <Ico d={<polyline points="15 18 9 12 15 6"/>}/>;
const IcoCheck   = () => <Ico d={<polyline points="20 6 9 17 4 12"/>} stroke={2.5}/>;
const IcoLock    = () => <Ico d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}/>;
const IcoChart   = () => <Ico d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>}/>;
const IcoEdit    = () => <Ico size={15} d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}/>;
const IcoCalendar= () => <Ico d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
const IcoStore   = () => <Ico d={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}/>;

// ─── STYLES ──────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0c0e13;--surf:#13161d;--card:#181c25;--border:#252a38;
  --accent:#f5c842;--green:#3de8a0;--red:#f05565;
  --text:#e4e7f0;--muted:#5c6478;--muted2:#8892a4;
  --r:13px;
}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}

/* LAYOUT */
.app{min-height:100vh;display:flex;flex-direction:column}
.header{background:var(--surf);border-bottom:1px solid var(--border);padding:14px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20}
.logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1rem;letter-spacing:-.3px}
.logo span{color:var(--accent)}
.header-right{display:flex;align-items:center;gap:10px}
.date-chip{font-size:.72rem;color:var(--muted2);background:var(--card);border:1px solid var(--border);padding:4px 10px;border-radius:20px}
.admin-chip{font-family:'Syne',sans-serif;font-weight:700;font-size:.68rem;background:var(--accent);color:#0c0e13;padding:4px 10px;border-radius:20px;letter-spacing:.3px}
.main{flex:1;padding:22px 18px;max-width:500px;margin:0 auto;width:100%}

/* TYPOGRAPHY */
.page-title{font-family:'Syne',sans-serif;font-weight:800;font-size:1.6rem;line-height:1.1;margin-bottom:5px}
.page-title em{color:var(--accent);font-style:normal}
.page-sub{color:var(--muted2);font-size:.85rem;margin-bottom:28px}
.section-label{font-family:'Syne',sans-serif;font-size:.65rem;font-weight:700;letter-spacing:1.8px;color:var(--muted);text-transform:uppercase;margin-bottom:10px}

/* CARDS & BUTTONS */
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:18px}

.list{display:flex;flex-direction:column;gap:7px;margin-bottom:20px}

.row-btn{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:border-color .15s,transform .12s,background .15s;color:var(--text);font-family:'DM Sans',sans-serif;font-size:.92rem;font-weight:500;width:100%;text-align:left}
.row-btn:hover{border-color:var(--accent);background:#1d2230;transform:translateX(3px)}
.row-btn.done{border-color:var(--green)}
.row-left{display:flex;align-items:center;gap:11px}
.dot{width:7px;height:7px;border-radius:50%;background:var(--border);flex-shrink:0}
.row-btn.done .dot{background:var(--green)}
.done-tag{display:flex;align-items:center;gap:4px;font-size:.72rem;color:var(--green);font-weight:500}
.arrow-ico{color:var(--muted);font-size:1rem}

.admin-row{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;display:flex;align-items:center;gap:11px;cursor:pointer;transition:all .15s;color:var(--accent);font-family:'Syne',sans-serif;font-weight:700;font-size:.88rem;width:100%;text-align:left}
.admin-row:hover{border-color:var(--accent);background:#1d2230}

/* BACK BTN */
.back-btn{display:flex;align-items:center;gap:5px;color:var(--muted2);font-size:.83rem;cursor:pointer;margin-bottom:22px;background:none;border:none;font-family:'DM Sans',sans-serif;transition:color .15s}
.back-btn:hover{color:var(--text)}

/* FORM */
.form-head{margin-bottom:22px}
.form-name{font-family:'Syne',sans-serif;font-weight:800;font-size:1.4rem;margin-bottom:3px}
.form-date{color:var(--muted2);font-size:.83rem;text-transform:capitalize}

.input-label{font-size:.78rem;color:var(--muted2);margin-bottom:7px;font-weight:500}

.counter-wrap{display:flex;align-items:center;gap:0;margin-bottom:20px}
.cnt-btn{width:46px;height:52px;background:var(--surf);border:1px solid var(--border);color:var(--text);font-size:1.3rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;font-family:'Syne',sans-serif;font-weight:700}
.cnt-btn:first-child{border-radius:10px 0 0 10px}
.cnt-btn:last-child{border-radius:0 10px 10px 0}
.cnt-btn:hover{background:var(--border);color:var(--accent)}
.cnt-num{flex:1;height:52px;background:var(--surf);border-top:1px solid var(--border);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:2rem;color:var(--accent);border-left:none;border-right:none}

.submit-btn{width:100%;background:var(--accent);color:#0c0e13;border:none;border-radius:10px;padding:14px;font-family:'Syne',sans-serif;font-weight:800;font-size:.95rem;cursor:pointer;transition:opacity .15s,transform .12s;letter-spacing:.2px}
.submit-btn:hover{opacity:.9;transform:translateY(-1px)}
.submit-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}

.saved-box{background:#1a2e22;border:1px solid #2a5040;border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:10px;margin-bottom:16px;color:var(--green);font-size:.87rem;font-weight:500}

/* HISTORY INSIDE FORM */
.history-title{font-family:'Syne',sans-serif;font-size:.7rem;font-weight:700;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin:20px 0 10px}
.hist-row{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surf);border:1px solid var(--border);border-radius:9px;margin-bottom:6px}
.hist-day{font-size:.82rem;color:var(--muted2)}
.hist-val{font-family:'Syne',sans-serif;font-weight:700;font-size:.95rem;color:var(--text)}
.hist-val.empty{color:var(--muted);font-weight:400;font-size:.82rem}
.hist-time{font-size:.7rem;color:var(--muted);margin-left:6px}

/* PIN */
.pin-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:28px 24px;text-align:center}
.pin-title{font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;margin-bottom:6px}
.pin-sub{color:var(--muted2);font-size:.83rem;margin-bottom:22px}
.pin-input{width:100%;background:var(--surf);border:1px solid var(--border);border-radius:9px;padding:13px 16px;font-family:'Syne',sans-serif;font-weight:700;font-size:1.4rem;color:var(--accent);text-align:center;letter-spacing:8px;outline:none;transition:border-color .15s;margin-bottom:14px}
.pin-input:focus{border-color:var(--accent)}
.pin-btn{width:100%;background:var(--accent);color:#0c0e13;border:none;border-radius:9px;padding:13px;font-family:'Syne',sans-serif;font-weight:800;font-size:.9rem;cursor:pointer}
.pin-err{color:var(--red);font-size:.8rem;margin-bottom:10px}

/* ADMIN PANEL */
.day-selector{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:22px;scrollbar-width:none}
.day-selector::-webkit-scrollbar{display:none}
.day-pill{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:6px 14px;font-size:.78rem;font-weight:500;cursor:pointer;white-space:nowrap;transition:all .15s;color:var(--muted2);flex-shrink:0}
.day-pill.active{background:var(--accent);color:#0c0e13;border-color:var(--accent);font-family:'Syne',sans-serif;font-weight:700}
.day-pill:hover:not(.active){border-color:var(--muted);color:var(--text)}

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
.bar-fill{height:100%;background:var(--accent);border-radius:4px;transition:width .4s}
.bar-fill.zero{background:var(--border)}

/* WEEK CHART */
.week-chart{margin-top:20px}
.chart-title{font-family:'Syne',sans-serif;font-size:.7rem;font-weight:700;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:12px}
.chart-bars{display:flex;align-items:flex-end;gap:6px;height:80px}
.chart-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}
.chart-bar{width:100%;background:var(--border);border-radius:4px 4px 0 0;transition:height .3s,background .3s;min-height:3px}
.chart-bar.has-data{background:var(--accent);opacity:.7}
.chart-bar.today{background:var(--accent);opacity:1}
.chart-day-label{font-size:.6rem;color:var(--muted);text-align:center}
.chart-val{font-size:.65rem;color:var(--muted2);font-weight:500}

.empty-state{text-align:center;padding:32px 0;color:var(--muted2);font-size:.85rem}
`;

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(null); // { [date]: { [sucursal]: { cantidad, hora } } }
  const [screen, setScreen] = useState("home"); // home | registro | pin | admin
  const [selectedSuc, setSelectedSuc] = useState(null);
  const [adminDay, setAdminDay] = useState(todayStr());
  const [cantidad, setCantidad] = useState(0);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [saved, setSaved] = useState(false);
  const days = last7Days();

  // Load
  useEffect(() => {
    loadData().then(setData);
  }, []);

  if (data === null) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#0c0e13",color:"#5c6478",fontFamily:"'DM Sans',sans-serif"}}>
      Cargando…
    </div>
  );

  const today = todayStr();

  // Helpers
  const getEntry = (date, suc) => data?.[date]?.[suc] ?? null;
  const getVal = (date, suc) => getEntry(date, suc)?.cantidad ?? null;

  const todayTotal = () => {
    let t = 0;
    SUCURSALES.forEach(s => { t += getVal(today, s) || 0; });
    return t;
  };
  const todayReported = () => SUCURSALES.filter(s => getVal(today, s) !== null).length;

  // Save entry
  const handleSave = async () => {
    const newData = { ...data };
    if (!newData[today]) newData[today] = {};
    newData[today][selectedSuc] = { cantidad, hora: nowTime() };
    setData(newData);
    await saveData(newData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Open registro
  const openRegistro = (suc) => {
    setSelectedSuc(suc);
    const existing = getVal(today, suc);
    setCantidad(existing !== null ? existing : 0);
    setSaved(false);
    setScreen("registro");
  };

  // Admin stats for a day
  const dayTotal = (d) => {
    let t = 0;
    SUCURSALES.forEach(s => { t += getVal(d, s) || 0; });
    return t;
  };
  const maxDayVal = () => {
    let m = 1;
    SUCURSALES.forEach(s => {
      const v = getVal(adminDay, s) || 0;
      if (v > m) m = v;
    });
    return m;
  };
  const maxWeekVal = () => {
    let m = 1;
    days.forEach(d => { const v = dayTotal(d); if (v > m) m = v; });
    return m;
  };

  // ── RENDER SCREENS ──────────────────────────────────────────────────────────

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
              <div className="row-left">
                <div className="dot"/>
                <span>{suc}</span>
              </div>
              {done ? (
                <div className="done-tag">
                  <IcoCheck/>
                  {entry.cantidad} consultas · {entry.hora}
                </div>
              ) : (
                <span className="arrow-ico">›</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="section-label">Panel de gestión</div>
      <button className="admin-row" onClick={() => setScreen("pin")}>
        <IcoLock/>
        Acceso administrador
        <span style={{marginLeft:"auto", fontSize:".75rem", color:"#f5c84288"}}>solo vos</span>
      </button>
    </div>
  );

  const renderRegistro = () => {
    const suc = selectedSuc;
    const histDays = days.slice(0, 6); // últimos 6 días (sin hoy)

    return (
      <div className="main">
        <button className="back-btn" onClick={() => setScreen("home")}><IcoBack/> Volver</button>

        <div className="card">
          <div className="form-head">
            <div className="form-name">{suc}</div>
            <div className="form-date" style={{textTransform:"capitalize"}}>{fmtFull(today)}</div>
          </div>

          {saved && (
            <div className="saved-box">
              <IcoCheck/> Guardado correctamente a las {getEntry(today, suc)?.hora}
            </div>
          )}

          <div className="input-label">¿Cuántas consultas recibiste hoy?</div>
          <div className="counter-wrap">
            <button className="cnt-btn" onClick={() => setCantidad(c => Math.max(0, c - 1))}>−</button>
            <div className="cnt-num">{cantidad}</div>
            <button className="cnt-btn" onClick={() => setCantidad(c => c + 1)}>+</button>
          </div>

          <button className="submit-btn" onClick={handleSave}>
            {getVal(today, suc) !== null ? "Actualizar registro" : "Guardar registro"}
          </button>
        </div>

        {/* Historial */}
        <div className="history-title">Últimos 7 días</div>
        {days.map(d => {
          const v = getVal(d, suc);
          const entry = getEntry(d, suc);
          return (
            <div className="hist-row" key={d}>
              <span className="hist-day" style={{textTransform:"capitalize"}}>{fmtDate(d)}</span>
              {v !== null ? (
                <div style={{display:"flex",alignItems:"baseline",gap:"4px"}}>
                  <span className="hist-val">{v}</span>
                  <span style={{fontSize:".72rem",color:"var(--muted)"}}>consultas</span>
                  <span className="hist-time">· {entry.hora}</span>
                </div>
              ) : (
                <span className="hist-val empty">Sin registro</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderPin = () => (
    <div className="main">
      <button className="back-btn" onClick={() => { setScreen("home"); setPin(""); setPinErr(false); }}><IcoBack/> Volver</button>
      <div className="pin-card">
        <div style={{marginBottom:"14px",color:"var(--accent)"}}><IcoLock/></div>
        <div className="pin-title">Acceso Administrador</div>
        <div className="pin-sub">Ingresá el PIN para ver el panel</div>
        {pinErr && <div className="pin-err">PIN incorrecto. Intentá de nuevo.</div>}
        <input
          className="pin-input"
          type="password"
          maxLength={4}
          value={pin}
          onChange={e => { setPin(e.target.value); setPinErr(false); }}
          onKeyDown={e => { if (e.key === "Enter") { if (pin === ADMIN_PIN) { setScreen("admin"); setPin(""); } else { setPinErr(true); setPin(""); } } }}
          placeholder="····"
          autoFocus
        />
        <button className="pin-btn" onClick={() => {
          if (pin === ADMIN_PIN) { setScreen("admin"); setPin(""); setPinErr(false); }
          else { setPinErr(true); setPin(""); }
        }}>Ingresar</button>
      </div>
    </div>
  );

  const renderAdmin = () => {
    const maxV = maxDayVal();
    const maxW = maxWeekVal();
    const reported = SUCURSALES.filter(s => getVal(adminDay, s) !== null).length;
    const total = dayTotal(adminDay);

    return (
      <div className="main">
        <button className="back-btn" onClick={() => setScreen("home")}><IcoBack/> Volver al inicio</button>

        <div className="page-title" style={{marginBottom:"5px"}}>Panel <em>Admin</em></div>
        <div className="page-sub">Resumen por sucursal · últimos 7 días</div>

        {/* Day selector */}
        <div className="day-selector">
          {days.map(d => (
            <button key={d} className={`day-pill${adminDay === d ? " active" : ""}`} onClick={() => setAdminDay(d)}>
              {fmtDate(d)}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Total del día</div>
            <div className="stat-val">{total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sucursales reportadas</div>
            <div className="stat-val green">{reported}<span style={{fontSize:"1rem",color:"var(--muted2)"}}>/{SUCURSALES.length}</span></div>
          </div>
        </div>

        {/* Per-sucursal */}
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
                <div className="bar-wrap">
                  <div className={`bar-fill${v === null || v === 0 ? " zero" : ""}`} style={{width: `${pct}%`}}/>
                </div>
              </div>
              <div style={{textAlign:"right",marginLeft:"12px"}}>
                {v !== null ? (
                  <>
                    <div className="admin-suc-val">{v}</div>
                    <span className="admin-suc-time">{entry.hora}</span>
                  </>
                ) : (
                  <div className="admin-suc-val empty">Sin dato</div>
                )}
              </div>
            </div>
          );
        })}

        {/* Week chart */}
        <div className="week-chart">
          <div className="chart-title">Evolución semanal (total red)</div>
          <div className="chart-bars">
            {days.map(d => {
              const v = dayTotal(d);
              const h = maxW > 0 ? Math.max(3, (v / maxW) * 72) : 3;
              return (
                <div className="chart-col" key={d}>
                  <span className="chart-val">{v || ""}</span>
                  <div
                    className={`chart-bar${v > 0 ? " has-data" : ""}${d === today ? " today" : ""}`}
                    style={{height: `${h}px`}}
                  />
                  <span className="chart-day-label">{fmtDate(d).slice(0,3)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* Header */}
        <div className="header">
          <div>
            <div className="logo">Consultas <span>Daily</span></div>
          </div>
          <div className="header-right">
            <div className="date-chip">{new Date().toLocaleDateString("es-AR",{day:"numeric",month:"short"})}</div>
            {screen === "admin" && <div className="admin-chip">ADMIN</div>}
          </div>
        </div>

        {screen === "home"     && renderHome()}
        {screen === "registro" && renderRegistro()}
        {screen === "pin"      && renderPin()}
        {screen === "admin"    && renderAdmin()}
      </div>
    </>
  );
}