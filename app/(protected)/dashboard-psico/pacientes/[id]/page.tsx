"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { LuArrowLeft, LuCalendar, LuClock, LuMapPin, LuUser, LuMail, LuPhone } from "react-icons/lu";

interface Paciente {
    nombre: string;
    email: string;
    telefono?: number;
    sexo?: string;
    edad?: number;
    fechaNacimiento?: string;
    fotoUrl?: string;
}

interface Cita {
    id: string;
    especialidad: string;
    fecha: string;
    hora: string;
    lugar: string;
    motivo: string;
    estado: string;
    duracion?: number;
}

const ESTADO_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    ACEPTADA:   { bg: "#f0f9f7", color: "#2a5f5a",  border: "#b2ddd7" },
    COMPLETADA: { bg: "#f0f9f7", color: "#2a5f5a",  border: "#b2ddd7" },
    PENDIENTE:  { bg: "#fef9ec", color: "#b45309",  border: "#fde68a" },
    CANCELADA:  { bg: "#fef2f2", color: "#dc2626",  border: "#fecaca" },
};

function Avatar({ nombre, fotoUrl, size = 72 }: { nombre?: string; fotoUrl?: string; size?: number }) {
    if (fotoUrl) return (
        <img src={fotoUrl} alt={nombre} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "3px solid #e5e7eb" }} />
    );
    return (
        <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1.8rem" }}>
            {(nombre ?? "P")[0].toUpperCase()}
        </div>
    );
}

export default function DetallePaciente() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [citas, setCitas] = useState<Cita[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }

            // Datos del paciente
            const pacSnap = await getDoc(doc(db, "pacientes", id));
            if (pacSnap.exists()) setPaciente(pacSnap.data() as Paciente);

            // Citas de este paciente con este doctor
            const q = query(
                collection(db, "citas"),
                where("doctorId", "==", user.uid),
                where("pacienteId", "==", id)
            );
            const snap = await getDocs(q);
            const citasData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Cita));

            // Ordenar por fecha descendente
            citasData.sort((a, b) => {
                const fa = new Date(a.fecha).getTime() || 0;
                const fb = new Date(b.fecha).getTime() || 0;
                return fb - fa;
            });

            setCitas(citasData);
            setLoading(false);
        }
        cargar();
    }, [id]);

    if (loading) return (
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#4a8a85" }}>Cargando...</p>
        </div>
    );

    if (!paciente) return (
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#dc2626" }}>Paciente no encontrado.</p>
        </div>
    );

    const citasCompletadas = citas.filter(c => c.estado === "COMPLETADA" || c.estado === "ACEPTADA").length;
    const citasPendientes  = citas.filter(c => c.estado === "PENDIENTE").length;

    return (
        <div style={{ padding: "24px 32px", fontFamily: "'Montserrat', sans-serif", maxWidth: 900, margin: "0 auto" }}>

            {/* ── Back ─────────────────────────────────────────── */}
            <button
                onClick={() => router.push("/dashboard-psico/pacientes")}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", color: "#374151", fontSize: "0.85rem", cursor: "pointer", marginBottom: 24, fontFamily: "'Montserrat', sans-serif" }}
            >
                <LuArrowLeft size={16} /> Volver a Pacientes
            </button>

            {/* ── Card info paciente ────────────────────────────── */}
            <div style={{ background: "white", borderRadius: 16, padding: "28px 24px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                    <Avatar nombre={paciente.nombre} fotoUrl={paciente.fotoUrl} size={72} />
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "#1a2e2c", margin: "0 0 4px" }}>
                            {paciente.nombre}
                        </h2>
                        <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: "#4a8a85", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Paciente
                        </p>
                        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                            {paciente.email && (
                                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "#6b7280" }}>
                                    <LuMail size={14} color="#9ca3af" /> {paciente.email}
                                </span>
                            )}
                            {paciente.telefono && (
                                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "#6b7280" }}>
                                    <LuPhone size={14} color="#9ca3af" /> +52 {paciente.telefono}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats rápidas */}
                    <div style={{ display: "flex", gap: 12 }}>
                        {[
                            { value: citas.length,       label: "Total citas"  },
                            { value: citasCompletadas,   label: "Completadas"  },
                            { value: citasPendientes,    label: "Pendientes"   },
                        ].map(s => (
                            <div key={s.label} style={{ background: "#f9fafb", borderRadius: 12, padding: "12px 18px", textAlign: "center", minWidth: 80, border: "1px solid #e5e7eb" }}>
                                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#1a2e2c" }}>{s.value}</p>
                                <p style={{ margin: 0, fontSize: "0.68rem", color: "#9ca3af", marginTop: 2 }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Datos adicionales */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 20, paddingTop: 20, borderTop: "1px solid #f3f4f6" }}>
                    {[
                        { label: "Sexo",              value: paciente.sexo === "M" ? "Masculino" : paciente.sexo === "F" ? "Femenino" : "—" },
                        { label: "Edad",              value: paciente.edad ? `${paciente.edad} años` : "—" },
                        { label: "Fecha nacimiento",  value: paciente.fechaNacimiento ?? "—" },
                    ].map(item => (
                        <div key={item.label} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 14px" }}>
                            <p style={{ margin: 0, fontSize: "0.68rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{item.label}</p>
                            <p style={{ margin: 0, fontSize: "0.88rem", color: "#1a2e2c", fontWeight: 500 }}>{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Historial de citas ────────────────────────────── */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: 0 }}>
                        Historial de Citas
                    </h3>
                    <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>{citas.length} cita{citas.length !== 1 ? "s" : ""}</span>
                </div>

                {citas.length === 0 ? (
                    <div style={{ padding: "40px 24px", textAlign: "center" }}>
                        <LuCalendar size={36} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: "#9ca3af", margin: 0 }}>Sin citas registradas</p>
                    </div>
                ) : (
                    citas.map((cita, i) => {
                        const colors = ESTADO_COLORS[cita.estado] ?? ESTADO_COLORS["PENDIENTE"];
                        return (
                            <div
                                key={cita.id}
                                onClick={() => router.push(`/dashboard-psico/cita/${cita.id}`)}
                                style={{ padding: "16px 24px", borderBottom: i < citas.length - 1 ? "1px solid #f3f4f6" : "none", cursor: "pointer", transition: "background 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                                onMouseLeave={e => e.currentTarget.style.background = "white"}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "0.9rem", color: "#1a2e2c" }}>{cita.especialidad}</p>
                                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", color: "#6b7280" }}>
                                                <LuCalendar size={13} color="#9ca3af" /> {cita.fecha}
                                            </span>
                                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", color: "#6b7280" }}>
                                                <LuClock size={13} color="#9ca3af" /> {cita.hora}
                                            </span>
                                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", color: "#6b7280" }}>
                                                <LuMapPin size={13} color="#9ca3af" /> {cita.lugar}
                                            </span>
                                        </div>
                                        {cita.motivo && (
                                            <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "#9ca3af", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 400 }}>
                                                "{cita.motivo}"
                                            </p>
                                        )}
                                    </div>
                                    <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`, whiteSpace: "nowrap" }}>
                                        {cita.estado}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}