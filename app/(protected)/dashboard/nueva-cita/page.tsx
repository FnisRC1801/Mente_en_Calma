"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, collection, getDocs, query, where, addDoc, Timestamp } from "firebase/firestore";
import { LuBrain, LuHeartPulse, LuHeart, LuSparkles, LuBaby, LuUser, LuUsers, LuChevronDown, LuCalendar } from "react-icons/lu";
import { createPortal } from "react-dom";
import { FaMars, FaVenus } from "react-icons/fa";

interface Especialidad {
    id: string;
    nombre: string;
}

interface DiaSemana {
    activo: boolean;
    inicio: string;
    fin: string;
}

interface Horario {
    lunes: DiaSemana; martes: DiaSemana; miercoles: DiaSemana;
    jueves: DiaSemana; viernes: DiaSemana; sabado: DiaSemana; domingo: DiaSemana;
}

interface Doctor {
    uid: string;
    nombre: string;
    especialidad: string;
    especialidades?: { nombre: string; icono: string; dirigidoA: string }[];
    consultorio: string;
    gradoEstudios: string;
    horario?: Horario;
    fotoUrl?: string;
}

interface Paciente {
    nombre: string;
    email: string;
    telefono: number;
    sexo: string;
    fechaNacimiento?: string;
    edad?: number;
}

const ESPECIALIDADES_SOLO_ADULTOS = ["Terapia de Parejas"];
const ESPECIALIDADES_SOLO_MENORES = ["Psicología Infantil y Adolescente"];

const ICONOS: Record<string, React.ReactNode> = {
    "Neuropsicología":                    <LuBrain />,
    "Psicología Clínica":                 <LuHeartPulse />,
    "Terapia de Parejas":                 <LuHeart />,
    "Terapia del Duelo":                  <LuSparkles />,
    "Psicología Infantil y Adolescente":  <LuBaby />,
};

const DURACIONES = [
    { label: "1 hora",          value: 60  },
    { label: "1 hora 30 min",   value: 90  },
    { label: "2 horas",         value: 120 },
    { label: "2 horas 30 min",  value: 150 },
];

const MESES_OPT = [
    { v: "01", n: "Enero" }, { v: "02", n: "Febrero" }, { v: "03", n: "Marzo" },
    { v: "04", n: "Abril" }, { v: "05", n: "Mayo" },    { v: "06", n: "Junio" },
    { v: "07", n: "Julio" }, { v: "08", n: "Agosto" },  { v: "09", n: "Septiembre" },
    { v: "10", n: "Octubre" },{ v: "11", n: "Noviembre"},{ v: "12", n: "Diciembre" }
];

const MESES_CAL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// Mapeo día JS (0=Dom) → clave del horario (lunes=0)
const DIA_JS_A_KEY = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"] as const;

// Generar slots de hora según inicio/fin del doctor
function generarSlots(inicio: string, fin: string): string[] {
    const slots: string[] = [];
    const [hIni] = inicio.split(":").map(Number);
    const [hFin] = fin.split(":").map(Number);
    for (let h = hIni; h < hFin; h++) {
        slots.push(`${String(h).padStart(2,"0")}:00`);
        if (h + 0.5 < hFin) slots.push(`${String(h).padStart(2,"0")}:30`);
    }
    return slots;
}

