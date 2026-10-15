import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, KINDS, categoryLabel, type Kind } from "@/lib/catalog";
import { ListingGrid, EmptyListings, type ListingRow } from "@/components/ListingCard";

const searchSchema = z.object({
  q: z.string().optional(),
  kind: z.enum(["product", "service", "request", "opportunity"]).optional(),
  category: z.string().optional(),
});

export const Route = createFileRoute("/explorar")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Explorar anúncios — GCNM" },
      { name: "description", content: "Pesquisa produtos, serviços, pedidos de compra e oportunidades no GCNM." },
      { property: "og:title", content: "Explorar anúncios — GCNM" },
      { property: "og:description", content: "Pesquisa produtos, serviços, pedidos de compra e oportunidades." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Explore,
});

function Explore() {
  const { q, kind, category } = Route.useSearch();
  const { data, isLoading } = useQuery({
    queryKey: ["explore", q, kind, category],
    queryFn: async () => {
      let query = supabase.from("listings").select("id,kind,title,category,images,price,currency,city,country")
        .eq("status", "active").order("created_at", { ascending: false }).limit(60);
      if (kind) query = query.eq("kind", kind);
      if (category) query = query.eq("category", category);
      if (q) {
        const safe = q.replace(/[%,()]/g, " ").trim();
        if (safe) query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as ListingRow[];
    },
  });
  const title = kind ? KINDS[kind] : category ? categoryLabel(category) : q ? `Resultados para “${q}”` : "Todos os anúncios";
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <div className="my-5 flex flex-wrap gap-2">
        <Chip active={!kind} to={{ q, category }}>Todos</Chip>
        {(Object.keys(KINDS) as Kind[]).map((k) => <Chip key={k} active={kind === k} to={{ q, category, kind: k }}>{KINDS[k]}</Chip>)}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Chip key={c.id} active={category === c.id} to={{ q, kind, category: category === c.id ? undefined : c.id }}>{c.label}</Chip>
        ))}
      </div>
      {isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-muted" /> : data?.length ? <ListingGrid items={data} /> : <EmptyListings kind={kind} />}
    </div>
  );
}

function Chip({ active, to, children }: { active: boolean; to: z.infer<typeof searchSchema>; children: React.ReactNode }) {
  return (
    <Link to="/explorar" search={to} className={`rounded-full border px-3 py-1 text-sm ${active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"}`}>
      {children}
    </Link>
  );
}
