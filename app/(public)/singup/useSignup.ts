// app/(public)/singup/useSignup.ts
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from "firebase/auth";
import { auth, db } from "@/lib/firebase-client";
import { collection, addDoc, getDocs, doc, setDoc, getDoc, query, where, Timestamp } from "firebase/firestore";

export function getStrength(pwd: string) {
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

export function useSignup() {
    const router = useRouter();
    const [tipo, setTipo] = useState<"paciente" | "doctor">("paciente");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [sexo, setSexo] = useState<"M" | "F" | "N/A" | "">("");

    const [diaNac, setDiaNac] = useState("");
    const [mesNac, setMesNac] = useState("");
    const [anioNac, setAnioNac] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState("");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [pwdError, setPwdError] = useState("");
    const [aceptaTerminos, setAceptaTerminos] = useState(false);
    const [showTerminos, setShowTerminos] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

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
    const [cargandoEspecialidades, setCargandoEspecialidades] = useState(true);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [googleUser, setGoogleUser] = useState<any>(null);
    const [modoGoogle, setModoGoogle] = useState(false);

    const strength = getStrength(password);

    useEffect(() => {
        if (diaNac && mesNac && anioNac) {
            const diasEnMes = new Date(Number(anioNac), Number(mesNac), 0).getDate();
            const diaFinal = Math.min(Number(diaNac), diasEnMes);
            if (Number(diaNac) > diasEnMes) setDiaNac(String(diaFinal).padStart(2, "0"));
            setFechaNacimiento(`${anioNac}-${mesNac}-${String(diaFinal).padStart(2, "0")}`);
        } else {
            setFechaNacimiento("");
        }
    }, [diaNac, mesNac, anioNac]);

    useEffect(() => {
        async function cargarEspecialidades() {
            try {
                const cached = localStorage.getItem("especialidades");
                if (cached) {
                    setEspecialidades(JSON.parse(cached));
                    setCargandoEspecialidades(false);
                    return;
                }
                const snap = await getDocs(collection(db, "especialidades"));
                const lista = snap.docs.map(d => (d.data() as any).nombre as string);
                const listaOrdenada = lista.sort();
                setEspecialidades(listaOrdenada);
                localStorage.setItem("especialidades", JSON.stringify(listaOrdenada));
            } catch {
                setEspecialidades([]);
            } finally {
                setCargandoEspecialidades(false);
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

            const docSnap = await getDoc(doc(db, "pacientes", user.uid));
            const docSnapDoctor = await getDoc(doc(db, "doctores", user.uid));

            if (docSnap.exists() || docSnapDoctor.exists()) {
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

        // ── Validaciones comunes ──────────────────────────────
        if (!name.trim()) { setError("Ingresa tu nombre completo."); return; }
        if (!email.trim()) { setError("Ingresa tu correo."); return; }
        if (!sexo) { setError("Selecciona tu sexo."); return; }

        if (tipo === "paciente") {
            if (!diaNac || !mesNac || !anioNac) { setError("Selecciona tu fecha de nacimiento completa."); return; }
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
            if (especialidad === "otra" && !otraEspecialidad.trim()) { setError("Escribe el nombre de tu especialidad."); return; }
            if (!gradoEstudios) { setError("Selecciona tu grado de estudios."); return; }
            if (!consultorio.trim()) { setError("Ingresa tu consultorio."); return; }
            if (!cedulaFile) { setError("Adjunta tu cédula profesional."); return; }
        }

        setLoading(true);
        try {
            let uid: string;


            if (modoGoogle && googleUser) {
                // ── Registro con Google ───────────────────────
                uid = googleUser.uid;
            } else {
                // ── Registro con email/password ───────────────

                // ✅ Verificar email duplicado en AMBAS colecciones
                const [snapPac, snapDoc] = await Promise.all([
                    getDocs(query(collection(db, "pacientes"), where("email", "==", email.trim()))),
                    getDocs(query(collection(db, "doctores"), where("email", "==", email.trim()))),
                ]);

                if (!snapPac.empty || !snapDoc.empty) {
                    setError("Este correo ya está registrado. Inicia sesión.");
                    setLoading(false);
                    return;
                }

                const cred = await createUserWithEmailAndPassword(auth, email, password);
                if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
                await sendEmailVerification(cred.user);
                uid = cred.user.uid;
            }

            const now = Timestamp.now();
            const hackEspecialidad = especialidad === "otra" ? otraEspecialidad.trim() : especialidad;

            if (tipo === "paciente") {
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
                if (especialidad === "otra" && otraEspecialidad.trim()) {
                    await addDoc(collection(db, "especialidades"), {
                        nombre: otraEspecialidad.trim(),
                        descripcion: otraDescripcion.trim(),
                        createdAt: now,
                    });
                }

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

                await setDoc(doc(db, "doctores", uid), {
                    nombre: name.trim(),
                    email: email.trim(),
                    sexo,
                    telefono: Number(telefono),
                    especialidad: hackEspecialidad,
                    gradoEstudios,
                    consultorio: consultorio.trim(),
                    cedulaUrl,
                    cedulaArchivoNombre: cedulaFile!.name,
                    cedulaArchivoTipo: cedulaFile!.type,
                    role: "psicologo",
                    activo: true,
                    emailVerificado: false,
                    createdAt: now,
                    updatedAt: now,
                });
            }

            const currentUser = modoGoogle ? googleUser : auth.currentUser;
            const token = await currentUser.getIdToken();
            await fetch("/api/session", {
                method: "POST",
                body: JSON.stringify({ token }),
                headers: { "Content-Type": "application/json" },
            });

            if (modoGoogle) {
                const roleRes = await fetch("/api/auth/verify-role");
                const { role } = await roleRes.json();
                if (role === "psicologo") router.push("/dashboard-psico");
                else router.push("/dashboard");
            } else {
                setEnviado(true);
            }
        } catch (e: any) {
            if (e.code === "auth/email-already-in-use") setError("Este correo ya está registrado.");
            else setError(e.message ?? "Error al crear la cuenta.");
        } finally { setLoading(false); }
    }

    return {
        tipo, setTipo, name, setName, email, setEmail, sexo, setSexo,
        diaNac, setDiaNac, mesNac, setMesNac, anioNac, setAnioNac, fechaNacimiento,
        password, setPassword, confirm, setConfirm,
        pwdError, aceptaTerminos, setAceptaTerminos, showTerminos, setShowTerminos,
        showPassword, setShowPassword, showConfirm, setShowConfirm, telefono, setTelefono,
        especialidad, setEspecialidad, otraDescripcion, setOtraDescripcion, otraEspecialidad, setOtraEspecialidad,
        mostrarDescripcion, setMostrarDescripcion, gradoEstudios, setGradoEstudios, consultorio, setConsultorio,
        cedulaFileName, especialidades, cargandoEspecialidades, error, setError, loading, enviado, modoGoogle, strength,
        handlePasswordChange, handleGoogle, handleCedulaFile, handleRegister, calcularEdad,
    };
}