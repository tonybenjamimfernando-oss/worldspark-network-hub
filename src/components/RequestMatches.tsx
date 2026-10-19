import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { rankListingMatches, type MatchCandidate } from "@/lib/matching";

type RequestContext = {
  id: string;
  category: string;
  budget_max: number | null;
  currency: string;
  city: string | null;
  country: string | null;
};

export function RequestMatches({ request }: { request: RequestContext }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["request-matches", request.id, request.category, request.budget_max, request.currency, request.city, request.country],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("id,kind,title,category,images,price,currency,city,country")
        .eq("status", "active")
        .in("kind", ["product", "service"])
        .neq("id", request.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (request.category && request.category !== "other") query = query.eq("category", request.category);
      const { data: listings, error } = await query;
      if (error) throw error;
      if (!listings?.length) return [];

      const ids = listings.map((item) => item.id);
      const { data: reviews } = await supabase
        .from("reviews")
        .select("listing_id,rating")
        .in("listing_id", ids)
        .eq("status", "visible");

      const ratings = new Map<string, { sum: number; count: number }>();
      for (const review of reviews ?? []) {
        const current = ratings.get(review.listing_id) ?? { sum: 0, count: 0 };
        current.sum += review.rating;
        current.count += 1;
        ratings.set(review.listing_id, current);
      }

      const candidates: MatchCandidate[] = listings.map((item) => {
        const rating = ratings.get(item.id);
        return {
          id: item.id,
          kind: item.kind as "product" | "service",
          title: item.title,
          category: item.category,
          images: item.images ?? [],
          price: item.price,
          currency: item.currency,
          city: item.city,
          country: item.country,
          rating: rating && rating.count ? rating.sum / rating.count : null,
        };
      });

      return rankListingMatches(request, candidates).slice(0, 4);
    },
  });

  if (isLoading) return <div className="mt-6 h-32 animate-pulse rounded-lg bg-muted" />;
  if (isError) return <p className="mt-4 text-sm text-muted-foreground">Não foi possível calcular correspondências agora.</p>;
  if (!data?.length) {
    return (
      <section className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="flex items-center gap-2 font-bold"><Sparkles className="h-4 w-4 text-primary" /> Ofertas que podem corresponder</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ainda não encontrámos ofertas suficientes para este pedido. Novas publicações poderão aparecer aqui.</p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link to="/explorar">Explorar mercado <ArrowRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mt-8 border-t pt-6">
      <div className="mb-4">
        <p className="eyebrow flex items-center gap-2 text-primary"><Sparkles className="h-4 w-4" /> CORRESPONDÊNCIA INTELIGENTE</p>
        <h2 className="mt-2 text-xl font-bold">Ofertas que podem responder a este pedido</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ordenadas por categoria, localização, orçamento e avaliações disponíveis. Cada correspondência mostra os motivos do resultado.</p>
      </div>
      <div className="space-y-3">
        {data.map(({ listing, score, reasons }) => (
          <article key={listing.id} className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link to="/anuncio/$id" params={{ id: listing.id }} className="font-semibold hover:text-primary">{listing.title}</Link>
                <p className="mt-1 text-xs text-muted-foreground">{[listing.city, listing.country].filter(Boolean).join(", ") || "Localização não indicada"}</p>
              </div>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold">{score} pontos</span>
            </div>
            <p className="mt-2 text-sm font-bold text-primary">{listing.price == null ? "Preço sob consulta" : new Intl.NumberFormat("pt-PT", { style: "currency", currency: listing.currency }).format(listing.price)}</p>
            {reasons.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{reasons.join(" · ")}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
