export type MatchRequest = {
  category: string;
  budget_max: number | null;
  currency: string;
  city: string | null;
  country: string | null;
};

export type MatchCandidate = {
  id: string;
  kind: "product" | "service";
  title: string;
  category: string;
  images: string[];
  price: number | null;
  currency: string;
  city: string | null;
  country: string | null;
  rating?: number | null;
};

export type RankedMatch = {
  listing: MatchCandidate;
  score: number;
  reasons: string[];
};

const norm = (value: string | null | undefined) =>
  (value ?? "").trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function rankListingMatches(request: MatchRequest, candidates: MatchCandidate[]): RankedMatch[] {
  return candidates
    .map((listing) => {
      let score = 0;
      const reasons: string[] = [];
      if (request.category && request.category !== "other" && norm(listing.category) === norm(request.category)) {
        score += 35;
        reasons.push("Categoria correspondente");
      } else if (request.category === "other") {
        score += 5;
      }

      if (request.city && listing.city && norm(request.city) === norm(listing.city)) {
        score += 25;
        reasons.push("Mesma cidade");
      }
      if (request.country && listing.country && norm(request.country) === norm(listing.country)) {
        score += 15;
        reasons.push("Mesmo país");
      }

      if (
        request.budget_max != null &&
        listing.price != null &&
        norm(request.currency) === norm(listing.currency)
      ) {
        if (listing.price <= request.budget_max) {
          score += 20;
          reasons.push("Dentro do orçamento");
        } else {
          score -= 10;
          reasons.push("Acima do orçamento");
        }
      }

      if (listing.rating != null && listing.rating > 0) {
        score += Math.min(5, Math.max(0, listing.rating));
        if (listing.rating >= 4) reasons.push("Boa avaliação");
      }

      return { listing, score, reasons };
    })
    .sort((a, b) => b.score - a.score || (a.listing.price ?? Number.MAX_SAFE_INTEGER) - (b.listing.price ?? Number.MAX_SAFE_INTEGER));
}
