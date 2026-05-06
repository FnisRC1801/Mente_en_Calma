import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = request.cookies.get("session")?.value;
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const decoded = await adminAuth.verifySessionCookie(session, true);
  if ((decoded as any).role !== "superusuario")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { estado } = await request.json();
  await adminDb.collection("psicologos").doc(params.id).update({
    estado,
    updatedAt: Timestamp.now(),
  });

  return NextResponse.json({ ok: true });
}