"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import {
    LuChevronLeft, LuChevronRight, LuCalendar, LuList,
    LuClock, LuMapPin, LuUser, LuCheck, LuX, LuCalendarDays,
    LuSettings, LuSave,
} from "react-icons/lu";

// ── Tipos ──────────────────────────────────────────────────────
interface DiaSemana {
    activo: boolean;
    inicio: string;
    fin: string;
}

interface Horario {
    lunes: DiaSemana;
    martes: DiaSemana;
    miercoles: DiaSemana;
    jueves: DiaSemana;
    viernes: DiaSemana;
    sabado: DiaSemana;
    domingo: DiaSemana;
}

interface Cita {
    id: string;
    pacienteNombre: string;
    especialidad: string;
    fecha: string;
    hora: string;
    lugar: string;
    duracion?: number;
    estado: "PENDIENTE" | "ACEPTADA" | "COMPLETADA" | "CANCELADA";
    motivo?: string;
}

// ── Constantes ─────────────────────────────────────────────────
const DIAS_KEYS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"] as const;
const DIAS_LABELS: Record<string, string> = {
    lunes: "Lun", martes: "Mar", miercoles: "Mié",
    jueves: "Jue", viernes: "Vie", sabado: "Sáb", domingo: "Dom",
};
const DIAS_FULL: Record<string, string> = {
    lunes: "Lunes", martes: "Martes", miercoles: "Miércoles",
    jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
};
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS_CORTO = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
    PENDIENTE: { label: "Pendiente", color: "#b45309", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b" },
    ACEPTADA: { label: "Aceptada", color: "#2a5f5a", bg: "#f0f9f7", border: "#b2ddd7", dot: "#4a8a85" },
    COMPLETADA: { label: "Completada", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6" },
    CANCELADA: { label: "Cancelada", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", dot: "#ef4444" },
};

const HORARIO_DEFAULT: Horario = {
    lunes: { activo: true, inicio: "09:00", fin: "18:00" },
    martes: { activo: true, inicio: "09:00", fin: "18:00" },
    miercoles: { activo: true, inicio: "09:00", fin: "18:00" },
    jueves: { activo: true, inicio: "09:00", fin: "18:00" },
    viernes: { activo: true, inicio: "09:00", fin: "14:00" },
    sabado: { activo: false, inicio: "09:00", fin: "13:00" },
    domingo: { activo: false, inicio: "09:00", fin: "13:00" },
};

// Horas disponibles para selección
const HORAS_OPTS = Array.from({ length: 24 }, (_, i) => {
    const h = String(i).padStart(2, "0");
    return `${h}:00`;
});

export default function CitasPsicologo() {
    const router = useRouter();

    const [citas, setCitas] = useState<Cita[]>([]);
    const [horario, setHorario] = useState<Horario>(HORARIO_DEFAULT);
    const [horarioGuardado, setHorarioGuardado] = useState<Horario>(HORARIO_DEFAULT);
    const [loading, setLoading] = useState(true);
    const [guardandoHorario, setGuardandoHorario] = useState(false);
    const [horarioCambiado, setHorarioCambiado] = useState(false);

    const [fechaActual, setFechaActual] = useState(new Date());
    const [vista, setVista] = useState<"mes" | "semana">("semana");
    const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(new Date());
    const [citaDetalle, setCitaDetalle] = useState<Cita | null>(null);
    const [horarioVisible, setHorarioVisible] = useState(false);
    // Cargar datos
    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }

            const [docSnap, citasSnap] = await Promise.all([
                getDoc(doc(db, "doctores", user.uid)),
                getDocs(query(collection(db, "citas"), where("doctorId", "==", user.uid))),
            ]);

            if (docSnap.exists() && docSnap.data().horario) {
                const h = docSnap.data().horario as Horario;
                setHorario(h);
                setHorarioGuardado(h);
            }

            setCitas(citasSnap.docs.map(d => ({ id: d.id, ...d.data() } as Cita)));
            setLoading(false);
        }
        cargar();
    }, []);

    // Detectar cambios en horario
    useEffect(() => {
        setHorarioCambiado(JSON.stringify(horario) !== JSON.stringify(horarioGuardado));
    }, [horario, horarioGuardado]);

    // Guardar horario
    async function guardarHorario() {
        const user = auth.currentUser;
        if (!user) return;
        setGuardandoHorario(true);
        try {
            await updateDoc(doc(db, "doctores", user.uid), { horario });
            setHorarioGuardado(horario);
            setHorarioCambiado(false);
        } catch (e) {
            console.error(e);
        } finally {
            setGuardandoHorario(false);
        }
    }

    // Helpers de fecha
    function parseFecha(fecha: string) { return new Date(fecha + "T00:00:00"); }

    function getCitasDia(date: Date) {
        return citas.filter(c => {
            const f = parseFecha(c.fecha);
            return f.getFullYear() === date.getFullYear() &&
                f.getMonth() === date.getMonth() &&
                f.getDate() === date.getDate();
        }).sort((a, b) => a.hora.localeCompare(b.hora));
    }

    function getInicioSemana(date: Date) {
        const d = new Date(date);
        const day = d.getDay();
        d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // empieza en lunes
        return d;
    }

    function getDiasSemana() {
        const inicio = getInicioSemana(fechaActual);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(inicio);
            d.setDate(d.getDate() + i);
            return d;
        });
    }

    function navegar(dir: number) {
        const d = new Date(fechaActual);
        if (vista === "mes") d.setMonth(d.getMonth() + dir);
        else d.setDate(d.getDate() + dir * 7);
        setFechaActual(d);
    }

    function getTituloNav() {
        if (vista === "mes") return `${MESES[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;
        const dias = getDiasSemana();
        const ini = dias[0]; const fin = dias[6];
        if (ini.getMonth() === fin.getMonth())
            return `${ini.getDate()} - ${fin.getDate()} ${MESES[ini.getMonth()]} ${ini.getFullYear()}`;
        return `${ini.getDate()} ${MESES[ini.getMonth()].slice(0, 3)} - ${fin.getDate()} ${MESES[fin.getMonth()].slice(0, 3)} ${fin.getFullYear()}`;
    }

    // Citas del día seleccionado
    const citasDelDia = diaSeleccionado ? getCitasDia(diaSeleccionado) : [];

    // ── Vista mensual ─────────────────────────────────────────
    function renderMes() {
        const year = fechaActual.getFullYear();
        const month = fechaActual.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const offset = firstDay === 0 ? 6 : firstDay - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const hoy = new Date();

        return (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Cabecera días */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #e5e7eb" }}>
                    {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
                        <div key={d} style={{ padding: "8px 0", textAlign: "center", fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em" }}>{d}</div>
                    ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", flex: 1, gridAutoRows: "minmax(80px, 1fr)" }}>
                    {Array.from({ length: offset }).map((_, i) => (
                        <div key={`e${i}`} style={{ borderRight: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dia = i + 1;
                        const fecha = new Date(year, month, dia);
                        const esHoy = dia === hoy.getDate() && month === hoy.getMonth() && year === hoy.getFullYear();
                        const seleccionado = diaSeleccionado?.toDateString() === fecha.toDateString();
                        const citasDia = getCitasDia(fecha);

                        // Día laboral según horario
                        const diaSemanaKey = DIAS_KEYS[(fecha.getDay() + 6) % 7]; // lunes=0
                        const esLaboral = horario[diaSemanaKey]?.activo;

                        return (
                            <div key={dia}
                                onClick={() => setDiaSeleccionado(fecha)}
                                style={{ borderRight: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", padding: "5px", cursor: "pointer", background: seleccionado ? "#f0f9f7" : "white", transition: "background 0.15s", position: "relative" }}
                                onMouseEnter={e => { if (!seleccionado) e.currentTarget.style.background = "#f8f8f8"; }}
                                onMouseLeave={e => { if (!seleccionado) e.currentTarget.style.background = seleccionado ? "#f0f9f7" : esLaboral ? "white" : "#fafafa"; }}>
                                <div style={{ width: horarioVisible ? 220 : 0, background: "white", borderRight: horarioVisible ? "1px solid #e5e7eb" : "none", overflow: "hidden", transition: "width 0.3s ease", flexShrink: 0, display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontSize: "0.78rem", fontWeight: esHoy ? 700 : 400, color: esHoy ? "white" : esLaboral ? "#374151" : "#c4c4c4" }}>{dia}</span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    {citasDia.slice(0, 2).map(c => {
                                        const cfg = ESTADO_CONFIG[c.estado];
                                        return (
                                            <div key={c.id}
                                                onClick={e => { e.stopPropagation(); setDiaSeleccionado(fecha); setCitaDetalle(c); }}
                                                style={{ background: cfg.bg, borderLeft: `3px solid ${cfg.dot}`, borderRadius: 3, padding: "1px 4px", fontSize: "0.6rem", color: cfg.color, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}>
                                                {c.hora} {c.pacienteNombre.split(" ")[0]}
                                            </div>
                                        );
                                    })}
                                    {citasDia.length > 2 && <div style={{ fontSize: "0.58rem", color: "#9ca3af", paddingLeft: 3 }}>+{citasDia.length - 2} más</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── Vista semanal ─────────────────────────────────────────
    function renderSemana() {
        const dias = getDiasSemana();
        const hoy = new Date();
        const HORAS_VISTA = Array.from({ length: 14 }, (_, i) => i + 7); // 7am - 8pm

        return (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Cabecera */}
                <div style={{ display: "grid", gridTemplateColumns: "48px repeat(7, 1fr)", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
                    <div />
                    {dias.map((d, i) => {
                        const esHoy = d.toDateString() === hoy.toDateString();
                        const seleccionado = diaSeleccionado?.toDateString() === d.toDateString();
                        const diaSemanaKey = DIAS_KEYS[i];
                        const esLaboral = horario[diaSemanaKey]?.activo;
                        return (
                            <div key={i} onClick={() => setDiaSeleccionado(d)}
                                style={{ padding: "6px 0", textAlign: "center", borderLeft: "1px solid #f3f4f6", cursor: "pointer", background: seleccionado ? "#f0f9f7" : "white" }}>
                                <p style={{ margin: 0, fontSize: "0.65rem", color: esLaboral ? "#9ca3af" : "#d1d5db", fontWeight: 700, letterSpacing: "0.06em" }}>{DIAS_CORTO[d.getDay()]}</p>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: esHoy ? "#2d6560" : seleccionado ? "#e0f4f1" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", margin: "2px auto 0" }}>
                                    <span style={{ fontSize: "0.85rem", fontWeight: esHoy ? 700 : 400, color: esHoy ? "white" : esLaboral ? "#374151" : "#d1d5db" }}>{d.getDate()}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Grid horario */}
                <div style={{ flex: 1, overflowY: "auto" }}>
                    {HORAS_VISTA.map(hora => (
                        <div key={hora} style={{ display: "grid", gridTemplateColumns: "48px repeat(7, 1fr)", minHeight: 52, borderBottom: "1px solid #f3f4f6" }}>
                            <div style={{ padding: "3px 6px 0 0", textAlign: "right", fontSize: "0.62rem", color: "#9ca3af", fontWeight: 500 }}>
                                {hora < 12 ? `${hora}am` : hora === 12 ? "12pm" : `${hora - 12}pm`}
                            </div>
                            {dias.map((d, di) => {
                                const diaSemanaKey = DIAS_KEYS[di];
                                const esLaboral = horario[diaSemanaKey]?.activo;
                                const inicioH = parseInt(horario[diaSemanaKey]?.inicio?.split(":")[0] ?? "0");
                                const finH = parseInt(horario[diaSemanaKey]?.fin?.split(":")[0] ?? "24");
                                const dentroDe = esLaboral && hora >= inicioH && hora < finH;
                                const citasHora = getCitasDia(d).filter(c => parseInt(c.hora.split(":")[0]) === hora);
                                const seleccionado = diaSeleccionado?.toDateString() === d.toDateString();
                                return (
                                    <div key={di} onClick={() => setDiaSeleccionado(d)}
                                        style={{ borderLeft: "1px solid #f3f4f6", padding: "2px 3px", background: seleccionado ? "#fafffe" : "white", cursor: "pointer" }}>
                                        {citasHora.map(c => {
                                            const cfg = ESTADO_CONFIG[c.estado];
                                            return (
                                                <div key={c.id}
                                                    onClick={e => { e.stopPropagation(); setDiaSeleccionado(d); setCitaDetalle(c); }}
                                                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderLeft: `3px solid ${cfg.dot}`, borderRadius: 4, padding: "2px 5px", cursor: "pointer", marginBottom: 2 }}>
                                                    <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, color: cfg.color }}>{c.hora}</p>
                                                    <p style={{ margin: 0, fontSize: "0.6rem", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.pacienteNombre.split(" ")[0]}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (loading) return (
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#4a8a85" }}>Cargando...</p>
        </div>
    );

    return (
        <div style={{ height: "calc(100vh - 53px)", display: "flex", fontFamily: "'Montserrat', sans-serif", background: "#f8fafb", overflow: "hidden" }}>

            <style>{`
            ::-webkit-scrollbar { width: 0px; height: 0px; }
            @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

            {/* ── IZQUIERDA: Horario de trabajo ────────────────── */}
            <div style={{ width: horarioVisible ? 220 : 0, background: "white", borderRight: horarioVisible ? "1px solid #e5e7eb" : "none", transition: "width 0.3s ease", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5e7eb" }}>
                    <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "#1a2e2c", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                        <LuSettings size={15} color="#4a8a85" /> Horario de trabajo
                    </h3>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
                    {DIAS_KEYS.map(dia => {
                        const cfg = horario[dia];
                        return (
                            <div key={dia} style={{ marginBottom: 10, padding: "10px", background: cfg.activo ? "#f0f9f7" : "#f9fafb", borderRadius: 10, border: `1px solid ${cfg.activo ? "#b2ddd7" : "#e5e7eb"}`, transition: "all 0.2s" }}>
                                {/* Toggle día */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: cfg.activo ? 8 : 0 }}>
                                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: cfg.activo ? "#1a2e2c" : "#9ca3af" }}>
                                        {DIAS_FULL[dia]}
                                    </span>
                                    <button
                                        onClick={() => setHorario(prev => ({ ...prev, [dia]: { ...prev[dia], activo: !prev[dia].activo } }))}
                                        style={{ width: 32, height: 18, borderRadius: 9, border: "none", cursor: "pointer", background: cfg.activo ? "#4a8a85" : "#d1d5db", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                                        <div style={{ width: 14, height: 14, borderRadius: "50%", background: "white", position: "absolute", top: 2, left: cfg.activo ? 16 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                                    </button>
                                </div>

                                {/* Horas (solo si activo) */}
                                {cfg.activo && (
                                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                        <select value={cfg.inicio}
                                            onChange={e => setHorario(prev => ({ ...prev, [dia]: { ...prev[dia], inicio: e.target.value } }))}
                                            style={{ flex: 1, fontSize: "0.7rem", border: "1px solid #d1d5db", borderRadius: 6, padding: "3px 4px", outline: "none", fontFamily: "'Montserrat', sans-serif", background: "white", color: "#374151" }}>
                                            {HORAS_OPTS.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                        <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>-</span>
                                        <select value={cfg.fin}
                                            onChange={e => setHorario(prev => ({ ...prev, [dia]: { ...prev[dia], fin: e.target.value } }))}
                                            style={{ flex: 1, fontSize: "0.7rem", border: "1px solid #d1d5db", borderRadius: 6, padding: "3px 4px", outline: "none", fontFamily: "'Montserrat', sans-serif", background: "white", color: "#374151" }}>
                                            {HORAS_OPTS.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Botón guardar */}
                <div style={{ padding: "12px", borderTop: "1px solid #e5e7eb" }}>
                    <button
                        onClick={guardarHorario}
                        disabled={!horarioCambiado || guardandoHorario}
                        style={{ width: "100%", padding: "9px", borderRadius: 10, border: "none", background: horarioCambiado ? "linear-gradient(135deg, #6b9e9a, #2d6560)" : "#e5e7eb", color: horarioCambiado ? "white" : "#9ca3af", fontWeight: 600, fontSize: "0.82rem", cursor: horarioCambiado ? "pointer" : "not-allowed", fontFamily: "'Montserrat', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}>
                        {guardandoHorario ? "Guardando..." : <><LuSave size={14} /> Guardar horario</>}
                    </button>
                </div>
            </div>

            {/* ── CENTRO: Calendario ───────────────────────────── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>


                {/* Toolbar calendario */}
                <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

                        {/* Botón horario — ahora dentro del toolbar */}
                        <button
                            onClick={() => setHorarioVisible(!horarioVisible)}
                            title={horarioVisible ? "Ocultar horario" : "Configurar horario"}
                            style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: horarioVisible ? "#f0f9f7" : "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", fontWeight: 600, color: horarioVisible ? "#2a5f5a" : "#6b7280", fontFamily: "'Montserrat', sans-serif" }}>
                            <LuSettings size={14} /> {horarioVisible ? "Ocultar horario" : "Horario"}
                        </button>

                        {/* Toggle vista */}
                        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 8, padding: 3, gap: 2 }}>
                            {[{ key: "semana", icon: <LuList size={13} />, label: "Semana" }, { key: "mes", icon: <LuCalendar size={13} />, label: "Mes" }].map(v => (
                                <button key={v.key} onClick={() => setVista(v.key as "mes" | "semana")}
                                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, fontFamily: "'Montserrat', sans-serif", background: vista === v.key ? "white" : "transparent", color: vista === v.key ? "#2a5f5a" : "#6b7280", boxShadow: vista === v.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>
                                    {v.icon} {v.label}
                                </button>
                            ))}
                        </div>

                        {/* Navegación */}
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button onClick={() => navegar(-1)} style={{ padding: 5, borderRadius: 7, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex" }}><LuChevronLeft size={14} color="#6b7280" /></button>
                            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.85rem", color: "#1a2e2c", minWidth: 160, textAlign: "center" }}>{getTituloNav()}</span>
                            <button onClick={() => navegar(1)} style={{ padding: 5, borderRadius: 7, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex" }}><LuChevronRight size={14} color="#6b7280" /></button>
                            <button onClick={() => { setFechaActual(new Date()); setDiaSeleccionado(new Date()); }}
                                style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, color: "#6b7280", fontFamily: "'Montserrat', sans-serif" }}>
                                Hoy
                            </button>
                        </div>
                    </div>

                    {/* Leyenda estados */}
                    <div style={{ display: "flex", gap: 10 }}>
                        {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
                            <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot }} />
                                <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>{cfg.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Calendario */}
                <div style={{ flex: 1, background: "white", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    {vista === "mes" ? renderMes() : renderSemana()}
                </div>
            </div>

            {/* ── DERECHA: Citas del día ───────────────────────── */}
            <div style={{ width: citaDetalle ? 270 : 0, background: "white", borderLeft: citaDetalle ? "1px solid #e5e7eb" : "none", overflow: "hidden", transition: "width 0.3s ease", flexShrink: 0, display: "flex", flexDirection: "column" }}>
                {/* Header panel derecho */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5e7eb" }}>
                    <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "#1a2e2c", margin: "0 0 2px" }}>
                        {diaSeleccionado
                            ? `${diaSeleccionado.getDate()} de ${MESES[diaSeleccionado.getMonth()]}`
                            : "Selecciona un día"}
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>
                        {citasDelDia.length} cita{citasDelDia.length !== 1 ? "s" : ""}
                    </p>
                </div>

                {/* Modal detalle cita */}
                {citaDetalle ? (
                    <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <div>
                                <h4 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#1a2e2c", margin: "0 0 3px" }}>{citaDetalle.pacienteNombre}</h4>
                                <p style={{ margin: 0, fontSize: "0.75rem", color: "#4a8a85" }}>{citaDetalle.especialidad}</p>
                            </div>
                            <button onClick={() => setCitaDetalle(null)} style={{ padding: 4, borderRadius: 7, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex" }}>
                                <LuX size={14} color="#6b7280" />
                            </button>
                        </div>

                        {(() => {
                            const cfg = ESTADO_CONFIG[citaDetalle.estado];
                            return <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>;
                        })()}

                        <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "12px 0" }}>
                            {[
                                { icon: <LuCalendarDays size={13} color="#4a8a85" />, value: citaDetalle.fecha },
                                { icon: <LuClock size={13} color="#4a8a85" />, value: `${citaDetalle.hora}${citaDetalle.duracion ? ` · ${citaDetalle.duracion} min` : ""}` },
                                { icon: <LuMapPin size={13} color="#4a8a85" />, value: citaDetalle.lugar },
                            ].map((item, i) => (
                                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 10px", background: "#f9fafb", borderRadius: 8 }}>
                                    {item.icon}
                                    <span style={{ fontSize: "0.78rem", color: "#374151" }}>{item.value}</span>
                                </div>
                            ))}
                        </div>

                        {citaDetalle.motivo && (
                            <div style={{ padding: "8px 10px", background: "#f9fafb", borderRadius: 8, marginBottom: 12 }}>
                                <p style={{ margin: "0 0 3px", fontSize: "0.65rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Motivo</p>
                                <p style={{ margin: 0, fontSize: "0.78rem", color: "#374151", lineHeight: 1.5 }}>{citaDetalle.motivo}</p>
                            </div>
                        )}

                        {/* Botón completar — solo si ya pasó y no está completada/cancelada */}
                        {citaDetalle.estado !== "COMPLETADA" && citaDetalle.estado !== "CANCELADA" &&
                            new Date(citaDetalle.fecha + "T23:59:59") < new Date() && (
                                <button
                                    onClick={async () => {
                                        await updateDoc(doc(db, "citas", citaDetalle.id), { estado: "COMPLETADA" });
                                        setCitas(prev => prev.map(c => c.id === citaDetalle.id ? { ...c, estado: "COMPLETADA" } : c));
                                        setCitaDetalle(prev => prev ? { ...prev, estado: "COMPLETADA" } : null);
                                    }}
                                    style={{ width: "100%", padding: "9px", borderRadius: 10, background: "#eff6ff", color: "#1d4ed8", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", marginBottom: 8, border: "1px solid #bfdbfe" }}>                                    Marcar como Completada
                                </button>
                            )}

                        <button
                            onClick={() => router.push(`/dashboard-psico/cita/${citaDetalle.id}`)}
                            style={{ width: "100%", padding: "9px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                            Ver detalles completos
                        </button>

                        <div style={{ margin: "12px 0 6px", fontSize: "0.72rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Otras citas del día
                        </div>
                        {citasDelDia.filter(c => c.id !== citaDetalle.id).length === 0 ? (
                            <p style={{ fontSize: "0.75rem", color: "#d1d5db", margin: 0 }}>No hay más citas</p>
                        ) : (
                            citasDelDia.filter(c => c.id !== citaDetalle.id).map(c => {
                                const cfg = ESTADO_CONFIG[c.estado];
                                return (
                                    <div key={c.id} onClick={() => setCitaDetalle(c)}
                                        style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${cfg.border}`, background: cfg.bg, cursor: "pointer", marginBottom: 6 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.78rem", color: "#1a2e2c" }}>{c.hora} · {c.pacienteNombre.split(" ")[0]}</p>
                                        <p style={{ margin: 0, fontSize: "0.68rem", color: cfg.color }}>{cfg.label}</p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    /* Lista de citas del día */
                    <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                        {!diaSeleccionado ? (
                            <div style={{ textAlign: "center", padding: "32px 12px" }}>
                                <LuCalendar size={32} color="#d1d5db" style={{ margin: "0 auto 8px" }} />
                                <p style={{ fontSize: "0.78rem", color: "#9ca3af", margin: 0 }}>Selecciona un día para ver sus citas</p>
                            </div>
                        ) : citasDelDia.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "32px 12px" }}>
                                <LuCalendarDays size={32} color="#d1d5db" style={{ margin: "0 auto 8px" }} />
                                <p style={{ fontSize: "0.78rem", color: "#9ca3af", margin: 0 }}>Sin citas este día</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {citasDelDia.map(c => {
                                    const cfg = ESTADO_CONFIG[c.estado];
                                    return (
                                        <div key={c.id} onClick={() => setCitaDetalle(c)}
                                            style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${cfg.border}`, background: cfg.bg, cursor: "pointer", transition: "opacity 0.15s" }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                                            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                                                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.82rem", color: "#1a2e2c", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.pacienteNombre}</p>
                                                <span style={{ fontSize: "0.62rem", fontWeight: 700, color: cfg.color, background: "white", border: `1px solid ${cfg.border}`, padding: "1px 6px", borderRadius: 10, flexShrink: 0, marginLeft: 4 }}>{cfg.label}</span>
                                            </div>
                                            <p style={{ margin: "0 0 5px", fontSize: "0.7rem", color: "#6b7280" }}>{c.especialidad}</p>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.68rem", color: "#6b7280" }}>
                                                    <LuClock size={11} /> {c.hora}
                                                </span>
                                                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.68rem", color: "#6b7280" }}>
                                                    <LuMapPin size={11} /> {c.lugar}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

    );
}