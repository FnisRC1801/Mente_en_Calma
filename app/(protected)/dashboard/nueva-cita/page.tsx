"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, collection, getDocs, query, where, addDoc, Timestamp } from "firebase/firestore";

interface Especialidad {
    id: string;
    nombre: string;
    descripcion?: string;
    soloAdultos?: boolean;
    soloMenores?: boolean;
}

interface Doctor {
    uid: string;
    nombre: string;
    especialidad: string;
    consultorio: string;
    gradoEstudios: string;
}

interface Paciente {
    nombre: string;
    email: string;
    telefono: number;
    sexo: string;
}

const ESPECIALIDADES_SOLO_ADULTOS = ["Terapia de Parejas"];
const ESPECIALIDADES_SOLO_MENORES = ["Psicología Infantil y Adolescente"];

const ICONOS: Record<string, string> = {
    "Neuropsicología": "🧠",
    "Psicología Clínica": "🩺",
    "Terapia de Parejas": "💑",
    "Terapia del Duelo": "🕊️",
    "Psicología Infantil y Adolescente": "🧒",
};

const DURACIONES = [
    { label: "1 hora", value: 60 },
    { label: "1 hora 30 min", value: 90 },
    { label: "2 horas", value: 120 },
    { label: "2 horas 30 min", value: 150 },
];

