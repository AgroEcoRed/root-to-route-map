import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(readFileSync(".env", "utf8").split("\n")
  .filter((line) => /^VITE_SUPABASE_(URL|PUBLISHABLE_KEY)=/.test(line))
  .map((line) => {
    const index = line.indexOf("=");
    return [line.slice(0, index), line.slice(index + 1).trim().replace(/^["']|["']$/g, "")];
  }));
const visitor = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

describe("Biblioteca anonymous document access", () => {
  it("allows visitors to sign and download a published PDF", async () => {
    const { data: items, error } = await visitor.from("library_items")
      .select("file_path").not("file_path", "is", null).limit(1);
    expect(error).toBeNull();
    const path = items?.[0]?.file_path;
    expect(path).toBeTruthy();
    if (!path) throw new Error("Expected a published library document");
    const signed = await visitor.storage.from("biblioteca").createSignedUrl(path, 60);
    expect(signed.error).toBeNull();
    if (!signed.data?.signedUrl) throw new Error("Expected a signed document URL");
    const response = await fetch(signed.data.signedUrl);
    expect(response.status).toBe(200);
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  }, 30000);

  it("denies visitors access to the unregistered internal import", async () => {
    const result = await visitor.storage.from("biblioteca").createSignedUrl("imports/mes2025.json", 60);
    expect(result.error).not.toBeNull();
    expect(result.data?.signedUrl).toBeFalsy();
  }, 30000);
});