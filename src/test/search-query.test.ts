import { describe, expect, it } from "vitest";
import { sanitizeListingSearchTerm } from "@/lib/search-query";

describe("sanitizeListingSearchTerm", () => {
  it("keeps ordinary search words and normalizes whitespace", () => {
    expect(sanitizeListingSearchTerm("  telefone   usado  ")).toBe("telefone usado");
  });

  it("removes PostgREST filter delimiters and wildcard characters", () => {
    expect(sanitizeListingSearchTerm("phone),status.eq.active,description.ilike.*")).toBe(
      "phone status.eq.active description.ilike.",
    );
  });

  it("limits very long search terms", () => {
    expect(sanitizeListingSearchTerm("a".repeat(500))).toHaveLength(120);
  });

  it("returns an empty term when the input contains only reserved characters", () => {
    expect(sanitizeListingSearchTerm("%,()*\\")).toBe("");
  });
});
