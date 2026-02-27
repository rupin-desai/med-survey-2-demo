import { NextResponse } from "next/server";
import { getSQL, ensureTable } from "@/lib/db";

export async function POST(request: Request) {
  try {
    await ensureTable();
    const { id, doctorName, answers, submittedAt } = await request.json();
    const sql = getSQL();

    // Upsert: insert on first call, merge answers on subsequent calls
    await sql`
      INSERT INTO submissions (id, doctor_name, answers, submitted_at)
      VALUES (${id}, ${doctorName}, ${JSON.stringify(answers)}, ${submittedAt})
      ON CONFLICT (id) DO UPDATE
        SET doctor_name  = EXCLUDED.doctor_name,
            answers      = submissions.answers || EXCLUDED.answers,
            submitted_at = EXCLUDED.submitted_at
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
