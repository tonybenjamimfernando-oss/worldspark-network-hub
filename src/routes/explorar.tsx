import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, KINDS, categoryLabel, type Kind } from "@/lib/catalog";
import { ListingGrid, EmptyListings, type ListingRow } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

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
      {
        name: "description",
        content: "Pesquisa produtos, serviços, pedidos de compra e oportunidades no GCNM.",
      },
      { property: "og:title", content: "Explorar anúncios — GCNM" },
      {
        property: "og:description",
        content: "Pesquisa produtos, serviços, pedidos de compra e oportunidades.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Explore,
});

function Explore() {
  const { q, kind, category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [text, setText] = useState(q ?? "");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["explore", q, kind, category],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("id,kind,title,category,images,price,currency,city,country")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(60);
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
  const title = kind
    ? KINDS[kind]
    : category
      ? categoryLabel(category)
      : q
        ? `Resultados para “${q}”`
        : "Todos os anúncios";
  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="page-heading">
        <p className="eyebrow mb-3 text-primary">MERCADO GCNM</p>
        <h1 className="text-3xl font-bold">{title}</h1>
        <form
          className="mt-5 flex max-w-xl gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ search: { q: text, kind, category } });
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Pesquisar ofertas"
            placeholder="Pesquisar no mercado"
          />
          <Button type="submit" aria-label="Pesquisar ofertas">
            <Search />
          </Button>
        </form>
      </div>
      <div className="my-5 flex flex-wrap gap-2">
        <Chip active={!kind} to={{ q, category }}>
          Todos
        </Chip>
        {(Object.keys(KINDS) as Kind[]).map((k) => (
          <Chip key={k} active={kind === k} to={{ q, category, kind: k }}>
            {KINDS[k]}
          </Chip>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            active={category === c.id}
            to={{ q, kind, category: category === c.id ? undefined : c.id }}
          >
            {c.label}
          </Chip>
        ))}
      </div>
      <p aria-live="polite" className="mb-5 text-xs text-muted-foreground">
        {isLoading
          ? "A procurar ofertas…"
          : isError
            ? "Não foi possível carregar as ofertas."
            : `${data?.length ?? 0} ofertas encontradas`}
      </p>
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      ) : isError ? (
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      ) : data?.length ? (
        <ListingGrid items={data} />
      ) : (
        <EmptyListings kind={kind} />
      )}
    </div>
  );
}

function Chip({
  active,
  to,
  children,
}: {
  active: boolean;
  to: z.infer<typeof searchSchema>;
  children: React.ReactNode;
}) {
  return (
    <Link
      to="/explorar"
      search={to}
      aria-current={active ? "true" : undefined}
      className={`inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-xs font-medium ${active ? "border-navy bg-navy text-navy-foreground" : "bg-card hover:border-primary"}`}
    >
      {children}
    </Link>
  );
}
