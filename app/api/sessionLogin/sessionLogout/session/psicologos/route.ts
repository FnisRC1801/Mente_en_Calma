import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { createPsicologo, getAllPsicologos } from "@/lib/altas/Psicologo.repository";

async function verificarSuperUsuario(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    if (!session) return null;
    try {
        const decoded = await adminAuth.verifySessionCookie(session, true);
        if ((decoded as any).role !== "superusuario") return null;
        return decoded;
    } catch { return null; }
}

/** GET /api/psicologos → lista todos */
export async function GET(request: NextRequest) {
    const user = await verificarSuperUsuario(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const psicologos = await getAllPsicologos();
    return NextResponse.json({ psicologos });
}

/** POST /api/psicologos → da de alta + envía correo */
export async function POST(request: NextRequest) {
    const user = await verificarSuperUsuario(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    try {
        const body = await request.json();
        const psicologo = await createPsicologo(body);

        // Generar link de reset para que el psicólogo establezca su contraseña
        const resetLink = await adminAuth.generatePasswordResetLink(psicologo.correo);

        // Aquí conectarías tu servicio de email (Resend, SendGrid, etc.)
        // Por ahora se retorna el link para pruebas
        console.log(`Link de acceso para ${psicologo.correo}: ${resetLink}`);

        return NextResponse.json({ psicologo, resetLink }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}