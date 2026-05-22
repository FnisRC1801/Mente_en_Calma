// app/(public)/singup/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase-client";
import VerificandoCorreo from "./VerificandoCorreo";
import { useSignup } from "./useSignup";
import { createPortal } from "react-dom";

// 🌟 Importamos la lista limpia y actualizada de iconos de Lucide que sí reconoce tu proyecto
import {
    LuCalendar,
    LuChevronDown,
    LuUser,
    LuMail,
    LuSmartphone, // 📱 Actualizado
    LuLock,
    LuEye,
    LuEyeOff,
    LuFileDigit,   // 📄 Actualizado
    LuStethoscope, // 🩺 Actualizado
    LuUserMinus,    // 🚫 Para "Prefiero no especificar"
    LuUserRound
} from "react-icons/lu";

import {
    FaMars,
    FaVenus
} from "react-icons/fa";

// ⚡ ESTILOS ESTÁTICOS FUERA DEL COMPONENTE (Optimiza los recursos del navegador)
const inputWrap = (error = false): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 8,
    border: `1px solid ${error ? "#ef4444" : "#d1d5db"}`,
    borderRadius: 12, padding: "10px 14px", background: "white",
});

const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.75rem", fontWeight: 600,
    color: "#4b5563", marginBottom: 6, textTransform: "uppercase",
    letterSpacing: "0.07em",
};

const inputStyle: React.CSSProperties = {
    flex: 1, background: "transparent", border: "none",
    outline: "none", fontSize: "0.9rem", color: "#111827",
};

