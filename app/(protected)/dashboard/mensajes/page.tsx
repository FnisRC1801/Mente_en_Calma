// app/(protected)/dashboard/mensajes/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import {
    collection, query, where, getDocs, addDoc,
    onSnapshot, orderBy, Timestamp, doc, updateDoc,
    setDoc, getDoc
} from "firebase/firestore";
import { LuSearch, LuSend, LuMessageSquare } from "react-icons/lu";

interface Doctor {
    uid: string;
    nombre: string;
    especialidad: string;
    fotoUrl?: string;
}

interface Conversacion {
    id: string;
    doctorId: string;
    doctorNombre: string;
    doctorEspecialidad: string;
    doctorFotoUrl?: string;
    ultimoMensaje: string;
    ultimaFecha: any;
    noLeidos_paciente: number;
}

interface Mensaje {
    id: string;
    texto: string;
    senderId: string;
    fecha: any;
    leido: boolean;
}

// 🖼️ COMPONENTE AVATAR INTEGRADO (Muestra la fotoUrl real o la inicial)
function Avatar({ nombre, fotoUrl, size = 40 }: { nombre?: string; fotoUrl?: string; size?: number }) {
    if (fotoUrl && fotoUrl.trim() !== "") {
        return (
            <img
                src={fotoUrl}
                alt={nombre ?? "avatar"}
                style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
        );
    }
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: "linear-gradient(135deg, #6b9e9a, #2d6560)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700,
            fontSize: size > 38 ? "1rem" : "0.9rem",
            flexShrink: 0,
        }}>
            {(nombre ?? "D")[0].toUpperCase()}
        </div>
    );
}

