import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

const ESPECIALIDADES = [
  "Psicología Clínica",
  "Psicología Infantil y Adolescente",
  "Psicología Cognitivo-Conductual",
  "Psicología de Trauma y PTSD",
  "Terapia Familiar",
  "Terapia de Parejas",
  "Manejo del Estrés",
  "Terapia de Duelo",
  "Psiquiatría General",
  "Neuropsicología",
  "Terapia Ocupacional",
  "Terapia de Grupo",
  "Psicología Educativa",
  "Psicología Organizacional",
];

export async function GET() {
  try {
    const colRef = adminDb.collection("especialidades");
    const now = Timestamp.now();

    const results = await Promise.all(
      ESPECIALIDADES.map((nombre) =>
        colRef.add({ nombre, createdAt: now })
      )
    );

    return NextResponse.json({
      message: `Se crearon ${results.length} especialidades`,
      ids: results.map((r) => r.id),
    });
  } catch (error) {
    console.error("Error al seedear especialidades:", error);
    return NextResponse.json(
      { error: "Error al crear especialidades" },
      { status: 500 }
    );
  }
}
