import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Home,
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
  Command,
  ShieldCheck,
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
import { supabase } from "@/integrations/supabase/client";
import { Globe as BrandGlobe } from "@/components/Globe";

const NAV = [
  { to: "/explorar", search: { kind: "product" }, label: "Comprar", icon: ShoppingBag },
  { to: "/explorar", search: { kind: "service" }, label: "Serviços", icon: Wrench },
  { to: "/explorar", search: { kind: "request" }, label: "Pedidos de compra", icon: Megaphone },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/freelancers", label: "Freelancers", icon: Users },
  { to: "/mapa", label: "Mapa", icon: Map },
  { to: "/centro", label: "Centro de comando", icon: Command },
  { to: "/universo", label: "Universo GCNM", icon: Globe },
  { to: "/planos", label: "Planos", icon: CreditCard },
] as const;

export function SiteHeader() {
  const { user } = useUser();
  const { data: isAdmin = false } = useQuery({
    queryKey: ["header-admin-role", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) return false;
      return data === true;
    },
    retry: false,
  });
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <>
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
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-primary hover:bg-secondary"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Centro administrativo
                </Link>
              )}
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
          <span className="grid h-11 w-11 place-items-center rounded-full bg-navy">
            <BrandGlobe className="h-10 w-10" />
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
          <span className="hidden items-center gap-1.5 text-xs font-semibold text-muted-foreground lg:flex">
            <Globe className="h-4 w-4 text-primary" /> Mercado global
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
          {isAdmin && (
            <Button asChild size="sm" variant="secondary" className="hidden xl:inline-flex">
              <Link to="/admin">
                <ShieldCheck />
                Administração
              </Link>
            </Button>
          )}
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
        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-2 border-b-2 border-transparent px-3 py-3 text-xs font-semibold text-primary transition hover:border-primary"
          >
            <ShieldCheck className="h-4 w-4" />
            Administração
          </Link>
        )}
      </nav>
    </header>
    <nav aria-label="Atalhos móveis" className="mobile-shortcuts fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-md md:hidden">
      {([
        { label: "Início", to: "/", icon: Home },
        { label: "Comprar", to: "/explorar", search: { kind: "product" }, icon: ShoppingBag },
        { label: "Pedidos", to: "/explorar", search: { kind: "request" }, icon: Megaphone },
        { label: "Centro", to: "/centro", icon: Command },
        { label: "Publicar", to: "/publicar", search: { kind: "product" }, icon: Plus },
        { label: user ? "Painel" : "Entrar", to: user ? "/painel" : "/auth", icon: UserIcon },
      ] as const).map((item) => (
        <Link
          key={item.label}
          to={item.to}
          search={("search" in item ? item.search : {}) as never}
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 py-1 text-[10px] font-semibold text-muted-foreground transition hover:bg-secondary hover:text-primary"
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
    </>
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
