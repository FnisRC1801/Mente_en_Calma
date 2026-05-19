import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

async function verificarSU(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    if (!session) return null;
    try {
        const decoded = await adminAuth.verifySessionCookie(session, true);
        if ((decoded as any).role !== "superusuario") return null;
        return decoded;
    } catch { return null; }
}

export async function GET(request: NextRequest) {
    const user = await verificarSU(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const snap = await adminDb.collection("pacientes").orderBy("createdAt", "desc").get();
    const pacientes = snap.docs.map(d => {
        const data = d.data();
        return {
            id: d.id,
            nombreCompleto: data.nombreCompleto ?? "",
            correo: data.correo ?? "",
            telefono: data.telefono ?? "",
            estado: data.estado ?? "activo",
            psicologoId: data.psicologoId ?? null,
            ultimaCita: data.ultimaCita ?? null,
            createdAt: data.createdAt?.toDate?.().toISOString() ?? "",
        };
    });

    return NextResponse.json({ pacientes });
}