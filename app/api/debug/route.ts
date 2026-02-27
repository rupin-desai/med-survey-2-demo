import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const keys = Object.keys(process.env);

  // Find any postgres/storage/database/neon related env vars
  const dbRelated = keys.filter(
    (k) =>
      k.includes("POSTGRES") ||
      k.includes("STORAGE") ||
      k.includes("DATABASE") ||
      k.includes("NEON") ||
      k.includes("PG"),
  );

  const details = dbRelated.map((key) => {
    const value = process.env[key] || "";
    return {
      key,
      protocol: value.split(":")[0],
      length: value.length,
      isEmpty: value.length === 0,
    };
  });

  return NextResponse.json({
    message: "Environment Variable Check",
    foundKeys: details,
    totalEnvKeys: keys.length,
    isVercel: !!process.env.VERCEL,
    nodeEnv: process.env.NODE_ENV,
  });
}
