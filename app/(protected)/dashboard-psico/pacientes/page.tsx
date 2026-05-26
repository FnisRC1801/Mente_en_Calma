"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { LuSearch, LuUsers, LuCalendar, LuFileText, LuChevronRight } from "react-icons/lu";

interface PacienteRow {
    uid: string;
    nombre: string;
    fotoUrl?: string;
    edad?: number;
    especialidad: string;
    ultimaCita: string;
    ultimaCitaTimestamp: number;
    estado: "ACTIVO" | "PAUSADO";
}

function Avatar({ nombre, fotoUrl, size = 40 }: { nombre?: string; fotoUrl?: string; size?: number }) {
    if (fotoUrl) return (
        <img src={fotoUrl} alt={nombre} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    );
    return (
        <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>
            {(nombre ?? "P")[0].toUpperCase()}
        </div>
    );
}

export default function PacientesPage() {
    const router = useRouter();
    const [pacientes, setPacientes] = useState<PacienteRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [citasPendientesCount, setCitasPendientesCount] = useState(0);

    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }

            // 1. Traer todas las citas del doctor
            const qCitas = query(collection(db, "citas"), where("doctorId", "==", user.uid));
            const snapCitas = await getDocs(qCitas);

            // Contar pendientes
            const pendientes = snapCitas.docs.filter(d => d.data().estado === "PENDIENTE").length;
            setCitasPendientesCount(pendientes);

            // 2. Agrupar citas por paciente
            const mapaUltimaCita = new Map<string, { fecha: string; timestamp: number; especialidad: string }>();

            snapCitas.docs.forEach(d => {
                const data = d.data();
                const pid = data.pacienteId;
                if (!pid) return;

                // Convertir fecha a timestamp para comparar
                const fechaStr = data.fecha ?? "";
                const ts = new Date(fechaStr).getTime() || 0;

                const actual = mapaUltimaCita.get(pid);
                if (!actual || ts > actual.timestamp) {
                    mapaUltimaCita.set(pid, {
                        fecha: fechaStr,
                        timestamp: ts,
                        especialidad: data.especialidad ?? "",
                    });
                }
            });

            // 3. Por cada paciente único, traer sus datos reales de Firestore
            const ahora = Date.now();
            const tresMeses = 1000 * 60 * 60 * 24 * 90;

            const filas = (await Promise.all(
                Array.from(mapaUltimaCita.entries()).map(async ([uid, citaInfo]) => {
                    let nombre = "Paciente";
                    let fotoUrl: string | undefined;
                    let edad: number | undefined;

                    try {
                        const snap = await getDoc(doc(db, "pacientes", uid));
                        if (!snap.exists()) return null; // cuenta borrada
                        const data = snap.data();
                        nombre = data.nombre ?? nombre;
                        fotoUrl = data.fotoUrl ?? undefined;
                        edad = data.edad ?? undefined;
                    } catch { return null; }

                    const estado: "ACTIVO" | "PAUSADO" =
                        ahora - citaInfo.timestamp < tresMeses ? "ACTIVO" : "PAUSADO";

                    let ultimaCitaLabel = citaInfo.fecha;
                    try {
                        const d = new Date(citaInfo.fecha);
                        if (!isNaN(d.getTime())) {
                            ultimaCitaLabel = d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
                        }
                    } catch { }

                    return {
                        uid, nombre, fotoUrl, edad,
                        especialidad: citaInfo.especialidad,
                        ultimaCita: ultimaCitaLabel,
                        ultimaCitaTimestamp: citaInfo.timestamp,
                        estado,
                    } as PacienteRow;
                })
            )).filter(Boolean) as PacienteRow[];

            // Ordenar: activos primero, luego por última cita más reciente
            filas.sort((a, b) => {
                if (a.estado !== b.estado) return a.estado === "ACTIVO" ? -1 : 1;
                return b.ultimaCitaTimestamp - a.ultimaCitaTimestamp;
            });

            setPacientes(filas);
            setLoading(false);
        }
        cargar();
    }, []);

    const pacientesFiltrados = pacientes.filter(p =>
        (p.nombre ?? "").toLowerCase().includes(busqueda.toLowerCase())
    );

    if (loading) return (
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#4a8a85" }}>Cargando pacientes...</p>
        </div>
    );

    return (
        <div style={{ padding: "24px 32px", fontFamily: "'Montserrat', sans-serif" }}>

            {/* ── Header ───────────────────────────────────────── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "#1a2e2c", margin: 0 }}>
                        Pacientes
                    </h1>
                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
                        Gestión de expedientes y seguimiento clínico
                    </p>
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    {/* Buscador */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", borderRadius: 10, padding: "9px 14px", border: "1px solid #e5e7eb", minWidth: 240 }}>
                        <LuSearch size={15} color="#9ca3af" />
                        <input
                            placeholder="Buscar paciente..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            style={{ border: "none", outline: "none", fontSize: "0.85rem", color: "#374151", width: "100%", fontFamily: "'Montserrat', sans-serif", background: "transparent" }}
                        />
                    </div>

                    {/* Badge citas pendientes */}
                    {citasPendientesCount > 0 && (
                        <button
                            onClick={() => router.push("/dashboard-psico/citas")}
                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, border: "none", background: "#fef9ec", color: "#b45309", fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", position: "relative" }}
                        >
                            <LuCalendar size={15} />
                            Citas por Aceptar
                            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#b45309", color: "white", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {citasPendientesCount}
                            </div>
                        </button>
                    )}
                </div>
            </div>

            {/* ── Tabla ────────────────────────────────────────── */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>

                {/* Cabecera de tabla */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 1fr 100px 1fr", gap: 0, padding: "12px 24px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                    {["NOMBRE DEL PACIENTE", "EDAD", "ÚLTIMA CITA", "ESTADO", "ACCIONES"].map(col => (
                        <p key={col} style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em" }}>{col}</p>
                    ))}
                </div>

                {/* Filas */}
                {pacientesFiltrados.length === 0 ? (
                    <div style={{ padding: "48px 24px", textAlign: "center" }}>
                        <LuUsers size={40} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: "#9ca3af", margin: "0 0 4px" }}>
                            {busqueda ? "No se encontraron pacientes" : "Sin pacientes aún"}
                        </p>
                        <p style={{ fontSize: "0.82rem", color: "#d1d5db", margin: 0 }}>
                            {busqueda ? "Intenta con otro nombre" : "Los pacientes aparecerán aquí cuando agendes citas"}
                        </p>
                    </div>
                ) : (
                    pacientesFiltrados.map((p, i) => (
                        <div
                            key={p.uid}
                            style={{ display: "grid", gridTemplateColumns: "2fr 80px 1fr 100px 1fr", gap: 0, padding: "16px 24px", borderBottom: i < pacientesFiltrados.length - 1 ? "1px solid #f3f4f6" : "none", alignItems: "center", transition: "background 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                            onMouseLeave={e => e.currentTarget.style.background = "white"}
                        >
                            {/* Nombre */}
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <Avatar nombre={p.nombre} fotoUrl={p.fotoUrl} size={38} />
                                <div>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#1a2e2c" }}>{p.nombre}</p>
                                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>{p.especialidad}</p>
                                </div>
                            </div>

                            {/* Edad */}
                            <p style={{ margin: 0, fontSize: "0.88rem", color: "#374151" }}>
                                {p.edad ? `${p.edad} años` : "—"}
                            </p>

                            {/* Última cita */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <LuCalendar size={13} color="#9ca3af" />
                                <p style={{ margin: 0, fontSize: "0.82rem", color: "#6b7280" }}>{p.ultimaCita || "—"}</p>
                            </div>

                            {/* Estado */}
                            <div>
                                <span style={{
                                    padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700,
                                    background: p.estado === "ACTIVO" ? "#f0f9f7" : "#f9fafb",
                                    color: p.estado === "ACTIVO" ? "#2a5f5a" : "#9ca3af",
                                    border: `1px solid ${p.estado === "ACTIVO" ? "#b2ddd7" : "#e5e7eb"}`,
                                }}>
                                    {p.estado}
                                </span>
                            </div>

                            {/* Acciones */}
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    onClick={() => router.push(`/dashboard-psico/pacientes/${p.uid}`)}
                                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", color: "#374151", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif", transition: "all 0.15s" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#f0f9f7"; e.currentTarget.style.borderColor = "#b2ddd7"; e.currentTarget.style.color = "#2a5f5a"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; }}
                                >
                                    <LuChevronRight size={14} /> Seguimiento
                                </button>
                                <button
                                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", color: "#374151", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif", transition: "all 0.15s" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#f0f9f7"; e.currentTarget.style.borderColor = "#b2ddd7"; e.currentTarget.style.color = "#2a5f5a"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; }}
                                >
                                    <LuFileText size={14} /> Subir Informe
                                </button>
                            </div>
                        </div>
                    ))
                )}

                {/* Footer con contador */}
                {pacientesFiltrados.length > 0 && (
                    <div style={{ padding: "12px 24px", borderTop: "1px solid #f3f4f6", background: "#f9fafb" }}>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#9ca3af", textAlign: "center" }}>
                            {pacientesFiltrados.length} paciente{pacientesFiltrados.length !== 1 ? "s" : ""} encontrado{pacientesFiltrados.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}