"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from "firebase/auth";
import { auth, db } from "@/lib/firebase-client";
import { collection, addDoc, getDocs, doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { LuUser, LuStethoscope, LuEye, LuEyeOff, LuMail } from "react-icons/lu";
import { FaMars, FaVenus } from "react-icons/fa6";


function getStrength(pwd: string) {
    const score = [
        (pwd.match(/[a-zA-Z]/g) || []).length >= 5,
        /\d/.test(pwd),
        /[^a-zA-Z0-9]/.test(pwd),
        pwd.length >= 10,
    ].filter(Boolean).length;
    return [
        { label: "", color: "#e5e7eb", width: "0%" },
        { label: "Muy débil", color: "#ef4444", width: "25%" },
        { label: "Débil", color: "#f97316", width: "50%" },
        { label: "Buena", color: "#eab308", width: "75%" },
        { label: "Fuerte", color: "#22c55e", width: "100%" },
    ][score];
}

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

function VerificandoCorreo({ email, auth, router, setError, error, tipo, name, sexo, fechaNacimiento, telefono, especialidad, otraEspecialidad, otraDescripcion, gradoEstudios, consultorio, cedulaFile, db, calcularEdad }: any) {
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user: any) => {
            if (user) {
                const intervalo = setInterval(async () => {
                    try {
                        await user.reload();

                        if (user.emailVerified) {
                            clearInterval(intervalo);
                            const now = Timestamp.now();
                            const especialidadFinal = especialidad === "otra" ? otraEspecialidad.trim() : especialidad;

                            if (tipo === "paciente") {
                                await setDoc(doc(db, "pacientes", user.uid), {
                                    nombre: name.trim(),
                                    email: email.trim(),
                                    sexo,
                                    fechaNacimiento,
                                    edad: calcularEdad(fechaNacimiento),
                                    telefono: Number(telefono),
                                    role: "paciente",
                                    emailVerificado: true,
                                    createdAt: now,
                                    updatedAt: now,
                                });
                            } else {
                                if (especialidad === "otra" && otraEspecialidad.trim()) {
                                    await addDoc(collection(db, "especialidades"), {
                                        nombre: otraEspecialidad.trim(),
                                        descripcion: otraDescripcion.trim(),
                                        createdAt: now,
                                    });
                                }
                                const cedulaFormData = new FormData();
                                cedulaFormData.append("file", cedulaFile);
                                cedulaFormData.append("tipo", "cedula");
                                const cedulaRes = await fetch("/api/upload", {
                                    method: "POST",
                                    body: cedulaFormData,
                                });
                                const cedulaData = await cedulaRes.json();
                                const cedulaUrl = cedulaData.data.url;

                                await setDoc(doc(db, "doctores", user.uid), {
                                    nombre: name.trim(),
                                    email: email.trim(),
                                    sexo,
                                    telefono: Number(telefono),
                                    especialidad: especialidadFinal,
                                    gradoEstudios,
                                    consultorio: consultorio.trim(),
                                    cedulaUrl,
                                    cedulaArchivoNombre: cedulaFile.name,
                                    cedulaArchivoTipo: cedulaFile.type,
                                    role: "psicologo",
                                    activo: true,
                                    emailVerificado: true,
                                    createdAt: now,
                                    updatedAt: now,
                                });
                            }

                            const token = await user.getIdToken();
                            await fetch("/api/session", {
                                method: "POST",
                                body: JSON.stringify({ token }),
                                headers: { "Content-Type": "application/json" },
                            });

                            const roleRes = await fetch("/api/auth/verify-role");
                            const { role } = await roleRes.json();
                            if (role === "psicologo") router.push("/dashboard-psico");
                            else router.push("/dashboard");
                        }
                    } catch (e: any) {
                        setError(e.message ?? "Error al guardar datos.");
                    }
                }, 3000);

                return () => clearInterval(intervalo);
            }
        });

        return () => unsubscribe();
    }, [auth, router, db, tipo, name, email, sexo, fechaNacimiento, telefono, especialidad, otraEspecialidad, otraDescripcion, gradoEstudios, consultorio, cedulaFile]);

    return (
        <div className="relative min-h-screen" style={{ background: "linear-gradient(to bottom, #5f817d, #0f1e33)" }}>
            <div className="flex items-center justify-center min-h-screen px-4">
                <div style={{ background: "white", borderRadius: 24, padding: "48px 40px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0f9f7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                        <LuMail size={28} color="#4a8a85" />
                    </div>
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#1a2e2c", margin: "0 0 12px" }}>
                        ¡Verifica tu correo!
                    </h2>
                    <p style={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.6, margin: "0 0 8px" }}>
                        Te enviamos un correo de verificación a:
                    </p>
                    <p style={{ fontSize: "0.95rem", color: "#2a5f5a", fontWeight: 600, margin: "0 0 16px" }}>
                        {email}
                    </p>
                    <p style={{ fontSize: "0.85rem", color: "#9ca3af", lineHeight: 1.5, margin: "0 0 16px" }}>
                        Una vez que verifiques tu correo serás redirigido automáticamente al Inicio.
                    </p>

                    {/* Corregido a justifyContent en esta línea */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#4a8a85", fontSize: "0.85rem", margin: "0 0 20px" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4a8a85" }} />
                        Esperando verificación...
                    </div>

                    {/* Nota de Spam al final con coordenadas equilibradas */}
                    <p style={{ fontSize: "0.78rem", color: "#9ca3af", lineHeight: 1.4, margin: "0 0 12px", fontStyle: "italic" }}>
                        (Si no ves el correo, revisa tu carpeta de spam)
                    </p>
                    {error && (
                        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 12px", marginTop: 16 }}>
                            <p style={{ margin: 0, fontSize: "0.82rem", color: "#dc2626" }}>{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SignUp() {
    const router = useRouter();
    const [tipo, setTipo] = useState<"paciente" | "doctor">("paciente");

    // Campos comunes
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [sexo, setSexo] = useState<"M" | "F" | "Otro" | "">("");
    const [fechaNacimiento, setFechaNacimiento] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [pwdError, setPwdError] = useState("");
    const [aceptaTerminos, setAceptaTerminos] = useState(false);
    const [showTerminos, setShowTerminos] = useState(false);

    // Visibilidad de las contraseñas
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);


    // Campos doctor
    const [telefono, setTelefono] = useState<number | "">("");

    const [especialidad, setEspecialidad] = useState("");
    const [otraDescripcion, setOtraDescripcion] = useState("");
    const [otraEspecialidad, setOtraEspecialidad] = useState("");
    const [mostrarDescripcion, setMostrarDescripcion] = useState(false);
    const [gradoEstudios, setGradoEstudios] = useState("");
    const [consultorio, setConsultorio] = useState("");
    const [cedulaFile, setCedulaFile] = useState<File | null>(null);
    const [cedulaFileName, setCedulaFileName] = useState("");
    const [especialidades, setEspecialidades] = useState<string[]>([]);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [googleUser, setGoogleUser] = useState<any>(null);
    const [modoGoogle, setModoGoogle] = useState(false);

    const strength = getStrength(password);

    useEffect(() => {
        async function cargarEspecialidades() {
            try {
                const snap = await getDocs(collection(db, "especialidades"));
                const lista = snap.docs.map(d => (d.data() as any).nombre as string);
                setEspecialidades(lista.sort());
            } catch {
                setEspecialidades([]);
            }
        }
        cargarEspecialidades();
    }, []);

    function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setPassword(val);
        const letters = (val.match(/[a-zA-Z]/g) || []).length;
        const numbers = (val.match(/\d/g) || []).length;
        setPwdError(letters < 5 || numbers < 1 ? "Mínimo 5 letras y 1 número" : "");
    }

    function calcularEdad(fechaNac: string): number {
        const hoy = new Date();
        const nacimiento = new Date(fechaNac);
        let edadCalculada = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edadCalculada--;
        }
        return edadCalculada;
    }

    async function handleGoogle() {
        setError(""); setLoading(true);
        try {
            const result = await signInWithPopup(auth, new GoogleAuthProvider());
            const user = result.user;

            // Verificar si ya existe en Firestore
            const docSnap = await getDoc(doc(db, "pacientes", user.uid));
            const docSnapDoctor = await getDoc(doc(db, "doctores", user.uid));

            if (docSnap.exists() || docSnapDoctor.exists()) {
                // Ya existe → login directo
                const token = await user.getIdToken();
                await fetch("/api/session", {
                    method: "POST",
                    body: JSON.stringify({ token }),
                    headers: { "Content-Type": "application/json" },
                });
                const roleRes = await fetch("/api/auth/verify-role");
                const { role } = await roleRes.json();
                if (role === "psicologo") router.push("/dashboard-psico");
                else router.push("/dashboard");
                return;
            }

            // Es nuevo → precargar datos y mostrar formulario
            setGoogleUser(user);
            setName(user.displayName ?? "");
            setEmail(user.email ?? "");
            setModoGoogle(true);

        } catch {
            setError("Error al iniciar con Google.");
        } finally { setLoading(false); }
    }

    function handleCedulaFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError("El archivo no puede superar 5 MB."); return; }
        setCedulaFile(file);
        setCedulaFileName(file.name);
        setError("");
    }

    async function handleRegister() {
        setError("");
        if (!name.trim()) { setError("Ingresa tu nombre completo."); return; }
        if (!email.trim()) { setError("Ingresa tu correo."); return; }
        if (!sexo) { setError("Selecciona tu sexo."); return; }

        if (tipo === "paciente") {
            if (!fechaNacimiento) { setError("Ingresa tu fecha de nacimiento."); return; }
            const edadPaciente = calcularEdad(fechaNacimiento);
            if (edadPaciente < 18) { setError("Debes ser mayor de 18 años para registrarte."); return; }
        }

        if (!modoGoogle && pwdError) { setError(pwdError); return; }
        if (!modoGoogle && !password) { setError("Ingresa una contraseña."); return; }
        if (!modoGoogle && password !== confirm) { setError("Las contraseñas no coinciden."); return; }
        if (!aceptaTerminos) { setError("Acepta los términos y condiciones."); return; }

        if (tipo === "doctor") {
            if (!telefono) { setError("Ingresa tu teléfono."); return; }
            if (!especialidad) { setError("Selecciona tu especialidad."); return; }
            {
                especialidad === "otra" && (
                    <>
                        <div className="input-wrap" style={{ ...inputWrap(), marginTop: 10 }}>
                            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                            <input type="text" placeholder="Nombre de tu especialidad" value={otraEspecialidad} onChange={e => { setOtraEspecialidad(e.target.value); setMostrarDescripcion(e.target.value.trim().length > 2); }} style={inputStyle} />
                        </div>
                        {mostrarDescripcion && (
                            <div className="input-wrap" style={{ ...inputWrap(), marginTop: 8, alignItems: "flex-start" }}>
                                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0, marginTop: 2 }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>
                                <textarea placeholder="Breve descripción de tu especialidad..." value={otraDescripcion} onChange={e => setOtraDescripcion(e.target.value)}
                                    style={{ ...inputStyle, resize: "none", minHeight: 72, paddingTop: 2, lineHeight: 1.5 }} />
                            </div>
                        )}
                    </>
                )
            }
            if (!gradoEstudios) { setError("Selecciona tu grado de estudios."); return; }
            if (!consultorio.trim()) { setError("Ingresa tu consultorio o dirección de atención."); return; }
            if (!cedulaFile) { setError("Adjunta tu cédula profesional."); return; }
        }



        setLoading(true);
        try {
            let uid: string;
            if (modoGoogle && googleUser) {
                uid = googleUser.uid;
            } else {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
                await sendEmailVerification(cred.user);
                uid = cred.user.uid;
            }

            const now = Timestamp.now();
            const especialidadFinal = especialidad === "otra" ? otraEspecialidad.trim() : especialidad;
            if (tipo === "paciente") {
                // ── Colección: pacientes (uid como id del documento) ──
                await setDoc(doc(db, "pacientes", uid), {
                    nombre: name.trim(),
                    email: email.trim(),
                    sexo,
                    fechaNacimiento,
                    edad: calcularEdad(fechaNacimiento),
                    telefono: Number(telefono),
                    role: "paciente",
                    emailVerificado: false,
                    createdAt: now,
                    updatedAt: now,
                });
            } else {
                // Si especialidad nueva → guardar en colección especialidades
                if (especialidad === "otra" && otraEspecialidad.trim()) {
                    await addDoc(collection(db, "especialidades"), {
                        nombre: otraEspecialidad.trim(),
                        descripcion: otraDescripcion.trim(),
                        createdAt: now,
                    });
                }

                // Subir cédula a Cloudinary
                const cedulaFormData = new FormData();
                cedulaFormData.append("file", cedulaFile!);
                cedulaFormData.append("tipo", "cedula");

                const cedulaRes = await fetch("/api/upload", {
                    method: "POST",
                    body: cedulaFormData,
                });
                const cedulaData = await cedulaRes.json();
                if (!cedulaData.ok) throw new Error("Error al subir la cédula.");
                const cedulaUrl = cedulaData.data.url;

                // ── Colección: doctores (uid como id del documento) ──
                await setDoc(doc(db, "doctores", uid), {
                    nombre: name.trim(),
                    email: email.trim(),
                    sexo,
                    telefono: Number(telefono),
                    especialidad: especialidadFinal,
                    gradoEstudios,
                    consultorio: consultorio.trim(),
                    cedulaUrl: cedulaUrl,
                    cedulaArchivoNombre: cedulaFile!.name,
                    cedulaArchivoTipo: cedulaFile!.type,
                    role: "psicologo",
                    activo: true,
                    emailVerificado: false,
                    createdAt: now,
                    updatedAt: now,
                });
            }

            // Crear sesión
            const currentUser = modoGoogle ? googleUser : auth.currentUser;
            const token = await currentUser.getIdToken();
            await fetch("/api/session", {
                method: "POST",
                body: JSON.stringify({ token }),
                headers: { "Content-Type": "application/json" },
            });

            setEnviado(true);

        } catch (e: any) {
            if (e.code === "auth/email-already-in-use") setError("Este correo ya está registrado.");
            else setError(e.message ?? "Error al crear la cuenta.");
        } finally { setLoading(false); }
    }

    // ── Pantalla de éxito doctor ───────────────────────────────────────────────
    if (enviado) {
        return (
            <VerificandoCorreo
                email={email}
                auth={auth}
                router={router}
                setError={setError}
                error={error}
                tipo={tipo}
                name={name}
                sexo={sexo}
                fechaNacimiento={fechaNacimiento}
                telefono={telefono}
                especialidad={especialidad}
                otraEspecialidad={otraEspecialidad}
                otraDescripcion={otraDescripcion}
                gradoEstudios={gradoEstudios}
                consultorio={consultorio}
                cedulaFile={cedulaFile}
                db={db}
                calcularEdad={calcularEdad}
            />
        );
    }

    return (
        <div className="relative min-h-screen" style={{ background: "linear-gradient(to bottom, #5f817d, #0f1e33)" }}>

            {/* Modal Términos */}
            {showTerminos && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
                    onClick={() => setShowTerminos(false)}>
                    <div style={{ background: "white", borderRadius: 20, padding: "32px", maxWidth: 520, width: "100%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
                        onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "#1a2e2c", margin: "0 0 16px" }}>Términos y Condiciones</h2>
                        <div style={{ fontSize: "0.88rem", color: "#4b5563", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 12 }}>
                            <p><strong style={{ color: "#2a5f5a" }}>1. Uso de la plataforma</strong><br />Al registrarte en Mente en Calma, aceptas utilizar la plataforma exclusivamente para fines relacionados con la salud mental y el bienestar.</p>
                            <p><strong style={{ color: "#2a5f5a" }}>2. Privacidad y datos</strong><br />Tu información personal será tratada con estricta confidencialidad conforme a las leyes de protección de datos vigiciones.</p>
                            <p><strong style={{ color: "#2a5f5a" }}>3. Responsabilidad profesional</strong><br />{tipo === "doctor" ? "Como profesional, eres responsable de la veracidad de tu cédula y datos profesionales proporcionados." : "Como paciente, la información que compartas con tu psicólogo será confidencial."}</p>
                            <p><strong style={{ color: "#2a5f5a" }}>4. Citas y cancelaciones</strong><br />Las citas deben cancelarse con al menos 24 horas de anticipación. El incumplimiento reiterado puede resultar en la suspensión de la cuenta.</p>
                            <p><strong style={{ color: "#2a5f5a" }}>5. Modificaciones</strong><br />Mente en Calma se reserva el derecho de modificar estos términos con previo aviso a los usuarios registrados.</p>
                        </div>
                        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                            <button onClick={() => { setAceptaTerminos(true); setShowTerminos(false); }}
                                style={{ flex: 1, background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", border: "none", borderRadius: 12, padding: "11px", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
                                Aceptar y cerrar
                            </button>
                            <button onClick={() => setShowTerminos(false)}
                                style={{ flex: 1, background: "white", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: 12, padding: "11px", fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: "0.9rem", cursor: "pointer" }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header style={{ position: "absolute", top: 0, width: "100%", padding: "20px 40px" }} className="header-anim">
                <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <a href="/" className="brand-link" style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: "1.1rem", color: "white", textDecoration: "none", letterSpacing: "0.5px" }}>
                        <img src="https://static.vecteezy.com/system/resources/thumbnails/011/653/087/small_2x/psychology-3d-render-icon-illustration-png.png" alt="Mente en Calma" className="brand-logo" style={{ height: 40, width: "auto" }} />
                        <span>Mente en Calma</span>
                    </a>
                </nav>
            </header>

            <div className="flex items-center justify-center min-h-screen px-4 pt-24 pb-8">
                <div className="anim-card-wrapper w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex min-h-[540px]">

                    {/* Panel izquierdo */}
                    <div className="hidden md:flex md:w-2/5 relative flex-col justify-end p-8"
                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(74,138,133,0.35) 0%, rgba(15,42,40,0.88) 100%)" }} />
                        <div style={{ position: "relative", zIndex: 10 }}>
                            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1.6rem", color: "white", lineHeight: 1.2 }}>
                                {tipo === "paciente" ? "Empieza tu camino hoy" : "Únete como profesional"}
                            </h2>
                            <p style={{ marginTop: 10, fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                                {tipo === "paciente" ? "Únete a nuestra plataforma para acceder a servicios de salud mental de calidad." : "Forma parte de nuestra red de psicólogos certificados."}
                            </p>
                            {tipo === "doctor" && (
                                <ul style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10, listStyle: "none", padding: 0 }}>
                                    {["Gestiona tu agenda con total flexibilidad", "Llega a más pacientes que te necesitan", "Plataforma segura con historial clínico digital"].map((b, i) => (
                                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.85rem", color: "rgba(255,255,255,0.85)" }}>
                                            <span style={{ color: "#6b9e9a", fontWeight: 700, flexShrink: 0 }}>✓</span>{b}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Panel derecho */}
                    <div className="anim-card flex-1 flex flex-col justify-center px-8 py-10" style={{ background: "white", overflowY: "auto" }}>
                        <h1 className="anim-title" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.7rem", color: "#1a2e2c", margin: 0 }}>Crear cuenta</h1>
                        <p className="anim-title" style={{ marginTop: 4, fontSize: "0.9rem", color: "#6b7280", marginBottom: 20 }}>Completa tus datos para comenzar.</p>

                        {/* Toggle */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 24 }}>
                            {(["paciente", "doctor"] as const).map(t => {
                                const activo = tipo === t;
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => { setTipo(t); setError(""); }}
                                        style={{
                                            padding: "10px",
                                            borderRadius: 10,
                                            border: "none",
                                            cursor: "pointer",
                                            fontFamily: "'Poppins', sans-serif",
                                            fontWeight: 600,
                                            fontSize: "0.88rem",
                                            transition: "all 0.2s ease",
                                            background: activo ? "white" : "transparent",
                                            color: activo ? "#2a5f5a" : "#9ca3af",
                                            boxShadow: activo ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 6
                                        }}
                                    >
                                        {t === "paciente" ? <LuUser size={16} /> : <LuStethoscope size={16} />}
                                        {t === "paciente" ? "Soy Paciente" : "Soy Doctor"}
                                    </button>
                                );
                            })}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                            {/* Nombre */}
                            <div className="anim-field">
                                <label style={labelStyle}>Nombre completo</label>
                                <div className="input-wrap" style={inputWrap()}>
                                    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    <input type="text" placeholder={tipo === "doctor" ? "Ej. Dra. María López" : "Ej. Juan Pérez"} value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                                </div>
                            </div>

                            {/* Email */}
                            {!modoGoogle && (
                                <div className="anim-field">
                                    <label style={labelStyle}>Correo electrónico</label>
                                    <div className="input-wrap" style={inputWrap()}>
                                        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" /></svg>
                                        <input type="email" placeholder="ejemplo@correo.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                                    </div>
                                </div>
                            )}

                            {/* Sexo — ambos */}
                            <div className="anim-field">
                                <label style={labelStyle}>Sexo</label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                    {(["M", "F", "Otro"] as const).map(s => {
                                        const activo = sexo === s;
                                        return (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setSexo(s)}
                                                style={{
                                                    padding: "10px 8px",
                                                    borderRadius: 12,
                                                    border: `2px solid ${activo ? "#4a8a85" : "#d1d5db"}`,
                                                    background: activo ? "#f0f9f7" : "white",
                                                    color: activo ? "#2a5f5a" : "#6b7280",
                                                    fontWeight: activo ? 600 : 400,
                                                    fontSize: "0.88rem",
                                                    cursor: "pointer",
                                                    transition: "all 0.15s ease",
                                                    fontFamily: "'Poppins', sans-serif",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 6
                                                } as React.CSSProperties}
                                            >
                                                {s === "M" && <FaMars size={16} />}
                                                {s === "F" && <FaVenus size={16} />}
                                                {s === "Otro" && <LuUser size={16} />}
                                                {s === "M" ? "Masculino" : s === "F" ? "Femenino" : "Otro"}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Fecha de Nacimiento — Solo para Pacientes */}
                            {tipo === "paciente" && (
                                <div className="anim-field">
                                    <label style={labelStyle}>Fecha de nacimiento</label>
                                    <div className="input-wrap" style={inputWrap()}>
                                        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                        <input type="date" value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} style={inputStyle} />
                                    </div>
                                </div>
                            )}

                            {/* Teléfono — ambos */}
                            <div className="anim-field">
                                <label style={labelStyle}>Teléfono</label>
                                <div className="input-wrap" style={inputWrap()}>
                                    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.48 2 2 0 0 1 3.59 2.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z" /></svg>
                                    <input type="number" placeholder="5512345678" value={telefono} onChange={e => setTelefono(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} />
                                </div>
                            </div>

                            {/* Campos doctor */}
                            {tipo === "doctor" && (
                                <>
                                    {/* Especialidad */}
                                    <div className="anim-field">
                                        <label style={labelStyle}>Especialidad</label>
                                        <div style={{ border: "1px solid #d1d5db", borderRadius: 12, background: "white" }}>
                                            <select value={especialidad} onChange={e => { setEspecialidad(e.target.value); setMostrarDescripcion(false); setOtraEspecialidad(""); setOtraDescripcion(""); }}
                                                style={{ width: "100%", background: "white", border: "none", outline: "none", fontSize: "0.9rem", color: especialidad ? "#111827" : "#9ca3af", cursor: "pointer", padding: "10px 14px", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}>
                                                {especialidades.map(e => <option key={e} value={e}>{e}</option>)}
                                                <option value="otra">Otra especialidad...</option>
                                            </select>
                                        </div>
                                        {especialidad === "otra" && (
                                            <div className="input-wrap" style={{ ...inputWrap(), marginTop: 10 }}>
                                                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                                                <input type="text" placeholder="Escribe tu especialidad" value={otraEspecialidad}
                                                    onChange={e => { setOtraEspecialidad(e.target.value); setMostrarDescripcion(e.target.value.trim().length > 2); }}
                                                    style={inputStyle} />
                                            </div>
                                        )}
                                        {mostrarDescripcion && (
                                            <div className="input-wrap" style={{ ...inputWrap(), marginTop: 8, alignItems: "flex-start" }}>
                                                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0, marginTop: 2 }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>
                                                <textarea placeholder="Breve descripción de tu especialidad..." value={otraDescripcion}
                                                    onChange={e => setOtraDescripcion(e.target.value)}
                                                    style={{ ...inputStyle, resize: "none", minHeight: 72, paddingTop: 2, lineHeight: 1.5 }} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Grado de estudios */}
                                    <div className="anim-field">
                                        <label style={labelStyle}>Grado de estudios</label>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                            {(["Carrera", "Maestría", "Doctorado"] as const).map(grado => (
                                                <button key={grado} type="button" onClick={() => setGradoEstudios(grado)}
                                                    style={{ padding: "10px 8px", borderRadius: 12, border: `2px solid ${gradoEstudios === grado ? "#4a8a85" : "#d1d5db"}`, background: gradoEstudios === grado ? "#f0f9f7" : "white", color: gradoEstudios === grado ? "#2a5f5a" : "#6b7280", fontWeight: gradoEstudios === grado ? 600 : 400, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.15s ease", fontFamily: "'Poppins', sans-serif" }}>
                                                    {grado}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Consultorio */}
                                    <div className="anim-field">
                                        <label style={labelStyle}>Consultorio / Dirección de atención</label>
                                        <div className="input-wrap" style={inputWrap()}>
                                            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                            <input type="text" placeholder="Ej. Consultorio 3, Clínica del Valle" value={consultorio} onChange={e => setConsultorio(e.target.value)} style={inputStyle} />
                                        </div>
                                    </div>

                                    {/* Upload cédula */}
                                    <div className="anim-field">
                                        <label style={labelStyle}>Cédula profesional</label>
                                        <label style={{ display: "flex", alignItems: "center", gap: 12, border: `1.5px solid ${cedulaFileName ? "#4a8a85" : "#d1d5db"}`, borderRadius: 12, padding: "12px 16px", background: cedulaFileName ? "#f0f9f7" : "white", cursor: "pointer", transition: "all 0.2s ease" }}>
                                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={handleCedulaFile} />
                                            <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: cedulaFileName ? "#d1f0eb" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, color: cedulaFileName ? "#2a5f5a" : "#9ca3af" }} fill="none" stroke="currentColor" strokeWidth="1.8">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                                                    {!cedulaFileName && <><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></>}
                                                    {cedulaFileName && <polyline points="9 11 12 14 16 10" />}
                                                </svg>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {cedulaFileName
                                                    ? <><p style={{ margin: 0, fontSize: "0.88rem", color: "#2a5f5a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cedulaFileName}</p><p style={{ margin: 0, fontSize: "0.72rem", color: "#4a8a85", marginTop: 2 }}>Archivo listo ✓</p></>
                                                    : <><p style={{ margin: 0, fontSize: "0.88rem", color: "#374151", fontWeight: 500 }}>Subir cédula profesional</p><p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af", marginTop: 2 }}>PDF, JPG o PNG · Máx. 5 MB</p></>}
                                            </div>
                                            {!cedulaFileName && (
                                                <span style={{ fontSize: "0.78rem", color: "#4a8a85", fontWeight: 600, flexShrink: 0, border: "1px solid #b2ddd7", borderRadius: 8, padding: "4px 10px" }}>Examinar</span>
                                            )}
                                        </label>
                                    </div>
                                </>
                            )}

                            {/* Contraseña */}
                            {!modoGoogle && (
                                <div className="anim-field">
                                    <label style={labelStyle}>Contraseña</label>
                                    <div className="input-wrap" style={inputWrap(!!pwdError)}>
                                        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={handlePasswordChange} style={inputStyle} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", padding: 0 }}>
                                            {showPassword ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                                        </button>
                                    </div>
                                    {password.length > 0 && (<><div className="strength-bar-track"><div className="strength-bar-fill" style={{ width: strength.width, background: strength.color }} /></div><p className="strength-label" style={{ color: strength.color }}>{strength.label}</p></>)}
                                    {pwdError && <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 4 }}>{pwdError}</p>}
                                    <p style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: 4 }}>Mínimo 5 letras y 1 número</p>
                                </div>
                            )}

                            {/* Confirmar */}
                            {!modoGoogle && (
                                <div className="anim-field">
                                    <label style={labelStyle}>Confirmar contraseña</label>
                                    <div className="input-wrap" style={inputWrap()}>
                                        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        <input type={showConfirm ? "text" : "password"} placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", padding: 0 }}>
                                            {showConfirm ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Términos */}
                            <div className="anim-field">
                                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", background: "#fafafa", display: "flex", alignItems: "flex-start", gap: 12 }}>
                                    <input type="checkbox" checked={aceptaTerminos} onChange={e => setAceptaTerminos(e.target.checked)}
                                        style={{ accentColor: "#4a8a85", marginTop: 2, flexShrink: 0, width: 16, height: 16, cursor: "pointer" }} />
                                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.5 }}>
                                        Acepto los{" "}
                                        <button type="button" onClick={() => setShowTerminos(true)}
                                            style={{ color: "#2a5f5a", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "0.85rem", textDecoration: "underline" }}>
                                            Términos y Condiciones
                                        </button>
                                        {tipo === "doctor" && " y confirmo que mi cédula profesional es válida y verificable"}
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 12px" }}>
                                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#dc2626" }}>{error}</p>
                                </div>
                            )}

                            <div className="anim-btn">
                                <button type="button" onClick={handleRegister} disabled={loading} className="btn-primary"
                                    style={{ width: "100%", background: loading ? "#9ca3af" : "linear-gradient(135deg, #6b9e9a, #2d6560)", border: "none", borderRadius: 12, padding: "12px", color: "white", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                    {loading ? (tipo === "paciente" ? "Creando cuenta..." : "Registrando...") : (tipo === "paciente" ? "Crear Cuenta" : "Registrarme como Doctor")}
                                    {!loading && <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>}
                                </button>
                            </div>

                            <div className="anim-btn">
                                <Link href="/login" className="btn-secondary" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 12, padding: "12px", color: "#374151", fontSize: "0.88rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500 }}>
                                    ¿Ya tienes cuenta? Inicia sesión
                                </Link>
                            </div>

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

                        <p style={{ marginTop: 20, textAlign: "center", fontSize: "0.78rem", color: "#9ca3af" }}>
                            Mente en Calma. Bienestar y Salud Mental.
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
}
