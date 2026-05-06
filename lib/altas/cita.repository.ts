import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../firebase-admin";
import {
    Cita,
    CreateCitaInput,
    EstadoCita,
    Especialidad,
} from "./pacientes.types";

const COL = "citas";

function docToCita(id: string, data: FirebaseFirestore.DocumentData): Cita {
    return {
        id,
        pacienteId: String(data.pacienteId ?? ""),
        pacienteNombre: String(data.pacienteNombre ?? ""),
        pacienteCorreo: String(data.pacienteCorreo ?? ""),
        psicologoId: String(data.psicologoId ?? ""),
        especialidad: (data.especialidad as Especialidad) ?? "cita_general",
        motivoConsulta: String(data.motivoConsulta ?? ""),
        fechaSolicitada: data.fechaSolicitada ?? undefined,
        estado: (data.estado as EstadoCita) ?? "pendiente",
        consultorio: data.consultorio ?? undefined,
        notas: data.notas ?? undefined,
        createdAt: data.createdAt?.toDate?.().toISOString() ?? "",
        updatedAt: data.updatedAt?.toDate?.().toISOString() ?? "",
    };
}

/** Crea una nueva solicitud de cita (estado: pendiente) */
export async function createCita(input: CreateCitaInput): Promise<Cita> {
    const now = Timestamp.now();
    const data = {
        ...input,
        estado: "pendiente" as EstadoCita,
        createdAt: now,
        updatedAt: now,
    };
    const ref = await adminDb.collection(COL).add(data);
    return docToCita(ref.id, { ...data });
}

/** Citas PENDIENTES de un psicólogo (para la pantalla "Citas por Aceptar") */
export async function getCitasPendientesByPsicologo(psicologoId: string): Promise<Cita[]> {
    const snap = await adminDb
        .collection(COL)
        .where("psicologoId", "==", psicologoId)
        .where("estado", "==", "pendiente")
        .orderBy("createdAt", "asc")
        .get();
    return snap.docs.map((d) => docToCita(d.id, d.data()));
}

/** Todas las citas de un psicólogo (historial completo) */
export async function getCitasByPsicologo(psicologoId: string): Promise<Cita[]> {
    const snap = await adminDb
        .collection(COL)
        .where("psicologoId", "==", psicologoId)
        .orderBy("createdAt", "desc")
        .get();
    return snap.docs.map((d) => docToCita(d.id, d.data()));
}

/** Citas de un paciente específico */
export async function getCitasByPaciente(pacienteId: string): Promise<Cita[]> {
    const snap = await adminDb
        .collection(COL)
        .where("pacienteId", "==", pacienteId)
        .orderBy("createdAt", "desc")
        .get();
    return snap.docs.map((d) => docToCita(d.id, d.data()));
}

/** Acepta una cita → cambia estado a "aceptada" */
export async function aceptarCita(citaId: string, consultorio?: string): Promise<void> {
    await adminDb.collection(COL).doc(citaId).update({
        estado: "aceptada" as EstadoCita,
        ...(consultorio ? { consultorio } : {}),
        updatedAt: Timestamp.now(),
    });
}

/** Rechaza una cita → cambia estado a "rechazada" */
export async function rechazarCita(citaId: string, notas?: string): Promise<void> {
    await adminDb.collection(COL).doc(citaId).update({
        estado: "rechazada" as EstadoCita,
        ...(notas ? { notas } : {}),
        updatedAt: Timestamp.now(),
    });
}

/** Completa una cita → cambia estado a "completada" */
export async function completarCita(citaId: string, notas?: string): Promise<void> {
    await adminDb.collection(COL).doc(citaId).update({
        estado: "completada" as EstadoCita,
        ...(notas ? { notas } : {}),
        updatedAt: Timestamp.now(),
    });
}