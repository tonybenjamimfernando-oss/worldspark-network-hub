import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Building2,
  Compass,
  Globe2,
  MessageSquare,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
  Wrench,
  Megaphone,
  MapPinned,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/auth";
import { meta } from "@/components/InfoPage";

export const Route = createFileRoute("/centro")({
  head: () => meta(
    "Centro de comando — GCNM",
    "Atalhos inteligentes para comprar, vender, encontrar parceiros e gerir a tua presença no mercado global.",
  ),
  component: CommandCenter,
});

const commands = [
  {
    title: "Encontrar produtos",
    description: "Descobre ofertas de vendedores e lojas, compara opções e abre a origem da oferta.",
    to: "/explorar",
    search: { kind: "product" },
    icon: ShoppingBag,
    tone: "bg-primary/10 text-primary",
    label: "Explorar produtos",
  },
  {
    title: "Publicar uma oferta",
    description: "Apresenta um produto, serviço ou oportunidade ao mercado.",
    to: "/publicar",
    search: { kind: "product" },
    icon: Store,
    tone: "bg-emerald-500/10 text-emerald-600",
    label: "Criar publicação",
  },
  {
    title: "Publicar um serviço",
    description: "Apresenta as tuas competências, condições e disponibilidade a potenciais clientes.",
    to: "/publicar",
    search: { kind: "service" },
    icon: Wrench,
    tone: "bg-sky-500/10 text-sky-600",
    label: "Publicar serviço",
  },
  {
    title: "Criar um pedido de compra",
    description: "Explica o que procuras e facilita propostas de fornecedores relevantes.",
    to: "/publicar",
    search: { kind: "request" },
    icon: Megaphone,
    tone: "bg-amber-500/10 text-amber-600",
    label: "Publicar pedido",
  },
  {
    title: "Encontrar serviços",
    description: "Pesquisa profissionais e serviços para a tua próxima necessidade.",
    to: "/explorar",
    search: { kind: "service" },
    icon: Wrench,
    tone: "bg-sky-500/10 text-sky-600",
    label: "Ver serviços",
  },
  {
    title: "Explorar o mapa",
    description: "Descobre ofertas com localização aproximada e explora o mercado por região.",
    to: "/mapa",
    icon: MapPinned,
    tone: "bg-violet-500/10 text-violet-600",
    label: "Abrir mapa",
  },
  {
    title: "Encontrar empresas",
    description: "Conhece lojas, empresas e potenciais parceiros comerciais.",
    to: "/empresas",
    icon: Building2,
    tone: "bg-indigo-500/10 text-indigo-600",
    label: "Ver empresas",
  },
  {
    title: "Abrir mensagens",
    description: "Continua conversas comerciais privadas com outros participantes.",
    to: "/mensagens",
    icon: MessageSquare,
    tone: "bg-rose-500/10 text-rose-600",
    label: "Ir para mensagens",
  },
  {
    title: "Gerir perfil e ofertas",
    description: "Atualiza a tua presença pública e acompanha as tuas publicações.",
    to: "/painel",
    icon: UserRound,
    tone: "bg-secondary text-foreground",
    label: "Abrir painel",
  },
] as const;

