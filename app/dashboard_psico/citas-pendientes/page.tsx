"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCitasPendientesAction, getCitasHistorialAction, getPacientesAction } from "../actions";
import type { Cita, Paciente } from "@/lib/altas/Pacientes.types";
import { ESPECIALIDADES_LABELS } from "@/lib/altas/Pacientes.types";

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems = [
  { icon: "⊞",  label: "Dashboard",     id: "dashboard" },
  { icon: "👥",  label: "Mis Pacientes", id: "pacientes" },
  { icon: "🗓️", label: "Agenda",         id: "agenda"    },
  { icon: "💬",  label: "Mensajes",      id: "mensajes"  },
  { icon: "📋",  label: "Historial",     id: "historial" },
  { icon: "⚙️",  label: "Configuración", id: "config"    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHora(iso: string | undefined): string {
  if (!iso) return "Por confirmar";
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function formatFechaRelativa(iso: string | undefined): string {
  if (!iso) return "—";
  const hoy = new Date();
  const fecha = new Date(iso);
  const diff = fecha.setHours(0,0,0,0) - hoy.setHours(0,0,0,0);
  if (diff === 0) return "Hoy";
  if (diff === 86400000) return "Mañana";
  return fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function getIniciales(nombre: string): string {
  return nombre.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function DashboardPsico() {
  const router = useRouter();
  const [active, setActive] = useState("dashboard");

  // Datos desde Firestore
  const [citasPendientes, setCitasPendientes] = useState<Cita[]>([]);
  const [citasProximas, setCitasProximas]     = useState<Cita[]>([]);
  const [pacientes, setPacientes]             = useState<Paciente[]>([]);
  const [loading, setLoading]                 = useState(true);

  // Nombre del psicólogo — puedes conectarlo desde el auth/cookie más adelante
  const displayName = "Dr. Alejandro Méndez";
  const especialidad = "Psicología Clínica";

  useEffect(() => {
    Promise.all([
      getCitasPendientesAction(),
      getCitasHistorialAction(),
      getPacientesAction(),
    ]).then(([pendientes, historial, pacs]) => {
      setCitasPendientes(pendientes);
      // Próximas = aceptadas ordenadas por fecha
      const proximas = historial
        .filter(c => c.estado === "aceptada" && c.fechaSolicitada)
        .sort((a, b) => new Date(a.fechaSolicitada!).getTime() - new Date(b.fechaSolicitada!).getTime())
        .slice(0, 3);
      setCitasProximas(proximas);
      setPacientes(pacs);
    }).finally(() => setLoading(false));
  }, []);

  // Stats dinámicos
  const stats = [
    { label: "Pacientes activos",        value: loading ? "…" : String(pacientes.filter(p => p.estado === "activo").length),  icon: "👥", color: "#4a8a85" },
    { label: "Citas por aceptar",        value: loading ? "…" : String(citasPendientes.length),                                icon: "📅", color: citasPendientes.length > 0 ? "#d97706" : "#2a5f5a" },
    { label: "Total pacientes",          value: loading ? "…" : String(pacientes.length),                                      icon: "✅", color: "#6b9e9a" },
    { label: "Pendientes de revisión",   value: loading ? "…" : String(citasPendientes.length),                                icon: "📋", color: "#d97706" },
  ];

  // Navegación del sidebar
  function handleNav(id: string) {
    setActive(id);
    if (id === "pacientes") router.push("/dashboard_psico/pacientes");
    if (id === "agenda")    router.push("/dashboard_psico/citas-pendientes");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f0f4f3" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 220, background: "white", borderRight: "1px solid #e2ebe9", display: "flex", flexDirection: "column", padding: "24px 0", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 10 }}>

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
            <button key={item.id} onClick={() => handleNav(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: "0.86rem", fontFamily: "'Montserrat',sans-serif", fontWeight: active === item.id ? 600 : 400, background: active === item.id ? "#f0f9f7" : "transparent", color: active === item.id ? "#2a5f5a" : "#6b7280", borderLeft: active === item.id ? "3px solid #4a8a85" : "3px solid transparent", transition: "all 0.18s ease", textAlign: "left", position: "relative" }}>
              <span style={{ fontSize: "0.95rem" }}>{item.icon}</span>
              {item.label}
              {/* Badge rojo en "Agenda" si hay citas pendientes */}
              {item.id === "agenda" && citasPendientes.length > 0 && (
                <span style={{ marginLeft: "auto", background: "#ef4444", color: "white", borderRadius: 999, fontSize: "0.62rem", fontWeight: 700, padding: "1px 5px", minWidth: 16, textAlign: "center" }}>
                  {citasPendientes.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Perfil */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid #e2ebe9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7aada8,#4a8a85)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem" }}>🩺</div>
            <div>
              <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "#1a2e2c" }}>{displayName}</p>
              <p style={{ margin: 0, fontSize: "0.68rem", color: "#4a8a85", fontWeight: 500 }}>PROFESIONAL</p>
            </div>
          </div>
          <button onClick={() => router.replace("/login")} title="Cerrar sesión"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "1rem", padding: 4, borderRadius: 6, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>⇥</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ marginLeft: 220, flex: 1, padding: "28px 32px" }}>

        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280", fontFamily: "'Montserrat',sans-serif" }}>
              {new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
            <h1 style={{ margin: "4px 0 0", fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "1.6rem", color: "#1a2e2c" }}>
              Bienvenido, <span style={{ color: "#4a8a85" }}>{displayName}</span> 👋
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#9ca3af", fontFamily: "'Montserrat',sans-serif" }}>{especialidad}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {/* Botón citas por aceptar con badge */}
            {citasPendientes.length > 0 && (
              <button
                onClick={() => router.push("/dashboard_psico/citas-pendientes")}
                style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 10, padding: "9px 16px", color: "#c2410c", fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: "0.83rem", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#ffedd5"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff7ed"; }}
              >
                🗓️ Citas por aceptar
                <span style={{ background: "#ef4444", color: "white", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700, padding: "1px 6px" }}>
                  {citasPendientes.length}
                </span>
              </button>
            )}
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#6b9e9a,#2d6560)", border: "none", borderRadius: 10, padding: "9px 16px", color: "white", fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: "0.83rem", cursor: "pointer" }}>
              + Nueva Cita
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, margin: "24px 0" }}>
          {stats.map((s, i) => (
            <div key={i}
              style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #e2ebe9", boxShadow: "0 2px 8px rgba(42,95,90,0.05)", display: "flex", alignItems: "center", gap: 14, transition: "transform 0.2s ease, box-shadow 0.2s ease", cursor: i === 1 && citasPendientes.length > 0 ? "pointer" : "default" }}
              onClick={() => i === 1 && citasPendientes.length > 0 && router.push("/dashboard_psico/citas-pendientes")}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(42,95,90,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(42,95,90,0.05)"; }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <p style={{ margin: 0, fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "1.4rem", color: i === 1 && citasPendientes.length > 0 ? "#c2410c" : "#1a2e2c", lineHeight: 1 }}>{s.value}</p>
                <p style={{ margin: "3px 0 0", fontSize: "0.75rem", color: "#6b7280" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Grid: Citas próximas + Panel lateral */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

          {/* Próximas citas */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>🗓️</span>
                <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#1a2e2c", margin: 0 }}>Próximas Citas</h3>
              </div>
              <button
                onClick={() => router.push("/dashboard_psico/citas-pendientes")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", color: "#4a8a85", fontWeight: 600 }}>
                Ver agenda completa
              </button>
            </div>

            {loading ? (
              <div style={{ background: "white", borderRadius: 14, padding: "32px", textAlign: "center", border: "1px solid #e2ebe9", color: "#9ca3af", fontSize: "0.88rem" }}>
                <div style={{ width: 24, height: 24, border: "2px solid #e2ebe9", borderTopColor: "#4a8a85", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 8px" }} />
                Cargando citas...
              </div>
            ) : citasProximas.length === 0 ? (
              <div style={{ background: "white", borderRadius: 14, padding: "32px", textAlign: "center", border: "1px solid #e2ebe9", color: "#9ca3af", fontSize: "0.88rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>🗓️</div>
                No hay citas próximas confirmadas
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {citasProximas.map((cita) => (
                  <CitaCard key={cita.id} cita={cita} onVerDetalle={() => router.push("/dashboard_psico/citas-pendientes")} />
                ))}
              </div>
            )}

            {/* Solicitudes pendientes — mini lista */}
            {!loading && citasPendientes.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>⏳</span>
                    <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#1a2e2c", margin: 0 }}>
                      Solicitudes pendientes
                    </h3>
                    <span style={{ background: "#ef4444", color: "white", borderRadius: 999, fontSize: "0.62rem", fontWeight: 700, padding: "1px 6px" }}>
                      {citasPendientes.length}
                    </span>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard_psico/citas-pendientes")}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", color: "#4a8a85", fontWeight: 600 }}>
                    Gestionar todas
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {citasPendientes.slice(0, 3).map((cita) => (
                    <SolicitudCard key={cita.id} cita={cita} onClick={() => router.push("/dashboard_psico/citas-pendientes")} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel lateral */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Card bienvenida */}
            <div style={{ background: "linear-gradient(135deg,#4a8a85,#2a5f5a,#0f3d38)", borderRadius: 16, padding: "22px 20px", color: "white", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ position: "absolute", bottom: -10, right: 30, width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
              <p style={{ margin: "0 0 6px", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Panel profesional</p>
              <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "white", margin: "0 0 8px" }}>
                ¡Bienvenido de vuelta!
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                Tienes{" "}
                <strong style={{ color: "white" }}>{citasProximas.length} citas</strong> próximas
                {citasPendientes.length > 0 && (
                  <> y <strong style={{ color: "#fbbf24" }}>{citasPendientes.length} solicitudes</strong> por atender</>
                )}.
              </p>
              <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", textAlign: "center", flex: 1, border: "1px solid rgba(255,255,255,0.2)" }}>
                  <p style={{ margin: 0, fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "white", lineHeight: 1 }}>
                    {loading ? "…" : citasProximas.length}
                  </p>
                  <p style={{ margin: "3px 0 0", fontSize: "0.62rem", color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em" }}>PRÓXIMAS</p>
                </div>
                <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", textAlign: "center", flex: 1, border: "1px solid rgba(255,255,255,0.2)", cursor: citasPendientes.length > 0 ? "pointer" : "default" }}
                  onClick={() => citasPendientes.length > 0 && router.push("/dashboard_psico/citas-pendientes")}>
                  <p style={{ margin: 0, fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "1.3rem", color: citasPendientes.length > 0 ? "#fbbf24" : "white", lineHeight: 1 }}>
                    {loading ? "…" : citasPendientes.length}
                  </p>
                  <p style={{ margin: "3px 0 0", fontSize: "0.62rem", color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em" }}>PENDIENTES</p>
                </div>
              </div>
            </div>

            {/* Accesos rápidos */}
            <div style={{ background: "white", borderRadius: 14, padding: "18px", border: "1px solid #e2ebe9" }}>
              <h4 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: "0.88rem", color: "#1a2e2c", margin: "0 0 14px" }}>Accesos rápidos</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: "👥", label: "Ver mis pacientes",       action: () => router.push("/dashboard_psico/pacientes") },
                  { icon: "📅", label: "Citas por aceptar",       action: () => router.push("/dashboard_psico/citas-pendientes") },
                  { icon: "📊", label: "Ver estadísticas",        action: () => {} },
                  { icon: "📤", label: "Exportar historial",      action: () => {} },
                ].map((a, i) => (
                  <button key={i} onClick={a.action}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: "1px solid #e2ebe9", background: "white", cursor: "pointer", fontSize: "0.84rem", color: "#374151", fontFamily: "'Montserrat',sans-serif", transition: "background 0.2s ease, border-color 0.2s ease", textAlign: "left" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f0f9f7"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#4a8a85"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "white"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2ebe9"; }}>
                    <span style={{ fontSize: "1rem" }}>{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mis pacientes — mini lista */}
            {!loading && pacientes.length > 0 && (
              <div style={{ background: "white", borderRadius: 14, padding: "18px", border: "1px solid #e2ebe9" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h4 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: "0.88rem", color: "#1a2e2c", margin: 0 }}>Pacientes recientes</h4>
                  <button onClick={() => router.push("/dashboard_psico/pacientes")}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.78rem", color: "#4a8a85", fontWeight: 600 }}>
                    Ver todos
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pacientes.slice(0, 4).map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6b9e9a,#2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0 }}>
                        {getIniciales(p.nombreCompleto)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#1a2e2c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombreCompleto}</p>
                        <p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af" }}>{p.estado === "activo" ? "Activo" : p.estado === "pausado" ? "Pausado" : "Alta"}</p>
                      </div>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.estado === "activo" ? "#16a34a" : p.estado === "pausado" ? "#ca8a04" : "#3b82f6", flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function CitaCard({ cita, onVerDetalle }: { cita: Cita; onVerDetalle: () => void }) {
  const iniciales = getIniciales(cita.pacienteNombre);
  return (
    <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #e2ebe9", boxShadow: "0 2px 8px rgba(42,95,90,0.05)", display: "flex", alignItems: "center", gap: 14, transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(42,95,90,0.1)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(42,95,90,0.05)"; }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#7aada822,#4a8a8533)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", fontWeight: 700, color: "#2a5f5a", flexShrink: 0 }}>
        {iniciales}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.92rem", color: "#1a2e2c" }}>{cita.pacienteNombre}</p>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280" }}>{ESPECIALIDADES_LABELS[cita.especialidad] ?? cita.especialidad}</p>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#2a5f5a" }}>{formatHora(cita.fechaSolicitada)}</p>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>{formatFechaRelativa(cita.fechaSolicitada)}</p>
      </div>
      <button onClick={onVerDetalle} style={{ background: "linear-gradient(135deg,#6b9e9a,#2d6560)", border: "none", borderRadius: 8, padding: "7px 14px", color: "white", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
        Ver
      </button>
    </div>
  );
}

function SolicitudCard({ cita, onClick }: { cita: Cita; onClick: () => void }) {
  const iniciales = getIniciales(cita.pacienteNombre);
  return (
    <div onClick={onClick} style={{ background: "#fff7ed", borderRadius: 12, padding: "12px 14px", border: "1px solid #fed7aa", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "background 0.15s" }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#ffedd5"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "#fff7ed"}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#fdba74,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>
        {iniciales}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "#1a2e2c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cita.pacienteNombre}</p>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "#92400e" }}>{ESPECIALIDADES_LABELS[cita.especialidad] ?? cita.especialidad}</p>
      </div>
      <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#ef4444", color: "white", borderRadius: 999, padding: "2px 7px", flexShrink: 0 }}>NUEVA</span>
    </div>
  );
}