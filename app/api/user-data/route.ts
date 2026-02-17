import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

type UserDataPayload = {
  goal: unknown;
  transactions: unknown;
  cash: unknown;
  cashTransactions?: unknown;
  customTickers?: unknown;
};

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS user_data (
      id bigserial PRIMARY KEY,
      user_id text UNIQUE NOT NULL,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    await ensureTable();

    const rows = (await sql`
      SELECT data
      FROM user_data
      WHERE user_id = ${userId}
      LIMIT 1
    `) as { data: UserDataPayload }[];

    const row = rows[0];
    return Response.json({ data: row?.data ?? null });
  } catch (error) {
    console.error("Failed to load user data:", error);
    return new Response("Failed to load user data", { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = (await request.json()) as UserDataPayload;

    if (!payload || typeof payload !== "object") {
      return new Response("Invalid payload", { status: 400 });
    }

    await ensureTable();

    const dataJson = JSON.stringify(payload);

    await sql`
      INSERT INTO user_data (user_id, data, updated_at)
      VALUES (${userId}, ${dataJson}::jsonb, now())
      ON CONFLICT (user_id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to save user data:", error);
    return new Response("Failed to save user data", { status: 500 });
  }
}
