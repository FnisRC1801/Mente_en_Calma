"use client";

import { auth } from "@/lib/firebase-client";
import { sendEmailVerification } from "firebase/auth";
import { useState } from "react";
import { LuMailCheck, LuMailWarning, LuSend } from "react-icons/lu";

export default function VerificacionCorreo() {
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState<"exito" | "error" | "">("");

    // Detectamos de forma segura el estado de verificación actual del usuario
    const esVerificado = auth.currentUser?.emailVerified ?? false;

    async function enviarVerificacion() {
        const user = auth.currentUser;

        if (!user) {
            setTipoMensaje("error");
            setMensaje("No hay ningún usuario autenticado actualmente.");
            return;
        }

        setLoading(true);
        setMensaje("");
        try {
            await sendEmailVerification(user);
            setTipoMensaje("exito");
            setMensaje("¡Enlace enviado! Revisa tu bandeja de entrada o la carpeta de spam.");
        } catch (error: any) {
            console.error(error);
            setTipoMensaje("error");
            if (error.code === "auth/too-many-requests") {
                setMensaje("Has realizado demasiadas solicitudes. Inténtalo de nuevo más tarde.");
            } else {
                setMensaje(`Error: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb", maxWidth: "100%", minWidth: 0 }}>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                {esVerificado ? <LuMailCheck size={20} style={{ color: "#4a8a85" }} /> : <LuMailWarning size={20} style={{ color: "#b45309" }} />}
                Verificación de Cuenta
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#4b5563", lineHeight: 1.5 }}>
                    Para garantizar la seguridad de tus citas y notificaciones en <strong>Mente en Calma</strong>, es necesario validar la autenticidad de tu correo electrónico.
                </p>

                {/* Banner de Estado */}
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 12, 
                    padding: "12px 16px", 
                    borderRadius: 12, 
                    background: esVerificado ? "#f0f9f7" : "#fef9ec",
                    border: `1px solid ${esVerificado ? "#b2ddd7" : "#fde68a"}`
                }}>
                    <span style={{ fontSize: "1.2rem" }}>{esVerificado ? "🛡️" : "⚠️"}</span>
                    <div>
                        <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: esVerificado ? "#2a5f5a" : "#b45309" }}>
                            {esVerificado ? "Tu correo electrónico ya está verificado" : "Correo electrónico pendiente de verificar"}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: esVerificado ? "#4a8a85" : "#b45309" }}>
                            {auth.currentUser?.email}
                        </p>
                    </div>
                </div>

                {/* Acción si no está verificado */}
                {!esVerificado && (
                    <div>
                        <button
                            type="button"
                            onClick={enviarVerificacion}
                            disabled={loading}
                            style={{
                                padding: "10px 20px",
                                borderRadius: 10,
                                border: "none",
                                background: loading ? "#9ca3af" : "linear-gradient(135deg, #6b9e9a, #2d6560)",
                                color: "white",
                                fontSize: "0.85rem",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                transition: "opacity 0.2s"
                            }}
                            onMouseEnter={(e) => { if(!loading) e.currentTarget.style.opacity = "0.9"; }}
                            onMouseLeave={(e) => { if(!loading) e.currentTarget.style.opacity = "1"; }}
                        >
                            <LuSend size={16} />
                            {loading ? "Enviando..." : "Solicitar enlace de verificación"}
                        </button>
                    </div>
                )}

                {/* Mensajes de feedback */}
                {mensaje && (
                    <div style={{ 
                        background: tipoMensaje === "exito" ? "#f0f9f7" : "#fef2f2", 
                        border: `1px solid ${tipoMensaje === "exito" ? "#b2ddd7" : "#fecaca"}`, 
                        borderRadius: 10, 
                        padding: "10px 14px" 
                    }}>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: tipoMensaje === "exito" ? "#2a5f5a" : "#dc2626", fontWeight: 500 }}>
                            {tipoMensaje === "exito" ? "✓" : "✕"} {mensaje}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}