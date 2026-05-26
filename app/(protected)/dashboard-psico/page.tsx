// app/(protected)/dashboard-psico/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, Timestamp } from "firebase/firestore";
import {
    LuUser,
    LuCalendar,
    LuClock,
    LuMapPin,
    LuCalendarCheck,
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
    cedulaUrl?: string;
}

export default function DashboardDoctor() {
    const router = useRouter();
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [citas, setCitas] = useState<Cita[]>([]);
    const [loading, setLoading] = useState(true);
    const [mesActual] = useState(new Date());

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

    // 🌟 Obtener la fecha de hoy limpia (sin horas, minutos ni segundos) para comparar justamente los días
    const hoyReset = new Date();
    hoyReset.setHours(0, 0, 0, 0);

    const citasPendientes  = citas.filter(c => c.estado === "PENDIENTE");
    const citasCompletadas = citas.filter(c => c.estado === "COMPLETADA");
    
    // 🔍 Mapeo de nombres de meses en español a sus índices numéricos correspondientes (0-11)
    const dicMeses: { [key: string]: number } = {
        enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
        julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
    };

    // 🌟 FUNCIÓN REFORZADA: Convierte "Martes, 19 de Mayo del 2026" en un objeto Date real y limpio
    function parsearFechaTexto(fechaTexto: string): Date | null {
        try {
            if (!fechaTexto) return null;
            
            // Pasamos a minúsculas y limpiamos comas/puntos
            const limpio = fechaTexto.toLowerCase().replace(/,/g, "");
            // Buscamos los números presentes (ej: [19, 2026])
            const numeros = limpio.match(/\d+/g); 
            
            if (!numeros || numeros.length < 2) return null;
            
            const dia = parseInt(numeros[0], 10);
            const anio = parseInt(numeros[1], 10);
            
            // Encontrar qué mes está escrito dentro de la cadena
            let mesIndex = 0;
            for (const nombreMes in dicMeses) {
                if (limpio.includes(nombreMes)) {
                    mesIndex = dicMeses[nombreMes];
                    break;
                }
            }
            
            // Creamos el objeto Date con los datos extraídos
            const fechaObjeto = new Date(anio, mesIndex, dia);
            fechaObjeto.setHours(0, 0, 0, 0);
            return fechaObjeto;
        } catch (e) {
            console.error("Error al parsear la fecha:", e);
            return null;
        }
    }

    // 🌟 FILTRADO SEGURO: Solo citas aceptadas cuya fecha sea igual o posterior a hoyReset
    const citasAceptadasProximas = citas.filter(c => {
        if (c.estado !== "ACEPTADA") return false;
        
        const fechaCitaObj = parsearFechaTexto(c.fecha);
        if (!fechaCitaObj) return true; // Si no se puede parsear, la dejamos por precaución

        // Retorna verdadero solo si la fecha de la cita es igual o posterior a hoy
        return fechaCitaObj.getTime() >= hoyReset.getTime();
    });

    function getDiasDelMes() {
        const year     = mesActual.getFullYear();
        const month    = mesActual.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const offset   = firstDay === 0 ? 6 : firstDay - 1;
        return { daysInMonth, offset };
    }

    const { daysInMonth, offset } = getDiasDelMes();
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#4a8a85" }}>Cargando...</p>
        </div>
    );

    return (
        <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

            <style>{`
                @media (max-width: 992px) {
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

            {/* Banner bienvenida */}
            <div
                className="banner-bienvenida"
                style={{
                    background: "linear-gradient(135deg, #4a8a85, #2d6560)",
                    borderRadius: 16,
                    padding: "24px 28px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                }}
            >
                <div>
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "white", margin: "0 0 4px" }}>
                        ¡Hola, {doctor?.nombre}!
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.8)", margin: "0 0 4px", fontSize: "0.9rem" }}>
                        {doctor?.especialidad} · {doctor?.consultorio}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.7)", margin: 0, fontSize: "0.85rem" }}>
                        {citasPendientes.length > 0
                            ? `Tienes ${citasPendientes.length} solicitud${citasPendientes.length > 1 ? "es" : ""} pendiente${citasPendientes.length > 1 ? "s" : ""} de aprobar.`
                            : "No tienes solicitudes pendientes."}
                    </p>
                </div>

                <div className="banner-stats" style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                    {[
                        { value: citasPendientes.length.toString().padStart(2, "0"),   label: "PENDIENTES"  },
                        { value: citasAceptadasProximas.length.toString().padStart(2, "0"),   label: "ACEPTADAS"   },
                        { value: citasCompletadas.length.toString().padStart(2, "0"), label: "COMPLETADAS" },
                    ].map(stat => (
                        <div key={stat.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 20px", textAlign: "center", minWidth: 110 }}>
                            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.8rem", color: "white" }}>{stat.value}</p>
                            <p style={{ margin: 0, fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em" }}>{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid principal */}
            <div
                className="grid-principal"
                style={{ display: "grid", gridTemplateColumns: "1fr minmax(300px, 380px)", gap: 24 }}
            >
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
                                    style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer", transition: "all 0.2s ease" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.03)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "white";  e.currentTarget.style.boxShadow = "none"; }}
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
                                        <button
                                            onClick={async e => {
                                                e.stopPropagation();
                                                await updateDoc(doc(db, "citas", cita.id), { estado: "ACEPTADA", updatedAt: Timestamp.now() });
                                                setCitas(prev => prev.map(c => c.id === cita.id ? { ...c, estado: "ACEPTADA" } : c));
                                            }}
                                            style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#f0f9f7", color: "#2a5f5a", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                                        >
                                            ✓ Aceptar
                                        </button>
                                        <button
                                            onClick={async e => {
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
                        {["LUN","MAR","MIÉ","JUE","VIE","SÁB","DOM"].map(d => (
                            <div key={d} style={{ textAlign: "center", fontSize: "0.65rem", fontWeight: 600, color: "#9ca3af", padding: "4px 0" }}>{d}</div>
                        ))}
                        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dia   = i + 1;
                            const esHoy = dia === hoyReset.getDate() && mesActual.getMonth() === hoyReset.getMonth() && mesActual.getFullYear() === hoyReset.getFullYear();
                            
                            // Pintar puntitos en los días correctos evaluando el objeto Date parseado de las citas próximas
                            const tieneCita = citasAceptadasProximas.some(c => {
                                const fechaCitaObj = parsearFechaTexto(c.fecha);
                                return (
                                    fechaCitaObj &&
                                    fechaCitaObj.getDate() === dia &&
                                    fechaCitaObj.getMonth() === mesActual.getMonth() &&
                                    fechaCitaObj.getFullYear() === mesActual.getFullYear()
                                );
                            });

                            return (
                                <div key={dia} style={{ textAlign: "center", padding: "6px 4px", borderRadius: 8, fontSize: "0.8rem", background: esHoy ? "#2d6560" : "transparent", color: esHoy ? "white" : "#374151", fontWeight: esHoy ? 700 : 400, position: "relative" }}>
                                    {dia}
                                    {tieneCita && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#4a8a85", margin: "2px auto 0" }} />}
                                </div>
                            );
                        })}
                    </div>

                    {/* Listado inferior dinámico y limpio */}
                    <div style={{ marginTop: 16, borderTop: "1px solid #e5e7eb", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                        {citasAceptadasProximas.length === 0 ? (
                            <p style={{ fontSize: "0.78rem", color: "#9ca3af", textAlign: "center" }}>Sin citas próximas pendientes</p>
                        ) : (
                            citasAceptadasProximas.map((cita: Cita) => (
                                <div key={cita.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4a8a85", marginTop: 4, flexShrink: 0 }} />
                                    <div>
                                        <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>{cita.fecha} · {cita.hora}</p>
                                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{cita.pacienteNombre} ({cita.lugar})</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}