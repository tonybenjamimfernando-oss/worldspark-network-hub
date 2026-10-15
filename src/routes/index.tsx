import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, type Kind } from "@/lib/catalog";
import { ListingGrid, EmptyListings, type ListingRow } from "@/components/ListingCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GCNM — O que procuras hoje?" },
      { name: "description", content: "Encontra produtos, serviços, empresas, freelancers e pedidos de compra no Global Commerce Network Map." },
      { property: "og:title", content: "GCNM — O que procuras hoje?" },
      { property: "og:description", content: "Encontra produtos, serviços, empresas, freelancers e pedidos de compra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SECTIONS: { kind: Kind; title: string }[] = [
  { kind: "product", title: "Novos produtos" },
  { kind: "request", title: "Pedidos de compra recentes" },
  { kind: "service", title: "Serviços disponíveis" },
  { kind: "opportunity", title: "Oportunidades empresariais" },
];

function Index() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <section className="hero-glow rounded-3xl px-6 py-12 text-navy-foreground sm:px-10 sm:py-14">
        <p className="text-sm opacity-80">Olá ☀</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">O que procuras hoje?</h1>
        <p className="mt-3 max-w-xl opacity-85">Produtos, serviços, empresas, profissionais e pedidos de compra — perto de ti ou em qualquer parte do mundo.</p>
        <form className="mt-6 flex max-w-2xl gap-2" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/explorar", search: { q } }); }}>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Pesquisar"
              placeholder="Pesquisar produtos, serviços, empresas..."
              className="h-12 w-full rounded-xl bg-card pl-11 pr-4 text-foreground outline-none" />
          </div>
          <Button type="submit" size="lg" className="h-12 rounded-xl px-6">Pesquisar</Button>
        </form>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          {([["product", "Produto"], ["service", "Serviço"], ["request", "Pedido de compra"]] as const).map(([k, l]) => (
            <Link key={k} to="/explorar" search={{ kind: k }} className="rounded-full bg-navy-soft px-3 py-1 hover:bg-primary">{l}</Link>
          ))}
          <Link to="/empresas" className="rounded-full bg-navy-soft px-3 py-1 hover:bg-primary">Empresas</Link>
          <Link to="/freelancers" className="rounded-full bg-navy-soft px-3 py-1 hover:bg-primary">Freelancers</Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold">Categorias</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          {CATEGORIES.map((c) => (
            <Link key={c.id} to="/explorar" search={{ category: c.id }} className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-center text-xs font-medium transition hover:border-primary">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-primary"><c.icon className="h-5 w-5" /></span>
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      {SECTIONS.map((s) => <KindSection key={s.kind} {...s} />)}
    </div>
  );
}

function KindSection({ kind, title }: { kind: Kind; title: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["home", kind],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings")
        .select("id,kind,title,category,images,price,currency,city,country")
        .eq("kind", kind).eq("status", "active").order("created_at", { ascending: false }).limit(8);
      if (error) throw error;
      return data as ListingRow[];
    },
  });
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link to="/explorar" search={{ kind }} className="flex items-center text-sm font-medium text-primary">Ver tudo <ChevronRight className="h-4 w-4" /></Link>
      </div>
      {isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-muted" /> : data && data.length ? <ListingGrid items={data} /> : <EmptyListings kind={kind} />}
    </section>
  );
}
