"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
    LuCalendarDays, LuClock, LuMapPin, LuSearch,
    LuDownload, LuFileText, LuFilter
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

const FILTROS_ESTADO = ["Todas", "Completada", "Cancelada"];

export default function HistorialMedico() {
    const router = useRouter();
    const [citas, setCitas] = useState<Cita[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("Todas");
    const [filtroAnio, setFiltroAnio] = useState("Todos");

    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }
            const q = query(collection(db, "citas"), where("pacienteId", "==", user.uid));
            const snap = await getDocs(q);
            const data = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as Cita))
                .filter(c => c.estado === "COMPLETADA" || c.estado === "CANCELADA")
                .sort((a, b) => b.fecha.localeCompare(a.fecha));
            setCitas(data);
            setLoading(false);
        }
        cargar();
    }, []);

    const anios = ["Todos", ...Array.from(new Set(citas.map(c => c.fecha.split("-")[0]))).sort((a, b) => b.localeCompare(a))];

    const citasFiltradas = citas.filter(c => {
        const coincideEstado = filtroEstado === "Todas" || c.estado === filtroEstado.toUpperCase();
        const coincideAnio = filtroAnio === "Todos" || c.fecha.startsWith(filtroAnio);
        const coincideBusqueda = busqueda === "" ||
            c.doctorNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            c.especialidad.toLowerCase().includes(busqueda.toLowerCase());
        return coincideEstado && coincideAnio && coincideBusqueda;
    });

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#4a8a85" }}>Cargando...</p>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", fontFamily: "'Montserrat', sans-serif" }}>

            {/* Header */}
            <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                <div>
                    <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: 0 }}>Historial Médico</h1>
                    <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#9ca3af" }}>Consulta y descarga tus reportes de sesiones anteriores</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, background: "#f0f9f7", border: "1px solid #b2ddd7" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4a8a85" }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#2a5f5a" }}>Datos encriptados</span>
                </div>
            </div>

            <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Buscador y filtros */}
                <div style={{ background: "white", borderRadius: 14, padding: "16px", border: "1px solid #e5e7eb", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 10, background: "#f9fafb", borderRadius: 10, padding: "10px 14px", border: "1px solid #e5e7eb" }}>
                        <LuSearch size={15} color="#9ca3af" />
                        <input
                            placeholder="Buscar por doctor o especialidad..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            style={{ border: "none", background: "none", outline: "none", fontSize: "0.85rem", color: "#374151", width: "100%", fontFamily: "'Montserrat', sans-serif" }}
                        />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <LuFilter size={14} color="#9ca3af" />
                        <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}
                            style={{ border: "1px solid #e5e7eb", borderRadius: 9, padding: "8px 12px", fontSize: "0.82rem", color: "#374151", fontFamily: "'Montserrat', sans-serif", background: "white", cursor: "pointer", outline: "none" }}>
                            {anios.map(a => <option key={a} value={a}>{a === "Todos" ? "Todos los años" : a}</option>)}
                        </select>
                    </div>
                </div>

                {/* Filtros estado */}
                <div style={{ display: "flex", gap: 8 }}>
                    {FILTROS_ESTADO.map(f => (
                        <button key={f} onClick={() => setFiltroEstado(f)}
                            style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, fontFamily: "'Montserrat', sans-serif", background: filtroEstado === f ? "#2a5f5a" : "#f3f4f6", color: filtroEstado === f ? "white" : "#6b7280", transition: "all 0.2s" }}>
                            {f}
                        </button>
                    ))}
                </div>

                {/* Lista */}
                {citasFiltradas.length === 0 ? (
                    <div style={{ background: "white", borderRadius: 16, padding: "48px 24px", border: "1px solid #e5e7eb", textAlign: "center" }}>
                        <LuFileText size={40} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: "#9ca3af", margin: "0 0 4px" }}>Sin registros</p>
                        <p style={{ fontSize: "0.82rem", color: "#d1d5db", margin: 0 }}>No hay sesiones en tu historial con esos filtros</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {citasFiltradas.map(cita => (
                            <div key={cita.id} style={{ background: "white", borderRadius: 14, padding: "18px 22px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 16 }}>

                                {/* Icono */}
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: cita.estado === "COMPLETADA" ? "#f0f9f7" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <LuFileText size={20} color={cita.estado === "COMPLETADA" ? "#4a8a85" : "#dc2626"} />
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.92rem", color: "#1a2e2c", fontFamily: "'Poppins', sans-serif" }}>{cita.doctorNombre}</p>
                                            <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#4a8a85", fontWeight: 500 }}>{cita.especialidad}</p>
                                        </div>
                                        <span style={{
                                            padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap",
                                            color: cita.estado === "COMPLETADA" ? "#1d4ed8" : "#dc2626",
                                            background: cita.estado === "COMPLETADA" ? "#eff6ff" : "#fef2f2",
                                            border: `1px solid ${cita.estado === "COMPLETADA" ? "#bfdbfe" : "#fecaca"}`
                                        }}>
                                            {cita.estado === "COMPLETADA" ? "Finalizada" : "Cancelada"}
                                        </span>
                                    </div>

                                    <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.76rem", color: "#6b7280" }}>
                                            <LuCalendarDays size={12} color="#9ca3af" /> {cita.fecha}
                                        </span>
                                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.76rem", color: "#6b7280" }}>
                                            <LuClock size={12} color="#9ca3af" /> {cita.hora}{cita.duracion ? ` (${cita.duracion} min)` : ""}
                                        </span>
                                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.76rem", color: "#6b7280" }}>
                                            <LuMapPin size={12} color="#9ca3af" /> {cita.lugar}
                                        </span>
                                    </div>
                                </div>

                                {/* Botón descargar — solo completadas */}
                                {cita.estado === "COMPLETADA" && (
                                    <button
                                        title="Descargar reporte"
                                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid #b2ddd7", background: "#f0f9f7", color: "#2a5f5a", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}>
                                        <LuDownload size={14} /> Reporte PDF
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}