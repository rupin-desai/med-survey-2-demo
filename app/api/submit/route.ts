import { NextResponse } from "next/server";
import { getSQL, ensureTable } from "@/lib/db";

export async function POST(request: Request) {
  try {
    await ensureTable();
    const { id, doctorName, answers, submittedAt } = await request.json();
    const sql = getSQL();

    await sql`
      INSERT INTO submissions (id, doctor_name, answers, submitted_at)
      VALUES (${id}, ${doctorName}, ${JSON.stringify(answers)}, ${submittedAt})
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
