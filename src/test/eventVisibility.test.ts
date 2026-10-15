import { describe, it, expect } from "vitest";
import { isEventPubliclyVisible, readEventVisibility } from "@/lib/eventVisibility";

const now = new Date("2026-11-10T12:00:00-03:00").getTime();
const past2025 = { starts_at: "2025-11-09T14:00:00-03:00" };
const past2026 = { starts_at: "2026-11-05T10:00:00-03:00" };
const next2026 = { starts_at: "2026-11-20T10:00:00-03:00" };

describe("visibilidad de actividades", () => {
  it("en campaña (ocultar pasadas) solo se ven las próximas", () => {
    const v = readEventVisibility({ events_visibility: { past: "hide" } });
    expect(isEventPubliclyVisible(past2025, v, now)).toBe(false);
    expect(isEventPubliclyVisible(past2026, v, now)).toBe(false);
    expect(isEventPubliclyVisible(next2026, v, now)).toBe(true);
  });
  it("en modo archivo se ven las de 2025 y 2026", () => {
    const v = readEventVisibility({});
    expect(isEventPubliclyVisible(past2025, v, now)).toBe(true);
    expect(isEventPubliclyVisible(past2026, v, now)).toBe(true);
  });
  it("un año apagado no se ve", () => {
    const v = readEventVisibility({ events_visibility: { past: "show", hidden_years: [2025] } });
    expect(isEventPubliclyVisible(past2025, v, now)).toBe(false);
    expect(isEventPubliclyVisible(past2026, v, now)).toBe(true);
  });
});
