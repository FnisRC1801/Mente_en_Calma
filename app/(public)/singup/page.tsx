// app/(public)/singup/page.tsx
"use client";

import Link from "next/link";
import { auth, db } from "@/lib/firebase-client";
import VerificandoCorreo from "./VerificandoCorreo";
import { useSignup } from "./useSignup"; // 👈 Importamos la lógica pura

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

export default function SignUp() {
    // 🎛️ Extraemos todo lo que el diseño necesita de forma limpia
    const {
        tipo, setTipo, name, setName, email, setEmail, sexo, setSexo,
        fechaNacimiento, setFechaNacimiento, password, confirm, setConfirm,
        pwdError, aceptaTerminos, setAceptaTerminos, showTerminos, setShowTerminos,
        showPassword, setShowPassword, showConfirm, setShowConfirm, telefono, setTelefono,
        especialidad, setEspecialidad, otraDescripcion, setOtraDescripcion, otraEspecialidad, setOtraEspecialidad,
        mostrarDescripcion, setMostrarDescripcion, // 👈 AGREGA ESTA LÍNEA AQUÍ
        gradoEstudios, setGradoEstudios, consultorio, setConsultorio,
        cedulaFileName, especialidades, error, setError, loading, enviado, modoGoogle, strength,
        fechaMaximaPermitida, handlePasswordChange, handleGoogle, handleCedulaFile, handleRegister, calcularEdad
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
                            <p><strong style={{ color: "#2a5f5a" }}>1. Uso de la plataforma</strong><br />Al registrarte en Mente en Calma, aceptas utilizar la plataforma exclusivamente para fines relacionados con la salud mental.</p>
                            <p><strong style={{ color: "#2a5f5a" }}>2. Privacidad y datos</strong><br />Tu información será tratada con estricta confidencialidad conforme a la ley.</p>
                        </div>
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
                <div className="anim-card-wrapper w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex min-h-[540px]">

                    <div className="hidden md:flex md:w-2/5 relative flex-col justify-end p-8" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(74,138,133,0.35) 0%, rgba(15,42,40,0.88) 100%)" }} />
                        <div style={{ position: "relative", zIndex: 10 }}>
                            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1.6rem", color: "white" }}>{tipo === "paciente" ? "Empieza tu camino hoy" : "Únete como profesional"}</h2>
                            <p style={{ marginTop: 10, fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>{tipo === "paciente" ? "Únete a nuestra plataforma para acceder a servicios de salud mental de calidad." : "Forma parte de nuestra red de psicólogos certificados."}</p>
                        </div>
                    </div>

                    <div className="anim-card flex-1 flex flex-col justify-center px-8 py-10" style={{ background: "white", overflowY: "auto" }}>
                        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.7rem", color: "#1a2e2c", margin: 0 }}>Crear cuenta</h1>
                        <p style={{ marginTop: 4, fontSize: "0.9rem", color: "#6b7280", marginBottom: 20 }}>Completa tus datos para comenzar.</p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 24 }}>
                            {(["paciente", "doctor"] as const).map(t => (
                                <button key={t} type="button" onClick={() => { setTipo(t); setError(""); }} style={{ padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.88rem", background: tipo === t ? "white" : "transparent", color: tipo === t ? "#2a5f5a" : "#9ca3af", boxShadow: tipo === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                    {tipo === t ? "✓ " : ""}{t === "paciente" ? "Soy Paciente" : "Soy Doctor"}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div className="anim-field">
                                <label style={labelStyle}>Nombre completo</label>
                                <div className="input-wrap" style={inputWrap()}>
                                    <input type="text" placeholder={tipo === "doctor" ? "Ej. Dra. María López" : "Ej. Juan Pérez"} value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                                </div>
                            </div>

                            {!modoGoogle && (
                                <div className="anim-field">
                                    <label style={labelStyle}>Correo electrónico</label>
                                    <div className="input-wrap" style={inputWrap()}>
                                        <input type="email" placeholder="ejemplo@correo.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                                    </div>
                                </div>
                            )}

                            <div className="anim-field">
                                <label style={labelStyle}>Sexo</label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                    {(["M", "F", "Otro"] as const).map(s => (
                                        <button key={s} type="button" onClick={() => setSexo(s)} style={{ padding: "10px 8px", borderRadius: 12, border: `2px solid ${sexo === s ? "#4a8a85" : "#d1d5db"}`, background: sexo === s ? "#f0f9f7" : "white", color: sexo === s ? "#2a5f5a" : "#6b7280", fontWeight: sexo === s ? 600 : 400, fontSize: "0.88rem", cursor: "pointer", fontFamily: "'Poppins', sans-serif" }}>
                                            {s === "M" ? "Masculino" : s === "F" ? "Femenino" : "Otro"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {tipo === "paciente" && (
                                <div className="anim-field">
                                    <label style={labelStyle}>Fecha de nacimiento</label>
                                    <div className="input-wrap" style={inputWrap()}>
                                        <input type="date" max={fechaMaximaPermitida} value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} style={inputStyle} />
                                    </div>
                                </div>
                            )}

                            <div className="anim-field">
                                <label style={labelStyle}>Teléfono</label>
                                <div className="input-wrap" style={inputWrap()}>
                                    <input type="number" placeholder="5512345678" value={telefono} onChange={e => setTelefono(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} />
                                </div>
                            </div>

                            {tipo === "doctor" && (
                                <>
                                    <div className="anim-field">
                                        <label style={labelStyle}>Especialidad</label>
                                        <select value={especialidad} onChange={e => { setEspecialidad(e.target.value); setMostrarDescripcion(false); setOtraEspecialidad(""); setOtraDescripcion(""); }} style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #d1d5db" }}>
                                            {especialidades.map(e => <option key={e} value={e}>{e}</option>)}
                                            <option value="otra">Otra especialidad...</option>
                                        </select>
                                        {especialidad === "otra" && (
                                            <input type="text" placeholder="Escribe tu especialidad" value={otraEspecialidad} onChange={e => { setOtraEspecialidad(e.target.value); setMostrarDescripcion(e.target.value.trim().length > 2); }} style={{ ...inputStyle, border: "1px solid #d1d5db", borderRadius: 12, padding: 10, marginTop: 10, width: "100%" }} />
                                        )}
                                        {mostrarDescripcion && (
                                            <textarea placeholder="Breve descripción..." value={otraDescripcion} onChange={e => setOtraDescripcion(e.target.value)} style={{ ...inputStyle, border: "1px solid #d1d5db", borderRadius: 12, padding: 10, marginTop: 8, width: "100%", minHeight: 72 }} />
                                        )}
                                    </div>

                                    <div className="anim-field">
                                        <label style={labelStyle}>Grado de estudios</label>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                            {(["Carrera", "Maestría", "Doctorado"] as const).map(grado => (
                                                <button key={grado} type="button" onClick={() => setGradoEstudios(grado)} style={{ padding: "10px 8px", borderRadius: 12, border: `2px solid ${gradoEstudios === grado ? "#4a8a85" : "#d1d5db"}`, background: gradoEstudios === grado ? "#f0f9f7" : "white", color: gradoEstudios === grado ? "#2a5f5a" : "#6b7280", cursor: "pointer", fontSize: "0.85rem" }}>{grado}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="anim-field">
                                        <label style={labelStyle}>Consultorio</label>
                                        <div className="input-wrap" style={inputWrap()}>
                                            <input type="text" placeholder="Dirección de atención" value={consultorio} onChange={e => setConsultorio(e.target.value)} style={inputStyle} />
                                        </div>
                                    </div>

                                    <div className="anim-field">
                                        <label style={labelStyle}>Cédula profesional</label>
                                        <label style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid #d1d5db", borderRadius: 12, padding: 12, cursor: "pointer" }}>
                                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={handleCedulaFile} />
                                            <span>{cedulaFileName || "Subir archivo (PDF, JPG, PNG)"}</span>
                                        </label>
                                    </div>
                                </>
                            )}

                            {!modoGoogle && (
                                <>
                                    <div className="anim-field">
                                        <label style={labelStyle}>Contraseña</label>
                                        <div className="input-wrap" style={inputWrap(!!pwdError)}>
                                            <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={handlePasswordChange} style={inputStyle} />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: "none", border: "none" }}>{showPassword ? "🙈" : "👁️"}</button>
                                        </div>
                                        {password.length > 0 && <p style={{ color: strength.color, fontSize: "0.8rem", margin: "4px 0 0" }}>{strength.label}</p>}
                                    </div>

                                    <div className="anim-field">
                                        <label style={labelStyle}>Confirmar contraseña</label>
                                        <div className="input-wrap" style={inputWrap()}>
                                            <input type={showConfirm ? "text" : "password"} placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} />
                                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ background: "none", border: "none" }}>{showConfirm ? "🙈" : "👁️"}</button>
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

                            <button type="button" onClick={handleRegister} disabled={loading} style={{ width: "100%", background: loading ? "#9ca3af" : "linear-gradient(135deg, #6b9e9a, #2d6560)", border: "none", borderRadius: 12, padding: "12px", color: "white", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                                {loading ? "Procesando..." : tipo === "paciente" ? "Crear Cuenta" : "Registrarme como Doctor"}
                            </button>

                            <Link href="/login" style={{ textAlign: "center", fontSize: "0.88rem", color: "#374151", textDecoration: "none", display: "block", width: "100%", border: "1px solid #d1d5db", borderRadius: 12, padding: 12 }}>
                                ¿Ya tienes cuenta? Inicia sesión
                            </Link>

                            {!modoGoogle && (
                                <button type="button" onClick={handleGoogle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px", fontSize: "0.88rem", color: "#374151", background: "white", cursor: "pointer" }}>
                                    Continuar con Google
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}