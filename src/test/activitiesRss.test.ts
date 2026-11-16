import { describe, it, expect } from "vitest";
import { buildActivitiesRss, selectPublicActivities, type FeedEvent } from "../../supabase/functions/activities-rss/feed";

const event: FeedEvent = { id: "activity-1", title: "Encuentro agroecológico", description: "Encuentro abierto", starts_at: "2026-11-20T15:00:00Z", ends_at: null, location_name: "La Plata", created_at: "2026-11-16T15:00:00Z", approved: true, layer_id: "mes_agroecologia" };
const layer = { source_id: "mes_agroecologia", enabled: true, privacy: { events_visibility: { past: "show", hidden_years: [2025] } } };
describe("Public activity feed", () => {
  it("includes approved public activities without requiring a user", () => {
    expect(selectPublicActivities([event], [layer])).toEqual([event]);
  });
  it("excludes unapproved activities", () => {
    expect(selectPublicActivities([{ ...event, approved: false }], [layer])).toEqual([]);
  });
  it("excludes disabled layers", () => {
    expect(selectPublicActivities([event], [{ ...layer, enabled: false }])).toEqual([]);
  });
  it("fails closed for layers unavailable to the public", () => {
    expect(selectPublicActivities([event], [])).toEqual([]);
  });
  it("hides the previous year's Mes activities (2025)", () => {
    expect(selectPublicActivities([{ ...event, starts_at: "2025-11-20T15:00:00Z" }], [layer])).toEqual([]);
  });
  it("uses Argentina's year at the UTC year boundary", () => {
    expect(selectPublicActivities([{ ...event, starts_at: "2026-01-01T01:00:00Z" }], [layer])).toEqual([]);
  });
  it("honors a layer's hide-past setting", () => {
    expect(selectPublicActivities([event], [{ ...layer, privacy: { events_visibility: { past: "hide" } } }], Date.parse("2026-11-21T15:00:00Z"))).toEqual([]);
  });
  it("includes approved activities not attached to a layer", () => {
    expect(selectPublicActivities([{ ...event, layer_id: null }], [])).toHaveLength(1);
  });
  it("produces parseable RSS with a working activity link and no private fields", () => {
    const xml = buildActivitiesRss([{ ...event, title: "Semillas & huertas", description: '<script>alert("x")</script>', edit_token: "PRIVATE_TOKEN", focal_email: "private@example.test" } as FeedEvent], "https://example.test/rss");
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.querySelector("item link")?.textContent).toBe("https://agroeco.red/mapa?event=activity-1");
    expect(doc.querySelector("item description")?.textContent).not.toContain("<script>");
    expect(xml).not.toContain("PRIVATE_TOKEN");
    expect(xml).not.toContain("private@example.test");
  });
});