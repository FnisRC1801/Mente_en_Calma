import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    if (!session) return NextResponse.json({ error: "No session" }, { status: 401 });

    try {
        const decoded = await adminAuth.verifySessionCookie(session, true);
        const role = (decoded as any).role ?? "paciente";
        return NextResponse.json({ role, uid: decoded.uid });
    } catch {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
}