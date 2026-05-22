"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase-client";
import { sendPasswordResetEmail } from "firebase/auth";
import { LuMail, LuArrowLeft } from "react-icons/lu";

interface RecuperarPasswordProps {
    onVolver: () => void;
    emailInicial: string;
    onEmailChange: (nuevoEmail: string) => void;
}

export default function RecuperarPassword({ onVolver, emailInicial, onEmailChange }: RecuperarPasswordProps) {
    const [error, setError] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false); // 👈 Estado para controlar el texto del botón

    async function handleRestablecer(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setMensajeExito("");

        if (!emailInicial.trim()) {
            setError("Por favor, ingresa tu correo electrónico.");
            return;
        }

        setLoading(true);
        try {
            const actionCodeSettings = {
                url: `${window.location.origin}/login`,
                handleCodeInApp: true,
            };

            await sendPasswordResetEmail(auth, emailInicial.trim(), actionCodeSettings);

            setMensajeExito("¡Correo enviado! Revisa tu bandeja de entrada (y la carpeta de spam).");
            setEnviado(true); // 👈 Marcamos que ya se envió con éxito al menos una vez
        } catch (e: any) {
            if (e.code === "auth/user-not-found") {
                setError("No existe ninguna cuenta registrada con este correo.");
            } else if (e.code === "auth/invalid-email") {
                setError("El formato del correo no es válido.");
            } else {
                setError("Ocurrió un error. Inténtalo de nuevo más tarde.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <div>
                <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.6rem", color: "#1a2e2c", margin: "0 0 8px" }}>
                    Restablecer contraseña
                </h1>
                <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
                    Ingresa tu correo electrónico y te enviaremos un enlace seguro para que elijas una nueva contraseña.
                </p>
            </div>

            <form onSubmit={handleRestablecer} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Input de Correo */}
                <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4b5563", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        Correo electrónico
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${error ? "#ef4444" : "#d1d5db"}`, borderRadius: 12, padding: "10px 14px", background: "white" }}>
                        <LuMail size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
                        <input
                            type="email"
                            placeholder="ejemplo@correo.com"
                            value={emailInicial}
                            onChange={e => onEmailChange(e.target.value)}
                            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.9rem", color: "#111827" }}
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Alertas */}
                {error && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px" }}>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "#dc2626", lineHeight: 1.4 }}>{error}</p>
                    </div>
                )}

                {mensajeExito && (
                    <div style={{ background: "#f0f9f7", border: "1px solid #b2ddd7", borderRadius: 10, padding: "10px 14px" }}>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "#2a5f5a", lineHeight: 1.4 }}>{mensajeExito}</p>
                    </div>
                )}

                {/* Botón Dinámico */}
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        background: loading ? "#9ca3af" : "linear-gradient(135deg, #6b9e9a, #2d6560)",
                        border: "none",
                        borderRadius: 12,
                        padding: "12px",
                        color: "white",
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading
                        ? "Enviando..."
                        : enviado
                            ? "Reenviar liga de recuperación" // 👈 Si enviado es true, muestra este texto
                            : "Enviar enlace de recuperación"  // 👈 Si es la primera vez, muestra este
                    }
                </button>
            </form>

            {/* Regresar */}
            <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
                <button
                    type="button"
                    onClick={onVolver}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#4b5563", fontSize: "0.88rem", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
                >
                    <LuArrowLeft size={16} /> Volver al inicio de sesión
                </button>
            </div>

        </div>
    );
}