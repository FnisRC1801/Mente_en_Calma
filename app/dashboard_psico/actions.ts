"use server";

import { revalidatePath } from "next/cache";
import {
    getPacientesByPsicologo,
    updatePacienteEstado,
    asignarPsicologo,
} from "@/lib/altas/Paciente.repository";
import {
    getCitasPendientesByPsicologo,
    getCitasByPsicologo,
    aceptarCita,
    rechazarCita,
} from "@/lib/altas/cita.repository";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

// ─── Helper: obtener psicologoId del usuario logueado ────────────────────────

async function getPsicologoIdFromSession(): Promise<string> {
    const cookieStore = cookies();
    const sessionCookie = (await cookieStore).get(process.env.SESSION_COOKIE_NAME ?? "_session");
    if (!sessionCookie?.value) throw new Error("No autenticado");
    const decoded = await adminAuth.verifySessionCookie(sessionCookie.value, true);
    return decoded.uid;
}

// ─── Pacientes ────────────────────────────────────────────────────────────────

export async function getPacientesAction() {
    const psicologoId = await getPsicologoIdFromSession();
    return getPacientesByPsicologo(psicologoId);
}

export async function updateEstadoPacienteAction(
    pacienteId: string,
    estado: "activo" | "pausado" | "alta"
) {
    await getPsicologoIdFromSession(); // verificar auth
    await updatePacienteEstado(pacienteId, estado);
    revalidatePath("/dashboard_psico");
}

// ─── Citas ────────────────────────────────────────────────────────────────────

export async function getCitasPendientesAction() {
    const psicologoId = await getPsicologoIdFromSession();
    return getCitasPendientesByPsicologo(psicologoId);
}

export async function getCitasHistorialAction() {
    const psicologoId = await getPsicologoIdFromSession();
    return getCitasByPsicologo(psicologoId);
}

export async function aceptarCitaAction(citaId: string, pacienteId: string, consultorio?: string) {
    const psicologoId = await getPsicologoIdFromSession();
    await aceptarCita(citaId, consultorio);
    // Asignar psicólogo al paciente si no lo tiene aún
    await asignarPsicologo(pacienteId, psicologoId);
    revalidatePath("/dashboard_psico");
}

export async function rechazarCitaAction(citaId: string, notas?: string) {
    await getPsicologoIdFromSession();
    await rechazarCita(citaId, notas);
    revalidatePath("/dashboard_psico");
}