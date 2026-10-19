import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ArrowRight, ArrowUpRight, Globe2, ShoppingBag, Building2, Megaphone, ShieldCheck, Link2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, type Kind } from "@/lib/catalog";
import { Globe } from "@/components/Globe";
import { ListingGrid, EmptyListings, type ListingRow } from "@/components/ListingCard";
import port from "@/assets/commerce-port.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "GCNM — O teu mercado, sem fronteiras" },
    { name: "description", content: "Descobre produtos, serviços, empresas e oportunidades comerciais no Global Commerce Network Map." },
    { property: "og:title", content: "GCNM — O teu mercado, sem fronteiras" },
    { property: "og:description", content: "Produtos, serviços e oportunidades. Uma ligação ao comércio global." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: Index,
});
const SECTIONS: { kind: Kind; title: string; subtitle: string }[] = [
  { kind: "product", title: "Novos produtos", subtitle: "Descobre o que chegou ao mercado." },
  { kind: "request", title: "Quem procura, encontra", subtitle: "Pedidos de compra à procura do fornecedor certo." },
  { kind: "service", title: "Talento que faz acontecer", subtitle: "Serviços e profissionais para o teu próximo passo." },
  { kind: "opportunity", title: "Novas ligações. Novas oportunidades.", subtitle: "Possibilidades de negócio, perto de ti ou mais além." },
];
function Index() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [allCategories, setAllCategories] = useState(false);
  return <div>
    <section className="commerce-hero relative flex items-center px-5 py-12 text-navy-foreground md:px-8">
      <img src={port} alt="Navio de carga num porto internacional" width={1920} height={1024} fetchPriority="high" />
      <div className="mx-auto w-full max-w-7xl">
        <p className="eyebrow flex items-center gap-2 text-gold"><span className="h-1.5 w-1.5 rounded-full bg-gold" /> GLOBAL COMMERCE NETWORK MAP</p>
        <h1 className="mt-5 max-w-xl text-4xl font-bold leading-[1.15] sm:text-5xl"><span className="brand-mark">GCNM.</span><br />O teu mercado,<br />sem fronteiras.</h1>
        <p className="mt-5 max-w-md text-sm leading-6 text-navy-foreground/85">Produtos, serviços e oportunidades.<br />Encontra a oferta certa. Cria a próxima ligação.</p>
        <form className="mt-7 flex max-w-xl items-center gap-2 rounded-lg bg-card p-2" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/explorar", search: { q } }); }}>
          <Search className="ml-2 hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" /><input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Pesquisa no mercado" placeholder="O que procuras hoje?" className="h-11 min-w-0 flex-1 bg-card px-2 text-sm text-foreground outline-none" /><Button type="submit" aria-label="Pesquisar no mercado"><Search className="sm:hidden" /><span className="hidden sm:inline">Pesquisar</span><ArrowRight className="hidden sm:block" /></Button>
        </form>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-navy-foreground/80"><span>Explorar:</span><Link to="/explorar" search={{ kind: "product" }} className="hover:text-gold">Produtos</Link><Link to="/explorar" search={{ kind: "service" }} className="hover:text-gold">Serviços</Link><Link to="/empresas" className="hover:text-gold">Empresas</Link><Link to="/freelancers" className="hover:text-gold">Freelancers</Link></div>
      </div>
    </section>
    <div className="border-b bg-card"><div className="mx-auto grid max-w-7xl grid-cols-1 divide-y px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">{[{ icon: Globe2, label: "Um mercado global", text: "Ofertas próprias e de lojas externas" }, { icon: ShieldCheck, label: "Confiança em cada ligação", text: "Perfis, atribuição e avaliações" }, { icon: Megaphone, label: "O teu próximo fornecedor", text: "Publica o que procuras" }].map((item) => <div key={item.label} className="flex items-center gap-3 px-4 py-5"><item.icon className="h-6 w-6 shrink-0 text-primary" /><div><p className="text-xs font-bold">{item.label}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.text}</p></div></div>)}</div></div>
    <div className="mx-auto max-w-7xl px-5 md:px-6">
      <section className="market-section"><div className="section-heading"><div><p className="eyebrow mb-2 text-primary">O MUNDO À TUA ESCOLHA</p><h2>Explora por categoria</h2></div><Button variant="ghost" size="sm" onClick={() => setAllCategories(!allCategories)} aria-expanded={allCategories}>{allCategories ? "Ver menos" : "Todas as categorias"}<ChevronDown className={allCategories ? "rotate-180" : ""} /></Button></div><div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">{(allCategories ? CATEGORIES : CATEGORIES.slice(0, 8)).map((c) => <Link key={c.id} to="/explorar" search={{ category: c.id }} className="category-link flex min-h-28 flex-col items-center justify-center gap-3 rounded-lg bg-secondary px-2 py-4 text-center text-xs font-semibold"><c.icon className="h-6 w-6 text-navy" />{c.label}</Link>)}</div></section>
      {SECTIONS.slice(0, 1).map((s) => <KindSection key={s.kind} {...s} />)}
      <section className="market-section"><div className="section-heading"><div><p className="eyebrow mb-2 text-primary">MAIS DO QUE UM CATÁLOGO</p><h2>Abre a porta ao próximo negócio</h2></div></div><div className="grid gap-0 divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">{[{ title: "Empresas & lojas", desc: "Conhece quem está por trás da oferta.", to: "/empresas", icon: Building2 }, { title: "Serviços & profissionais", desc: "Encontra a experiência de que precisas.", to: "/freelancers", icon: ShoppingBag }, { title: "Pedidos de compra", desc: "A tua necessidade, novas propostas.", to: "/explorar", icon: Megaphone }].map((item) => <Link key={item.title} to={item.to} search={item.to === "/explorar" ? { kind: "request" } : {}} className="group flex gap-4 py-6 sm:px-5"><item.icon className="mt-1 h-6 w-6 shrink-0 text-primary" /><div className="flex-1"><h3 className="text-base font-bold">{item.title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.desc}</p></div><ArrowUpRight className="h-4 w-4 transition group-hover:text-primary" /></Link>)}</div></section>
      {SECTIONS.slice(1).map((s) => <KindSection key={s.kind} {...s} />)}
    </div>
    <section className="relative mt-10 overflow-hidden bg-navy px-5 py-12 text-navy-foreground"><Globe className="pointer-events-none absolute -right-10 top-0 h-80 w-80 opacity-40" /><div className="relative mx-auto max-w-7xl"><p className="eyebrow text-gold">PARA QUEM TEM ALGO A OFERECER</p><h2 className="mt-3 max-w-lg text-3xl font-bold">O teu negócio.<br />Um mundo de possibilidades.</h2><p className="mt-4 max-w-lg text-sm leading-6 text-navy-foreground/75">Apresenta os teus produtos, partilha ofertas da tua loja e liga-te a novos compradores.</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link to="/publicar" search={{ kind: "product" }}>Publicar oferta<ArrowRight /></Link></Button><Button asChild variant="outline" className="border-navy-foreground/30 bg-navy text-navy-foreground hover:bg-navy-soft hover:text-navy-foreground"><Link to="/publicar" search={{ kind: "product", external: true }}><Link2 />Importar link externo</Link></Button></div></div></section>
  </div>;
}
function KindSection({ kind, title, subtitle }: { kind: Kind; title: string; subtitle: string }) {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["home", kind], queryFn: async () => {
    const { data, error } = await supabase.from("listings").select("id,kind,title,category,images,price,currency,city,country").eq("kind", kind).eq("status", "active").order("created_at", { ascending: false }).limit(8);
    if (error) throw error; return data as ListingRow[];
  } });
  return <section className="market-section"><div className="section-heading"><div><h2>{title}</h2><p className="mt-2 text-xs text-muted-foreground">{subtitle}</p></div><Link to="/explorar" search={{ kind }} className="flex items-center gap-2 text-xs font-bold text-primary">Ver tudo<ArrowRight className="h-4 w-4" /></Link></div>{isLoading ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-52 animate-pulse rounded-lg bg-muted" />)}</div> : isError ? <div className="flex flex-wrap items-center gap-4 py-8"><p className="text-sm text-muted-foreground">Não foi possível carregar as ofertas.</p><Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button></div> : data?.length ? <ListingGrid items={data} /> : <EmptyListings kind={kind} />}</section>;
}
