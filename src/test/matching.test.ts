import { describe, expect, it } from "vitest";
import { rankListingMatches, type MatchCandidate, type MatchRequest } from "@/lib/matching";

const request: MatchRequest = {
  category: "electronics",
  budget_max: 100,
  currency: "MZN",
  city: "Maputo",
  country: "Moçambique",
};

const candidate = (overrides: Partial<MatchCandidate> = {}): MatchCandidate => ({
  id: "one",
  kind: "product",
  title: "Produto",
  category: "electronics",
  images: [],
  price: 80,
  currency: "MZN",
  city: "Maputo",
  country: "Moçambique",
  ...overrides,
});

describe("rankListingMatches", () => {
  it("ranks matching category, location and budget above unrelated offers", () => {
    const ranked = rankListingMatches(request, [
      candidate({ id: "unrelated", category: "fashion", city: "Nampula", country: "Moçambique", price: 140 }),
      candidate({ id: "best" }),
    ]);
    expect(ranked[0].listing.id).toBe("best");
    expect(ranked[0].score).toBe(95);
    expect(ranked[0].reasons).toContain("Dentro do orçamento");
  });

  it("does not compare prices across different currencies", () => {
    const ranked = rankListingMatches(request, [candidate({ currency: "USD", price: 2 })]);
    expect(ranked[0].reasons).not.toContain("Dentro do orçamento");
    expect(ranked[0].reasons).not.toContain("Acima do orçamento");
  });

  it("normalizes accents and case for location comparisons", () => {
    const ranked = rankListingMatches(request, [
      candidate({ city: "MAPUTO", country: "Mocambique" }),
    ]);
    expect(ranked[0].reasons).toContain("Mesma cidade");
    expect(ranked[0].reasons).toContain("Mesmo país");
  });

  it("uses rating as a small tie-breaker and returns a stable price preference", () => {
    const ranked = rankListingMatches(
      { ...request, city: null, country: null, budget_max: null },
      [candidate({ id: "expensive", price: 90 }), candidate({ id: "rated", price: 70, rating: 5 })],
    );
    expect(ranked[0].listing.id).toBe("rated");
    expect(ranked[0].reasons).toContain("Boa avaliação");
  });
});
