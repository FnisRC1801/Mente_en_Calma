"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
    LuCalendarCheck, LuCalendar, LuClock, LuMapPin,
    LuBrain, LuHeartPulse, LuHeart, LuSparkles, LuBaby,
    LuCalendarDays, LuBell, LuX
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
    const [showNotif, setShowNotif] = useState(false);
    const [config, setConfig] = useState<{ notif_citas: boolean; notif_mensajes: boolean } | null>(null); // 👈 aquí
    const [notifVistas, setNotifVistas] = useState(false);

    useEffect(() => {
        async function cargarDatos() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }
            const docSnap = await getDoc(doc(db, "pacientes", user.uid));
            if (docSnap.exists()) {
                const data = docSnap.data();
                setPaciente(data as Paciente);
                setConfig(data.config ?? { notif_citas: true, notif_mensajes: true });
            } else {
                // Cuenta Google recién creada, usa displayName como fallback
                setPaciente({ nombre: user.displayName ?? "Usuario", email: user.email ?? "", sexo: "" });
            }
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

    // Solo citas futuras o de hoy
    const hoyStr = new Date().toISOString().split("T")[0];
    const citasProximas = citas.filter(c =>
        (c.estado === "ACEPTADA" || c.estado === "PENDIENTE") && c.fecha >= hoyStr
    );
    const citasCompletadas = citas.filter(c => c.estado === "COMPLETADA");

    // Notificaciones — citas aceptadas próximas
    const notificaciones = (config?.notif_citas !== false)
        ? citasProximas.filter(c => c.estado === "ACEPTADA").slice(0, 5)
        : [];

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

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .cita-card { transition: box-shadow 0.2s, transform 0.2s; }
                .cita-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); transform: translateY(-1px); }
                .banner-bienvenida { animation: slideUp 0.5s ease; }
                @media (max-width: 640px) {
                    .grid-principal { grid-template-columns: 1fr !important; }
                    .banner-bienvenida { flex-direction: column !important; align-items: flex-start !important; }
                    .banner-stats { width: auto !important; }
                    .cita-item { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
                }
            `}</style>

            {/* Header */}
            {/* Header */}
            <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "21px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10, gap: 12 }}>
                <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: 0 }}>

                </h1>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>

                    {/* Campanita */}
                    <div style={{ position: "relative" }}>
                        <button onClick={() => { setShowNotif(!showNotif); setNotifVistas(true); }}
                            style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid #e5e7eb", background: showNotif ? "#f0f9f7" : "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
                            <LuBell size={18} color={showNotif ? "#2a5f5a" : "#6b7280"} />
                            {notificaciones.length > 0 && !notifVistas && (
                                <div style={{ position: "absolute", top: -2, right: -2, width: 16, height: 16, borderRadius: "50%", background: "#dc2626", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ fontSize: "0.55rem", color: "white", fontWeight: 700 }}>{notificaciones.length}</span>
                                </div>
                            )}
                        </button>

                        {/* Dropdown notificaciones */}
                        {showNotif && (
                            <div style={{ position: "absolute", top: 46, right: 0, width: 300, background: "white", borderRadius: 14, border: "1px solid #e5e7eb", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 50, animation: "fadeIn 0.2s ease", overflow: "hidden" }}>
                                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "#1a2e2c", margin: 0 }}>Notificaciones</h3>
                                    <button onClick={() => setShowNotif(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#9ca3af" }}>
                                        <LuX size={14} />
                                    </button>
                                </div>
                                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                                    {notificaciones.length === 0 ? (
                                        <p style={{ padding: "20px 16px", textAlign: "center", fontSize: "0.82rem", color: "#9ca3af", margin: 0 }}>Sin notificaciones</p>
                                    ) : (
                                        notificaciones.map(c => (
                                            <div key={c.id} onClick={() => { router.push(`/dashboard/cita/${c.id}`); setShowNotif(false); }}
                                                style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.15s" }}
                                                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                                onMouseLeave={e => e.currentTarget.style.background = "white"}>
                                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4a8a85", flexShrink: 0 }} />
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#1a2e2c" }}>Cita confirmada</p>
                                                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#6b7280" }}>{c.doctorNombre} · {c.fecha} {c.hora}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={handleCerrarSesion}
                        style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #d1d5db", background: "white", color: "#374151", fontSize: "0.82rem", cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                        Cerrar sesión
                    </button>
                    <button onClick={() => router.push("/dashboard/nueva-cita")}
                        style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontSize: "0.82rem", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
                        + Agendar Cita
                    </button>
                </div>
            </div>

            <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

                {/* Banner bienvenida */}
                <div className="banner-bienvenida" style={{ background: "linear-gradient(135deg, #4a8a85, #2d6560)", borderRadius: 20, padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, boxShadow: "0 8px 32px rgba(45,101,96,0.25)" }}>
                    <div>
                        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "white", margin: "0 0 6px" }}>
                            ¡Hola, {paciente?.nombre?.split(" ")[0]}! 👋
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: "0.9rem" }}>
                            {citasProximas.length > 0
                                ? `Tienes ${citasProximas.length} cita${citasProximas.length > 1 ? "s" : ""} próxima${citasProximas.length > 1 ? "s" : ""}.`
                                : "No tienes citas próximas. ¡Agenda una!"}
                        </p>
                    </div>
                    <div className="banner-stats" style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                        {[
                            { value: citasCompletadas.length.toString().padStart(2, "0"), label: "COMPLETADAS" },
                            { value: citasProximas.length.toString().padStart(2, "0"), label: "PRÓXIMAS" },
                        ].map(stat => (
                            <div key={stat.label} style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", borderRadius: 14, padding: "14px 20px", textAlign: "center", minWidth: 100, border: "1px solid rgba(255,255,255,0.2)" }}>
                                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "2rem", color: "white", lineHeight: 1 }}>{stat.value}</p>
                                <p style={{ margin: "4px 0 0", fontSize: "0.6rem", color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em" }}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grid principal */}
                <div className="grid-principal" style={{ display: "grid", gridTemplateColumns: "1fr minmax(280px, 360px)", gap: 24 }}>

                    {/* Próximas citas */}
                    <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid #e5e7eb" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                                <LuCalendarCheck size={18} color="#4a8a85" /> Próximas Citas
                            </h3>
                            {citasProximas.length > 0 && (
                                <button onClick={() => router.push("/dashboard/mis-citas")}
                                    style={{ fontSize: "0.75rem", color: "#4a8a85", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                                    Ver todas →
                                </button>
                            )}
                        </div>

                        {citasProximas.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
                                <LuCalendar size={40} color="#e5e7eb" style={{ margin: "0 auto 8px" }} />
                                <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 500 }}>No tienes citas próximas</p>
                                <p style={{ margin: "4px 0 16px", fontSize: "0.78rem" }}>Agenda una cita con un especialista</p>
                                <button onClick={() => router.push("/dashboard/nueva-cita")}
                                    style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
                                    + Agendar ahora
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {citasProximas.map(cita => (
                                    <div key={cita.id} className="cita-card cita-item"
                                        onClick={() => router.push(`/dashboard/cita/${cita.id}`)}
                                        style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer" }}>
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#f0f9f7", display: "flex", alignItems: "center", justifyContent: "center", color: "#2a5f5a", flexShrink: 0 }}>
                                                {ICONOS[cita.especialidad] ?? <LuBrain size={20} />}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#1a2e2c" }}>{cita.doctorNombre}</p>
                                                <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280" }}>{cita.especialidad}</p>
                                                <div style={{ display: "flex", gap: 10, marginTop: 5, flexWrap: "wrap" }}>
                                                    <span style={{ fontSize: "0.72rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: 3 }}>
                                                        <LuCalendar size={12} /> {cita.fecha}
                                                    </span>
                                                    <span style={{ fontSize: "0.72rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: 3 }}>
                                                        <LuClock size={12} /> {cita.hora}
                                                    </span>
                                                    <span style={{ fontSize: "0.72rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: 3 }}>
                                                        <LuMapPin size={12} /> {cita.lugar}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: "4px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 600, whiteSpace: "nowrap", alignSelf: "flex-start",
                                            background: cita.estado === "ACEPTADA" ? "#f0f9f7" : "#fffbeb",
                                            color: cita.estado === "ACEPTADA" ? "#2a5f5a" : "#b45309",
                                            border: `1px solid ${cita.estado === "ACEPTADA" ? "#b2ddd7" : "#fde68a"}`
                                        }}>
                                            {cita.estado}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Calendario */}
                    <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid #e5e7eb" }}>
                        <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                            <LuCalendarDays size={18} color="#4a8a85" /> {meses[mesActual.getMonth()]} {mesActual.getFullYear()}
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 8 }}>
                            {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map(d => (
                                <div key={d} style={{ textAlign: "center", fontSize: "0.62rem", fontWeight: 600, color: "#9ca3af", padding: "4px 0" }}>{d}</div>
                            ))}
                            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const dia = i + 1;
                                const esHoy = dia === hoy && mesActual.getMonth() === new Date().getMonth();
                                const tieneCita = citasProximas.some(c => {
                                    if (c.estado !== "ACEPTADA") return false;
                                    const f = new Date(c.fecha + "T00:00:00");
                                    return f.getDate() === dia && f.getMonth() === mesActual.getMonth() && f.getFullYear() === mesActual.getFullYear();
                                });
                                return (
                                    <div key={dia} style={{ textAlign: "center", padding: "5px 2px", borderRadius: 7, fontSize: "0.78rem", background: esHoy ? "#2d6560" : "transparent", color: esHoy ? "white" : "#374151", fontWeight: esHoy ? 700 : 400, position: "relative" }}>
                                        {dia}
                                        {tieneCita && <div style={{ width: 4, height: 4, borderRadius: "50%", background: esHoy ? "rgba(255,255,255,0.8)" : "#4a8a85", margin: "1px auto 0" }} />}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: 14, borderTop: "1px solid #e5e7eb", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                            {citasProximas.length === 0 ? (
                                <p style={{ fontSize: "0.75rem", color: "#9ca3af", textAlign: "center", margin: 0 }}>Sin citas este mes</p>
                            ) : (
                                citasProximas.map(cita => (
                                    <div key={cita.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: cita.estado === "ACEPTADA" ? "#4a8a85" : "#f59e0b", marginTop: 4, flexShrink: 0 }} />
                                        <div>
                                            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>{cita.fecha} · {cita.hora}</p>
                                            <p style={{ margin: 0, fontSize: "0.68rem", color: "#9ca3af" }}>{cita.doctorNombre}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}