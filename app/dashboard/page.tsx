"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

const navItems = [
  { icon: "⊞", label: "Dashboard",        id: "dashboard" },
  { icon: "📅", label: "Mis Citas",        id: "citas"     },
  { icon: "💬", label: "Mensajes",         id: "mensajes"  },
  { icon: "📋", label: "Historial Médico", id: "historial" },
  { icon: "⚙️", label: "Configuración",    id: "config"    },
];

const citas = [
  { nombre: "Dra. Sarah Jenkins", especialidad: "Terapia Cognitivo Conductual", fecha: "26 de Oct, 2023", hora: "10:00 AM - 11:00 AM", lugar: "Consultorio B-12",       estado: "ACEPTADA",  estadoColor: "#4a8a85", avatar: "👩‍⚕️" },
  { nombre: "Dr. Michael Chen",   especialidad: "Manejo del Estrés",            fecha: "30 de Oct, 2023", hora: "04:30 PM",            lugar: "Consultorio Presencial", estado: "PENDIENTE", estadoColor: "#d97706", avatar: "👨‍⚕️" },
];

// Calendario — Octubre 2023
const diasSemana = ["LUN","MAR","MIÉ","JUE","VIE","SÁB","DOM"];
// Oct 2023 empieza en domingo (índice 6 en lun-dom), 31 días
const primerDia = 6; // domingo
const totalDias = 31;

