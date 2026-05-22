"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase-client";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { LuPhone } from "react-icons/lu";

interface Props {
    telefono: number;
    onVerificado: () => void;
    onCerrar: () => void;
}

export default function ModalVerificarTelefono({ telefono, onVerificado, onCerrar }: Props) {
    const [codigo, setCodigo] = useState("");
    const [codigoDemo, setCodigoDemo] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);

    async function handleEnviarCodigo() {
        setLoading(true); setError("");
        try {
            const res = await fetch("/api/verificar-telefono", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: auth.currentUser!.uid,
                    telefono: `+52${telefono}`,
                }),
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error);
            setCodigoDemo(data.codigo ?? "");
            setEnviado(true);
        } catch (e: any) {
            setError(e.message);
        } finally { setLoading(false); }
    }

    async function handleConfirmar() {
        if (codigo.length !== 6) { setError("Ingresa el código de 6 dígitos."); return; }
        setLoading(true); setError("");
        try {
            const res = await fetch("/api/verificar-telefono", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: auth.currentUser!.uid, codigo }),
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error);
            onVerificado();
        } catch (e: any) {
            setError(e.message);
        } finally { setLoading(false); }
    }

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 100, display: "flex", alignItems: "center",
            justifyContent: "center", padding: 20
        }}>
            <div style={{
                background: "white", borderRadius: 20, padding: "32px",
                maxWidth: 380, width: "100%", textAlign: "center",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
            }}>
                {/* Icono */}
                <div style={{
                    width: 60, height: 60, borderRadius: "50%",
                    background: "#f0f9f7", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px"
                }}>
                    <LuPhone size={26} color="#4a8a85" />
                </div>

                <h3 style={{
                    fontFamily: "'Poppins', sans-serif", fontWeight: 700,
                    fontSize: "1.1rem", color: "#1a2e2c", margin: "0 0 8px"
                }}>
                    Verificar teléfono
                </h3>

                {!enviado ? (
                    <>
                        <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 20px", lineHeight: 1.5 }}>
                            Enviaremos un código de 6 dígitos al número<br />
                            <strong style={{ color: "#1a2e2c" }}>+52 {telefono}</strong>
                        </p>

                        {error && (
                            <p style={{ color: "#dc2626", fontSize: "0.8rem", margin: "0 0 12px" }}>{error}</p>
                        )}

                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={onCerrar}
                                style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontWeight: 500, fontFamily: "'Montserrat', sans-serif" }}>
                                Cancelar
                            </button>
                            <button onClick={handleEnviarCodigo} disabled={loading}
                                style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>
                                {loading ? "Enviando..." : "Enviar código"}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 12px", lineHeight: 1.5 }}>
                            Código enviado a <strong style={{ color: "#1a2e2c" }}>+52 {telefono}</strong>.<br />
                            Ingresa el código para continuar.
                        </p>

                        {/* Banner demo */}
                        {codigoDemo && (
                            <div style={{
                                background: "#f0f9f7", border: "1px solid #b2ddd7",
                                borderRadius: 10, padding: "8px 12px", marginBottom: 14,
                                fontSize: "0.8rem", color: "#2a5f5a"
                            }}>
                                🧪 <strong>Modo demo</strong> — Código: <strong style={{ letterSpacing: "0.1em" }}>{codigoDemo}</strong>
                            </div>
                        )}

                        {/* Input código */}
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={codigo}
                            onChange={e => { setCodigo(e.target.value.replace(/\D/g, "")); setError(""); }}
                            placeholder="○ ○ ○ ○ ○ ○"
                            style={{
                                width: "100%", border: `2px solid ${error ? "#dc2626" : "#d1d5db"}`,
                                borderRadius: 12, padding: "14px", fontSize: "1.5rem",
                                textAlign: "center", letterSpacing: "0.5em", outline: "none",
                                marginBottom: 8, fontFamily: "monospace",
                                boxSizing: "border-box", transition: "border-color 0.2s"
                            }}
                            onFocus={e => e.target.style.borderColor = "#4a8a85"}
                            onBlur={e => e.target.style.borderColor = error ? "#dc2626" : "#d1d5db"}
                        />

                        {error && (
                            <p style={{ color: "#dc2626", fontSize: "0.8rem", margin: "0 0 12px" }}>{error}</p>
                        )}

                        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                            <button
                                onClick={() => { setEnviado(false); setCodigo(""); setError(""); }}
                                style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontWeight: 500, fontFamily: "'Montserrat', sans-serif", fontSize: "0.85rem" }}>
                                ← Volver
                            </button>
                            <button onClick={handleConfirmar} disabled={loading || codigo.length !== 6}
                                style={{
                                    flex: 1, padding: "11px", borderRadius: 12, border: "none",
                                    background: codigo.length === 6 ? "linear-gradient(135deg, #6b9e9a, #2d6560)" : "#e5e7eb",
                                    color: codigo.length === 6 ? "white" : "#9ca3af",
                                    cursor: (loading || codigo.length !== 6) ? "not-allowed" : "pointer",
                                    fontWeight: 600, fontFamily: "'Montserrat', sans-serif",
                                    transition: "all 0.2s"
                                }}>
                                {loading ? "Verificando..." : "Confirmar"}
                            </button>
                        </div>

                        <button onClick={handleEnviarCodigo} disabled={loading}
                            style={{ marginTop: 12, background: "none", border: "none", color: "#4a8a85", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline" }}>
                            Reenviar código
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}