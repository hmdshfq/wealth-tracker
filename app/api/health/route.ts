import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

export async function GET() {
  const start = Date.now();
  let dbOk = false;
  let authOk = false;

  try {
    await sql`SELECT 1`;
    dbOk = true;
  } catch (error) {
    console.error("Health check DB error:", error);
  }

  try {
    const { userId } = await auth();
    authOk = Boolean(userId);
  } catch (error) {
    console.error("Health check auth error:", error);
  }

  return Response.json({
    ok: dbOk,
    db: dbOk ? "ok" : "error",
    auth: authOk ? "ok" : "unauthenticated",
    latencyMs: Date.now() - start,
  });
}