// ── CustomDropdown ──────────────────────────────────────────────
function CustomDropdown({ value, placeholder, options, onSelect, isMonth = false }: {
    value: string; placeholder: string; options: any[];
    onSelect: (val: string) => void; isMonth?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef   = useRef<HTMLButtonElement>(null);
    const menuRef     = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const t = e.target as Node;
            if (dropdownRef.current && !dropdownRef.current.contains(t) && menuRef.current && !menuRef.current.contains(t))
                setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleOpen() {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
        }
        setIsOpen(!isOpen);
    }

    const getLabel = () => {
        if (!value) return placeholder;
        if (isMonth) return MESES_OPT.find(o => o.v === value)?.n ?? placeholder;
        return value;
    };

    return (
        <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
            <button ref={buttonRef} type="button" onClick={handleOpen}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, border: `1px solid ${isOpen ? "#4a8a85" : "#d1d5db"}`, boxShadow: isOpen ? "0 0 0 3px rgba(74,138,133,0.15)" : "none", borderRadius: 12, padding: "11px 14px", background: "white", width: "100%", cursor: "pointer", transition: "all 0.2s", outline: "none" }}>
                <span style={{ fontSize: "0.88rem", color: value ? "#111827" : "#9ca3af", fontFamily: "'Montserrat', sans-serif" }}>{getLabel()}</span>
                <LuChevronDown size={14} color={value ? "#2d6560" : "#9ca3af"} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
            </button>
            {isOpen && typeof window !== "undefined" && createPortal(
                <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, width: menuPos.width, background: "white", border: "1px solid #e5e7eb", borderRadius: 14, boxShadow: "0 12px 30px rgba(0,0,0,0.15)", maxHeight: 200, overflowY: "auto", zIndex: 99999, padding: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                    {options.map(opt => {
                        const val   = isMonth ? opt.v : opt;
                        const label = isMonth ? opt.n : opt;
                        const sel   = value === val;
                        return (
                            <button key={val} type="button" onClick={() => { onSelect(val); setIsOpen(false); }}
                                style={{ width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 8, border: "none", fontSize: "0.85rem", fontFamily: "'Montserrat', sans-serif", cursor: "pointer", background: sel ? "#f0f9f7" : "transparent", color: sel ? "#2a5f5a" : "#374151", fontWeight: sel ? 600 : 400 }}
                                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "#f3f4f6"; }}
                                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}>
                                {label}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </div>
    );
}

export default function NuevaCita() {
    const router = useRouter();
    const [paso, setPaso] = useState(1);

    const [paciente,          setPaciente]          = useState<Paciente | null>(null);
    const [esTutor,           setEsTutor]           = useState(false);
    const [nombreMenor,       setNombreMenor]       = useState("");
    const [sexoMenor,         setSexoMenor]         = useState("");
    const [diaMenor,          setDiaMenor]          = useState("");
    const [mesMenor,          setMesMenor]          = useState("");
    const [anioMenor,         setAnioMenor]         = useState("");
    const [edadMenorCalc,     setEdadMenorCalc]     = useState<number | null>(null);
    const [edadMenorError,    setEdadMenorError]    = useState("");
    const [edadPaciente,      setEdadPaciente]      = useState<number>(0);
    const [fechaNacimiento,   setFechaNacimiento]   = useState("");

    const [especialidades,           setEspecialidades]           = useState<Especialidad[]>([]);
    const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("");
    const [doctores,                 setDoctores]                 = useState<Doctor[]>([]);
    const [doctorSeleccionado,       setDoctorSeleccionado]       = useState<Doctor | null>(null);

    const [mesCalendario, setMesCalendario] = useState(new Date());
    const [fecha,         setFecha]         = useState("");
    const [hora,          setHora]          = useState("");
    const [duracion,      setDuracion]      = useState(60);
    const [motivo,        setMotivo]        = useState("");
    const [loading,       setLoading]       = useState(false);
    const [error,         setError]         = useState("");

    // Calcular edad menor
    useEffect(() => {
        if (diaMenor && mesMenor && anioMenor) {
            const fechaStr = `${anioMenor}-${mesMenor}-${diaMenor}`;
            const edad = calcularEdad(fechaStr);
            setEdadMenorCalc(edad);
            if (edad < 0 || edad > 17) setEdadMenorError("El menor debe tener entre 0 y 17 años");
            else setEdadMenorError("");
        }
    }, [diaMenor, mesMenor, anioMenor]);

    // Cargar paciente y especialidades
    useEffect(() => {
        async function cargarDatos() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }
            const snap = await getDoc(doc(db, "pacientes", user.uid));
            if (snap.exists()) {
                const data = snap.data() as Paciente;
                setPaciente(data);
                if (data.fechaNacimiento) {
                    setEdadPaciente(calcularEdad(data.fechaNacimiento));
                    setFechaNacimiento(data.fechaNacimiento);
                } else if (data.edad) setEdadPaciente(data.edad);
            }
            const espSnap = await getDocs(collection(db, "especialidades"));
            setEspecialidades(espSnap.docs.map(d => ({ id: d.id, ...d.data() } as Especialidad)));
        }
        cargarDatos();
    }, []);

    // Cargar doctores cuando cambia especialidad — incluye especialidades adicionales
    useEffect(() => {
        async function cargarDoctores() {
            if (!especialidadSeleccionada) return;

            // Buscar doctores cuya especialidad principal coincide
            const q1 = query(collection(db, "doctores"),
                where("especialidad", "==", especialidadSeleccionada),
                where("activo", "==", true));
            const snap1 = await getDocs(q1);
            const doctoresMap = new Map<string, Doctor>();
            snap1.docs.forEach(d => doctoresMap.set(d.id, { uid: d.id, ...d.data() } as Doctor));

            // Buscar doctores con la especialidad en su array adicional
            const snapTodos = await getDocs(query(collection(db, "doctores"), where("activo", "==", true)));
            snapTodos.docs.forEach(d => {
                if (doctoresMap.has(d.id)) return;
                const data = d.data();
                const esps: any[] = data.especialidades ?? [];
                if (esps.some(e => e.nombre === especialidadSeleccionada)) {
                    doctoresMap.set(d.id, { uid: d.id, ...data } as Doctor);
                }
            });

            setDoctores(Array.from(doctoresMap.values()));
        }
        cargarDoctores();
    }, [especialidadSeleccionada]);

    function calcularEdad(fechaNac: string): number {
        const hoy = new Date(); const nac = new Date(fechaNac);
        let e = hoy.getFullYear() - nac.getFullYear();
        const m = hoy.getMonth() - nac.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
        return e;
    }

    function getEspecialidadesFiltradas() {
        const edadActual = esTutor ? (edadMenorCalc ?? 0) : (fechaNacimiento ? calcularEdad(fechaNacimiento) : edadPaciente);
        const esMenor = edadActual < 18;
        return especialidades.filter(e => {
            if (esMenor  && ESPECIALIDADES_SOLO_ADULTOS.includes(e.nombre)) return false;
            if (!esMenor && ESPECIALIDADES_SOLO_MENORES.includes(e.nombre)) return false;
            return true;
        });
    }

    // ── Verifica si un día es laborable según el horario del doctor ──
    function esDiaDisponible(dateStr: string): boolean {
        if (!doctorSeleccionado?.horario) return true; // sin horario = todos disponibles
        const d = new Date(dateStr + "T00:00:00");
        const key = DIA_JS_A_KEY[d.getDay()];
        return doctorSeleccionado.horario[key]?.activo ?? false;
    }

    // ── Generar horas disponibles según el horario del doctor ──
    function getHorasDisponibles(): string[] {
        if (!doctorSeleccionado?.horario || !fecha) {
            return Array.from({ length: 16 }, (_, i) => {
                const h = Math.floor(i / 2) + 9;
                const m = i % 2 === 0 ? "00" : "30";
                if (h >= 17) return null;
                return `${String(h).padStart(2,"0")}:${m}`;
            }).filter(Boolean) as string[];
        }
        const d = new Date(fecha + "T00:00:00");
        const key = DIA_JS_A_KEY[d.getDay()];
        const diaHorario = doctorSeleccionado.horario[key];
        if (!diaHorario?.activo) return [];
        return generarSlots(diaHorario.inicio, diaHorario.fin);
    }

    function renderCalendario() {
        const year  = mesCalendario.getFullYear();
        const month = mesCalendario.getMonth();
        const firstDay    = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const offset = firstDay === 0 ? 6 : firstDay - 1;
        const hoyStr = new Date().toISOString().split("T")[0];

        return (
            <div style={{ background: "#f9fafb", borderRadius: 14, padding: "16px", border: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <button type="button" onClick={() => setMesCalendario(new Date(year, month - 1))}
                        style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "#f0f9f7", color: "#2a5f5a", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>‹</button>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#1a2e2c" }}>{MESES_CAL[month]} {year}</span>
                    <button type="button" onClick={() => setMesCalendario(new Date(year, month + 1))}
                        style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "#f0f9f7", color: "#2a5f5a", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>›</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
                    {["Lu","Ma","Mi","Ju","Vi","Sá","Do"].map(d => (
                        <div key={d} style={{ textAlign: "center", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", padding: "4px 0" }}>{d}</div>
                    ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                    {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dia    = i + 1;
                        const diaStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;
                        const esPasado     = diaStr <= hoyStr;
                        const noDisponible = !esDiaDisponible(diaStr);
                        const deshabilitado = esPasado || noDisponible;
                        const seleccionado = fecha === diaStr;
                        const esHoy        = diaStr === hoyStr;

                        return (
                            <button key={dia} type="button"
                                disabled={deshabilitado}
                                onClick={() => { setFecha(diaStr); setHora(""); }}
                                title={noDisponible && !esPasado ? "El doctor no trabaja este día" : undefined}
                                style={{
                                    aspectRatio: "1", borderRadius: "50%",
                                    background: seleccionado ? "linear-gradient(135deg, #6b9e9a, #2d6560)" : esHoy ? "#f0f9f7" : noDisponible ? "#f3f4f6" : "transparent",
                                    color: seleccionado ? "white" : deshabilitado ? "#d1d5db" : esHoy ? "#2d6560" : "#374151",
                                    fontWeight: seleccionado || esHoy ? 700 : 400,
                                    fontSize: "0.78rem",
                                    cursor: deshabilitado ? "not-allowed" : "pointer",
                                    border: seleccionado ? "none" : esHoy ? "2px solid #b2ddd7" : "1px solid transparent",
                                    boxShadow: seleccionado ? "0 2px 8px rgba(45,101,96,0.35)" : "none",
                                    transition: "all 0.15s",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                {dia}
                            </button>
                        );
                    })}
                </div>
                {doctorSeleccionado?.horario && (
                    <p style={{ margin: "10px 0 0", fontSize: "0.68rem", color: "#9ca3af", textAlign: "center" }}>
                        Los días grises no están disponibles según el horario del doctor
                    </p>
                )}
            </div>
        );
    }

    async function handleEnviar() {
        if (!doctorSeleccionado || !fecha || !hora || !motivo.trim()) { setError("Por favor completa todos los campos."); return; }
        setLoading(true);
        try {
            const user = auth.currentUser!;
            const edadFinal = esTutor ? (edadMenorCalc ?? 0) : (fechaNacimiento ? calcularEdad(fechaNacimiento) : edadPaciente);
            await addDoc(collection(db, "citas"), {
                pacienteId:     user.uid,
                pacienteNombre: esTutor ? `${paciente?.nombre} (tutor de ${nombreMenor})` : paciente?.nombre,
                pacienteSexo:   esTutor ? (sexoMenor || "M") : (paciente?.sexo ?? "M"),
                pacienteEdad:   edadFinal,
                esTutor,
                nombreMenor:    esTutor ? nombreMenor : "",
                doctorId:       doctorSeleccionado.uid,
                doctorNombre:   doctorSeleccionado.nombre,
                especialidad:   especialidadSeleccionada,
                fecha, hora, duracion,
                lugar:          doctorSeleccionado.consultorio,
                motivo:         motivo.trim(),
                estado:         "PENDIENTE",
                createdAt:      Timestamp.now(),
                updatedAt:      Timestamp.now(),
            });
            router.push("/dashboard");
        } catch (e: any) {
            setError(e.message ?? "Error al agendar la cita.");
        } finally { setLoading(false); }
    }

    const inputStyle: React.CSSProperties = {
        width: "100%", background: "white", border: "1px solid #d1d5db",
        borderRadius: 12, padding: "11px 14px", color: "#111827", fontSize: "0.9rem",
        fontFamily: "'Montserrat', sans-serif", outline: "none", boxSizing: "border-box",
    };
    const labelStyle: React.CSSProperties = {
        display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4b5563",
        marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em",
    };

    const horasDisponibles = getHorasDisponibles();

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom, #5f817d, #0f1e33)", fontFamily: "'Montserrat', sans-serif" }}>
            <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src="https://static.vecteezy.com/system/resources/thumbnails/011/653/087/small_2x/psychology-3d-render-icon-illustration-png.png" style={{ height: 36 }} />
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "white" }}>Mente en Calma</span>
                </div>
                <button onClick={() => router.push("/dashboard")}
                    style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontSize: "0.85rem" }}>
                    Volver
                </button>
            </header>

            <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 20px 60px" }}>
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.8rem", color: "white", margin: "0 0 8px" }}>Agendar Nueva Cita</h1>
                    <p style={{ color: "rgba(255,255,255,0.7)", margin: 0 }}>Completa la información para solicitar tu consulta</p>
                </div>

                {/* Pasos */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
                    {["Datos","Especialidad","Fecha","Motivo"].map((label, i) => {
                        const num = i + 1; const activo = paso === num; const completado = paso > num;
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

                <div style={{ background: "white", borderRadius: 24, padding: "32px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

                    {/* PASO 1 */}
                    {paso === 1 && (
                        <div>
                            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: "0 0 20px" }}>Paso 1: Datos Generales</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 }}>
                                {[{ icon: <LuUser size={15} />, label: "Soy el Paciente", value: "yo" }, { icon: <LuUsers size={15} />, label: "Soy Tutor", value: "tutor" }].map(op => {
                                    const sel = (op.value === "yo" && !esTutor) || (op.value === "tutor" && esTutor);
                                    return (
                                        <button key={op.label} type="button" onClick={() => setEsTutor(op.value !== "yo")}
                                            style={{ padding: "9px 6px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.78rem", transition: "all 0.2s", background: sel ? "white" : "transparent", color: sel ? "#2a5f5a" : "#9ca3af", boxShadow: sel ? "0 1px 4px rgba(0,0,0,0.1)" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                                            {op.icon} {op.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Nombre completo</label>
                                    <input style={{ ...inputStyle, background: "#f9fafb" }} value={paciente?.nombre ?? ""} readOnly />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div><label style={labelStyle}>Correo</label><input style={{ ...inputStyle, background: "#f9fafb" }} value={paciente?.email ?? ""} readOnly /></div>
                                    <div><label style={labelStyle}>Teléfono</label><input style={{ ...inputStyle, background: "#f9fafb" }} value={paciente?.telefono ?? ""} readOnly /></div>
                                </div>
                                {!esTutor && (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div><label style={labelStyle}>Fecha de nacimiento</label><input style={{ ...inputStyle, background: "#f9fafb" }} value={fechaNacimiento} readOnly /></div>
                                        <div><label style={labelStyle}>Edad</label><input style={{ ...inputStyle, background: "#f9fafb" }} value={edadPaciente} readOnly /></div>
                                    </div>
                                )}
                                {esTutor && (
                                    <div style={{ background: "#f9fafb", borderRadius: 14, padding: 16, border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 14 }}>
                                        <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.88rem", color: "#1a2e2c" }}>Datos del menor</p>
                                        <div><label style={labelStyle}>Nombre del menor</label><input style={inputStyle} placeholder="Nombre completo" value={nombreMenor} onChange={e => setNombreMenor(e.target.value)} /></div>
                                        <div>
                                            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}><LuCalendar size={13} /> Fecha de nacimiento</label>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr 1fr", gap: 8 }}>
                                                <CustomDropdown value={diaMenor} placeholder="Día" options={Array.from({ length: mesMenor && anioMenor ? new Date(Number(anioMenor), Number(mesMenor), 0).getDate() : 31 }, (_, i) => String(i + 1).padStart(2, "0"))} onSelect={setDiaMenor} />
                                                <CustomDropdown value={mesMenor} placeholder="Mes" options={MESES_OPT} onSelect={setMesMenor} isMonth />
                                                <CustomDropdown value={anioMenor} placeholder="Año" options={(() => { const a = new Date().getFullYear(); const l = []; for (let y = a; y >= a - 17; y--) l.push(String(y)); return l; })()} onSelect={setAnioMenor} />
                                            </div>
                                            {edadMenorCalc !== null && !edadMenorError && <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#4a8a85", fontWeight: 600 }}>Edad calculada: {edadMenorCalc} años</p>}
                                            {edadMenorError && <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "#dc2626" }}>{edadMenorError}</p>}
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Género</label>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                                {[{ v: "M", label: "Masculino", icon: <FaMars size={14} /> }, { v: "F", label: "Femenino", icon: <FaVenus size={14} /> }, { v: "O", label: "No especificar", icon: <LuUser size={14} /> }].map(op => (
                                                    <button key={op.v} type="button" onClick={() => setSexoMenor(op.v)}
                                                        style={{ padding: "9px 6px", borderRadius: 12, border: `2px solid ${sexoMenor === op.v ? "#4a8a85" : "#d1d5db"}`, background: sexoMenor === op.v ? "#f0f9f7" : "white", color: sexoMenor === op.v ? "#2a5f5a" : "#6b7280", fontWeight: sexoMenor === op.v ? 600 : 400, fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                                                        {op.icon} {op.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PASO 2 */}
                    {paso === 2 && (
                        <div>
                            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: "0 0 6px" }}>Paso 2: Especialidades</h2>
                            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 20px" }}>Seleccione el tipo de atención que requiere</p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                                {getEspecialidadesFiltradas().map(esp => (
                                    <button key={esp.id} type="button" onClick={() => { setEspecialidadSeleccionada(esp.nombre); setDoctorSeleccionado(null); setFecha(""); setHora(""); }}
                                        style={{ padding: "16px 12px", borderRadius: 14, border: `2px solid ${especialidadSeleccionada === esp.nombre ? "#4a8a85" : "#e5e7eb"}`, background: especialidadSeleccionada === esp.nombre ? "#f0f9f7" : "white", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: "1.8rem", color: especialidadSeleccionada === esp.nombre ? "#4a8a85" : "#9ca3af" }}>{ICONOS[esp.nombre] ?? <LuBrain />}</span>
                                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: especialidadSeleccionada === esp.nombre ? "#2a5f5a" : "#374151", textAlign: "center", lineHeight: 1.3 }}>{esp.nombre}</span>
                                    </button>
                                ))}
                            </div>
                            {especialidadSeleccionada && (
                                <div>
                                    <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#1a2e2c", margin: "0 0 12px" }}>Doctores disponibles</h3>
                                    {doctores.length === 0 ? (
                                        <p style={{ fontSize: "0.85rem", color: "#9ca3af", textAlign: "center", padding: "16px 0" }}>No hay doctores disponibles para esta especialidad</p>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            {doctores.map(d => (
                                                <button key={d.uid} type="button" onClick={() => { setDoctorSeleccionado(d); setFecha(""); setHora(""); }}
                                                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: `2px solid ${doctorSeleccionado?.uid === d.uid ? "#4a8a85" : "#e5e7eb"}`, background: doctorSeleccionado?.uid === d.uid ? "#f0f9f7" : "white", cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}>
                                                    {d.fotoUrl ? (
                                                        <img src={d.fotoUrl} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                                                    ) : (
                                                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, flexShrink: 0 }}>{d.nombre[0]}</div>
                                                    )}
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#1a2e2c" }}>{d.nombre}</p>
                                                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280" }}>{d.gradoEstudios} · {d.consultorio}</p>
                                                        {d.horario && (
                                                            <p style={{ margin: "2px 0 0", fontSize: "0.68rem", color: "#4a8a85" }}>
                                                                Disponible: {Object.entries(d.horario).filter(([,v]) => (v as DiaSemana).activo).map(([k]) => k.slice(0,3)).join(", ")}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {doctorSeleccionado?.uid === d.uid && <span style={{ color: "#4a8a85", fontWeight: 700 }}>✓</span>}
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
                            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: "0 0 6px" }}>Paso 3: Fecha y Hora</h2>
                            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 20px" }}>Doctor: <strong>{doctorSeleccionado?.nombre}</strong> · {doctorSeleccionado?.consultorio}</p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
                                <div>
                                    <label style={labelStyle}>Fecha</label>
                                    {renderCalendario()}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div>
                                        <label style={labelStyle}>Hora</label>
                                        {!fecha ? (
                                            <p style={{ fontSize: "0.82rem", color: "#9ca3af", padding: "10px 0" }}>Selecciona una fecha primero</p>
                                        ) : horasDisponibles.length === 0 ? (
                                            <p style={{ fontSize: "0.82rem", color: "#dc2626", padding: "10px 0" }}>No hay horarios disponibles este día</p>
                                        ) : (
                                            <CustomDropdown value={hora} placeholder="Selecciona hora"
                                                options={horasDisponibles}
                                                onSelect={setHora} />
                                        )}
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Duración</label>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                            {DURACIONES.map(d => (
                                                <button key={d.value} type="button" onClick={() => setDuracion(d.value)}
                                                    style={{ padding: "9px 6px", borderRadius: 10, border: `2px solid ${duracion === d.value ? "#4a8a85" : "#e5e7eb"}`, background: duracion === d.value ? "#f0f9f7" : "white", color: duracion === d.value ? "#2a5f5a" : "#6b7280", fontWeight: duracion === d.value ? 600 : 400, fontSize: "0.75rem", cursor: "pointer", transition: "all 0.15s", fontFamily: "'Montserrat', sans-serif", textAlign: "center" }}>
                                                    {d.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {(fecha || hora) && (
                                        <div style={{ background: fecha && hora ? "#f0f9f7" : "#f9fafb", border: `1px solid ${fecha && hora ? "#b2ddd7" : "#e5e7eb"}`, borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                                            <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Día Agendado</p>
                                            {fecha && (
                                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                    <LuCalendar size={14} color="#4a8a85" />
                                                    <span style={{ fontSize: "0.82rem", color: "#1a2e2c", fontWeight: 500 }}>
                                                        {new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                                                    </span>
                                                </div>
                                            )}
                                            {hora && (
                                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                    <LuCalendar size={14} color="#4a8a85" />
                                                    <span style={{ fontSize: "0.82rem", color: "#1a2e2c", fontWeight: 500 }}>{hora} · {DURACIONES.find(d => d.value === duracion)?.label}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASO 4 */}
                    {paso === 4 && (
                        <div>
                            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: "0 0 6px" }}>Paso 4: Motivo de Consulta</h2>
                            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 20px" }}>{esTutor ? "¿Qué situación presenta el menor?" : "¿Qué te trae hoy a consulta?"}</p>
                            <textarea placeholder="Describe brevemente la situación..." value={motivo} onChange={e => setMotivo(e.target.value)}
                                style={{ ...inputStyle, minHeight: 140, resize: "none", lineHeight: 1.6 }} />
                            <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 8 }}>La información compartida es confidencial y solo accesible para el psicólogo.</p>
                            <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px", marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#1a2e2c", margin: 0 }}>Resumen</h3>
                                {[
                                    { label: "Paciente",     value: esTutor ? `${paciente?.nombre} (tutor de ${nombreMenor})` : paciente?.nombre },
                                    { label: "Doctor",       value: doctorSeleccionado?.nombre },
                                    { label: "Especialidad", value: especialidadSeleccionada },
                                    { label: "Fecha",        value: fecha ? new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }) : "" },
                                    { label: "Hora",         value: hora },
                                    { label: "Duración",     value: DURACIONES.find(d => d.value === duracion)?.label },
                                    { label: "Lugar",        value: doctorSeleccionado?.consultorio },
                                ].map(item => (
                                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                                        <span style={{ color: "#6b7280" }}>{item.label}:</span>
                                        <span style={{ color: "#1a2e2c", fontWeight: 500 }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                            {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 12px", marginTop: 16 }}><p style={{ margin: 0, fontSize: "0.82rem", color: "#dc2626" }}>{error}</p></div>}
                        </div>
                    )}

                    {/* Navegación */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
                        {paso > 1 ? (
                            <button onClick={() => { setPaso(p => p - 1); setError(""); }}
                                style={{ padding: "10px 24px", borderRadius: 12, border: "1px solid #d1d5db", background: "white", color: "#374151", fontSize: "0.88rem", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}>
                                Anterior
                            </button>
                        ) : <div />}
                        {paso < 4 ? (
                            <button onClick={() => {
                                if (paso === 1 && esTutor && (!nombreMenor || !diaMenor || !mesMenor || !anioMenor || !sexoMenor)) { setError("Completa todos los datos del menor."); return; }
                                if (paso === 1 && esTutor && edadMenorError) { setError(edadMenorError); return; }
                                if (paso === 2 && !especialidadSeleccionada) { setError("Selecciona una especialidad."); return; }
                                if (paso === 2 && !doctorSeleccionado) { setError("Selecciona un doctor."); return; }
                                if (paso === 3 && !fecha) { setError("Selecciona una fecha."); return; }
                                if (paso === 3 && !hora) { setError("Selecciona una hora."); return; }
                                setError(""); setPaso(p => p + 1);
                            }}
                                style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontSize: "0.88rem", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
                                Continuar
                            </button>
                        ) : (
                            <button onClick={handleEnviar} disabled={loading}
                                style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: loading ? "#9ca3af" : "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontSize: "0.88rem", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
                                {loading ? "Enviando..." : "Finalizar Registro"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}