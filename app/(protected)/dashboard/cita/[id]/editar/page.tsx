"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { LuArrowLeft, LuCalendarDays, LuClock, LuCheck } from "react-icons/lu";

interface Cita {
    id: string;
    doctorNombre: string;
    especialidad: string;
    fecha: string;
    hora: string;
    duracion: number;
    lugar: string;
    motivo: string;
    estado: string;
}

const DURACIONES = [
    { label: "1 hora", value: 60 },
    { label: "1 hora 30 min", value: 90 },
    { label: "2 horas", value: 120 },
    { label: "2 horas 30 min", value: 150 },
];

export default function EditarCita() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [cita, setCita] = useState<Cita | null>(null);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [exito, setExito] = useState(false);
    const [error, setError] = useState("");

    // Campos editables
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [duracion, setDuracion] = useState(60);

    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }
            const snap = await getDoc(doc(db, "citas", id));
            if (snap.exists()) {
                const data = { id: snap.id, ...snap.data() } as Cita;
                setCita(data);
                setFecha(data.fecha);
                setHora(data.hora);
                setDuracion(data.duracion ?? 60);
            }
            setLoading(false);
        }
        cargar();
    }, [id]);

    async function handleGuardar() {
        if (!fecha || !hora) { setError("Por favor completa todos los campos."); return; }
        setGuardando(true); setError("");
        try {
            if (cita?.estado === "ACEPTADA") {
                // Solicitud de edición — requiere aprobación del médico
                await updateDoc(doc(db, "citas", id), {
                    solicitudEdicion: {
                        fecha,
                        hora,
                        duracion,
                        solicitadoEn: Timestamp.now(),
                        estado: "EN_REVISION",
                    },
                    updatedAt: Timestamp.now(),
                });
            } else {
                // Cita pendiente — se edita directo
                await updateDoc(doc(db, "citas", id), {
                    fecha,
                    hora,
                    duracion,
                    updatedAt: Timestamp.now(),
                });
            }
            setExito(true);
            setTimeout(() => router.push(`/dashboard/cita/${id}`), 2000);
        } catch (e) {
            setError("Error al guardar los cambios.");
        } finally { setGuardando(false); }
    }

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#4a8a85" }}>Cargando...</p>
        </div>
    );

    if (!cita) return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#dc2626" }}>Cita no encontrada.</p>
        </div>
    );

    const esAceptada = cita.estado === "ACEPTADA";

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", fontFamily: "'Montserrat', sans-serif" }}>

            {/* Modal éxito */}
            {exito && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                    <div style={{ background: "white", borderRadius: 20, padding: "36px", maxWidth: 380, width: "100%", textAlign: "center" }}>
                        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f0f9f7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                            <LuCheck size={28} color="#2a5f5a" />
                        </div>
                        <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#1a2e2c", margin: "0 0 8px" }}>
                            {esAceptada ? "Solicitud enviada" : "Cita actualizada"}
                        </h3>
                        <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
                            {esAceptada
                                ? "Tu solicitud de cambio fue enviada al psicólogo. Recibirás una notificación cuando sea revisada."
                                : "Tu cita fue actualizada correctamente."}
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => router.back()}
                        style={{ padding: "7px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex" }}>
                        <LuArrowLeft size={18} color="#374151" />
                    </button>
                    <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: 0 }}>
                        {esAceptada ? "Solicitar edición" : "Editar cita"}
                    </h1>
                </div>
                {esAceptada && (
                    <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a" }}>
                        Requiere aprobación del médico
                    </span>
                )}
            </div>

            <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Info cita actual */}
                <div style={{ background: "white", borderRadius: 16, padding: "20px", border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>
                            {cita.doctorNombre?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem", color: "#1a2e2c", fontFamily: "'Poppins', sans-serif" }}>{cita.doctorNombre}</p>
                            <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#4a8a85" }}>{cita.especialidad} · {cita.lugar}</p>
                        </div>
                    </div>
                </div>

                {/* Aviso si es aceptada */}
                {esAceptada && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ fontSize: "1rem", flexShrink: 0 }}>⚠️</span>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "#92400e", lineHeight: 1.5 }}>
                            Esta cita ya fue aceptada por el médico. Los cambios que solicites quedarán <strong>en revisión</strong> hasta que el médico los apruebe.
                        </p>
                    </div>
                )}

                {/* Formulario */}
                <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 18 }}>
                    <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#1a2e2c", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                        <LuCalendarDays size={16} color="#4a8a85" /> Nueva fecha y hora
                    </h3>

                    {/* Fecha */}
                    <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Fecha
                        </label>
                        <input type="date"
                            value={fecha}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={e => setFecha(e.target.value)}
                            style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 10, padding: "11px 14px", fontSize: "0.9rem", outline: "none", fontFamily: "'Montserrat', sans-serif", color: "#111827", boxSizing: "border-box" }}
                        />
                    </div>

                    {/* Hora */}
                    <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Hora
                        </label>
                        <select value={hora} onChange={e => setHora(e.target.value)}
                            style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 10, padding: "11px 14px", fontSize: "0.9rem", outline: "none", fontFamily: "'Montserrat', sans-serif", color: hora ? "#111827" : "#9ca3af", background: "white", boxSizing: "border-box", appearance: "none" }}>
                            <option value="">Selecciona una hora</option>
                            {Array.from({ length: 17 }, (_, i) => {
                                const h = Math.floor(i / 2) + 9;
                                const m = i % 2 === 0 ? "00" : "30";
                                const time = `${h.toString().padStart(2, "0")}:${m}`;
                                if (h >= 17) return null;
                                return <option key={time} value={time}>{time} {h < 12 ? "AM" : "PM"}</option>;
                            })}
                        </select>
                    </div>

                    {/* Duración */}
                    <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Duración
                        </label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                            {DURACIONES.map(d => (
                                <button key={d.value} type="button" onClick={() => setDuracion(d.value)}
                                    style={{ padding: "10px 6px", borderRadius: 10, border: `2px solid ${duracion === d.value ? "#4a8a85" : "#e5e7eb"}`, background: duracion === d.value ? "#f0f9f7" : "white", color: duracion === d.value ? "#2a5f5a" : "#6b7280", fontWeight: duracion === d.value ? 600 : 400, fontSize: "0.75rem", cursor: "pointer", transition: "all 0.15s", fontFamily: "'Montserrat', sans-serif", textAlign: "center" }}>
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {error && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px" }}>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "#dc2626" }}>{error}</p>
                    </div>
                )}

                {/* Botones */}
                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => router.back()}
                        style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "0.88rem" }}>
                        Cancelar
                    </button>
                    <button onClick={handleGuardar} disabled={guardando}
                        style={{ flex: 1, padding: "13px", borderRadius: 12, border: "none", background: guardando ? "#9ca3af" : "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", cursor: guardando ? "not-allowed" : "pointer", fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "0.88rem" }}>
                        {guardando ? "Guardando..." : esAceptada ? "Enviar solicitud" : "Guardar cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
}