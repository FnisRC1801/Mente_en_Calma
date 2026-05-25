"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
    LuLayoutDashboard,
    LuCalendarDays,
    LuMessageSquare,
    LuClipboardList,
    LuSettings,
    LuCalendarCheck,
    LuCalendar,
    LuClock,
    LuMapPin,
    LuBrain,
    LuHeartPulse,
    LuHeart,
    LuSparkles,
    LuBaby,
    LuMenu
} from "react-icons/lu";

interface Cita {
    id: string;
    doctorNombre: string;
    especialidad: string;
    fecha: string;
    hora: string;
    lugar: string;
    estado: string;
}

interface Paciente {
    nombre: string;
    email: string;
    sexo: string;
    fechaNacimiento?: string;
    edad?: number;
    fotoUrl?: string;
}

const ICONOS: Record<string, React.ReactNode> = {
    "Neuropsicología": <LuBrain size={20} />,
    "Psicología Clínica": <LuHeartPulse size={20} />,
    "Terapia de Parejas": <LuHeart size={20} />,
    "Terapia del Duelo": <LuSparkles size={20} />,
    "Psicología Infantil y Adolescente": <LuBaby size={20} />,
};


export default function DashboardPaciente() {
    const router = useRouter();
    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [citas, setCitas] = useState<Cita[]>([]);
    const [loading, setLoading] = useState(true);
    const [mesActual] = useState(new Date());

    useEffect(() => {
        async function cargarDatos() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }

            const docSnap = await getDoc(doc(db, "pacientes", user.uid));
            if (docSnap.exists()) setPaciente(docSnap.data() as Paciente);

            const q = query(collection(db, "citas"), where("pacienteId", "==", user.uid));
            const snap = await getDocs(q);
            setCitas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Cita)));
            setLoading(false);
        }
        cargarDatos();
    }, []);

    async function handleCerrarSesion() {
        await signOut(auth);
        await fetch("/api/session", { method: "DELETE" });
        router.push("/login");
    }

    const citasProximas = citas.filter(c => c.estado === "ACEPTADA" || c.estado === "PENDIENTE");
    const citasCompletadas = citas.filter(c => c.estado === "COMPLETADA");

    function getDiasDelMes() {
        const year = mesActual.getFullYear();
        const month = mesActual.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const offset = firstDay === 0 ? 6 : firstDay - 1;
        return { daysInMonth, offset };
    }

    const { daysInMonth, offset } = getDiasDelMes();
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const hoy = new Date().getDate();

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#4a8a85" }}>Cargando...</p>
        </div>
    );


    return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", fontFamily: "'Montserrat', sans-serif" }}>


            {/* Sidebar */}


            {/* Main */}
            <div>

                {/* Header */}
                <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10, gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>

                        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "#1a2e2c", margin: 0 }}>Panel del Paciente</h1>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button onClick={handleCerrarSesion} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #d1d5db", background: "white", color: "#374151", fontSize: "0.85rem", cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                            Cerrar sesión
                        </button>
                        <button
                            style={{
                                padding: "8px 16px",
                                borderRadius: 10,
                                border: "none",
                                background: "linear-gradient(135deg, #6b9e9a, #2d6560)",
                                color: "white",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 600
                            }}
                            onClick={() => router.push("/dashboard/nueva-cita")}
                        >
                            + Agendar Nueva Cita
                        </button>
                    </div>
                </div>

                <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

                    {/* Banner bienvenida */}
                    <div className="banner-bienvenida" style={{ background: "linear-gradient(135deg, #4a8a85, #2d6560)", borderRadius: 16, padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                        <div>
                            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "white", margin: "0 0 6px" }}>
                                ¡Hola, {paciente?.nombre}!
                            </h2>
                            <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: "0.9rem" }}>
                                {citasProximas.length > 0 ? `Tienes ${citasProximas.length} cita${citasProximas.length > 1 ? "s" : ""} próxima${citasProximas.length > 1 ? "s" : ""}.` : "No tienes citas próximas."}
                            </p>
                        </div>
                        <div className="banner-stats" style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                            {[
                                { value: citasCompletadas.length.toString().padStart(2, "0"), label: "COMPLETADAS" },
                                { value: citasProximas.length.toString().padStart(2, "0"), label: "PRÓXIMAS" },
                            ].map(stat => (
                                <div key={stat.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 20px", textAlign: "center", minWidth: 110 }}>
                                    <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.8rem", color: "white" }}>{stat.value}</p>
                                    <p style={{ margin: 0, fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em" }}>{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="grid-principal" style={{ display: "grid", gridTemplateColumns: "1fr minmax(300px, 380px)", gap: 24 }}>

                        {/* Próximas citas */}
                        <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid #e5e7eb", minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                                    <LuCalendarCheck size={18} style={{ color: "#4a8a85" }} /> Próximas Citas
                                </h3>
                            </div>

                            {citasProximas.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
                                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, color: "#cbd5e1" }}>
                                        <LuCalendar size={40} />
                                    </div>
                                    <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 500 }}>No tienes citas próximas</p>
                                    <p style={{ margin: "4px 0 0", fontSize: "0.78rem" }}>Agenda una cita con un specialist</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {citasProximas.map(cita => (
                                        <div key={cita.id} className="cita-item" style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f0f9f7", display: "flex", alignItems: "center", justifyContent: "center", color: "#2a5f5a", flexShrink: 0 }}>
                                                    {ICONOS[cita.especialidad] ?? <LuBrain size={20} />}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#1a2e2c" }}>{cita.doctorNombre}</p>
                                                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280" }}>{cita.especialidad}</p>

                                                    <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                                                        <span style={{ fontSize: "0.75rem", color: "#9ca3af", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                                                            <LuCalendar size={14} /> {cita.fecha}
                                                        </span>
                                                        <span style={{ fontSize: "0.75rem", color: "#9ca3af", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                                                            <LuClock size={14} /> {cita.hora}
                                                        </span>
                                                        <span style={{ fontSize: "0.75rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
                                                            <LuMapPin size={14} /> {cita.lugar}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600, background: cita.estado === "ACEPTADA" ? "#f0f9f7" : "#fef9ec", color: cita.estado === "ACEPTADA" ? "#2a5f5a" : "#b45309", border: `1px solid ${cita.estado === "ACEPTADA" ? "#b2ddd7" : "#fde68a"}`, whiteSpace: "nowrap", alignSelf: "flex-start" }}>
                                                {cita.estado}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Calendario */}
                        <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid #e5e7eb", minWidth: 0 }}>
                            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                                <LuCalendarDays size={18} style={{ color: "#4a8a85" }} /> {meses[mesActual.getMonth()]} {mesActual.getFullYear()}
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
                                {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map(d => (
                                    <div key={d} style={{ textAlign: "center", fontSize: "0.65rem", fontWeight: 600, color: "#9ca3af", padding: "4px 0" }}>{d}</div>
                                ))}
                                {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const dia = i + 1;
                                    const esHoy = dia === hoy && mesActual.getMonth() === new Date().getMonth();

                                    const tieneCitaProximaConfirmada = citasProximas.some(c => {
                                        if (c.estado !== "ACEPTADA") return false;

                                        const numerosEnFecha = c.fecha.match(/\d+/g);
                                        if (!numerosEnFecha) return false;

                                        return numerosEnFecha.some(num => parseInt(num, 10) === dia);
                                    });

                                    return (
                                        <div key={dia} style={{ textAlign: "center", padding: "6px 4px", borderRadius: 8, fontSize: "0.8rem", background: esHoy ? "#2d6560" : "transparent", color: esHoy ? "white" : "#374151", fontWeight: esHoy ? 700 : 400, position: "relative", cursor: "default" }}>
                                            {dia}
                                            {tieneCitaProximaConfirmada && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#4a8a85", margin: "2px auto 0" }} />}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Citas del mes */}
                            <div style={{ marginTop: 16, borderTop: "1px solid #e5e7eb", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                                {citasProximas.length === 0 ? (
                                    <p style={{ fontSize: "0.78rem", color: "#9ca3af", textAlign: "center" }}>Sin citas este mes</p>
                                ) : (
                                    citasProximas.map(cita => (
                                        <div key={cita.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cita.estado === "ACEPTADA" ? "#4a8a85" : "#b45309", marginTop: 4, flexShrink: 0 }} />
                                            <div>
                                                <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>{cita.fecha} · {cita.hora}</p>
                                                <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{cita.doctorNombre} ({cita.lugar})</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}