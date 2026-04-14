"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    setError(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setError(""); setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.push("/dashboard");
    } catch {
      setError("Error al iniciar con Google.");
    } finally { setLoading(false); }
  }

  return (
    <div className="relative min-h-screen" style={{ background: "linear-gradient(to bottom, #5f817d, #0f1e33)" }}>

      {/* Header */}
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
                Un espacio para ti
              </h2>
              <p style={{ marginTop: 10, fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                Descubre un ambiente profesional y tranquilo diseñado específicamente para tu bienestar emocional y crecimiento personal.
              </p>
            </div>
          </div>

          {/* Panel derecho — blanco */}
          <div className="anim-card flex-1 flex flex-col justify-center px-8 py-10" style={{ background: "white" }}>

            <h1 className="anim-title" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.7rem", color: "#1a2e1a", margin: 0 }}>
              Bienvenido
            </h1>
            <p className="anim-title" style={{ marginTop: 4, fontSize: "0.9rem", color: "#6b7280", marginBottom: 24 }}>
              Ingresa a tu cuenta para gestionar tus citas.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Email */}
              <div className="anim-field">
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4b5563", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Correo electrónico
                </label>
                <div className="input-wrap" style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #d1d5db", borderRadius: 12, padding: "10px 14px", background: "white" }}>
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" />
                  </svg>
                  <input type="email" placeholder="ejemplo@correo.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.9rem", color: "#111827" }} />
                </div>
              </div>

              {/* Contraseña */}
              <div className="anim-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Contraseña
                  </label>
                  <button type="button" className="nav-link" style={{ fontSize: "0.78rem", color: "#63a19a", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="input-wrap" style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #d1d5db", borderRadius: 12, padding: "10px 14px", background: "white" }}>
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input type="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.9rem", color: "#111827" }} />
                </div>
              </div>

              {/* Recordar */}
              <div className="anim-field">
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#6b7280", cursor: "pointer" }}>
                  <input type="checkbox" style={{ accentColor: "#4a8a85" }} />
                  Recordar sesión
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="anim-field" style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 12px" }}>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#dc2626" }}>{error}</p>
                </div>
              )}

              {/* Botón principal */}
              <div className="anim-btn">
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: "100%", background: loading ? "#9ca3af" : "linear-gradient(135deg, #6b9e9a, #2d6560)", border: "none", borderRadius: 12, padding: "12px", color: "white", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {loading ? "Entrando..." : "Iniciar Sesión"}
                  {!loading && <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>}
                </button>
              </div>

              {/* Registrarse */}
              <div className="anim-btn">
                <Link href="/singup" className="btn-secondary" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 12, padding: "12px", color: "#374151", fontSize: "0.88rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500 }}>
                  ¿Aún no tienes una cuenta? ¡Regístrate!
                </Link>
              </div>
            </div>

            {/* Separador */}
            <div className="anim-btn" style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
              <span style={{ fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.12em" }}>O continuar con</span>
              <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            </div>

            {/* Social */}
            <div className="anim-btn" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button type="button" onClick={handleGoogle} className="btn-social"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px", fontSize: "0.88rem", color: "#374151", background: "white", cursor: "pointer" }}>
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="currentColor">
                  <path d="M21.35 11.1h-9.18v2.98h5.27a4.52 4.52 0 0 1-1.95 2.96 6.06 6.06 0 0 1-3.32.9A6.25 6.25 0 0 1 5.9 11.82a6.25 6.25 0 0 1 6.27-6.25c1.46 0 2.78.5 3.81 1.49l2.09-2.09A9.3 9.3 0 0 0 12.17 2 9.1 9.1 0 0 0 5.7 4.7 9.25 9.25 0 0 0 3 11.82a9.25 9.25 0 0 0 2.7 7.12A9.1 9.1 0 0 0 12.17 22a8.9 8.9 0 0 0 6.08-2.37 6.25 6.25 0 0 0 2.1-4.81c0-.68-.05-1.28-.31-1.72Z" />
                </svg>
                Google
              </button>
              <button type="button" onClick={handleGoogle} className="btn-social"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px", fontSize: "0.88rem", color: "#374151", background: "white", cursor: "pointer" }}>
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11Z" />
                </svg>
                Apple
              </button>
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