function CommandCenter() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function runSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate({ to: "/explorar", search: { q } });
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <section className="relative overflow-hidden rounded-2xl bg-navy px-6 py-8 text-navy-foreground md:px-10 md:py-12">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-6 h-44 w-44 rounded-full border border-white/10" />
        <div className="relative max-w-3xl">
          <p className="eyebrow flex items-center gap-2 text-gold">
            <Sparkles className="h-4 w-4" /> CENTRO DE COMANDO GCNM
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            O teu mercado. <span className="text-gold">Um só ponto de partida.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-navy-foreground/80 md:text-base">
            Atalhos diretos para descobrir ofertas, encontrar fornecedores, publicar oportunidades
            e gerir a tua atividade comercial — sem alterar a forma como já utilizas o GCNM.
          </p>
          <form onSubmit={runSearch} className="mt-7 flex max-w-2xl gap-2 rounded-xl bg-card p-2 text-foreground shadow-lg">
            <Search className="ml-2 mt-3 h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Pesquisar produtos, serviços ou empresas"
              placeholder="O que procuras hoje?"
              className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" className="shrink-0">Pesquisar</Button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5">
              <Globe2 className="h-3.5 w-3.5" /> Mercado global
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Ligações comerciais com segurança
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5">
              <Compass className="h-3.5 w-3.5" /> Descoberta por região
            </span>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow text-primary">AÇÕES RÁPIDAS</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">O que queres fazer?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Escolhe um comando para ir diretamente à ferramenta certa.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/explorar">Explorar todo o mercado <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {commands.map((command) => {
            const Icon = command.icon;
            const isPublish = command.to === "/publicar";
            const isExplore = command.to === "/explorar";
            const requiresAuth = command.to === "/painel" || command.to === "/publicar";
            const target = requiresAuth && !user ? "/auth" : command.to;
            const authNext =
              command.to === "/publicar" && "search" in command
                ? command.search.kind === "product"
                  ? "publish-product"
                  : command.search.kind === "service"
                    ? "publish-service"
                    : "publish-request"
                : "panel";
            const authLabel =
              command.to === "/publicar"
                ? "search" in command && command.search.kind === "request"
                  ? "Entrar para criar pedido"
                  : "Entrar para publicar"
                : "Entrar no painel";
            return (
              <article key={command.title} className="group flex min-h-52 flex-col rounded-xl border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${command.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{command.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-5 text-muted-foreground">{command.description}</p>
                <Button
                  asChild
                  variant="ghost"
                  className="mt-4 -ml-3 w-fit justify-start px-3 text-primary hover:text-primary"
                >
                  {target === "/auth" ? (
                    <Link to="/auth" search={{ next: authNext }}>{authLabel}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                  ) : isPublish ? (
                    <Link to="/publicar" search={command.search}>{command.label}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                  ) : isExplore ? (
                    <Link to="/explorar" search={command.search}>{command.label}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                  ) : command.to === "/painel" ? (
                    <Link to="/painel">{command.label}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                  ) : command.to === "/mensagens" ? (
                    <Link to="/mensagens">{command.label}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                  ) : command.to === "/mapa" ? (
                    <Link to="/mapa">{command.label}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                  ) : (
                    <Link to="/empresas">{command.label}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                  )}
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <CircleDollarSign className="h-5 w-5 text-primary" />
          <h3 className="mt-3 font-semibold">Planos transparentes</h3>
          <p className="mt-1 text-sm text-muted-foreground">Consulta as opções disponíveis e acompanha os recursos que ainda estão em preparação.</p>
          <Button asChild variant="link" className="mt-2 h-auto px-0">
            <Link to="/planos">Consultar planos <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h3 className="mt-3 font-semibold">Negócios com confiança</h3>
          <p className="mt-1 text-sm text-muted-foreground">Revê as orientações para publicar, comunicar e avaliar ofertas de forma responsável.</p>
          <Button asChild variant="link" className="mt-2 h-auto px-0">
            <Link to="/regras">Ver regras e segurança <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="mt-3 font-semibold">{user ? "Continua a tua atividade" : "Entra para começar"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {user ? "Abre o teu painel para gerir o perfil e as publicações." : "Cria uma sessão para publicar ofertas, gerir o perfil e conversar com participantes."}
          </p>
          <Button asChild variant="link" className="mt-2 h-auto px-0">
            {user ? <Link to="/painel">Abrir painel <ArrowRight className="ml-1 h-4 w-4" /></Link> : <Link to="/auth">Entrar ou criar conta <ArrowRight className="ml-1 h-4 w-4" /></Link>}
          </Button>
        </div>
      </section>
    </div>
  );
}
