"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import {
    LuArrowLeft, LuCalendarDays, LuClock, LuMapPin,
    LuUser, LuGraduationCap, LuMessageSquare, LuPencil,
    LuPhone, LuFileText
} from "react-icons/lu";

interface Cita {
    id: string;
    pacienteNombre: string;
    pacienteSexo: string;
    pacienteEdad: number;
    esTutor: boolean;
    nombreMenor: string;
    doctorId: string;
    doctorNombre: string;
    especialidad: string;
    fecha: string;
    hora: string;
    duracion: number;
    lugar: string;
    motivo: string;
    estado: string;
    createdAt: any;
}

interface Doctor {
    nombre: string;
    especialidad: string;
    gradoEstudios: string;
    consultorio: string;
    telefono?: number;
    email?: string;
    cedulaUrl?: string;
    fotoUrl?: string;
    sexo?: string;
}

const DURACIONES: Record<number, string> = {
    60: "1 hora",
    90: "1 hora 30 min",
    120: "2 horas",
    150: "2 horas 30 min",
};

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    PENDIENTE: { label: "Pendiente", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
    ACEPTADA: { label: "Aceptada", color: "#2a5f5a", bg: "#f0f9f7", border: "#b2ddd7" },
    COMPLETADA: { label: "Completada", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
    CANCELADA: { label: "Cancelada", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

export default function DetalleCitaPaciente() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [cita, setCita] = useState<Cita | null>(null);
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelando, setCancelando] = useState(false);
    const [showCancelar, setShowCancelar] = useState(false);

    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }
            const snap = await getDoc(doc(db, "citas", id));
            if (snap.exists()) {
                const citaData = { id: snap.id, ...snap.data() } as Cita;
                setCita(citaData);
                if (citaData.doctorId) {
                    const docSnap = await getDoc(doc(db, "doctores", citaData.doctorId));
                    if (docSnap.exists()) setDoctor(docSnap.data() as Doctor);
                }
            }
            setLoading(false);
        }
        cargar();
    }, [id]);

    async function handleCancelar() {
        setCancelando(true);
        try {
            await updateDoc(doc(db, "citas", id), {
                estado: "CANCELADA",
                updatedAt: Timestamp.now(),
            });
            setCita(prev => prev ? { ...prev, estado: "CANCELADA" } : null);
            setShowCancelar(false);
        } catch (e) {
            console.error(e);
        } finally { setCancelando(false); }
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

    const cfg = ESTADO_CONFIG[cita.estado] ?? ESTADO_CONFIG.PENDIENTE;

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", fontFamily: "'Montserrat', sans-serif" }}>

            {/* Modal cancelar */}
            {showCancelar && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                    <div style={{ background: "white", borderRadius: 20, padding: "32px", maxWidth: 400, width: "100%", textAlign: "center" }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                            <LuCalendarDays size={24} color="#dc2626" />
                        </div>
                        <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#1a2e2c", margin: "0 0 8px" }}>
                            ¿Cancelar esta cita?
                        </h3>
                        <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 24px", lineHeight: 1.5 }}>
                            Tu cita con <strong>{cita.doctorNombre}</strong> el <strong>{cita.fecha}</strong> será cancelada. Esta acción no se puede deshacer.
                        </p>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setShowCancelar(false)}
                                style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}>
                                Volver
                            </button>
                            <button onClick={handleCancelar} disabled={cancelando}
                                style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: "#dc2626", color: "white", cursor: cancelando ? "not-allowed" : "pointer", fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
                                {cancelando ? "Cancelando..." : "Sí, cancelar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => router.back()}
                        style={{ padding: "7px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <LuArrowLeft size={18} color="#374151" />
                    </button>
                    <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: 0 }}>
                        Detalle de Cita
                    </h1>
                </div>
                <span style={{ padding: "5px 14px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    {cfg.label}
                </span>
            </div>

            <div style={{ maxWidth: 700, margin: "0 auto", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Card Doctor */}
                <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        {doctor?.fotoUrl ? (
                            <img src={doctor.fotoUrl} alt={cita.doctorNombre}
                                style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "3px solid #e5e7eb" }} />
                        ) : (
                            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1.4rem", flexShrink: 0 }}>
                                {cita.doctorNombre?.[0]?.toUpperCase() ?? "D"}
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "#1a2e2c", margin: "0 0 4px" }}>
                                {cita.doctorNombre}
                            </h2>
                            <p style={{ margin: "0 0 8px", fontSize: "0.82rem", color: "#4a8a85", fontWeight: 500 }}>{cita.especialidad}</p>
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                {doctor?.gradoEstudios && (
                                    <span style={{ fontSize: "0.75rem", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                                        <LuGraduationCap size={13} color="#9ca3af" /> {doctor.gradoEstudios}
                                    </span>
                                )}
                                {doctor?.telefono && (
                                    <span style={{ fontSize: "0.75rem", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                                        <LuPhone size={13} color="#9ca3af" /> {doctor.telefono}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                            <button onClick={() => router.push("/dashboard/mensajes")}
                                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, border: "1px solid #b2ddd7", background: "#f0f9f7", color: "#2a5f5a", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                                <LuMessageSquare size={14} /> Mensaje
                            </button>
                            {doctor?.cedulaUrl && (
                                <a href={doctor.cedulaUrl} target="_blank" rel="noreferrer"
                                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", color: "#6b7280", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
                                    <LuFileText size={14} /> Cédula
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Detalles de la cita */}
                <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb" }}>
                    <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#1a2e2c", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                        <LuCalendarDays size={16} color="#4a8a85" /> Tiempo y Lugar
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {[
                            { icon: <LuCalendarDays size={14} color="#4a8a85" />, label: "Fecha", value: cita.fecha },
                            { icon: <LuClock size={14} color="#4a8a85" />, label: "Hora", value: `${cita.hora} (${DURACIONES[cita.duracion] ?? `${cita.duracion} min`})` },
                            { icon: <LuMapPin size={14} color="#4a8a85" />, label: "Lugar", value: cita.lugar },
                            { icon: <LuUser size={14} color="#4a8a85" />, label: "Tipo", value: cita.esTutor ? `Tutor de ${cita.nombreMenor}` : "Paciente directo" },
                        ].map(item => (
                            <div key={item.label} style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                                <div style={{ marginTop: 2 }}>{item.icon}</div>
                                <div>
                                    <p style={{ margin: 0, fontSize: "0.68rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</p>
                                    <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#1a2e2c", fontWeight: 500 }}>{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Motivo */}
                <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb" }}>
                    <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#1a2e2c", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                        <LuMessageSquare size={16} color="#4a8a85" /> Motivo de Consulta
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.88rem", color: "#374151", lineHeight: 1.7, background: "#f9fafb", borderRadius: 10, padding: "14px 16px" }}>
                        {cita.motivo}
                    </p>
                </div>

                {/* Botones acción */}
                {(cita.estado === "PENDIENTE" || cita.estado === "ACEPTADA") && (
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => setShowCancelar(true)}
                            style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" }}>
                            Cancelar cita
                        </button>
                        <button onClick={() => router.push(`/dashboard/cita/${id}/editar`)}
                            style={{ flex: 1, padding: "13px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <LuPencil size={15} />
                            {cita.estado === "ACEPTADA" ? "Solicitar edición" : "Editar cita"}
                        </button>
                    </div>
                )}

                {cita.estado === "CANCELADA" && (
                    <div style={{ textAlign: "center", padding: "16px", background: "#fef2f2", borderRadius: 12, border: "1px solid #fecaca" }}>
                        <p style={{ margin: 0, color: "#dc2626", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <LuCalendarDays size={16} /> Esta cita fue cancelada
                        </p>
                    </div>
                )}

                {cita.estado === "COMPLETADA" && (
                    <div style={{ textAlign: "center", padding: "16px", background: "#eff6ff", borderRadius: 12, border: "1px solid #bfdbfe" }}>
                        <p style={{ margin: 0, color: "#1d4ed8", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <LuCalendarDays size={16} /> Esta cita fue completada
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}