export default function NuevaCita() {
    const router = useRouter();
    const [paso, setPaso] = useState(1);

    // Datos paciente
    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [esTutor, setEsTutor] = useState(false);
    const [nombreMenor, setNombreMenor] = useState("");
    const [edadMenor, setEdadMenor] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState("");
    const [edad, setEdad] = useState<number | "">("");

    // Especialidades y doctores
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("");
    const [doctores, setDoctores] = useState<Doctor[]>([]);
    const [doctorSeleccionado, setDoctorSeleccionado] = useState<Doctor | null>(null);

    // Fecha y hora
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [duracion, setDuracion] = useState(60);

    // Motivo
    const [motivo, setMotivo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function cargarDatos() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }

            const snap = await getDoc(doc(db, "pacientes", user.uid));
            if (snap.exists()) setPaciente(snap.data() as Paciente);

            const espSnap = await getDocs(collection(db, "especialidades"));
            setEspecialidades(espSnap.docs.map(d => ({ id: d.id, ...d.data() } as Especialidad)));
        }
        cargarDatos();
    }, []);

    useEffect(() => {
        async function cargarDoctores() {
            if (!especialidadSeleccionada) return;
            const q = query(collection(db, "doctores"), where("especialidad", "==", especialidadSeleccionada), where("activo", "==", true));
            const snap = await getDocs(q);
            setDoctores(snap.docs.map(d => ({ uid: d.id, ...d.data() } as Doctor)));
        }
        cargarDoctores();
    }, [especialidadSeleccionada]);

    function calcularEdad(fechaNac: string): number {
        const hoy = new Date();
        const nac = new Date(fechaNac);
        let edad = hoy.getFullYear() - nac.getFullYear();
        const m = hoy.getMonth() - nac.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
        return edad;
    }

    function getEspecialidadesFiltradas() {
        const edadActual = esTutor ? Number(edadMenor) : (fechaNacimiento ? calcularEdad(fechaNacimiento) : Number(edad));
        const esMenor = edadActual < 18;
        return especialidades.filter(e => {
            if (esMenor && ESPECIALIDADES_SOLO_ADULTOS.includes(e.nombre)) return false;
            if (!esMenor && ESPECIALIDADES_SOLO_MENORES.includes(e.nombre)) return false;
            return true;
        });
    }

    async function handleEnviar() {
        if (!doctorSeleccionado || !fecha || !hora || !motivo.trim()) {
            setError("Por favor completa todos los campos.");
            return;
        }
        setLoading(true);
        try {
            const user = auth.currentUser!;
            const edadFinal = esTutor ? Number(edadMenor) : (fechaNacimiento ? calcularEdad(fechaNacimiento) : Number(edad));

            await addDoc(collection(db, "citas"), {
                pacienteId: user.uid,
                pacienteNombre: esTutor ? `${paciente?.nombre} (tutor de ${nombreMenor})` : paciente?.nombre,
                pacienteSexo: paciente?.sexo ?? "M",
                pacienteEdad: edadFinal,
                esTutor,
                nombreMenor: esTutor ? nombreMenor : "",
                doctorId: doctorSeleccionado.uid,
                doctorNombre: doctorSeleccionado.nombre,
                doctorSexo: "M",
                especialidad: especialidadSeleccionada,
                fecha,
                hora,
                duracion,
                lugar: doctorSeleccionado.consultorio,
                motivo: motivo.trim(),
                estado: "PENDIENTE",
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            router.push("/dashboard");
        } catch (e: any) {
            setError(e.message ?? "Error al agendar la cita.");
        } finally { setLoading(false); }
    }

    const inputStyle: React.CSSProperties = {
        width: "100%", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 12, padding: "12px 16px", color: "white", fontSize: "0.9rem",
        fontFamily: "'Montserrat', sans-serif", outline: "none", boxSizing: "border-box",
    };

    const labelStyle: React.CSSProperties = {
        display: "block", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.6)",
        marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em",
    };

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom, #5f817d, #0f1e33)", fontFamily: "'Montserrat', sans-serif" }}>

            {/* Header */}
            <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src="https://static.vecteezy.com/system/resources/thumbnails/011/653/087/small_2x/psychology-3d-render-icon-illustration-png.png" style={{ height: 36 }} />
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "white" }}>Mente en Calma</span>
                </div>
                <button onClick={() => router.push("/dashboard")}
                    style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontSize: "0.85rem" }}>
                    ← Volver
                </button>
            </header>

            <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 20px 60px" }}>

                {/* Título */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.8rem", color: "white", margin: "0 0 8px" }}>
                        Agendar Nueva Cita
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.7)", margin: 0 }}>Completa la información para solicitar tu consulta</p>
                </div>

                {/* Indicador de pasos */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32, gap: 0 }}>
                    {["Datos", "Especialidad", "Fecha", "Motivo"].map((label, i) => {
                        const num = i + 1;
                        const activo = paso === num;
                        const completado = paso > num;
                        return (
                            <div key={label} style={{ display: "flex", alignItems: "center" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: completado ? "#4a8a85" : activo ? "white" : "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: activo ? "#2d6560" : completado ? "white" : "rgba(255,255,255,0.5)", transition: "all 0.3s" }}>
                                        {completado ? "✓" : num}
                                    </div>
                                    <span style={{ fontSize: "0.7rem", color: activo ? "white" : "rgba(255,255,255,0.5)", fontWeight: activo ? 600 : 400 }}>{label}</span>
                                </div>
                                {i < 3 && <div style={{ width: 60, height: 2, background: completado ? "#4a8a85" : "rgba(255,255,255,0.2)", margin: "0 8px 20px", transition: "all 0.3s" }} />}
                            </div>
                        );
                    })}
                </div>

                {/* Card */}
                <div style={{ background: "white", borderRadius: 24, padding: "32px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

                    {/* PASO 1 */}
                    {paso === 1 && (
                        <div>
                            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: "0 0 20px" }}>
                                Paso 1: Datos Generales
                            </h2>

                            {/* Toggle paciente/tutor */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 24 }}>
                                {[
                                    { label: "🧑 Soy el Paciente", value: false },
                                    { label: "👨‍👧 Soy Tutor", value: true },
                                ].map(op => (
                                    <button key={op.label} type="button" onClick={() => setEsTutor(op.value)}
                                        style={{ padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.88rem", transition: "all 0.2s", background: esTutor === op.value ? "white" : "transparent", color: esTutor === op.value ? "#2a5f5a" : "#9ca3af", boxShadow: esTutor === op.value ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
                                        {op.label}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div>
                                    <label style={{ ...labelStyle, color: "#4b5563" }}>Nombre completo</label>
                                    <input style={{ ...inputStyle, background: "#f9fafb", color: "#111827", border: "1px solid #d1d5db" }}
                                        value={paciente?.nombre ?? ""} readOnly />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div>
                                        <label style={{ ...labelStyle, color: "#4b5563" }}>Correo</label>
                                        <input style={{ ...inputStyle, background: "#f9fafb", color: "#111827", border: "1px solid #d1d5db" }}
                                            value={paciente?.email ?? ""} readOnly />
                                    </div>
                                    <div>
                                        <label style={{ ...labelStyle, color: "#4b5563" }}>Teléfono</label>
                                        <input style={{ ...inputStyle, background: "#f9fafb", color: "#111827", border: "1px solid #d1d5db" }}
                                            value={paciente?.telefono ?? ""} readOnly />
                                    </div>
                                </div>

                                {!esTutor && (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div>
                                            <label style={{ ...labelStyle, color: "#4b5563" }}>Fecha de nacimiento</label>
                                            <input type="date" style={{ ...inputStyle, background: "white", color: "#111827", border: "1px solid #d1d5db" }}
                                                value={fechaNacimiento} onChange={e => { setFechaNacimiento(e.target.value); setEdad(calcularEdad(e.target.value)); }} />
                                        </div>
                                        <div>
                                            <label style={{ ...labelStyle, color: "#4b5563" }}>Edad</label>
                                            <input type="number" style={{ ...inputStyle, background: "#f9fafb", color: "#111827", border: "1px solid #d1d5db" }}
                                                value={edad} readOnly placeholder="Se calcula automáticamente" />
                                        </div>
                                    </div>
                                )}

                                {esTutor && (
                                    <>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                            <div>
                                                <label style={{ ...labelStyle, color: "#4b5563" }}>Nombre del menor</label>
                                                <input style={{ ...inputStyle, background: "white", color: "#111827", border: "1px solid #d1d5db" }}
                                                    placeholder="Nombre completo del menor" value={nombreMenor} onChange={e => setNombreMenor(e.target.value)} />
                                            </div>
                                            <div>
                                                <label style={{ ...labelStyle, color: "#4b5563" }}>Edad del menor</label>
                                                <input type="number" min={0} max={17} style={{ ...inputStyle, background: "white", color: "#111827", border: "1px solid #d1d5db" }}
                                                    placeholder="Años" value={edadMenor} onChange={e => setEdadMenor(e.target.value)} />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PASO 2 */}
                    {paso === 2 && (
                        <div>
                            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: "0 0 6px" }}>
                                Paso 2: Especialidades
                            </h2>
                            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 20px" }}>Seleccione el tipo de atención que requiere</p>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                                {getEspecialidadesFiltradas().map(esp => (
                                    <button key={esp.id} type="button" onClick={() => { setEspecialidadSeleccionada(esp.nombre); setDoctorSeleccionado(null); }}
                                        style={{ padding: "16px 12px", borderRadius: 14, border: `2px solid ${especialidadSeleccionada === esp.nombre ? "#4a8a85" : "#e5e7eb"}`, background: especialidadSeleccionada === esp.nombre ? "#f0f9f7" : "white", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: "1.8rem" }}>{ICONOS[esp.nombre] ?? "🧠"}</span>
                                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: especialidadSeleccionada === esp.nombre ? "#2a5f5a" : "#374151", textAlign: "center", lineHeight: 1.3 }}>{esp.nombre}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Doctores */}
                            {especialidadSeleccionada && (
                                <div>
                                    <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#1a2e2c", margin: "0 0 12px" }}>
                                        Doctores disponibles
                                    </h3>
                                    {doctores.length === 0 ? (
                                        <p style={{ fontSize: "0.85rem", color: "#9ca3af", textAlign: "center", padding: "16px 0" }}>
                                            No hay doctores disponibles para esta especialidad
                                        </p>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            {doctores.map(d => (
                                                <button key={d.uid} type="button" onClick={() => setDoctorSeleccionado(d)}
                                                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: `2px solid ${doctorSeleccionado?.uid === d.uid ? "#4a8a85" : "#e5e7eb"}`, background: doctorSeleccionado?.uid === d.uid ? "#f0f9f7" : "white", cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>
                                                        {d.nombre[0]}
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#1a2e2c" }}>{d.nombre}</p>
                                                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280" }}>{d.gradoEstudios} · {d.consultorio}</p>
                                                    </div>
                                                    {doctorSeleccionado?.uid === d.uid && (
                                                        <span style={{ marginLeft: "auto", color: "#4a8a85", fontWeight: 700 }}>✓</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PASO 3 */}
                    {paso === 3 && (
                        <div>
                            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: "0 0 6px" }}>
                                Paso 3: Fecha y Hora
                            </h2>
                            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 20px" }}>
                                Doctor: <strong>{doctorSeleccionado?.nombre}</strong> · {doctorSeleccionado?.consultorio}
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div>
                                        <label style={{ ...labelStyle, color: "#4b5563" }}>Fecha</label>
                                        <input type="date" style={{ ...inputStyle, background: "white", color: "#111827", border: "1px solid #d1d5db" }}
                                            min={new Date().toISOString().split("T")[0]}
                                            value={fecha} onChange={e => setFecha(e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ ...labelStyle, color: "#4b5563" }}>Hora</label>
                                        <select style={{ ...inputStyle, background: "white", color: hora ? "#111827" : "#9ca3af", border: "1px solid #d1d5db", appearance: "none" }}
                                            value={hora} onChange={e => setHora(e.target.value)}>
                                            <option value="">Selecciona hora</option>
                                            {Array.from({ length: 17 }, (_, i) => {
                                                const h = Math.floor(i / 2) + 9;
                                                const m = i % 2 === 0 ? "00" : "30";
                                                const time = `${h.toString().padStart(2, "0")}:${m}`;
                                                if (h >= 17) return null;
                                                return <option key={time} value={time}>{time} {h < 12 ? "AM" : "PM"}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ ...labelStyle, color: "#4b5563" }}>Duración de la cita</label>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                                        {DURACIONES.map(d => (
                                            <button key={d.value} type="button" onClick={() => setDuracion(d.value)}
                                                style={{ padding: "10px 8px", borderRadius: 12, border: `2px solid ${duracion === d.value ? "#4a8a85" : "#d1d5db"}`, background: duracion === d.value ? "#f0f9f7" : "white", color: duracion === d.value ? "#2a5f5a" : "#6b7280", fontWeight: duracion === d.value ? 600 : 400, fontSize: "0.78rem", cursor: "pointer", transition: "all 0.15s", fontFamily: "'Poppins', sans-serif", textAlign: "center" }}>
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASO 4 */}
                    {paso === 4 && (
                        <div>
                            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: "0 0 6px" }}>
                                Paso 4: Motivo de Consulta
                            </h2>
                            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 20px" }}>
                                {esTutor ? "¿Qué situación presenta el menor?" : "¿Qué te trae hoy a consulta?"}
                            </p>

                            <textarea
                                placeholder="Describe brevemente la situación por la que solicita la consulta..."
                                value={motivo} onChange={e => setMotivo(e.target.value)}
                                style={{ ...inputStyle, background: "white", color: "#111827", border: "1px solid #d1d5db", minHeight: 140, resize: "none", lineHeight: 1.6 }} />

                            <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 8 }}>
                                La información compartida es confidencial y solo accesible para el psicólogo.
                            </p>

                            {/* Resumen */}
                            <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px", marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#1a2e2c", margin: 0 }}>Resumen de la cita</h3>
                                {[
                                    { label: "Paciente", value: esTutor ? `${paciente?.nombre} (tutor de ${nombreMenor})` : paciente?.nombre },
                                    { label: "Doctor", value: doctorSeleccionado?.nombre },
                                    { label: "Especialidad", value: especialidadSeleccionada },
                                    { label: "Fecha", value: fecha },
                                    { label: "Hora", value: hora },
                                    { label: "Duración", value: DURACIONES.find(d => d.value === duracion)?.label },
                                    { label: "Lugar", value: doctorSeleccionado?.consultorio },
                                ].map(item => (
                                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                                        <span style={{ color: "#6b7280" }}>{item.label}:</span>
                                        <span style={{ color: "#1a2e2c", fontWeight: 500 }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 12px", marginTop: 16 }}>
                                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#dc2626" }}>{error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Botones navegación */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
                        {paso > 1 ? (
                            <button onClick={() => setPaso(p => p - 1)}
                                style={{ padding: "10px 24px", borderRadius: 12, border: "1px solid #d1d5db", background: "white", color: "#374151", fontSize: "0.88rem", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}>
                                ← Anterior
                            </button>
                        ) : <div />}

                        {paso < 4 ? (
                            <button onClick={() => {
                                if (paso === 1 && !esTutor && !fechaNacimiento) { setError("Ingresa tu fecha de nacimiento."); return; }
                                if (paso === 1 && esTutor && (!nombreMenor || !edadMenor)) { setError("Ingresa los datos del menor."); return; }
                                if (paso === 2 && !especialidadSeleccionada) { setError("Selecciona una especialidad."); return; }
                                if (paso === 2 && !doctorSeleccionado) { setError("Selecciona un doctor."); return; }
                                if (paso === 3 && (!fecha || !hora)) { setError("Selecciona fecha y hora."); return; }
                                setError("");
                                setPaso(p => p + 1);
                            }}
                                style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontSize: "0.88rem", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                                Continuar →
                            </button>
                        ) : (
                            <button onClick={handleEnviar} disabled={loading}
                                style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: loading ? "#9ca3af" : "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontSize: "0.88rem", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Montserrat', sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                                {loading ? "Enviando..." : "Finalizar Registro ✓"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}