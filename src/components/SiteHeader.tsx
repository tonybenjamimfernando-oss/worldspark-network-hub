import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  Globe,
  ShoppingBag,
  Wrench,
  Megaphone,
  Building2,
  Users,
  Map,
  CreditCard,
  Plus,
  User as UserIcon,
  Menu,
  ArrowUpRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUser } from "@/lib/auth";

const NAV = [
  { to: "/explorar", search: { kind: "product" }, label: "Comprar", icon: ShoppingBag },
  { to: "/explorar", search: { kind: "service" }, label: "Serviços", icon: Wrench },
  { to: "/explorar", search: { kind: "request" }, label: "Pedidos de compra", icon: Megaphone },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/freelancers", label: "Freelancers", icon: Users },
  { to: "/mapa", label: "Mapa", icon: Map },
  { to: "/planos", label: "Planos", icon: CreditCard },
] as const;

export function SiteHeader() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-md">
      <div className="hidden border-b bg-secondary md:block">
        <div className="mx-auto flex max-w-7xl justify-between px-6 py-2 text-[11px] text-muted-foreground">
          <span>GLOBAL COMMERCE NETWORK MAP</span>
          <div className="flex gap-6">
            <Link to="/regras">Confiança e segurança</Link>
            <Link to="/publicar" search={{ kind: "product", external: true }}>
              Para vendedores e parceiros <ArrowUpRight className="inline h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 md:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="Abrir menu" className="md:hidden">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(88vw,360px)] overflow-y-auto">
            <SheetTitle>Explorar GCNM</SheetTitle>
            <SheetDescription>Global Commerce Network Map</SheetDescription>
            <nav aria-label="Menu móvel" className="mt-7 flex flex-col gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.label}
                  to={n.to}
                  search={("search" in n ? n.search : {}) as never}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-secondary"
                >
                  <n.icon className="h-5 w-5 text-primary" />
                  {n.label}
                </Link>
              ))}
              <Link
                to="/mensagens"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-sm"
              >
                <MessageSquare className="h-5 w-5 text-primary" />
                Mensagens
              </Link>
            </nav>
            <Button asChild className="mt-7 w-full">
              <Link to="/publicar" search={{ kind: "product" }} onClick={() => setOpen(false)}>
                <Plus />
                Publicar oferta
              </Link>
            </Button>
          </SheetContent>
        </Sheet>
        <Link
          to="/"
          className="brand-mark flex shrink-0 items-center gap-2.5"
          aria-label="GCNM — Início"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-[10px] font-extrabold text-primary-foreground">
            GCNM
          </span>
          <span className="leading-tight">
            <span className="block text-xl font-extrabold text-navy">GCNM</span>
            <span className="hidden text-[9px] text-muted-foreground sm:block">
              GLOBAL COMMERCE NETWORK MAP
            </span>
          </span>
        </Link>
        <form
          className="relative ml-5 hidden flex-1 md:block"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/explorar", search: { q } });
          }}
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Pesquisar"
            placeholder="O que procuras?"
            className="h-11 w-full rounded-md border bg-secondary pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-xs font-medium lg:flex">
            <Globe className="h-4 w-4" /> PT · EUR
          </span>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            aria-label="Mensagens"
          >
            <Link to="/mensagens">
              <MessageSquare />
            </Link>
          </Button>
          {user ? (
            <Button asChild size="sm" variant="outline">
              <Link to="/painel">
                <UserIcon />
                Painel
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link to="/auth">
                <UserIcon />
                Entrar
              </Link>
            </Button>
          )}
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/publicar" search={{ kind: "product" }}>
              <Plus />
              Publicar
            </Link>
          </Button>
        </div>
      </div>
      <nav
        aria-label="Navegação principal"
        className="mx-auto hidden max-w-7xl items-center gap-1 px-4 md:flex md:px-6"
      >
        {NAV.map((n) => (
          <Link
            key={n.label}
            to={n.to}
            search={("search" in n ? n.search : {}) as never}
            className="flex items-center gap-2 border-b-2 border-transparent px-3 py-3 text-xs font-semibold transition hover:border-primary hover:text-primary"
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t bg-navy text-navy-foreground">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap justify-between gap-8">
          <div>
            <Link to="/" className="brand-mark text-2xl font-extrabold">
              GCNM<span className="text-primary">.</span>
            </Link>
            <p className="mt-2 text-xs text-navy-foreground/70">Global Commerce Network Map</p>
          </div>
          <nav aria-label="Rodapé" className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
            <Link to="/explorar">Explorar</Link>
            <Link to="/empresas">Empresas</Link>
            <Link to="/publicar" search={{ kind: "product", external: true }}>
              Parceiros
            </Link>
            <Link to="/planos">Planos</Link>
            <Link to="/regras">Regras e segurança</Link>
          </nav>
        </div>
        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-navy-soft pt-5 text-[11px] text-navy-foreground/60">
          <span>© {new Date().getFullYear()} GCNM. Todos os direitos reservados.</span>
          <span>Uma ligação. Um mundo de possibilidades.</span>
        </div>
      </div>
    </footer>
  );
}
