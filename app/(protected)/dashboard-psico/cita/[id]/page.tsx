"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";

interface Cita {
    id: string;
    pacienteNombre: string;
    pacienteSexo: string;
    pacienteEdad: number;
    esTutor: boolean;
    nombreMenor: string;
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

const DURACIONES: Record<number, string> = {
    60: "1 hora",
    90: "1 hora 30 min",
    120: "2 horas",
    150: "2 horas 30 min",
};

export default function DetalleCita() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [cita, setCita] = useState<Cita | null>(null);
    const [loading, setLoading] = useState(true);
    const [accionando, setAccionando] = useState(false);
    const [confirmacion, setConfirmacion] = useState<"aceptar" | "rechazar" | null>(null);

    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }
            const snap = await getDoc(doc(db, "citas", id));
            if (snap.exists()) setCita({ id: snap.id, ...snap.data() } as Cita);
            setLoading(false);
        }
        cargar();
    }, [id]);

    async function handleAccion(accion: "ACEPTADA" | "CANCELADA") {
        setAccionando(true);
        try {
            await updateDoc(doc(db, "citas", id), {
                estado: accion,
                updatedAt: Timestamp.now(),
            });
            router.push("/dashboard-psico");
        } catch (e) {
            console.error(e);
        } finally { setAccionando(false); }
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

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", fontFamily: "'Montserrat', sans-serif" }}>

            {/* Modal confirmación */}
            {confirmacion && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                    <div style={{ background: "white", borderRadius: 20, padding: "32px", maxWidth: 400, width: "100%", textAlign: "center" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>
                            {confirmacion === "aceptar" ? "✅" : "❌"}
                        </div>
                        <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: "0 0 8px" }}>
                            {confirmacion === "aceptar" ? "¿Aceptar esta cita?" : "¿Rechazar esta cita?"}
                        </h3>
                        <p style={{ fontSize: "0.88rem", color: "#6b7280", margin: "0 0 24px" }}>
                            {confirmacion === "aceptar"
                                ? `Confirmarás la cita con ${cita.pacienteNombre} el ${cita.fecha} a las ${cita.hora}.`
                                : "El paciente será notificado que su solicitud fue rechazada."}
                        </p>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setConfirmacion(null)}
                                style={{ flex: 1, padding: "10px", borderRadius: 12, border: "1px solid #d1d5db", background: "white", color: "#374151", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}>
                                Cancelar
                            </button>
                            <button onClick={() => handleAccion(confirmacion === "aceptar" ? "ACEPTADA" : "CANCELADA")}
                                disabled={accionando}
                                style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: confirmacion === "aceptar" ? "linear-gradient(135deg, #6b9e9a, #2d6560)" : "#dc2626", color: "white", cursor: accionando ? "not-allowed" : "pointer", fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
                                {accionando ? "Procesando..." : confirmacion === "aceptar" ? "Sí, aceptar" : "Sí, rechazar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => router.push("/dashboard-psico")}
                        style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #d1d5db", background: "white", color: "#374151", fontSize: "0.85rem", cursor: "pointer" }}>
                        ← Volver
                    </button>
                    <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: 0 }}>
                        Detalle de Cita
                    </h1>
                </div>
                <span style={{ padding: "6px 14px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600, background: cita.estado === "PENDIENTE" ? "#fef9ec" : cita.estado === "ACEPTADA" ? "#f0f9f7" : "#fef2f2", color: cita.estado === "PENDIENTE" ? "#b45309" : cita.estado === "ACEPTADA" ? "#2a5f5a" : "#dc2626", border: `1px solid ${cita.estado === "PENDIENTE" ? "#fde68a" : cita.estado === "ACEPTADA" ? "#b2ddd7" : "#fecaca"}` }}>
                    {cita.estado}
                </span>
            </div>

            <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px" }}>

                {/* Paciente */}
                <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 16px" }}>
                        👤 Información del Paciente
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[
                            { label: "Nombre", value: cita.pacienteNombre },
                            { label: "Sexo", value: cita.pacienteSexo === "M" ? "Masculino" : "Femenino" },
                            { label: "Edad", value: `${cita.pacienteEdad} años` },
                            { label: "Tipo", value: cita.esTutor ? `Tutor (menor: ${cita.nombreMenor})` : "Paciente directo" },
                        ].map(item => (
                            <div key={item.label} style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px" }}>
                                <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{item.label}</p>
                                <p style={{ margin: 0, fontSize: "0.88rem", color: "#1a2e2c", fontWeight: 500 }}>{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detalles cita */}
                <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 16px" }}>
                        📅 Detalles de la Cita
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[
                            { label: "Especialidad", value: cita.especialidad },
                            { label: "Fecha", value: cita.fecha },
                            { label: "Hora", value: cita.hora },
                            { label: "Duración", value: DURACIONES[cita.duracion] ?? `${cita.duracion} min` },
                            { label: "Lugar", value: cita.lugar },
                            { label: "Solicitada", value: cita.createdAt?.toDate?.().toLocaleDateString("es-MX") ?? "" },
                        ].map(item => (
                            <div key={item.label} style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px" }}>
                                <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{item.label}</p>
                                <p style={{ margin: 0, fontSize: "0.88rem", color: "#1a2e2c", fontWeight: 500 }}>{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Motivo */}
                <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb", marginBottom: 24 }}>
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 12px" }}>
                        💬 Motivo de Consulta
                    </h2>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#374151", lineHeight: 1.7, background: "#f9fafb", borderRadius: 10, padding: "14px 16px" }}>
                        {cita.motivo}
                    </p>
                </div>

                {/* Botones acción */}
                {cita.estado === "PENDIENTE" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <button onClick={() => setConfirmacion("rechazar")}
                            style={{ padding: "14px", borderRadius: 12, border: "none", background: "#fef2f2", color: "#dc2626", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer" }}>
                            ✕ Rechazar cita
                        </button>
                        <button onClick={() => setConfirmacion("aceptar")}
                            style={{ padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer" }}>
                            ✓ Aceptar cita
                        </button>
                    </div>
                )}

                {cita.estado !== "PENDIENTE" && (
                    <div style={{ textAlign: "center", padding: "16px", background: cita.estado === "ACEPTADA" ? "#f0f9f7" : "#fef2f2", borderRadius: 12 }}>
                        <p style={{ margin: 0, color: cita.estado === "ACEPTADA" ? "#2a5f5a" : "#dc2626", fontWeight: 600 }}>
                            {cita.estado === "ACEPTADA" ? "✅ Esta cita fue aceptada" : "❌ Esta cita fue rechazada"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}