const eventosCalendario: Record<number, { hora: string; doctor: string; color: string }> = {
  26: { hora: "10:00 AM", doctor: "Dra. Sarah Jenkins (Presencial)", color: "#4a8a85" },
  30: { hora: "04:30 PM", doctor: "Dr. Michael Chen (Presencial)",   color: "#d97706" },
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive]   = useState("dashboard");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.replace("/login"); }
      else    { setUser(u); setLoading(false); }
    });
    return () => unsub();
  }, [router]);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Usuario";

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to bottom, #5f817d, #0f1e33)" }}>
      <div style={{ textAlign: "center", color: "white" }}>
        <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontFamily: "'Poppins',sans-serif", opacity: 0.8 }}>Verificando sesión...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // Construir celdas del calendario
  const celdas: (number | null)[] = [
    ...Array(primerDia).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f0f4f3" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 210, background: "white", borderRight: "1px solid #e2ebe9", display: "flex", flexDirection: "column", padding: "24px 0", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 10 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px 28px" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#6b9e9a,#2d6560)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src="https://static.vecteezy.com/system/resources/thumbnails/011/653/087/small_2x/psychology-3d-render-icon-illustration-png.png" alt="" style={{ width: 22, height: 22, objectFit: "cover", borderRadius: 5 }} />
          </div>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#1a2e2c" }}>Mente en Calma</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 10px" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActive(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: "0.86rem", fontFamily: "'Montserrat',sans-serif", fontWeight: active === item.id ? 600 : 400, background: active === item.id ? "#f0f9f7" : "transparent", color: active === item.id ? "#2a5f5a" : "#6b7280", borderLeft: active === item.id ? "3px solid #4a8a85" : "3px solid transparent", transition: "all 0.18s ease", textAlign: "left" }}>
              <span style={{ fontSize: "0.95rem" }}>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        {/* Usuario */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid #e2ebe9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7aada8,#4a8a85)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem" }}>👤</div>
            <div>
              <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#1a2e2c" }}>{displayName}</p>
              <p style={{ margin: 0, fontSize: "0.68rem", color: "#4a8a85", fontWeight: 500 }}>PACIENTE</p>
            </div>
          </div>
          <button onClick={() => signOut(auth).then(() => router.replace("/login"))} title="Cerrar sesión"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "1rem", padding: 4, borderRadius: 6, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>⇥</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ marginLeft: 210, flex: 1, padding: "24px 28px" }}>

        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h1 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#1a2e2c", margin: 0 }}>Panel del Paciente</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #d1d5db", borderRadius: 10, padding: "7px 13px" }}>
              <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, color: "#9ca3af" }} fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input placeholder="Buscar citas, médicos..." style={{ border: "none", outline: "none", fontSize: "0.83rem", color: "#374151", width: 180, background: "transparent" }} />
            </div>
            <button style={{ fontSize: "1.1rem", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>🔔</button>
            <button
              onClick={() => signOut(auth).then(() => router.replace("/login"))}
              className="btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #d1d5db", borderRadius: 10, padding: "8px 14px", color: "#374151", fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: "0.83rem", cursor: "pointer", background: "white" }}>
              Cerrar sesión
            </button>
            <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#6b9e9a,#2d6560)", border: "none", borderRadius: 10, padding: "8px 16px", color: "white", fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: "0.83rem", cursor: "pointer", position: "relative", overflow: "hidden" }}>
              + Agendar Nueva Cita
            </button>
          </div>
        </div>

        {/* Banner bienvenida */}
        <div style={{ background: "linear-gradient(135deg,#4a8a85,#2a5f5a,#0f3d38)", borderRadius: 16, padding: "22px 28px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", color: "white", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: 200, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", bottom: -20, right: 100, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "1.4rem", margin: "0 0 6px", color: "white" }}>
              ¡Hola, {displayName}!
            </h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", maxWidth: 380 }}>
              Tienes una sesión programada para mañana a las 10:00 AM con la Dra. Jenkins. Recuerda completar el formulario previo.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, position: "relative", zIndex: 1 }}>
            {[{ num: "12", label: "COMPLETADAS" }, { num: "02", label: "PRÓXIMAS" }].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", borderRadius: 12, padding: "14px 20px", textAlign: "center", minWidth: 80, border: "1px solid rgba(255,255,255,0.2)" }}>
                <p style={{ margin: 0, fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "1.6rem", color: "white", lineHeight: 1 }}>{s.num}</p>
                <p style={{ margin: "4px 0 0", fontSize: "0.62rem", color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Grid: Citas + Calendario */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

          {/* Próximas Citas */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>📅</span>
                <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#1a2e2c", margin: 0 }}>Próximas Citas</h3>
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", color: "#4a8a85", fontWeight: 600 }}>Ver historial completo</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {citas.map((cita, i) => (
                <div key={i} style={{ background: "white", borderRadius: 14, padding: 18, border: "1px solid #e2ebe9", boxShadow: "0 2px 8px rgba(42,95,90,0.05)", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(42,95,90,0.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(42,95,90,0.05)"; }}>

                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 10, background: "linear-gradient(135deg,#7aada822,#4a8a8533)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>{cita.avatar}</div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.92rem", color: "#1a2e2c" }}>{cita.nombre}</p>
                        <p style={{ margin: 0, fontSize: "0.76rem", color: "#6b7280" }}>{cita.especialidad}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: cita.estado === "ACEPTADA" ? "#f0f9f7" : "#fffbeb", color: cita.estadoColor, border: `1px solid ${cita.estadoColor}44`, letterSpacing: "0.06em" }}>
                      {cita.estado}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
                    {[{ icon: "📅", text: cita.fecha }, { icon: "🕐", text: cita.hora }, { icon: "📍", text: cita.lugar }].map((d, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: "0.75rem" }}>{d.icon}</span>
                        <span style={{ fontSize: "0.78rem", color: "#4b5563" }}>{d.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Botones */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button className="btn-primary" style={{ background: i === 0 ? "linear-gradient(135deg,#6b9e9a,#2d6560)" : "none", border: i === 0 ? "none" : "1px solid #e2ebe9", borderRadius: 9, padding: "8px", color: i === 0 ? "white" : "#374151", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      {i === 0 ? "📨 Enviar mensaje" : "🔄 Reprogramar"}
                    </button>
                    <button style={{ background: "none", border: "1px solid #e2ebe9", borderRadius: 9, padding: "8px", color: "#374151", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", transition: "background 0.2s ease" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f0f4f3")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      Detalles de Cita
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendario */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span>📅</span>
              <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#1a2e2c", margin: 0 }}>Calendario Mensual</h3>
            </div>

            <div style={{ background: "white", borderRadius: 14, padding: 18, border: "1px solid #e2ebe9", boxShadow: "0 2px 8px rgba(42,95,90,0.05)" }}>
              {/* Mes */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: "0.92rem", color: "#1a2e2c" }}>Octubre 2023</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {["‹","›"].map(a => (
                    <button key={a} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #e2ebe9", background: "white", cursor: "pointer", fontSize: "0.9rem", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f0f4f3")}
                      onMouseLeave={e => (e.currentTarget.style.background = "white")}>{a}</button>
                  ))}
                </div>
              </div>

              {/* Días semana */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
                {diasSemana.map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: "0.62rem", fontWeight: 600, color: "#9ca3af", padding: "4px 0" }}>{d}</div>
                ))}
              </div>

              {/* Celdas */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                {celdas.map((dia, idx) => {
                  const esHoy = dia === 26;
                  const tieneEvento = dia !== null && eventosCalendario[dia];
                  return (
                    <div key={idx} style={{ textAlign: "center", padding: "5px 2px", borderRadius: 7, background: esHoy ? "linear-gradient(135deg,#6b9e9a,#2d6560)" : "transparent", cursor: dia ? "pointer" : "default", transition: "background 0.15s ease", position: "relative" }}
                      onMouseEnter={e => { if (!esHoy && dia) (e.currentTarget as HTMLDivElement).style.background = "#f0f9f7"; }}
                      onMouseLeave={e => { if (!esHoy && dia) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: esHoy ? 700 : 400, color: esHoy ? "white" : dia ? "#374151" : "#d1d5db" }}>
                        {dia ?? ""}
                      </span>
                      {tieneEvento && !esHoy && (
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: eventosCalendario[dia!].color, margin: "1px auto 0" }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Eventos */}
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(eventosCalendario).map(([dia, ev]) => (
                  <div key={dia} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 10, background: "#f7faf9", border: `1px solid ${ev.color}33` }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: ev.color, marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "#1a2e2c" }}>{dia} Oct · {ev.hora}</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "#6b7280" }}>{ev.doctor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
