import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const runtime = typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ? "bun" : "node";
  try {
    const session = await getSession();
    return Response.json({ runtime, ok: true, session });
  } catch (e) {
    return Response.json({ runtime, ok: false, error: String(e) });
  }
}