export default function MensajesPaciente() {
    const router = useRouter();
    const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
    const [doctoresDisponibles, setDoctoresDisponibles] = useState<Doctor[]>([]);
    const [convActiva, setConvActiva] = useState<Conversacion | null>(null);
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [texto, setTexto] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const unsubRef = useRef<(() => void) | null>(null);
    const userRef = useRef<any>(null);

    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }
            userRef.current = user;

            // 1. Obtener doctores desde las citas asignadas
            const qCitas = query(collection(db, "citas"), where("pacienteId", "==", user.uid));
            const snapCitas = await getDocs(qCitas);
            const doctoresMap = new Map<string, Doctor>();
            
            snapCitas.docs.forEach(d => {
                const data = d.data();
                if (!doctoresMap.has(data.doctorId)) {
                    doctoresMap.set(data.doctorId, {
                        uid: data.doctorId,
                        nombre: data.doctorNombre,
                        especialidad: data.especialidad,
                    });
                }
            });

            // 🌟 Cruzar con la colección "doctores" para traer la fotoUrl real
            const doctoresConFoto = await Promise.all(
                Array.from(doctoresMap.values()).map(async (docData) => {
                    try {
                        const snap = await getDoc(doc(db, "doctores", docData.uid));
                        if (snap.exists()) {
                            const data = snap.data();
                            return { 
                                ...docData, 
                                nombre: data.nombre ?? docData.nombre, 
                                fotoUrl: data.fotoUrl ?? undefined 
                            };
                        }
                    } catch (e) { console.error("Error cargando foto del profesional:", e); }
                    return docData;
                })
            );
            setDoctoresDisponibles(doctoresConFoto);

            // 2. Escuchar las conversaciones activas en tiempo real
            const qConv = query(collection(db, "conversaciones"), where("pacienteId", "==", user.uid));
            onSnapshot(qConv, async snap => {
                const convs = await Promise.all(
                    snap.docs.map(async d => {
                        const conv = { id: d.id, ...d.data() } as Conversacion;
                        
                        // Si la conversación no guardó la foto originalmente, la buscamos en doctores
                        if (!conv.doctorFotoUrl) {
                            try {
                                const docSnap = await getDoc(doc(db, "doctores", conv.doctorId));
                                if (docSnap.exists()) {
                                    conv.doctorFotoUrl = docSnap.data().fotoUrl ?? undefined;
                                }
                            } catch (e) {}
                        }
                        return conv;
                    })
                );
                
                convs.sort((a, b) => {
                    const fa = a.ultimaFecha?.toDate?.() ?? new Date(0);
                    const fb = b.ultimaFecha?.toDate?.() ?? new Date(0);
                    return fb.getTime() - fa.getTime();
                });
                setConversaciones(convs);
                setLoading(false);
            });
        }
        cargar();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes]);

    async function abrirConversacion(doctor: Doctor) {
        const user = userRef.current;
        if (!user) return;

        const convId = `${user.uid}_${doctor.uid}`;
        const convRef = doc(db, "conversaciones", convId);
        const convSnap = await getDoc(convRef);

        if (!convSnap.exists()) {
            await setDoc(convRef, {
                pacienteId: user.uid,
                doctorId: doctor.uid,
                doctorNombre: doctor.nombre,
                doctorEspecialidad: doctor.especialidad,
                doctorFotoUrl: doctor.fotoUrl ?? null,
                ultimoMensaje: "",
                ultimaFecha: Timestamp.now(),
                noLeidos_paciente: 0,
                noLeidos_doctor: 0,
            });
        }

        const conv: Conversacion = {
            id: convId,
            doctorId: doctor.uid,
            doctorNombre: doctor.nombre,
            doctorEspecialidad: doctor.especialidad,
            doctorFotoUrl: doctor.fotoUrl ?? convSnap.data()?.doctorFotoUrl,
            ultimoMensaje: convSnap.data()?.ultimoMensaje ?? "",
            ultimaFecha: convSnap.data()?.ultimaFecha ?? Timestamp.now(),
            noLeidos_paciente: 0,
        };
        setConvActiva(conv);
        escucharMensajes(convId);
    }

    function escucharMensajes(convId: string) {
        if (unsubRef.current) unsubRef.current();
        const q = query(collection(db, "conversaciones", convId, "mensajes"), orderBy("fecha", "asc"));
        unsubRef.current = onSnapshot(q, snap => {
            setMensajes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Mensaje)));
        });
    }

    async function handleSeleccionarConv(conv: Conversacion) {
        // Sincroniza la foto desde la colección "doctores" al hacer click
        let fotoReal = conv.doctorFotoUrl;
        try {
            const snap = await getDoc(doc(db, "doctores", conv.doctorId));
            if (snap.exists()) {
                fotoReal = snap.data().fotoUrl ?? fotoReal;
            }
        } catch (e) {}

        setConvActiva({ ...conv, doctorFotoUrl: fotoReal });
        escucharMensajes(conv.id);
        await updateDoc(doc(db, "conversaciones", conv.id), { noLeidos_paciente: 0 });
    }

    async function handleEnviar() {
        if (!texto.trim() || !convActiva || enviando) return;
        const user = userRef.current;
        setEnviando(true);
        try {
            await addDoc(collection(db, "conversaciones", convActiva.id, "mensajes"), {
                texto: texto.trim(),
                senderId: user.uid,
                fecha: Timestamp.now(),
                leido: false,
            });
            await updateDoc(doc(db, "conversaciones", convActiva.id), {
                ultimoMensaje: texto.trim(),
                ultimaFecha: Timestamp.now(),
                noLeidos_doctor: 1,
            });
            setTexto("");
        } finally { setEnviando(false); }
    }

    function formatHora(ts: any) {
        if (!ts) return "";
        const d = ts.toDate?.() ?? new Date(ts);
        return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    }

    function formatFechaConv(ts: any) {
        if (!ts) return "";
        const d = ts.toDate?.() ?? new Date(ts);
        const hoy = new Date();
        if (d.toDateString() === hoy.toDateString()) return formatHora(ts);
        return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
    }

    const doctoresSinConv = doctoresDisponibles.filter(doc => !conversaciones.find(c => c.doctorId === doc.uid));
    const convFiltradas = conversaciones.filter(c => c.doctorNombre.toLowerCase().includes(busqueda.toLowerCase()));
    const docsFiltrados = doctoresSinConv.filter(d => d.nombre.toLowerCase().includes(busqueda.toLowerCase()));

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#4a8a85" }}>Cargando...</p>
        </div>
    );

    return (
        <div style={{ height: "100vh", display: "flex", fontFamily: "'Montserrat', sans-serif", background: "white" }}>
            
            {/* Panel izquierdo — lista de conversaciones */}
            <div style={{ width: 300, borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0 }}>
                <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #e5e7eb" }}>
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 12px" }}>Mensajes</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", borderRadius: 10, padding: "8px 12px", border: "1px solid #e5e7eb" }}>
                        <LuSearch size={14} color="#9ca3af" />
                        <input
                            placeholder="Buscar doctor..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            style={{ border: "none", background: "none", outline: "none", fontSize: "0.82rem", color: "#374151", width: "100%", fontFamily: "'Montserrat', sans-serif" }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto" }}>
                    {/* Lista de Chats Activos */}
                    {convFiltradas.map(conv => {
                        const fotoReal = doctoresDisponibles.find(d => d.uid === conv.doctorId)?.fotoUrl ?? conv.doctorFotoUrl;
                        return (
                            <div key={conv.id} onClick={() => handleSeleccionarConv(conv)}
                                style={{ padding: "12px 16px", cursor: "pointer", background: convActiva?.id === conv.id ? "#f0f9f7" : "white", borderBottom: "1px solid #f3f4f6", transition: "background 0.15s" }}>
                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                    <Avatar nombre={conv.doctorNombre} fotoUrl={fotoReal} size={40} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "#1a2e2c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.doctorNombre}</p>
                                            <span style={{ fontSize: "0.68rem", color: "#9ca3af" }}>{formatFechaConv(conv.ultimaFecha)}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.ultimoMensaje || conv.doctorEspecialidad}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Lista de Doctores Disponibles (Sin Chat Iniciado) */}
                    {docsFiltrados.length > 0 && (
                        <>
                            <div style={{ padding: "8px 16px", background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                                <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Tus psicólogos</p>
                            </div>
                            {docsFiltrados.map(doctor => (
                                <div key={doctor.uid} onClick={() => abrirConversacion(doctor)}
                                    style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f3f4f6" }}>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                        <Avatar nombre={doctor.nombre} fotoUrl={doctor.fotoUrl} size={40} />
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "#1a2e2c" }}>{doctor.nombre}</p>
                                            <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{doctor.especialidad}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* AREA DEL CHAT SELECCIONADO */}
            {convActiva ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {/* Encabezado del chat */}
                    <div style={{ padding: "12px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12, background: "white" }}>
                        <Avatar nombre={convActiva.doctorNombre} fotoUrl={convActiva.doctorFotoUrl} size={38} />
                        <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.92rem", color: "#1a2e2c", fontFamily: "'Poppins', sans-serif" }}>{convActiva.doctorNombre}</p>
                            <p style={{ margin: 0, fontSize: "0.72rem", color: "#4a8a85" }}>{convActiva.doctorEspecialidad}</p>
                        </div>
                    </div>

                    {/* Contenedor de mensajes */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8, background: "#f8fafb" }}>
                        {mensajes.map(m => {
                            const esMio = m.senderId === userRef.current?.uid;
                            return (
                                <div key={m.id} style={{ display: "flex", justifyContent: esMio ? "flex-end" : "flex-start" }}>
                                    <div style={{
                                        maxWidth: "65%", padding: "10px 14px", borderRadius: esMio ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                        background: esMio ? "linear-gradient(135deg, #6b9e9a, #2d6560)" : "white",
                                        color: esMio ? "white" : "#1a2e2c",
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                                        border: esMio ? "none" : "1px solid #e5e7eb"
                                    }}>
                                        <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.5 }}>{m.texto}</p>
                                        <p style={{ margin: "4px 0 0", fontSize: "0.65rem", color: esMio ? "rgba(255,255,255,0.7)" : "#9ca3af", textAlign: "right" }}>{formatHora(m.fecha)}</p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input de texto */}
                    <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", background: "white", display: "flex", gap: 10, alignItems: "flex-end" }}>
                        <div style={{ flex: 1, background: "#f9fafb", borderRadius: 12, border: "1px solid #e5e7eb", padding: "10px 14px" }}>
                            <textarea
                                placeholder={`Escribe un mensaje para ${convActiva.doctorNombre}...`}
                                value={texto}
                                onChange={e => setTexto(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }}
                                rows={1}
                                style={{ width: "100%", border: "none", background: "none", outline: "none", resize: "none", fontSize: "0.88rem", fontFamily: "'Montserrat', sans-serif", color: "#374151", lineHeight: 1.5 }}
                            />
                        </div>
                        <button onClick={handleEnviar} disabled={!texto.trim() || enviando}
                            style={{ width: 42, height: 42, borderRadius: "50%", border: "none", background: texto.trim() ? "linear-gradient(135deg, #6b9e9a, #2d6560)" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: texto.trim() ? "pointer" : "not-allowed", flexShrink: 0 }}>
                            <LuSend size={16} color={texto.trim() ? "white" : "#9ca3af"} />
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafb" }}>
                    <div style={{ textAlign: "center" }}>
                        <LuMessageSquare size={48} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: "#9ca3af" }}>Selecciona una conversación</p>
                    </div>
                </div>
            )}
        </div>
    );
}