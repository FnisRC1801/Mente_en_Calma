import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
    const session = request.cookies.get("session")?.value;

    if (!session) {
        return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
    }

    try {
        const decoded = await adminAuth.verifyIdToken(session);
        const uid = decoded.uid;

        const doctorSnap = await adminDb.collection("doctores").doc(uid).get();
        if (doctorSnap.exists) {
            return NextResponse.json({ role: "psicologo", hasDoc: true });
        }

        const pacienteSnap = await adminDb.collection("pacientes").doc(uid).get();
        if (pacienteSnap.exists) {
            return NextResponse.json({ role: "paciente", hasDoc: true });
        }

        // Usuario autenticado con Google pero sin doc todavía
        return NextResponse.json({ role: "paciente", hasDoc: false });

    } catch {
        return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }
}