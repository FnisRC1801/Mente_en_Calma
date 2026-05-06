"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

export default function LoginPsico() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    setError(""); setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Verificar que sea psicólogo
      const tokenResult = await userCredential.user.getIdTokenResult();
      const role = tokenResult.claims.role as string | undefined;

      if (role !== "psicologo") {
        await auth.signOut();
        setError("Esta cuenta no tiene acceso como psicólogo.");
        setLoading(false);
        return;
      }

      // Crear cookie de sesión
      const token = await userCredential.user.getIdToken();
      await fetch("/api/session", {
        method: "POST",
        body: JSON.stringify({ token }),
        headers: { "Content-Type": "application/json" },
      });

      router.push("/dashboard_psico");
    } catch (e: any) {
      if (
        e.code === "auth/user-not-found" ||
        e.code === "auth/wrong-password" ||
        e.code === "auth/invalid-credential"
      ) {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError("Error al iniciar sesión. Intenta de nuevo.");
      }
    } finally { setLoading(false); }
  }

  return (
    <div
      className="relative min-h-screen"
      style={{ background: "linear-gradient(to bottom, #3d6b5e, #0f1e33)" }}
    >
      {/* Header */}
      <header
        style={{ position: "absolute", top: 0, width: "100%", padding: "20px 40px" }}
        className="header-anim"
      >
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a
            href="/"
            className="brand-link"
            style={{
              display: "flex", alignItems: "center", gap: 12,
              fontFamily: "'Poppins', sans-serif", fontWeight: 500,
              fontSize: "1.1rem", color: "white", textDecoration: "none", letterSpacing: "0.5px",
            }}
          >
            <img
              src="https://static.vecteezy.com/system/resources/thumbnails/011/653/087/small_2x/psychology-3d-render-icon-illustration-png.png"
              alt="Mente en Calma"
              className="brand-logo"
              style={{ height: 40, width: "auto" }}
            />
            <span>Mente en Calma</span>
          </a>
          <Link
            href="/login"
            style={{
              fontSize: "0.82rem", color: "rgba(255,255,255,0.7)",
              textDecoration: "none", fontFamily: "'Poppins', sans-serif",
            }}
          >
            ¿Eres paciente? →
          </Link>
        </nav>
      </header>

      <div className="flex items-center justify-center min-h-screen px-4 pt-24 pb-8">
        <div className="anim-card-wrapper w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex min-h-[540px]">

          {/* Panel izquierdo */}
          <div
            className="hidden md:flex md:w-2/5 relative flex-col justify-end p-8"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80')",
              backgroundSize: "cover", backgroundPosition: "center",
            }}
          >
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(42,95,90,0.4) 0%, rgba(15,30,42,0.92) 100%)" }} />
            <div style={{ position: "relative", zIndex: 10 }}>
              {/* Badge profesional */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(74,138,133,0.25)", border: "1px solid rgba(74,138,133,0.5)",
                borderRadius: 20, padding: "5px 12px", marginBottom: 16,
              }}>
                <span style={{ fontSize: "0.7rem", color: "#7dc9c3", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Área Profesional
                </span>
              </div>
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1.6rem", color: "white", lineHeight: 1.2 }}>
                Bienvenido, especialista
              </h2>
              <p style={{ marginTop: 10, fontSize: "0.88rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                Accede a tu panel para gestionar pacientes, citas y tu agenda semanal.
              </p>
              <ul style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10, listStyle: "none", padding: 0 }}>
                {[
                  "Gestiona tu agenda con total flexibilidad",
                  "Historial clínico digital seguro",
                  "Comunicación directa con tus pacientes",
                ].map((b, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.84rem", color: "rgba(255,255,255,0.8)" }}>
                    <span style={{ color: "#6bbfb8", fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Panel derecho — blanco */}
          <div
            className="anim-card flex-1 flex flex-col justify-center px-8 py-10"
            style={{ background: "white" }}
          >
            {/* Chip de rol */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#f0f9f7", border: "1px solid #b2ddd7",
              borderRadius: 20, padding: "4px 12px", marginBottom: 16, alignSelf: "flex-start",
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4a8a85" }} />
              <span style={{ fontSize: "0.72rem", color: "#2a5f5a", fontWeight: 600, letterSpacing: "0.06em" }}>
                ACCESO PSICÓLOGO
              </span>
            </div>

            <h1
              className="anim-title"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.7rem", color: "#1a2e2c", margin: 0 }}
            >
              Iniciar sesión
            </h1>
            <p
              className="anim-title"
              style={{ marginTop: 4, fontSize: "0.9rem", color: "#6b7280", marginBottom: 28 }}
            >
              Ingresa con las credenciales que te enviamos por correo.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Correo */}
              <div className="anim-field">
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4b5563", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Correo electrónico
                </label>
                <div
                  className="input-wrap"
                  style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #d1d5db", borderRadius: 12, padding: "10px 14px", background: "white" }}
                >
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" />
                  </svg>
                  <input
                    type="email"
                    placeholder="doctor@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.9rem", color: "#111827" }}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="anim-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Contraseña
                  </label>
                  <button
                    type="button"
                    style={{ fontSize: "0.78rem", color: "#63a19a", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div
                  className="input-wrap"
                  style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #d1d5db", borderRadius: 12, padding: "10px 14px", background: "white" }}
                >
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.9rem", color: "#111827" }}
                  />
                </div>
              </div>

              {/* Info correo */}
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                background: "#f0f9f7", border: "1px solid #b2ddd7",
                borderRadius: 10, padding: "10px 14px",
              }}>
                <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, color: "#4a8a85", flexShrink: 0, marginTop: 1 }} fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                </svg>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#2a5f5a", lineHeight: 1.5 }}>
                  Usa las credenciales del correo que recibiste al ser dado de alta en la plataforma.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 12px" }}>
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
                  style={{
                    width: "100%",
                    background: loading ? "#9ca3af" : "linear-gradient(135deg, #6b9e9a, #2d6560)",
                    border: "none", borderRadius: 12, padding: "12px",
                    color: "white", fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600, fontSize: "0.95rem",
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "opacity 0.2s",
                  }}
                >
                  {loading ? "Verificando..." : "Iniciar Sesión"}
                  {!loading && (
                    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Separador */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                <span style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em" }}>o</span>
                <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
              </div>

              {/* Link a login paciente */}
              <div className="anim-btn">
                <Link
                  href="/login"
                  className="btn-secondary"
                  style={{
                    width: "100%", border: "1px solid #d1d5db", borderRadius: 12,
                    padding: "12px", color: "#374151", fontSize: "0.88rem",
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500,
                  }}
                >
                  Soy paciente — ir a mi acceso
                </Link>
              </div>
            </div>

            <p style={{ marginTop: 24, textAlign: "center", fontSize: "0.78rem", color: "#9ca3af" }}>
              ¿Problemas para acceder? Contacta al administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}