"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
    LuCalendarDays, LuClock, LuMapPin, LuSearch,
    LuX, LuChevronDown, LuChevronUp, LuFileText,
} from "react-icons/lu";

interface Cita {
    id: string;
    pacienteNombre: string;
    especialidad: string;
    fecha: string;
    hora: string;
    lugar: string;
    duracion?: number;
    estado: "COMPLETADA" | "CANCELADA";
    motivo?: string;
}

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const ESTADO_CONFIG = {
    COMPLETADA: { label: "Completada", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6" },
    CANCELADA:  { label: "Cancelada",  color: "#dc2626", bg: "#fef2f2", border: "#fecaca", dot: "#ef4444" },
};

export default function HistorialPsicologo() {
    const router = useRouter();
    const [citas,        setCitas]        = useState<Cita[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [busqueda,     setBusqueda]     = useState("");
    const [filtroEstado, setFiltroEstado] = useState<"TODOS" | "COMPLETADA" | "CANCELADA">("TODOS");
    const [citaDetalle,  setCitaDetalle]  = useState<Cita | null>(null);
    const [orden,        setOrden]        = useState<"desc" | "asc">("desc");

    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }
            const [snapC, snapX] = await Promise.all([
                getDocs(query(collection(db, "citas"), where("doctorId", "==", user.uid), where("estado", "==", "COMPLETADA"))),
                getDocs(query(collection(db, "citas"), where("doctorId", "==", user.uid), where("estado", "==", "CANCELADA"))),
            ]);
            const todas = [
                ...snapC.docs.map(d => ({ id: d.id, ...d.data() } as Cita)),
                ...snapX.docs.map(d => ({ id: d.id, ...d.data() } as Cita)),
            ].sort((a, b) => b.fecha.localeCompare(a.fecha));
            setCitas(todas);
            setLoading(false);
        }
        cargar();
    }, []);

    const citasFiltradas = citas
        .filter(c => {
            const matchEstado   = filtroEstado === "TODOS" || c.estado === filtroEstado;
            const matchBusqueda = c.pacienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                c.especialidad.toLowerCase().includes(busqueda.toLowerCase());
            return matchEstado && matchBusqueda;
        })
        .sort((a, b) => orden === "desc"
            ? b.fecha.localeCompare(a.fecha)
            : a.fecha.localeCompare(b.fecha));

    function formatFecha(fechaStr: string) {
        const d = new Date(fechaStr + "T00:00:00");
        return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
    }

    if (loading) return (
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#4a8a85" }}>Cargando historial...</p>
        </div>
    );

    return (
        <div style={{ padding: "24px 32px", fontFamily: "'Montserrat', sans-serif", maxWidth: 900, margin: "0 auto" }}>
            <style>{`::-webkit-scrollbar { width: 0px; height: 0px; }`}</style>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "#1a2e2c", margin: "0 0 4px" }}>Historial de Citas</h1>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#9ca3af" }}>Registro de sesiones completadas y canceladas</p>
            </div>

            {/* Filtros */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                    <LuSearch size={14} color="#9ca3af" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar paciente o especialidad..."
                        style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: "1px solid #e5e7eb", borderRadius: 10, fontSize: "0.82rem", outline: "none", fontFamily: "'Montserrat', sans-serif", color: "#374151", boxSizing: "border-box" }} />
                    {busqueda && (
                        <button onClick={() => setBusqueda("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", display: "flex" }}>
                            <LuX size={13} color="#9ca3af" />
                        </button>
                    )}
                </div>
                <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 3, gap: 2 }}>
                    {(["TODOS", "COMPLETADA", "CANCELADA"] as const).map(e => (
                        <button key={e} onClick={() => setFiltroEstado(e)}
                            style={{ padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, fontFamily: "'Montserrat', sans-serif", background: filtroEstado === e ? "white" : "transparent", color: filtroEstado === e ? "#2a5f5a" : "#6b7280", boxShadow: filtroEstado === e ? "0 1px 3px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>
                            {e === "TODOS" ? "Todos" : ESTADO_CONFIG[e].label}
                        </button>
                    ))}
                </div>
                <button onClick={() => setOrden(o => o === "desc" ? "asc" : "desc")}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", fontFamily: "'Montserrat', sans-serif" }}>
                    {orden === "desc" ? <LuChevronDown size={13} /> : <LuChevronUp size={13} />}
                    {orden === "desc" ? "Más recientes" : "Más antiguas"}
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                {[
                    { label: "Total",       value: citas.length,                                        color: "#4a8a85", bg: "#f0f9f7" },
                    { label: "Completadas", value: citas.filter(c => c.estado === "COMPLETADA").length, color: "#1d4ed8", bg: "#eff6ff" },
                    { label: "Canceladas",  value: citas.filter(c => c.estado === "CANCELADA").length,  color: "#dc2626", bg: "#fef2f2" },
                ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px 16px" }}>
                        <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: s.color, fontFamily: "'Poppins', sans-serif" }}>{s.value}</p>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#6b7280", fontWeight: 500 }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabla */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 0.8fr", padding: "10px 16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                    {["PACIENTE","ESPECIALIDAD","FECHA","HORA","ESTADO"].map(col => (
                        <p key={col} style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em" }}>{col}</p>
                    ))}
                </div>

                {citasFiltradas.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 20px" }}>
                        <LuFileText size={36} color="#d1d5db" style={{ margin: "0 auto 10px" }} />
                        <p style={{ fontSize: "0.88rem", color: "#9ca3af", margin: 0 }}>
                            {busqueda || filtroEstado !== "TODOS" ? "No se encontraron citas con esos filtros" : "No hay citas en el historial aún"}
                        </p>
                    </div>
                ) : (
                    citasFiltradas.map((c, i) => {
                        const cfg = ESTADO_CONFIG[c.estado];
                        return (
                            <div key={c.id} onClick={() => setCitaDetalle(c)}
                                style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 0.8fr", padding: "12px 16px", borderBottom: i < citasFiltradas.length - 1 ? "1px solid #f3f4f6" : "none", cursor: "pointer", transition: "background 0.15s", alignItems: "center" }}
                                onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                                onMouseLeave={e => e.currentTarget.style.background = "white"}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.82rem", flexShrink: 0 }}>
                                        {c.pacienteNombre[0]?.toUpperCase()}
                                    </div>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "#1a2e2c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.pacienteNombre}</p>
                                </div>
                                <p style={{ margin: 0, fontSize: "0.82rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.especialidad}</p>
                                <p style={{ margin: 0, fontSize: "0.82rem", color: "#374151" }}>{formatFecha(c.fecha)}</p>
                                <p style={{ margin: 0, fontSize: "0.82rem", color: "#374151" }}>{c.hora}{c.duracion ? ` · ${c.duracion}m` : ""}</p>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: "0.68rem", fontWeight: 700, color: cfg.color }}>
                                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot }} />
                                    {cfg.label}
                                </span>
                            </div>
                        );
                    })
                )}

                {citasFiltradas.length > 0 && (
                    <div style={{ padding: "10px 16px", borderTop: "1px solid #f3f4f6", background: "#f9fafb" }}>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{citasFiltradas.length} cita{citasFiltradas.length !== 1 ? "s" : ""} encontrada{citasFiltradas.length !== 1 ? "s" : ""}</p>
                    </div>
                )}
            </div>

            {/* Modal detalle */}
            {citaDetalle && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                    <div style={{ background: "white", borderRadius: 20, padding: "28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                            <div>
                                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#1a2e2c", margin: "0 0 4px" }}>{citaDetalle.pacienteNombre}</h3>
                                <p style={{ margin: 0, fontSize: "0.82rem", color: "#4a8a85" }}>{citaDetalle.especialidad}</p>
                            </div>
                            <button onClick={() => setCitaDetalle(null)} style={{ padding: 6, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex" }}>
                                <LuX size={16} color="#6b7280" />
                            </button>
                        </div>
                        {(() => {
                            const cfg = ESTADO_CONFIG[citaDetalle.estado];
                            return <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>;
                        })()}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0" }}>
                            {[
                                { icon: <LuCalendarDays size={14} color="#4a8a85" />, value: formatFecha(citaDetalle.fecha) },
                                { icon: <LuClock size={14} color="#4a8a85" />, value: `${citaDetalle.hora}${citaDetalle.duracion ? ` · ${citaDetalle.duracion} min` : ""}` },
                                { icon: <LuMapPin size={14} color="#4a8a85" />, value: citaDetalle.lugar },
                            ].map((item, i) => (
                                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", background: "#f9fafb", borderRadius: 8 }}>
                                    {item.icon}
                                    <span style={{ fontSize: "0.85rem", color: "#374151" }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                        {citaDetalle.motivo && (
                            <div style={{ padding: "10px 12px", background: "#f9fafb", borderRadius: 8, marginBottom: 16 }}>
                                <p style={{ margin: "0 0 4px", fontSize: "0.68rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Motivo</p>
                                <p style={{ margin: 0, fontSize: "0.82rem", color: "#374151", lineHeight: 1.5 }}>{citaDetalle.motivo}</p>
                            </div>
                        )}
                        <button onClick={() => setCitaDetalle(null)}
                            style={{ width: "100%", padding: "10px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}