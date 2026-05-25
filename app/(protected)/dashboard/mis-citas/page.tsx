"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
    LuCalendarDays, LuClock, LuMapPin, LuChevronLeft,
    LuChevronRight, LuPlus, LuX, LuCalendar, LuList,
} from "react-icons/lu";

interface Cita {
    id: string;
    doctorNombre: string;
    especialidad: string;
    fecha: string;
    hora: string;
    lugar: string;
    estado: "PENDIENTE" | "ACEPTADA" | "COMPLETADA" | "CANCELADA";
    motivo?: string;
    duracion?: number;
}

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS_CORTO = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const HORAS = Array.from({ length: 12 }, (_, i) => i + 7);

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
    PENDIENTE: { label: "Pendiente", color: "#b45309", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b" },
    ACEPTADA: { label: "Aceptada", color: "#2a5f5a", bg: "#f0f9f7", border: "#b2ddd7", dot: "#4a8a85" },
    COMPLETADA: { label: "Completada", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6" },
    CANCELADA: { label: "Cancelada", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", dot: "#ef4444" },
};

export default function MisCitas() {
    const router = useRouter();
    const [citas, setCitas] = useState<Cita[]>([]);
    const [loading, setLoading] = useState(true);
    const [fechaActual, setFechaActual] = useState(new Date());
    const [vista, setVista] = useState<"mes" | "semana">("mes");
    const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
    const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);

    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }
            const q = query(collection(db, "citas"), where("pacienteId", "==", user.uid));
            const snap = await getDocs(q);
            setCitas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Cita)));
            setLoading(false);
        }
        cargar();
    }, []);

    function parseFecha(fecha: string) { return new Date(fecha + "T00:00:00"); }

    function getCitasDia(date: Date) {
        return citas.filter(c => {
            const f = parseFecha(c.fecha);
            return f.getFullYear() === date.getFullYear() &&
                f.getMonth() === date.getMonth() &&
                f.getDate() === date.getDate();
        });
    }

    function getInicioSemana(date: Date) {
        const d = new Date(date);
        d.setDate(d.getDate() - d.getDay());
        return d;
    }

    function getDiasSemana() {
        const inicio = getInicioSemana(fechaActual);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(inicio);
            d.setDate(d.getDate() + i);
            return d;
        });
    }

    function navegar(dir: number) {
        const d = new Date(fechaActual);
        if (vista === "mes") d.setMonth(d.getMonth() + dir);
        else d.setDate(d.getDate() + dir * 7);
        setFechaActual(d);
        setDiaSeleccionado(null);
    }

    function getTituloNav() {
        if (vista === "mes") return `${MESES[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;
        const dias = getDiasSemana();
        const ini = dias[0]; const fin = dias[6];
        if (ini.getMonth() === fin.getMonth())
            return `${ini.getDate()} - ${fin.getDate()} de ${MESES[ini.getMonth()]} ${ini.getFullYear()}`;
        return `${ini.getDate()} ${MESES[ini.getMonth()].slice(0, 3)} - ${fin.getDate()} ${MESES[fin.getMonth()].slice(0, 3)} ${fin.getFullYear()}`;
    }

    // Citas próximas (pendientes + aceptadas, ordenadas por fecha)
    const citasProximas = citas
        .filter(c => c.estado === "PENDIENTE" || c.estado === "ACEPTADA")
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

    // ── Vista mensual ─────────────────────────────────────────
    function renderMes() {
        const year = fechaActual.getFullYear();
        const month = fechaActual.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const hoy = new Date();

        return (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
                    {DIAS_CORTO.map(d => (
                        <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em" }}>{d}</div>
                    ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", flex: 1, gridAutoRows: "minmax(90px, 1fr)" }}>
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`e${i}`} style={{ borderRight: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dia = i + 1;
                        const esHoy = dia === hoy.getDate() && month === hoy.getMonth() && year === hoy.getFullYear();
                        const seleccionado = diaSeleccionado === dia;
                        const citasDia = getCitasDia(new Date(year, month, dia)).filter(c => c.estado !== "CANCELADA");
                        return (
                            <div key={dia} onClick={() => setDiaSeleccionado(seleccionado ? null : dia)}
                                style={{ borderRight: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", padding: "6px", cursor: "pointer", background: seleccionado ? "#f0f9f7" : "white", transition: "background 0.15s" }}
                                onMouseEnter={e => { if (!seleccionado) e.currentTarget.style.background = "#fafafa"; }}
                                onMouseLeave={e => { if (!seleccionado) e.currentTarget.style.background = "white"; }}>
                                <div style={{ width: 26, height: 26, borderRadius: "50%", background: esHoy ? "#2d6560" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 3 }}>
                                    <span style={{ fontSize: "0.8rem", fontWeight: esHoy ? 700 : 400, color: esHoy ? "white" : "#374151" }}>{dia}</span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    {citasDia.slice(0, 2).map(c => {
                                        const cfg = ESTADO_CONFIG[c.estado];
                                        return (
                                            <div key={c.id} onClick={e => { e.stopPropagation(); setCitaSeleccionada(c); }}
                                                style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderLeft: `3px solid ${cfg.dot}`, borderRadius: 4, padding: "2px 5px", fontSize: "0.63rem", color: cfg.color, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}>
                                                {c.hora} {c.doctorNombre.split(" ").slice(-1)[0]}
                                            </div>
                                        );
                                    })}
                                    {citasDia.length > 2 && <div style={{ fontSize: "0.6rem", color: "#9ca3af", paddingLeft: 4 }}>+{citasDia.length - 2} más</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {diaSeleccionado && (() => {
                    const citasDia = getCitasDia(new Date(year, month, diaSeleccionado));
                    return (
                        <div style={{ borderTop: "1px solid #e5e7eb", padding: "14px 20px", background: "white", flexShrink: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.88rem", color: "#1a2e2c", margin: 0 }}>
                                    {diaSeleccionado} de {MESES[month]}
                                </h3>
                                <button onClick={() => setDiaSeleccionado(null)} style={{ border: "none", background: "none", cursor: "pointer", color: "#9ca3af", fontSize: "1rem" }}>✕</button>
                            </div>
                            {citasDia.length === 0 ? (
                                <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: 0 }}>Sin citas este día</p>
                            ) : (
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {citasDia.map(c => {
                                        const cfg = ESTADO_CONFIG[c.estado];
                                        return (
                                            <div key={c.id} onClick={() => setCitaSeleccionada(c)}
                                                style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${cfg.border}`, background: cfg.bg, cursor: "pointer", minWidth: 160 }}>
                                                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.82rem", color: "#1a2e2c" }}>{c.doctorNombre}</p>
                                                <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#6b7280" }}>{c.hora} · {c.especialidad}</p>
                                                <span style={{ fontSize: "0.68rem", fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        );
    }

    // ── Vista semanal ─────────────────────────────────────────
    function renderSemana() {
        const dias = getDiasSemana();
        const hoy = new Date();
        return (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "56px repeat(7, 1fr)", borderBottom: "1px solid #e5e7eb", flexShrink: 0, minWidth: 560 }}>
                    <div />
                    {dias.map((d, i) => {
                        const esHoy = d.toDateString() === hoy.toDateString();
                        return (
                            <div key={i} style={{ padding: "8px 0", textAlign: "center", borderLeft: "1px solid #f3f4f6" }}>
                                <p style={{ margin: 0, fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.06em" }}>{DIAS_CORTO[d.getDay()]}</p>
                                <div style={{ width: 30, height: 30, borderRadius: "50%", background: esHoy ? "#2d6560" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", margin: "3px auto 0" }}>
                                    <span style={{ fontSize: "0.88rem", fontWeight: esHoy ? 700 : 400, color: esHoy ? "white" : "#374151" }}>{d.getDate()}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div style={{ flex: 1, overflowY: "auto", minWidth: 560 }}>
                    {HORAS.map(hora => (
                        <div key={hora} style={{ display: "grid", gridTemplateColumns: "56px repeat(7, 1fr)", minHeight: 56, borderBottom: "1px solid #f3f4f6" }}>
                            <div style={{ padding: "4px 8px 0 0", textAlign: "right", fontSize: "0.65rem", color: "#9ca3af", fontWeight: 500, paddingTop: 3 }}>
                                {hora < 12 ? `${hora} AM` : hora === 12 ? "12 PM" : `${hora - 12} PM`}
                            </div>
                            {dias.map((d, di) => {
                                const citasHora = getCitasDia(d).filter(c => parseInt(c.hora.split(":")[0]) === hora);
                                return (
                                    <div key={di} style={{ borderLeft: "1px solid #f3f4f6", padding: "2px 3px" }}>
                                        {citasHora.map(c => {
                                            const cfg = ESTADO_CONFIG[c.estado];
                                            return (
                                                <div key={c.id} onClick={() => setCitaSeleccionada(c)}
                                                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderLeft: `3px solid ${cfg.dot}`, borderRadius: 5, padding: "3px 5px", cursor: "pointer", marginBottom: 2 }}>
                                                    <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, color: cfg.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.hora}</p>
                                                    <p style={{ margin: 0, fontSize: "0.62rem", color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.doctorNombre.split(" ")[0]}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#4a8a85" }}>Cargando...</p>
        </div>
    );

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "white", fontFamily: "'Montserrat', sans-serif" }}>

            {/* Modal */}
            {citaSeleccionada && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                    <div style={{ background: "white", borderRadius: 20, padding: "28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                            <div>
                                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#1a2e2c", margin: 0 }}>{citaSeleccionada.doctorNombre}</h3>
                                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#4a8a85" }}>{citaSeleccionada.especialidad}</p>
                            </div>
                            <button onClick={() => setCitaSeleccionada(null)} style={{ padding: 6, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex" }}>
                                <LuX size={16} color="#6b7280" />
                            </button>
                        </div>
                        {(() => { const cfg = ESTADO_CONFIG[citaSeleccionada.estado]; return <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>; })()}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0" }}>
                            {[
                                { icon: <LuCalendarDays size={14} color="#4a8a85" />, value: citaSeleccionada.fecha },
                                { icon: <LuClock size={14} color="#4a8a85" />, value: `${citaSeleccionada.hora}${citaSeleccionada.duracion ? ` · ${citaSeleccionada.duracion} min` : ""}` },
                                { icon: <LuMapPin size={14} color="#4a8a85" />, value: citaSeleccionada.lugar },
                            ].map((item, i) => (
                                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", background: "#f9fafb", borderRadius: 8 }}>
                                    {item.icon}
                                    <span style={{ fontSize: "0.85rem", color: "#374151" }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                        {citaSeleccionada.motivo && (
                            <div style={{ padding: "10px 12px", background: "#f9fafb", borderRadius: 8, marginBottom: 16 }}>
                                <p style={{ margin: "0 0 4px", fontSize: "0.68rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Motivo</p>
                                <p style={{ margin: 0, fontSize: "0.82rem", color: "#374151", lineHeight: 1.5 }}>{citaSeleccionada.motivo}</p>
                            </div>
                        )}
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => { router.push(`/dashboard/cita/${citaSeleccionada.id}`); setCitaSeleccionada(null); }}
                                style={{ flex: 1, padding: "10px", borderRadius: 12, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontSize: "0.85rem", fontFamily: "'Montserrat', sans-serif" }}>
                                Ver detalles
                            </button>
                            {(citaSeleccionada.estado === "PENDIENTE" || citaSeleccionada.estado === "ACEPTADA") && (
                                <button onClick={() => { router.push(`/dashboard/cita/${citaSeleccionada.id}/editar`); setCitaSeleccionada(null); }}
                                    style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>
                                    {citaSeleccionada.estado === "ACEPTADA" ? "Solicitar edición" : "Editar cita"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 3, gap: 2 }}>
                        {[{ key: "mes", icon: <LuCalendar size={14} />, label: "Mes" }, { key: "semana", icon: <LuList size={14} />, label: "Semana" }].map(v => (
                            <button key={v.key} onClick={() => setVista(v.key as "mes" | "semana")}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "'Montserrat', sans-serif", background: vista === v.key ? "white" : "transparent", color: vista === v.key ? "#2a5f5a" : "#6b7280", boxShadow: vista === v.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>
                                {v.icon} {v.label}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => navegar(-1)} style={{ padding: 5, borderRadius: 7, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex" }}><LuChevronLeft size={15} color="#6b7280" /></button>
                        <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#1a2e2c", minWidth: 170, textAlign: "center" }}>{getTituloNav()}</span>
                        <button onClick={() => navegar(1)} style={{ padding: 5, borderRadius: 7, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex" }}><LuChevronRight size={15} color="#6b7280" /></button>
                        <button onClick={() => setFechaActual(new Date())} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", fontFamily: "'Montserrat', sans-serif" }}>Hoy</button>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

                    <button onClick={() => router.push("/dashboard/nueva-cita")}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 9, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                        <LuPlus size={15} /> Nueva Cita
                    </button>
                </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

                {/* Calendario */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid #e5e7eb" }}>
                    {vista === "mes" ? renderMes() : renderSemana()}
                </div>

                {/* Panel lateral */}
                <div style={{ width: 280, display: "flex", flexDirection: "column", background: "white", overflow: "hidden", flexShrink: 0 }}>
                    <div style={{ padding: "16px 16px 10px", borderBottom: "1px solid #f3f4f6" }}>
                        <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#1a2e2c", margin: 0 }}>Próximas Citas</h3>
                        <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#9ca3af" }}>{citasProximas.length} pendiente{citasProximas.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px" }}>
                        {citasProximas.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "32px 16px" }}>
                                <LuCalendarDays size={32} color="#d1d5db" style={{ margin: "0 auto 8px" }} />
                                <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: 0 }}>Sin citas próximas</p>
                                <button onClick={() => router.push("/dashboard/nueva-cita")}
                                    style={{ marginTop: 12, padding: "7px 14px", borderRadius: 9, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                                    + Agendar
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {citasProximas.map(c => {
                                    const cfg = ESTADO_CONFIG[c.estado];
                                    const fecha = parseFecha(c.fecha);
                                    return (
                                        <div key={c.id} onClick={() => setCitaSeleccionada(c)}
                                            style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${cfg.border}`, background: cfg.bg, cursor: "pointer", transition: "opacity 0.15s" }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                                            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.82rem", color: "#1a2e2c", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.doctorNombre}</p>
                                                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: cfg.color, background: "white", border: `1px solid ${cfg.border}`, padding: "1px 6px", borderRadius: 10, flexShrink: 0, marginLeft: 4 }}>{cfg.label}</span>
                                            </div>
                                            <p style={{ margin: "0 0 6px", fontSize: "0.72rem", color: "#6b7280" }}>{c.especialidad}</p>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.7rem", color: "#6b7280" }}>
                                                    <LuCalendarDays size={11} /> {fecha.getDate()} {MESES[fecha.getMonth()].slice(0, 3)}
                                                </span>
                                                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.7rem", color: "#6b7280" }}>
                                                    <LuClock size={11} /> {c.hora}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}