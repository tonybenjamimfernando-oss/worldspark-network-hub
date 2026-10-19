import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json" };
function reply(status: number, body: Record<string, unknown>) { return new Response(status === 204 ? null : JSON.stringify(body), { status, headers: cors }); }
async function digest(value: string) { const bytes = new TextEncoder().encode(value); const hash = await crypto.subtle.digest("SHA-256", bytes); return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join(""); }
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });
  const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return reply(503, { error: "Metrics service is not configured" });
  let body: { kind?: unknown; id?: unknown; code?: unknown };
  try { body = await req.json(); } catch { return reply(400, { error: "Invalid JSON body" }); }
  const kind = body.kind;
  if (kind === "view" || kind === "out") {
    if (typeof body.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)) return reply(400, { error: "Invalid listing ID" });
  } else if (kind === "affiliate") {
    if (typeof body.code !== "string" || body.code.length < 6 || body.code.length > 32 || !/^[a-zA-Z0-9_-]+$/.test(body.code)) return reply(400, { error: "Invalid affiliate code" });
  } else return reply(400, { error: "Unsupported metrics event" });
  let viewerId: string | null = null;
  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ")) {
    const verifier = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await verifier.auth.getUser(auth.slice(7));
    if (!error && data.user) viewerId = data.user.id;
  }
  const ip = req.headers.get("x-real-ip")?.trim() || req.headers.get("cf-connecting-ip")?.trim() || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = await digest(`${key}:${ip}`);
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: allowed, error: rateError } = await admin.rpc("consume_metrics_rate_limit", {
    _ip_hash: ipHash, _scope: kind === "affiliate" ? "affiliate" : "listing",
    _max_hits: kind === "affiliate" ? 30 : 90,
    _window_start: new Date(Math.floor(Date.now() / 60000) * 60000).toISOString()
  });
  if (rateError) { console.error("Metrics rate-limit check failed", rateError.message); return reply(503, { error: "Metrics temporarily unavailable" }); }
  if (allowed !== true) return reply(429, { error: "Too many metrics events; retry in the next minute" });
  const result = kind === "affiliate"
    ? await admin.rpc("track_affiliate_click", { _code: body.code as string, _viewer_id: viewerId })
    : await admin.rpc("track_listing", { _id: body.id as string, _kind: kind, _viewer_id: viewerId });
  if (result.error) { console.error("Metrics update failed", result.error.message); return reply(500, { error: "Could not record metrics event" }); }
  return reply(204, {});
});
