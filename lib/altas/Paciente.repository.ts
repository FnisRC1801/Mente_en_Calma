import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../firebase-admin";
import {
    Paciente,
    CreatePacienteInput,
    EstadoPaciente,
} from "./pacientes.types";

const COL = "pacientes";

function docToPaciente(id: string, data: FirebaseFirestore.DocumentData): Paciente {
    return {
        id,
        userId: String(data.userId ?? ""),
        nombreCompleto: String(data.nombreCompleto ?? ""),
        correo: String(data.correo ?? ""),
        telefono: String(data.telefono ?? ""),
        fechaNacimiento: String(data.fechaNacimiento ?? ""),
        tipoSolicitante: data.tipoSolicitante ?? "paciente",
        nombreTutor: data.nombreTutor ?? undefined,
        psicologoId: data.psicologoId ?? undefined,
        estado: (data.estado as EstadoPaciente) ?? "activo",
        ultimaCita: data.ultimaCita ?? undefined,
        createdAt: data.createdAt?.toDate?.().toISOString() ?? "",
        updatedAt: data.updatedAt?.toDate?.().toISOString() ?? "",
    };
}

/** Crea un nuevo paciente en Firestore */
export async function createPaciente(input: CreatePacienteInput): Promise<Paciente> {
    const now = Timestamp.now();
    const data = {
        ...input,
        estado: "activo" as EstadoPaciente,
        createdAt: now,
        updatedAt: now,
    };
    const ref = await adminDb.collection(COL).add(data);
    return docToPaciente(ref.id, { ...data, createdAt: now, updatedAt: now });
}

/** Obtiene todos los pacientes de un psicólogo específico */
export async function getPacientesByPsicologo(psicologoId: string): Promise<Paciente[]> {
    const snap = await adminDb
        .collection(COL)
        .where("psicologoId", "==", psicologoId)
        .orderBy("createdAt", "desc")
        .get();
    return snap.docs.map((d) => docToPaciente(d.id, d.data()));
}

/** Obtiene un paciente por su userId (Auth UID) */
export async function getPacienteByUserId(userId: string): Promise<Paciente | null> {
    const snap = await adminDb
        .collection(COL)
        .where("userId", "==", userId)
        .limit(1)
        .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return docToPaciente(doc.id, doc.data());
}

/** Actualiza el estado de un paciente */
export async function updatePacienteEstado(
    pacienteId: string,
    estado: EstadoPaciente
): Promise<void> {
    await adminDb.collection(COL).doc(pacienteId).update({
        estado,
        updatedAt: Timestamp.now(),
    });
}

/** Asigna un psicólogo a un paciente (al aceptar su primera cita) */
export async function asignarPsicologo(
    pacienteId: string,
    psicologoId: string
): Promise<void> {
    await adminDb.collection(COL).doc(pacienteId).update({
        psicologoId,
        updatedAt: Timestamp.now(),
    });
}

/** Actualiza la fecha de última cita */
export async function updateUltimaCita(
    pacienteId: string,
    fecha: string
): Promise<void> {
    await adminDb.collection(COL).doc(pacienteId).update({
        ultimaCita: fecha,
        updatedAt: Timestamp.now(),
    });
}