"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, Timestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
    LuLayoutDashboard,
    LuCalendarDays,
    LuUsers,
    LuMessageSquare,
    LuClipboardList,
    LuSettings,
    LuMenu,
    LuUser,
    LuCalendar,
    LuClock,
    LuMapPin,
    LuBrain,
    LuHeartPulse,
    LuHeart,
    LuSparkles,
    LuBaby,
    LuCalendarCheck
} from "react-icons/lu";


interface Cita {
    id: string;
    pacienteNombre: string;
    especialidad: string;
    fecha: string;
    hora: string;
    lugar: string;
    estado: string;
}

interface Doctor {
    nombre: string;
    email: string;
    especialidad: string;
    consultorio: string;
    gradoEstudios: string;
}

// Diccionario de iconos vectoriales para las especialidades psicológicas
const ICONOS: Record<string, React.ReactNode> = {
    "Neuropsicología": <LuBrain size={20} />,
    "Psicología Clínica": <LuHeartPulse size={20} />,
    "Terapia de Parejas": <LuHeart size={20} />,
    "Terapia del Duelo": <LuSparkles size={20} />,
    "Psicología Infantil y Adolescente": <LuBaby size={20} />,
};

export default function DashboardDoctor() {
    const router = useRouter();
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [citas, setCitas] = useState<Cita[]>([]);
    const [loading, setLoading] = useState(true);
    const [mesActual] = useState(new Date());

    // Estado para controlar la apertura de la barra lateral en móviles
    const [menuAbierto, setMenuAbierto] = useState(false);

    useEffect(() => {
        async function cargarDatos() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }

            const docSnap = await getDoc(doc(db, "doctores", user.uid));
            if (docSnap.exists()) setDoctor(docSnap.data() as Doctor);

            const q = query(collection(db, "citas"), where("doctorId", "==", user.uid));
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

    const citasPendientes = citas.filter(c => c.estado === "PENDIENTE");
    const citasAceptadas = citas.filter(c => c.estado === "ACEPTADA");
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
        <div style={{ minHeight: "100vh", background: "#f8fafb", display: "flex", fontFamily: "'Montserrat', sans-serif", position: "relative", overflowX: "hidden" }}>

            {/* Variables CSS y consultas de medios para transiciones animadas */}
            <style>{`
                aside {
                    transition: transform 0.3s ease-in-out;
                }
                main {
                    transition: margin-left 0.3s ease-in-out;
                }
                @media (max-width: 992px) {
                    aside {
                        transform: ${menuAbierto ? "translateX(0)" : "translateX(-100%)"};
                        box-shadow: ${menuAbierto ? "4px 0 24px rgba(0,0,0,0.1)" : "none"};
                    }
                    main {
                        margin-left: 0 !important;
                    }
                    .btn-hamburguesa {
                        display: flex !important;
                    }
                    .banner-bienvenida {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 16px !important;
                    }
                    .banner-stats {
                        width: auto !important;
                        justify-content: flex-start !important;
                    }
                }
                @media (max-width: 640px) {
                    .grid-principal {
                        grid-template-columns: 1fr !important;
                    }
                    .cita-item {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 12px !important;
                    }
                }
            `}</style>

            {/* Fondo oscuro traslúcido para cerrar el menú al hacer clic fuera (solo móviles) */}
            {menuAbierto && (
                <div
                    onClick={() => setMenuAbierto(false)}
                    style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.2)", zIndex: 15 }}
                />
            )}

            {/* Sidebar */}
            <aside style={{ width: 240, background: "white", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", padding: "24px 0", position: "fixed", height: "100vh", zIndex: 20 }}>
                <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img src="https://static.vecteezy.com/system/resources/thumbnails/011/653/087/small_2x/psychology-3d-render-icon-illustration-png.png" style={{ height: 36, width: "auto" }} />
                        <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c" }}>Mente en Calma</span>
                    </div>
                    <button className="btn-hamburguesa" onClick={() => setMenuAbierto(false)} style={{ display: "none", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#6b7280" }}>✕</button>
                </div>

                <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                    {[
                        { icon: <LuLayoutDashboard size={18} />, label: "Dashboard", active: true },
                        { icon: <LuCalendarDays size={18} />, label: "Mis Citas" },
                        { icon: <LuUsers size={18} />, label: "Pacientes" },
                        { icon: <LuMessageSquare size={18} />, label: "Mensajes" },
                        { icon: <LuClipboardList size={18} />, label: "Historial" },
                        { icon: <LuSettings size={18} />, label: "Configuración" },
                    ].map(item => (
                        <button
                            key={item.label}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "10px 12px",
                                borderRadius: 10,
                                border: "none",
                                background: item.active ? "#f0f9f7" : "transparent",
                                color: item.active ? "#2a5f5a" : "#6b7280",
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: item.active ? 600 : 400,
                                fontSize: "0.88rem",
                                cursor: "pointer",
                                textAlign: "left"
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center" }}>
                                {item.icon}
                            </div>
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Usuario */}
                <div style={{ padding: "16px 20px", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>
                        {doctor?.nombre?.[0]?.toUpperCase() ?? "D"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#1a2e2c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doctor?.nombre}</p>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#4a8a85", textTransform: "uppercase", letterSpacing: "0.05em" }}>Psicólogo</p>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main style={{ marginLeft: 240, flex: 1, minWidth: 0 }}>

                {/* Header */}
                <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10, gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <button className="btn-hamburguesa" onClick={() => setMenuAbierto(true)} style={{ display: "none", background: "#f3f4f6", border: "1px solid #e5e7eb", padding: "8px 12px", borderRadius: 8, fontSize: "1.1rem", cursor: "pointer", color: "#374151" }}>
                            <LuMenu size={20} />
                        </button>
                        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "#1a2e2c", margin: 0 }}>Panel del Profesional</h1>
                    </div>
                    <button onClick={handleCerrarSesion} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #d1d5db", background: "white", color: "#374151", fontSize: "0.85rem", cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                        Cerrar sesión
                    </button>
                </div>

                <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

                    {/* Banner */}
                    <div className="banner-bienvenida" style={{ background: "linear-gradient(135deg, #4a8a85, #2d6560)", borderRadius: 16, padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                        <div>
                            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "white", margin: "0 0 4px" }}>
                                ¡Hola, {doctor?.nombre}!
                            </h2>
                            <p style={{ color: "rgba(255,255,255,0.8)", margin: "0 0 4px", fontSize: "0.9rem" }}>
                                {doctor?.especialidad} · {doctor?.consultorio}
                            </p>
                            <p style={{ color: "rgba(255,255,255,0.7)", margin: 0, fontSize: "0.85rem" }}>
                                {citasPendientes.length > 0 ? `Tienes ${citasPendientes.length} solicitud${citasPendientes.length > 1 ? "es" : ""} pendiente${citasPendientes.length > 1 ? "s" : ""} de aprobar.` : "No tienes solicitudes pendientes."}
                            </p>
                        </div>
                        <div className="banner-stats" style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                            {[
                                { value: citasPendientes.length.toString().padStart(2, "0"), label: "PENDIENTES" },
                                { value: citasAceptadas.length.toString().padStart(2, "0"), label: "ACEPTADAS" },
                                { value: citasCompletadas.length.toString().padStart(2, "0"), label: "COMPLETADAS" },
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


                        {/* Citas pendientes */}
                        <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid #e5e7eb", minWidth: 0 }}>
                            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                                <LuClock size={18} style={{ color: "#b45309" }} /> Solicitudes por Aceptar
                            </h3>
                            {citasPendientes.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
                                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, color: "#cbd5e1" }}>
                                        <LuCalendarCheck size={40} />
                                    </div>
                                    <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 500 }}>No tienes solicitudes pendientes</p>
                                    <p style={{ margin: "4px 0 0", fontSize: "0.78rem" }}>Cuando un paciente agende contigo aparecerá aquí</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {citasPendientes.map(cita => (
                                        <div
                                            key={cita.id}
                                            className="cita-item"
                                            onClick={() => router.push(`/dashboard-psico/cita/${cita.id}`)}
                                            style={{
                                                border: "1px solid #e5e7eb",
                                                borderRadius: 12,
                                                padding: "14px 16px",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                gap: 12,
                                                cursor: "pointer",
                                                transition: "all 0.2s ease",
                                                // Efecto hover sutil inyectado de forma nativa en línea
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = "#f9fafb";
                                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.03)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "white";
                                                e.currentTarget.style.boxShadow = "none";
                                            }}
                                        >
                                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fef9ec", display: "flex", alignItems: "center", justifyContent: "center", color: "#b45309", flexShrink: 0 }}>
                                                    <LuUser size={20} />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#1a2e2c" }}>{cita.pacienteNombre}</p>
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
                                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                {/* e.stopPropagation() evita que al presionar los botones se abra la pantalla de detalles */}
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        await updateDoc(doc(db, "citas", cita.id), { estado: "ACEPTADA", updatedAt: Timestamp.now() });
                                                        setCitas(prev => prev.map(c => c.id === cita.id ? { ...c, estado: "ACEPTADA" } : c));
                                                    }}
                                                    style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#f0f9f7", color: "#2a5f5a", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                                                >
                                                    ✓ Aceptar
                                                </button>
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        await updateDoc(doc(db, "citas", cita.id), { estado: "CANCELADA", updatedAt: Timestamp.now() });
                                                        setCitas(prev => prev.map(c => c.id === cita.id ? { ...c, estado: "CANCELADA" } : c));
                                                    }}
                                                    style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#fef2f2", color: "#dc2626", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                                                >
                                                    ✕ Rechazar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Calendario */}
                        <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid #e5e7eb", minWidth: 0 }}>
                            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                                <LuCalendar size={18} style={{ color: "#4a8a85" }} /> {meses[mesActual.getMonth()]} {mesActual.getFullYear()}
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
                                {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map(d => (
                                    <div key={d} style={{ textAlign: "center", fontSize: "0.65rem", fontWeight: 600, color: "#9ca3af", padding: "4px 0" }}>{d}</div>
                                ))}
                                {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const dia = i + 1;
                                    const esHoy = dia === hoy && mesActual.getMonth() === new Date().getMonth();

                                    const tieneCitaConfirmada = citasAceptadas.some(c => {
                                        const numerosEnFecha = c.fecha.match(/\d+/g);
                                        if (!numerosEnFecha) return false;
                                        return numerosEnFecha.some(num => parseInt(num, 10) === dia);
                                    });

                                    return (
                                        <div key={dia} style={{ textAlign: "center", padding: "6px 4px", borderRadius: 8, fontSize: "0.8rem", background: esHoy ? "#2d6560" : "transparent", color: esHoy ? "white" : "#374151", fontWeight: esHoy ? 700 : 400, position: "relative", cursor: "default" }}>
                                            {dia}
                                            {tieneCitaConfirmada && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#4a8a85", margin: "2px auto 0" }} />}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Citas del mes */}
                            <div style={{ marginTop: 16, borderTop: "1px solid #e5e7eb", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                                {citasAceptadas.length === 0 ? (
                                    <p style={{ fontSize: "0.78rem", color: "#9ca3af", textAlign: "center" }}>Sin citas aceptadas este mes</p>
                                ) : (
                                    citasAceptadas.map((cita: Cita) => ( // Agregamos el tipado : Cita para quitar el error de tipo implícito 'any'
                                        <div key={cita.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                            {/* Dejamos el puntito indicador original */}
                                            <div
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: "50%",
                                                    background: cita.estado === "ACEPTADA" ? "#4a8a85" : "#b45309",
                                                    marginTop: 4,
                                                    flexShrink: 0
                                                }}
                                            />
                                            <div>
                                                <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>
                                                    {cita.fecha} · {cita.hora}
                                                </p>
                                                <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>
                                                    {cita.pacienteNombre} ({cita.lugar})
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}