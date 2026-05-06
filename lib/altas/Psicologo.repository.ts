import { Timestamp } from "firebase-admin/firestore";
import { adminDb, adminAuth } from "../firebase-admin";
import { Psicologo, CreatePsicologoInput, EstadoPsicologo } from "./Psicologos.types";

const COL = "psicologos";

function docToPsicologo(id: string, data: FirebaseFirestore.DocumentData): Psicologo {
    return {
        id,
        userId: String(data.userId ?? ""),
        nombreCompleto: String(data.nombreCompleto ?? ""),
        correo: String(data.correo ?? ""),
        telefono: String(data.telefono ?? ""),
        especialidad: data.especialidad ?? "psicologia_clinica",
        cedulaProfesional: String(data.cedulaProfesional ?? ""),
        estado: (data.estado as EstadoPsicologo) ?? "pendiente",
        totalPacientes: Number(data.totalPacientes ?? 0),
        totalCitas: Number(data.totalCitas ?? 0),
        createdAt: data.createdAt?.toDate?.().toISOString() ?? "",
        updatedAt: data.updatedAt?.toDate?.().toISOString() ?? "",
    };
}

/** Crea el psicólogo en Firestore + crea su cuenta Auth con contraseña temporal */
export async function createPsicologo(input: CreatePsicologoInput): Promise<Psicologo> {
    const now = Timestamp.now();
    const tempPassword = `MenteCalma${Math.random().toString(36).slice(2, 8)}!`;

    // 1. Crear cuenta en Firebase Auth
    const userRecord = await adminAuth.createUser({
        email: input.correo,
        password: tempPassword,
        displayName: input.nombreCompleto,
    });

    // 2. Asignar custom claim de rol
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: "psicologo" });

    // 3. Guardar en Firestore
    const data = {
        ...input,
        userId: userRecord.uid,
        estado: "activo" as EstadoPsicologo,
        totalPacientes: 0,
        totalCitas: 0,
        createdAt: now,
        updatedAt: now,
    };
    const ref = await adminDb.collection(COL).add(data);

    return docToPsicologo(ref.id, { ...data });
}

/** Lista todos los psicólogos */
export async function getAllPsicologos(): Promise<Psicologo[]> {
    const snap = await adminDb.collection(COL).orderBy("createdAt", "desc").get();
    return snap.docs.map((d) => docToPsicologo(d.id, d.data()));
}

/** Obtiene un psicólogo por su userId (Auth UID) */
export async function getPsicologoByUserId(userId: string): Promise<Psicologo | null> {
    const snap = await adminDb
        .collection(COL)
        .where("userId", "==", userId)
        .limit(1)
        .get();
    if (snap.empty) return null;
    return docToPsicologo(snap.docs[0].id, snap.docs[0].data());
}

/** Actualiza estado del psicólogo */
export async function updatePsicologoEstado(
    psicologoId: string,
    estado: EstadoPsicologo
): Promise<void> {
    await adminDb.collection(COL).doc(psicologoId).update({
        estado,
        updatedAt: Timestamp.now(),
    });
}

/** Elimina un psicólogo (Firestore + Auth) */
export async function deletePsicologo(psicologoId: string, userId: string): Promise<void> {
    await adminDb.collection(COL).doc(psicologoId).delete();
    if (userId) await adminAuth.deleteUser(userId);
}