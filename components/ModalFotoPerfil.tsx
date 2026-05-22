"use client";

import { useState } from "react";
import { LuCamera, LuCheck, LuX, LuUpload } from "react-icons/lu";

interface Props {
    nombreUsuario: string;
    onSeleccionar: (url: string) => void;
    onCerrar: () => void;
    subiendoFoto: boolean;
    onSubirFoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ESTILOS = ["avataaars", "micah", "personas", "notionists"];
const SEEDS = ["Felix", "Mia", "Luna", "Sofia", "Carlos", "Elena", "Pedro", "Ana", "Luis", "Maria", "Jorge", "Laura", "Diego", "Valeria", "Andres", "Camila"];

export default function ModalFotoPerfil({ nombreUsuario, onSeleccionar, onCerrar, subiendoFoto, onSubirFoto }: Props) {
    const [estiloActivo, setEstiloActivo] = useState("avataaars");
    const [seleccionado, setSeleccionado] = useState<string | null>(null);

    function getUrl(estilo: string, seed: string) {
        return `https://api.dicebear.com/9.x/${estilo}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    }

    function handleConfirmar() {
        if (seleccionado) onSeleccionar(seleccionado);
    }

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 100, display: "flex", alignItems: "center",
            justifyContent: "center", padding: 20
        }}>
            <div style={{
                background: "white", borderRadius: 20, width: "100%",
                maxWidth: 680, maxHeight: "90vh", display: "flex",
                flexDirection: "column", overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
            }}>
                {/* Header */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#1a2e2c", margin: 0 }}>
                            Foto de perfil
                        </h3>
                        <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>
                            Elige un avatar o sube tu propia foto
                        </p>
                    </div>
                    <button onClick={onCerrar} style={{ padding: 6, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex" }}>
                        <LuX size={18} color="#6b7280" />
                    </button>
                </div>

                {/* Contenido */}
                <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

                    {/* Izquierda — Avatares */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid #e5e7eb" }}>

                        {/* Tabs de estilo */}
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {ESTILOS.map(estilo => (
                                <button key={estilo} onClick={() => setEstiloActivo(estilo)}
                                    style={{
                                        padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer",
                                        fontSize: "0.78rem", fontWeight: 600, fontFamily: "'Montserrat', sans-serif",
                                        background: estiloActivo === estilo ? "#2a5f5a" : "#f3f4f6",
                                        color: estiloActivo === estilo ? "white" : "#6b7280",
                                        transition: "all 0.2s"
                                    }}>
                                    {estilo}
                                </button>
                            ))}
                        </div>

                        {/* Grid de avatares */}
                        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                            {SEEDS.map(seed => {
                                const url = getUrl(estiloActivo, seed);
                                const activo = seleccionado === url;
                                return (
                                    <button key={seed} onClick={() => setSeleccionado(url)}
                                        style={{
                                            border: `2px solid ${activo ? "#2a5f5a" : "#e5e7eb"}`,
                                            borderRadius: 12, background: activo ? "#f0f9f7" : "white",
                                            padding: 6, cursor: "pointer", position: "relative",
                                            transition: "all 0.15s", aspectRatio: "1"
                                        }}>
                                        <img src={url} alt={seed} style={{ width: "100%", height: "100%", borderRadius: 8 }} />
                                        {activo && (
                                            <div style={{
                                                position: "absolute", top: 4, right: 4,
                                                background: "#2a5f5a", borderRadius: "50%",
                                                width: 18, height: 18, display: "flex",
                                                alignItems: "center", justifyContent: "center"
                                            }}>
                                                <LuCheck size={11} color="white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Derecha — Subir foto */}
                    <div style={{ width: 180, padding: 20, display: "flex", flexDirection: "column", gap: 16, alignItems: "center", justifyContent: "center" }}>

                        {/* Preview */}
                        <div style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", border: "3px solid #e5e7eb", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {seleccionado ? (
                                <img src={seleccionado} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <span style={{ fontSize: "2rem", fontWeight: 700, color: "#4a8a85", fontFamily: "'Poppins', sans-serif" }}>
                                    {nombreUsuario?.[0]?.toUpperCase() ?? "P"}
                                </span>
                            )}
                        </div>

                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af", textAlign: "center", lineHeight: 1.4 }}>
                            {seleccionado ? "Avatar seleccionado" : "Selecciona un avatar"}
                        </p>

                        <div style={{ width: "100%", height: 1, background: "#e5e7eb" }} />

                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280", fontWeight: 600, textAlign: "center" }}>
                            O sube tu foto
                        </p>

                        {/* Botón subir */}
                        <label htmlFor="foto-modal-input" style={{
                            width: "100%", padding: "10px 0", borderRadius: 12,
                            border: "2px dashed #d1d5db", background: "#f9fafb",
                            display: "flex", flexDirection: "column", alignItems: "center",
                            gap: 6, cursor: subiendoFoto ? "not-allowed" : "pointer",
                            transition: "border-color 0.2s"
                        }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = "#4a8a85")}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = "#d1d5db")}
                        >
                            {subiendoFoto ? (
                                <div style={{ width: 20, height: 20, border: "2px solid #4a8a85", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                            ) : (
                                <LuUpload size={20} color="#4a8a85" />
                            )}
                            <span style={{ fontSize: "0.72rem", color: "#6b7280", fontFamily: "'Montserrat', sans-serif", textAlign: "center" }}>
                                {subiendoFoto ? "Subiendo..." : "Seleccionar\narchivo"}
                            </span>
                        </label>
                        <input id="foto-modal-input" type="file" accept="image/*" style={{ display: "none" }} onChange={onSubirFoto} />

                        {/* Botón confirmar */}
                        <button onClick={handleConfirmar} disabled={!seleccionado}
                            style={{
                                width: "100%", padding: "11px 0", borderRadius: 12, border: "none",
                                background: seleccionado ? "linear-gradient(135deg, #6b9e9a, #2d6560)" : "#e5e7eb",
                                color: seleccionado ? "white" : "#9ca3af",
                                cursor: seleccionado ? "pointer" : "not-allowed",
                                fontWeight: 600, fontSize: "0.85rem",
                                fontFamily: "'Montserrat', sans-serif",
                                transition: "all 0.2s"
                            }}>
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}