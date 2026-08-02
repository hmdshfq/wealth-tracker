import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

export async function GET() {
  const start = Date.now();
  let dbOk = false;
  let authOk = false;

  try {
    await sql`SELECT 1`;
    dbOk = true;
  } catch {
    // Failure is reflected in the response's dbOk field
  }

  try {
    const { userId } = await auth();
    authOk = Boolean(userId);
  } catch {
    // Failure is reflected in the response's authOk field
  }

  return Response.json({
    ok: dbOk,
    db: dbOk ? "ok" : "error",
    auth: authOk ? "ok" : "unauthenticated",
    latencyMs: Date.now() - start,
  });
}
