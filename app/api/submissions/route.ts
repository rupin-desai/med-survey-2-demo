import { NextResponse } from "next/server";
import { getSQL, ensureTable } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureTable();
    const sql = getSQL();

    const rows = await sql`
      SELECT
        id,
        doctor_name  AS "doctorName",
        answers,
        submitted_at AS "submittedAt"
      FROM submissions
      ORDER BY submitted_at DESC
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureTable();
    const { id, clearAll } = await request.json();
    const sql = getSQL();

    if (clearAll) {
      await sql`DELETE FROM submissions`;
    } else if (id) {
      await sql`DELETE FROM submissions WHERE id = ${id}`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
