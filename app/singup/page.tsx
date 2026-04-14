"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

function getStrength(pwd: string): { label: string; color: string; width: string } {
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

export default function SignUp() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [pwdError, setPwdError] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const strength = getStrength(password);

    function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setPassword(val);
        const letters = (val.match(/[a-zA-Z]/g) || []).length;
        const numbers = (val.match(/\d/g) || []).length;
        setPwdError(letters < 5 || numbers < 1 ? "Mínimo 5 letras y 1 número" : "");
    }

    async function handleRegister() {
        if (pwdError) { setError(pwdError); return; }
        if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
        setError(""); setLoading(true);
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
            const token = await cred.user.getIdToken();
            await fetch("/api/session", {
                method: "POST",
                body: JSON.stringify({ token }),
                headers: { "Content-Type": "application/json" },
            });
            router.push("/dashboard");
        } catch (e: any) {
            if (e.code === "auth/email-already-in-use") setError("Este correo ya está registrado.");
            else setError("Error al crear la cuenta. Intenta de nuevo.");
        } finally { setLoading(false); }
    }

    return (
        <div className="relative min-h-screen" style={{ background: "linear-gradient(to bottom, #5f817d, #0f1e33)" }}>
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
                    <div className="hidden md:flex md:w-2/5 relative flex-col justify-end p-8"
                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(74,138,133,0.35) 0%, rgba(15,42,40,0.88) 100%)" }} />
                        <div style={{ position: "relative", zIndex: 10 }}>
                            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1.6rem", color: "white", lineHeight: 1.2 }}>Empieza tu camino hoy</h2>
                            <p style={{ marginTop: 10, fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                                Únete a nuestra plataforma diseñada para facilitar tu acceso a servicios de salud mental de calidad.
                            </p>
                        </div>
                    </div>

                    <div className="anim-card flex-1 flex flex-col justify-center px-8 py-10" style={{ background: "white" }}>
                        <h1 className="anim-title" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.7rem", color: "#1a2e2c", margin: 0 }}>Crear cuenta</h1>
                        <p className="anim-title" style={{ marginTop: 4, fontSize: "0.9rem", color: "#6b7280", marginBottom: 24 }}>Completa tus datos para comenzar.</p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div className="anim-field">
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4b5563", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Nombre completo</label>
                                <div className="input-wrap" style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #d1d5db", borderRadius: 12, padding: "10px 14px", background: "white" }}>
                                    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <input type="text" placeholder="Ej. Juan Pérez" value={name} onChange={e => setName(e.target.value)}
                                        style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.9rem", color: "#111827" }} />
                                </div>
                            </div>

                            <div className="anim-field">
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4b5563", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Correo electrónico</label>
                                <div className="input-wrap" style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #d1d5db", borderRadius: 12, padding: "10px 14px", background: "white" }}>
                                    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" />
                                    </svg>
                                    <input type="email" placeholder="ejemplo@correo.com" value={email} onChange={e => setEmail(e.target.value)}
                                        style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.9rem", color: "#111827" }} />
                                </div>
                            </div>

                            <div className="anim-field">
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4b5563", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Contraseña</label>
                                <div className="input-wrap" style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${pwdError ? "#ef4444" : "#d1d5db"}`, borderRadius: 12, padding: "10px 14px", background: "white" }}>
                                    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input type="password" placeholder="••••••••" value={password} onChange={handlePasswordChange}
                                        style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.9rem", color: "#111827" }} />
                                </div>
                                {password.length > 0 && (
                                    <>
                                        <div className="strength-bar-track">
                                            <div className="strength-bar-fill" style={{ width: strength.width, background: strength.color }} />
                                        </div>
                                        <p className="strength-label" style={{ color: strength.color }}>{strength.label}</p>
                                    </>
                                )}
                                {pwdError && <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 4 }}>{pwdError}</p>}
                                <p style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: 4 }}>Mínimo 5 letras y 1 número</p>
                            </div>

                            <div className="anim-field">
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4b5563", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Confirmar contraseña</label>
                                <div className="input-wrap" style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #d1d5db", borderRadius: 12, padding: "10px 14px", background: "white" }}>
                                    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)}
                                        style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.9rem", color: "#111827" }} />
                                </div>
                            </div>

                            <div className="anim-field">
                                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#6b7280", cursor: "pointer" }}>
                                    <input type="checkbox" style={{ accentColor: "#4a8a85" }} />
                                    Acepto los <span style={{ color: "#2a5f5a", fontWeight: 500 }}>Términos y Condiciones</span>
                                </label>
                            </div>

                            {error && (
                                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 12px" }}>
                                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#dc2626" }}>{error}</p>
                                </div>
                            )}

                            <div className="anim-btn">
                                <button type="button" onClick={handleRegister} disabled={loading} className="btn-primary"
                                    style={{ width: "100%", background: loading ? "#9ca3af" : "linear-gradient(135deg, #6b9e9a, #2d6560)", border: "none", borderRadius: 12, padding: "12px", color: "white", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                    {loading ? "Creando cuenta..." : "Crear Cuenta"}
                                    {!loading && <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>}
                                </button>
                            </div>

                            <div className="anim-btn">
                                <Link href="/login" className="btn-secondary"
                                    style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 12, padding: "12px", color: "#374151", fontSize: "0.88rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500 }}>
                                    ¿Ya tienes cuenta? Inicia sesión
                                </Link>
                            </div>
                        </div>

                        <p style={{ marginTop: 20, textAlign: "center", fontSize: "0.78rem", color: "#9ca3af" }}>
                            Mente en Calma. Bienestar y Salud Mental.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}