// 🎛️ COMPONENTE DROPDOWN 100% PERSONALIZADO (Z-Index corregido y opaco)
function CustomDropdown({ value, placeholder, options, onSelect, isMonth = false, searchable = false }: {
    value: string;
    placeholder: string;
    options: any[];
    onSelect: (val: string) => void;
    isMonth?: boolean;
    searchable?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(target) &&
                menuRef.current &&
                !menuRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        function updatePos() {
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setMenuPos({
                    top: rect.bottom + 6,
                    left: rect.left,
                    width: rect.width,
                });
            }
        }
        window.addEventListener("scroll", updatePos, true);
        return () => window.removeEventListener("scroll", updatePos, true);
    }, [isOpen]);

    function handleOpen() {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + 6,
                left: rect.left,
                width: rect.width,
            });
        }
        setIsOpen(!isOpen);
    }

    const getDisplayLabel = () => {
        if (!value) return placeholder;
        if (isMonth) {
            const found = options.find(o => o.v === value);
            return found ? found.n : placeholder;
        }
        return value;
    };

    return (
        <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
            <button
                ref={buttonRef}
                type="button"
                onClick={handleOpen}
                style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    border: `1px solid ${isOpen ? "#4a8a85" : "#d1d5db"}`,
                    boxShadow: isOpen ? "0 0 0 3px rgba(74,138,133,0.15)" : "none",
                    borderRadius: 12, padding: "11px 14px", background: "#ffffff",
                    width: "100%", cursor: "pointer", transition: "all 0.2s ease", outline: "none"
                }}
            >
                <span style={{ fontSize: "0.9rem", color: value ? "#111827" : "#9ca3af", fontFamily: "'Poppins', sans-serif" }}>
                    {getDisplayLabel()}
                </span>
                <LuChevronDown
                    size={15}
                    color={value ? "#2d6560" : "#9ca3af"}
                    style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease", flexShrink: 0 }}
                />
            </button>
            {isOpen && typeof window !== "undefined" && createPortal(
                <div
                    ref={menuRef}
                    className="custom-scroll"
                    style={{
                        position: "fixed",
                        top: menuPos.top,
                        left: menuPos.left,
                        width: menuPos.width,
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "14px",
                        boxShadow: "0 12px 30px -4px rgba(0,0,0,0.15), 0 4px 12px -2px rgba(0,0,0,0.05)",
                        maxHeight: "200px",
                        overflowY: "auto",
                        zIndex: 99999,
                        padding: "6px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px"
                    }}
                >
                    {searchable && (
                        <div style={{ padding: "4px 6px 8px" }}>
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                                style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", fontSize: "0.85rem", outline: "none", fontFamily: "'Poppins', sans-serif", boxSizing: "border-box" as any }}
                            />
                        </div>
                    )}
                    {options
                        .filter(opt => {
                            if (!searchable || !search) return true;
                            const label = isMonth ? opt.n : opt;
                            return label.toLowerCase().includes(search.toLowerCase());
                        })
                        .map((opt) => {
                            const optionValue = isMonth ? opt.v : opt;
                            const optionLabel = isMonth ? opt.n : opt;
                            const isSelected = value === optionValue;
                            return (
                                <button
                                    key={optionValue}
                                    type="button"
                                    onClick={() => { onSelect(optionValue); setIsOpen(false); setSearch(""); }}
                                    style={{
                                        width: "100%", textAlign: "left", padding: "10px 14px",
                                        borderRadius: "8px", border: "none", fontSize: "0.88rem",
                                        fontFamily: "'Poppins', sans-serif", cursor: "pointer",
                                        backgroundColor: isSelected ? "#f0f9f7" : "transparent",
                                        color: isSelected ? "#2a5f5a" : "#374151",
                                        fontWeight: isSelected ? 600 : 400,
                                        transition: "background-color 0.15s ease",
                                    }}
                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = "#f3f4f6"; }}
                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
                                >
                                    {optionLabel}
                                </button>
                            );
                        })
                    }
                </div>,
                document.body
            )}
        </div>
    );
}
// VISTA PRINCIPAL
export default function SignUp() {
    const {
        tipo, setTipo, name, setName, email, setEmail, sexo, setSexo,
        diaNac, setDiaNac, mesNac, setMesNac, anioNac, setAnioNac, fechaNacimiento,
        password, confirm, setConfirm, pwdError, aceptaTerminos, setAceptaTerminos,
        showTerminos, setShowTerminos, showPassword, setShowPassword, showConfirm, setShowConfirm,
        telefono, setTelefono, especialidad, setEspecialidad, otraDescripcion, setOtraDescripcion,
        otraEspecialidad, setOtraEspecialidad, mostrarDescripcion, setMostrarDescripcion,
        gradoEstudios, setGradoEstudios, consultorio, setConsultorio, cedulaFileName,
        especialidades, cargandoEspecialidades, error, setError, loading, enviado, modoGoogle, strength,
        handlePasswordChange, handleGoogle, handleCedulaFile, handleRegister, calcularEdad
    } = useSignup();

    if (enviado) {
        return (
            <VerificandoCorreo
                email={email} auth={auth} router={null} setError={setError} error={error}
                tipo={tipo} name={name} sexo={sexo} fechaNacimiento={fechaNacimiento}
                telefono={telefono} especialidad={especialidad} otraEspecialidad={otraEspecialidad}
                otraDescripcion={otraDescripcion} gradoEstudios={gradoEstudios} consultorio={consultorio}
                cedulaFile={null} db={db} calcularEdad={calcularEdad}
            />
        );
    }

    return (
        <div className="relative min-h-screen" style={{ background: "linear-gradient(to bottom, #5f817d, #0f1e33)" }}>

            {showTerminos && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowTerminos(false)}>
                    <div style={{ background: "white", borderRadius: 20, padding: "32px", maxWidth: 520, width: "100%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "#1a2e2c", margin: "0 0 16px" }}>Términos y Condiciones</h2>
                        <div style={{ fontSize: "0.88rem", color: "#4b5563", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 12 }}>
                            <p><strong style={{ color: "#2a5f5a" }}>1. Uso de la plataforma</strong><br />Al registrarte en Mente en Calma, aceptas utilizar la plataforma exclusivamente para fines relacionados con la salud mental y el bienestar.</p>
                            <p><strong style={{ color: "#2a5f5a" }}>2. Privacidad y datos</strong><br />Tu información personal será tratada con estricta confidencialidad conforme a las leyes de protección de datos vigentes.</p>
                            <p><strong style={{ color: "#2a5f5a" }}>3. Responsabilidad profesional</strong><br />{tipo === "doctor" ? "Como profesional, eres responsable de la veracidad de tu cédula y datos profesionales proporcionados." : "Como paciente, la información que compartas con tu psicólogo será confidencial."}</p>
                            <p><strong style={{ color: "#2a5f5a" }}>4. Citas y cancelaciones</strong><br />Las citas deben cancelarse con al menos 24 horas de anticipación. El incumplimiento reiterado puede resultar en la suspensión de la cuenta.</p>
                            <p><strong style={{ color: "#2a5f5a" }}>5. Modificaciones</strong><br />Mente en Calma se reserva el derecho de modificar estos términos con previo aviso a los usuarios registrados.</p></div>
                        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                            <button onClick={() => { setAceptaTerminos(true); setShowTerminos(false); }} style={{ flex: 1, background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", border: "none", borderRadius: 12, padding: "11px", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>Aceptar y cerrar</button>
                            <button onClick={() => setShowTerminos(false)} style={{ flex: 1, background: "white", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: 12, padding: "11px", fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: "0.9rem", cursor: "pointer" }}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            <header style={{ position: "absolute", top: 0, width: "100%", padding: "20px 40px" }}>
                <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <a href="/" style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: "1.1rem", color: "white", textDecoration: "none" }}>
                        <img src="https://static.vecteezy.com/system/resources/thumbnails/011/653/087/small_2x/psychology-3d-render-icon-illustration-png.png" alt="Logo" style={{ height: 40, width: "auto" }} />
                        <span>Mente en Calma</span>
                    </a>
                </nav>
            </header>

            <div className="flex items-center justify-center min-h-screen px-4 pt-24 pb-8">
                <div className="anim-card-wrapper w-full max-w-4xl rounded-3xl shadow-2xl overflow-visible flex min-h-[540px]">

                    <div className="hidden md:flex md:w-2/5 relative flex-col justify-end p-8" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(74,138,133,0.35) 0%, rgba(15,42,40,0.88) 100%)" }} />
                        <div style={{ position: "relative", zIndex: 10 }}>
                            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1.6rem", color: "white" }}>{tipo === "paciente" ? "Empieza tu camino hoy" : "Únete como profesional"}</h2>
                            <p style={{ marginTop: 10, fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>{tipo === "paciente" ? "Únete a nuestra plataforma para acceder a servicios de salud mental de calidad." : "Forma parte de nuestra red de psicólogos certificados."}</p>
                        </div>
                    </div>

                    <div className="anim-card flex-1 flex flex-col justify-center px-8 py-10" style={{ background: "white", overflowY: "auto", overflowX: "visible" }}>
                        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.7rem", color: "#1a2e2c", margin: 0 }}>Crear cuenta</h1>
                        <p style={{ marginTop: 4, fontSize: "0.9rem", color: "#6b7280", marginBottom: 20 }}>Completa tus datos para comenzar.</p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 24 }}>
                            {(["paciente", "doctor"] as const).map(t => (
                                <button key={t} type="button" onClick={() => { setTipo(t); setError(""); }} style={{ padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.88rem", background: tipo === t ? "white" : "transparent", color: tipo === t ? "#2a5f5a" : "#9ca3af", boxShadow: tipo === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.25s ease" }}>
                                    {t === "paciente" ? <LuUser size={16} /> : <LuStethoscope size={16} />}
                                    {t === "paciente" ? "Soy Paciente" : "Soy Doctor"}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {/* 👤 Nombre Completo con icono LuUser */}
                            <div className="anim-field">
                                <label style={labelStyle}>Nombre completo</label>
                                <div className="input-wrap" style={inputWrap()}>
                                    <LuUser size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
                                    <input type="text" placeholder={tipo === "doctor" ? "Ej. Dra. María López" : "Ej. Juan Pérez"} value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                                </div>
                            </div>

                            {/* ✉️ Correo con icono LuMail */}
                            {!modoGoogle && (
                                <div className="anim-field">
                                    <label style={labelStyle}>Correo electrónico</label>
                                    <div className="input-wrap" style={inputWrap()}>
                                        <LuMail size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
                                        <input type="email" placeholder="ejemplo@correo.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                                    </div>
                                </div>
                            )}

                            {/* 📊 Bloque Sexo Único Restructurado y Ajustado */}
                            <div className="anim-field">
                                <label style={labelStyle}>Sexo</label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                    {(["M", "F", "N/A"] as const).map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setSexo(s)}
                                            style={{
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                                padding: "10px 4px", borderRadius: 12,
                                                border: `2px solid ${sexo === s ? "#4a8a85" : "#d1d5db"}`,
                                                background: sexo === s ? "#f0f9f7" : "white",
                                                color: sexo === s ? "#2a5f5a" : "#6b7280",
                                                fontWeight: sexo === s ? 600 : 400, fontSize: "0.85rem",
                                                cursor: "pointer", fontFamily: "'Poppins', sans-serif", transition: "all 0.2s ease"
                                            }}
                                        >
                                            {s === "M" && <FaMars size={15} color={sexo === "M" ? "#2a5f5a" : "#9ca3af"} />}
                                            {s === "F" && <FaVenus size={15} color={sexo === "F" ? "#2a5f5a" : "#9ca3af"} />}
                                            {s === "N/A" && <LuUserRound size={15} color={sexo === "N/A" ? "#2a5f5a" : "#9ca3af"} />}

                                            {s === "M" ? "Masculino" : s === "F" ? "Femenino" : "No especificar"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── 📅 SECCIÓN MODULAR DE FECHA DE NACIMIENTO RESTAURADA ── */}
                            {/* ── 📅 SECCIÓN MODULAR DE FECHA DE NACIMIENTO CORREGIDA (CAPAS POR ENCIMA DE TODO) ── */}
                            {tipo === "paciente" && (
                                <div className="anim-field">
                                    <label style={labelStyle}>Fecha de nacimiento</label>

                                    {/* 💡 Agregamos un zIndex dinámico al contenedor principal: si hay algún dato o interacción, 
           forzamos a que toda la sección se posicione por encima del campo de teléfono */}
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        position: "relative",
                                        zIndex: 100
                                    }}>
                                        <LuCalendar size={16} color="#9ca3af" style={{ flexShrink: 0 }} />

                                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2.5fr 1.3fr", gap: 8, flex: 1 }}>
                                            {/* Día */}
                                            <CustomDropdown
                                                value={diaNac}
                                                placeholder="Día"
                                                options={Array.from({
                                                    length: mesNac && anioNac
                                                        ? new Date(Number(anioNac), Number(mesNac), 0).getDate()
                                                        : 31
                                                }, (_, i) => String(i + 1).padStart(2, '0'))}
                                                onSelect={(val) => setDiaNac(val)}
                                            />

                                            <CustomDropdown
                                                value={mesNac}
                                                placeholder="Mes"
                                                options={[
                                                    { v: "01", n: "Enero" }, { v: "02", n: "Febrero" }, { v: "03", n: "Marzo" },
                                                    { v: "04", n: "Abril" }, { v: "05", n: "Mayo" }, { v: "06", n: "Junio" },
                                                    { v: "07", n: "Julio" }, { v: "08", n: "Agosto" }, { v: "09", n: "Septiembre" },
                                                    { v: "10", n: "Octubre" }, { v: "11", n: "Noviembre" }, { v: "12", n: "Diciembre" }
                                                ]}
                                                onSelect={(val) => setMesNac(val)}
                                                isMonth={true}
                                                searchable={true}
                                            />

                                            <CustomDropdown
                                                value={anioNac}
                                                placeholder="Año"
                                                options={(() => {
                                                    const anioActual = new Date().getFullYear();
                                                    const maxPermitido = anioActual - 18;
                                                    const minPermitido = anioActual - 120;
                                                    const lista = [];
                                                    for (let a = maxPermitido; a >= minPermitido; a--) lista.push(String(a));
                                                    return lista;
                                                })()}
                                                onSelect={(val) => setAnioNac(val)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 📱 Teléfono con icono LuSmartphone de Lucide */}
                            <div className="anim-field">
                                <label style={labelStyle}>Teléfono</label>
                                <div className="input-wrap" style={inputWrap()}>
                                    <LuSmartphone size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: "0.9rem", color: "#6b7280", fontWeight: 500, paddingRight: 6, borderRight: "1px solid #e5e7eb", marginRight: 6, whiteSpace: "nowrap" }}>🇲🇽 +52</span>
                                    <input
                                        type="number"
                                        placeholder="5512345678"
                                        value={telefono}
                                        onChange={e => setTelefono(e.target.value === "" ? "" : Number(e.target.value))}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {tipo === "doctor" && (
                                <>
                                    {/* Grado de Estudios — PRIMERO */}
                                    <div className="anim-field">
                                        <label style={labelStyle}>Grado de estudios</label>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                            {(["Carrera", "Maestría", "Doctorado"] as const).map(grado => (
                                                <button key={grado} type="button" onClick={() => setGradoEstudios(grado)}
                                                    style={{ padding: "10px 8px", borderRadius: 12, border: `2px solid ${gradoEstudios === grado ? "#4a8a85" : "#d1d5db"}`, background: gradoEstudios === grado ? "#f0f9f7" : "white", color: gradoEstudios === grado ? "#2a5f5a" : "#6b7280", cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s ease", fontFamily: "'Poppins', sans-serif" }}>
                                                    {grado}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {gradoEstudios && (
                                        <>
                                            {/* Especialidad */}
                                            <div className="anim-field">
                                                <label style={labelStyle}>Especialidad</label>
                                                <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
                                                    <div className="input-wrap" style={{ ...inputWrap(), width: "100%", paddingRight: "34px" }}>
                                                        <LuStethoscope size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
                                                        {cargandoEspecialidades ? (
                                                            <div style={{ flex: 1, padding: "2px 0", color: "#9ca3af", fontSize: "0.9rem", fontFamily: "'Poppins', sans-serif" }}>
                                                                Cargando especialidades...
                                                            </div>
                                                        ) : (
                                                            <select
                                                                value={especialidad}
                                                                onChange={e => { setEspecialidad(e.target.value); setMostrarDescripcion(false); setOtraEspecialidad(""); setOtraDescripcion(""); }}
                                                                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.9rem", color: "#111827", fontFamily: "'Poppins', sans-serif", appearance: "none", WebkitAppearance: "none", MozAppearance: "none", cursor: "pointer" }}
                                                            >
                                                                <option value="">Selecciona especialidad...</option>
                                                                {especialidades.map(e => <option key={e} value={e}>{e}</option>)}
                                                                <option value="otra">Otra especialidad...</option>
                                                            </select>
                                                        )}
                                                    </div>
                                                    <LuChevronDown size={16} color="#9ca3af" style={{ position: "absolute", right: 14, pointerEvents: "none" }} />
                                                </div>
                                                {especialidad === "otra" && (
                                                    <input type="text" placeholder="Escribe tu especialidad" value={otraEspecialidad} onChange={e => { setOtraEspecialidad(e.target.value); setMostrarDescripcion(e.target.value.trim().length > 2); }} style={{ ...inputStyle, border: "1px solid #d1d5db", borderRadius: 12, padding: 10, marginTop: 10, width: "100%" }} />
                                                )}
                                                {mostrarDescripcion && (
                                                    <textarea placeholder="Breve descripción..." value={otraDescripcion} onChange={e => setOtraDescripcion(e.target.value)} style={{ ...inputStyle, border: "1px solid #d1d5db", borderRadius: 12, padding: 10, marginTop: 8, width: "100%", minHeight: 72 }} />
                                                )}
                                            </div>

                                            {/* Consultorio */}
                                            <div className="anim-field">
                                                <label style={labelStyle}>Consultorio</label>
                                                <div className="input-wrap" style={inputWrap()}>
                                                    <input type="text" placeholder="Dirección de atención" value={consultorio} onChange={e => setConsultorio(e.target.value)} style={inputStyle} />
                                                </div>
                                            </div>

                                            {/* Cédula */}
                                            <div className="anim-field">
                                                <label style={labelStyle}>Cédula profesional</label>
                                                <label style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid #d1d5db", borderRadius: 12, padding: 12, cursor: "pointer", background: "white" }}>
                                                    <LuFileDigit size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
                                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={handleCedulaFile} />
                                                    <span style={{ fontSize: "0.9rem", color: "#4b5563" }}>{cedulaFileName || "Subir archivo (PDF, JPG, PNG)"}</span>
                                                </label>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {/* 🔒 Campos de Contraseña con icono LuLock y ojo Lucide */}
                            {!modoGoogle && (
                                <>
                                    <div className="anim-field">
                                        <label style={labelStyle}>Contraseña</label>
                                        <div className="input-wrap" style={inputWrap(!!pwdError)}>
                                            <LuLock size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
                                            <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={handlePasswordChange} style={inputStyle} />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: "none", border: "none", display: "flex", alignItems: "center", cursor: "pointer" }}>
                                                {showPassword ? <LuEyeOff size={16} color="#9ca3af" /> : <LuEye size={16} color="#9ca3af" />}
                                            </button>
                                        </div>
                                        {password.length > 0 && (
                                            <>
                                                <div style={{ height: 4, background: "#e5e7eb", borderRadius: 4, marginTop: 8, overflow: "hidden" }}>
                                                    <div style={{ height: "100%", width: strength.width, background: strength.color, borderRadius: 4, transition: "width 0.3s ease" }} />
                                                </div>
                                                <p style={{ color: strength.color, fontSize: "0.75rem", margin: "4px 0 0" }}>{strength.label}</p>
                                            </>
                                        )}
                                    </div>

                                    <div className="anim-field">
                                        <label style={labelStyle}>Confirmar contraseña</label>
                                        <div className="input-wrap" style={inputWrap()}>
                                            <LuLock size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
                                            <input type={showConfirm ? "text" : "password"} placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} />
                                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ background: "none", border: "none", display: "flex", alignItems: "center", cursor: "pointer" }}>
                                                {showConfirm ? <LuEyeOff size={16} color="#9ca3af" /> : <LuEye size={16} color="#9ca3af" />}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="anim-field">
                                <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: "0.85rem", color: "#6b7280" }}>
                                    <input type="checkbox" checked={aceptaTerminos} onChange={e => setAceptaTerminos(e.target.checked)} style={{ accentColor: "#4a8a85", marginTop: 3 }} />
                                    <span>Acepto los <button type="button" onClick={() => setShowTerminos(true)} style={{ color: "#2a5f5a", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>Términos y Condiciones</button></span>
                                </label>
                            </div>

                            {error && (
                                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 12px" }}>
                                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#dc2626" }}>{error}</p>
                                </div>
                            )}

                            <button type="button" onClick={handleRegister} disabled={loading} className="btn-primary" style={{ width: "100%", background: loading ? "#9ca3af" : "linear-gradient(135deg, #6b9e9a, #2d6560)", border: "none", borderRadius: 12, padding: "12px", color: "white", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                                {loading ? "Procesando..." : tipo === "paciente" ? "Crear Cuenta" : "Registrarme como Doctor"}
                            </button>

                            <Link href="/login" className="btn-secondary" style={{ textAlign: "center", fontSize: "0.88rem", color: "#374151", textDecoration: "none", display: "block", width: "100%", border: "1px solid #d1d5db", borderRadius: 12, padding: 12 }}>
                                ¿Ya tienes cuenta? Inicia sesión
                            </Link>

                            {!modoGoogle && (
                                <>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
                                        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                                        <span style={{ fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.12em" }}>O continuar con</span>
                                        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                                    </div>
                                    <button type="button" onClick={handleGoogle} disabled={loading} className="btn-social"
                                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px", fontSize: "0.88rem", color: "#374151", background: "white", cursor: "pointer" }}>
                                        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="currentColor">
                                            <path d="M21.35 11.1h-9.18v2.98h5.27a4.52 4.52 0 0 1-1.95 2.96 6.06 6.06 0 0 1-3.32.9A6.25 6.25 0 0 1 5.9 11.82a6.25 6.25 0 0 1 6.27-6.25c1.46 0 2.78.5 3.81 1.49l2.09-2.09A9.3 9.3 0 0 0 12.17 2 9.1 9.1 0 0 0 5.7 4.7 9.25 9.25 0 0 0 3 11.82a9.25 9.25 0 0 0 2.7 7.12A9.1 9.1 0 0 0 12.17 22a8.9 8.9 0 0 0 6.08-2.37 6.25 6.25 0 0 0 2.1-4.81c0-.68-.05-1.28-.31-1.72Z" />
                                        </svg>
                                        Continuar con Google
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}