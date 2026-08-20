// Shared SSRF protection + auth helpers for edge functions that fetch
// user-supplied URLs server-side.
import { createClient } from "npm:@supabase/supabase-js@2";

function ipToLong(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

export function isPrivateIPv4(ip: string): boolean {
  const n = ipToLong(ip);
  if (n === null) return true; // unparseable → treat as unsafe
  const inRange = (start: string, end: string) => {
    const s = ipToLong(start)!, e = ipToLong(end)!;
    return n >= s && n <= e;
  };
  return (
    inRange("0.0.0.0", "0.255.255.255") ||
    inRange("10.0.0.0", "10.255.255.255") ||
    inRange("127.0.0.0", "127.255.255.255") ||
    inRange("169.254.0.0", "169.254.255.255") ||
    inRange("172.16.0.0", "172.31.255.255") ||
    inRange("192.168.0.0", "192.168.255.255") ||
    inRange("100.64.0.0", "100.127.255.255") ||
    inRange("224.0.0.0", "255.255.255.255")
  );
}

export function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower === "::" ||
    lower.startsWith("fc") || lower.startsWith("fd") ||
    lower.startsWith("fe80") ||
    lower.startsWith("::ffff:")
  );
}

export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { throw new Error("URL inválida"); }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Sólo se permiten URLs http/https");
  }
  const host = parsed.hostname;
  if (!host) throw new Error("URL sin hostname");
  const lowerHost = host.toLowerCase();
  if (
    lowerHost === "localhost" || lowerHost.endsWith(".localhost") ||
    lowerHost.endsWith(".local") || lowerHost.endsWith(".internal")
  ) {
    throw new Error("Host no permitido");
  }
  const looksLikeIPv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const looksLikeIPv6 = host.includes(":");
  if (looksLikeIPv4) {
    if (isPrivateIPv4(host)) throw new Error("IP privada no permitida");
  } else if (looksLikeIPv6) {
    if (isPrivateIPv6(host)) throw new Error("IP privada no permitida");
  } else {
    const [a, aaaa] = await Promise.allSettled([
      Deno.resolveDns(host, "A"),
      Deno.resolveDns(host, "AAAA"),
    ]);
    const aRecords = a.status === "fulfilled" ? a.value : [];
    const aaaaRecords = aaaa.status === "fulfilled" ? aaaa.value : [];
    if (aRecords.length === 0 && aaaaRecords.length === 0) {
      throw new Error("No se pudo resolver el host");
    }
    for (const ip of aRecords) if (isPrivateIPv4(ip)) throw new Error("Host resuelve a IP privada");
    for (const ip of aaaaRecords) if (isPrivateIPv6(ip)) throw new Error("Host resuelve a IP privada");
  }
  return parsed;
}

export async function requireUser(req: Request): Promise<string> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) throw new Error("UNAUTHORIZED");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("UNAUTHORIZED");
  return data.user.id;
}
