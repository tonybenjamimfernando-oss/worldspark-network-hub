import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, Globe, ShoppingBag, Wrench, Megaphone, Building2, Users, Map, CreditCard, Plus, User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-[10px] font-extrabold text-primary-foreground">GCNM</span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-lg font-extrabold">GCNM</span>
            <span className="block text-[10px] tracking-wider text-muted-foreground">GLOBAL COMMERCE NETWORK MAP</span>
          </span>
        </Link>
        <form
          className="relative hidden flex-1 md:block"
          onSubmit={(e) => { e.preventDefault(); navigate({ to: "/explorar", search: { q } }); }}
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Pesquisar"
            placeholder="Pesquisar produtos, serviços, empresas..."
            className="h-10 w-full rounded-full border bg-secondary pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1 text-xs font-medium sm:flex"><Globe className="h-4 w-4" /> PT · EUR</span>
          {user ? (
            <>
              <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
                <Link to="/publicar" search={{ kind: "product" }}><Plus className="h-4 w-4" />Publicar</Link>
              </Button>
              <Button asChild size="sm"><Link to="/painel"><UserIcon className="h-4 w-4" />Painel</Link></Button>
            </>
          ) : (
            <Button asChild size="sm"><Link to="/auth">Entrar</Link></Button>
          )}
        </div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 pb-2">
        {NAV.map((n) => (
          <Link
            key={n.label}
            to={n.to}
            search={("search" in n ? n.search : {}) as never}
            className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm hover:bg-secondary"
          >
            <n.icon className="h-4 w-4" />{n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} GCNM — Global Commerce Network Map</span>
        <span className="flex gap-4">
          <Link to="/regras" className="hover:text-foreground">Regras e segurança</Link>
          <Link to="/planos" className="hover:text-foreground">Planos</Link>
        </span>
      </div>
    </footer>
  );
}
