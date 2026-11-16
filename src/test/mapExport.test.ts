import { describe, it, expect } from "vitest";
import { canDownloadExport, canReviewExport, csvCell } from "../../supabase/functions/map-export/permissions";
describe("Map export permissions", () => {
  it("requires layer approval for a non-manager", () => { expect(canDownloadExport("pending", false, true)).toBe(false); expect(canDownloadExport("approved", false, true)).toBe(true); });
  it("permits layer managers to export public data", () => { expect(canDownloadExport(undefined, true, true)).toBe(true); });
  it("denies revoked or rejected requests", () => { expect(canDownloadExport("revoked", false, true)).toBe(false); expect(canDownloadExport("rejected", false, true)).toBe(false); });
  it("blocks disabled layers even with a prior approval", () => { expect(canDownloadExport("approved", false, false)).toBe(false); });
  it("only the layer team can approve or reject", () => { expect(canReviewExport(false, "pending", "approved")).toBe(false); expect(canReviewExport(true, "pending", "approved")).toBe(true); expect(canReviewExport(true, "pending", "rejected")).toBe(true); });
  it("allows revoking an approval, not approving a revoked request", () => { expect(canReviewExport(true, "approved", "revoked")).toBe(true); expect(canReviewExport(true, "revoked", "approved")).toBe(false); });
  it("neutralizes spreadsheet formulas", () => { expect(csvCell("=IMPORTXML('x')")).toBe('"\'=IMPORTXML(\'x\')"'); });
});