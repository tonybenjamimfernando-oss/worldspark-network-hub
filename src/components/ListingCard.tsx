import { Link } from "@tanstack/react-router";
import { MapPin, PackageOpen, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KINDS, categoryLabel, formatPrice, type Kind } from "@/lib/catalog";
import { useSignedUrls } from "@/lib/media";

export type ListingRow = {
  id: string;
  kind: Kind;
  title: string;
  category: string;
  images: string[];
  price: number | null;
  currency: string;
  city: string | null;
  country: string | null;
  is_external?: boolean | null;
  source_platform?: string | null;
};

export function ListingGrid({ items }: { items: ListingRow[] }) {
  const { data: urls } = useSignedUrls(items.map((i) => i.images[0]));
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((l) => (
        <Link
          key={l.id}
          to="/anuncio/$id"
          params={{ id: l.id }}
          className="listing-card group overflow-hidden rounded-lg border bg-card transition duration-200"
        >
          <div className="relative aspect-[4/3] bg-muted">
            {l.images[0] && urls?.[l.images[0]] ? (
              <img
                src={urls[l.images[0]]}
                alt={l.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">
                <PackageOpen className="h-8 w-8" />
              </div>
            )}
            <span className="absolute bottom-3 left-3 rounded-md border border-border bg-card/95 px-2.5 py-1 text-[10px] font-bold text-foreground shadow-sm">
              {KINDS[l.kind]}
            </span>
            {l.is_external && (
              <span className="absolute right-3 top-3 max-w-[58%] truncate rounded-full bg-navy/95 px-2.5 py-1 text-[10px] font-semibold text-navy-foreground shadow-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold align-middle mr-1.5" />
                {l.source_platform || "Loja externa"}
              </span>
            )}
          </div>
          <div className="space-y-2 p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">
              {categoryLabel(l.category)}
            </p>
            <h3 className="line-clamp-2 min-h-10 text-sm font-semibold group-hover:text-primary">
              {l.title}
            </h3>
            <p className="font-bold text-primary">{formatPrice(l.price, l.currency)}</p>
            {(l.city || l.country) && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {[l.city, l.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export function EmptyListings({ kind = "product" }: { kind?: Kind | undefined }) {
  const empty = {
    product: { title: "Ainda não há produtos publicados", action: "Publicar produto" },
    service: { title: "Ainda não há serviços publicados", action: "Oferecer serviço" },
    request: { title: "Ainda não há pedidos de compra", action: "Criar pedido" },
    opportunity: { title: "Ainda não há oportunidades publicadas", action: "Publicar oportunidade" },
  }[kind];
  return (
    <div className="flex flex-col items-start justify-between gap-4 border-t border-dashed py-5 sm:flex-row sm:items-center">
      <div className="flex items-start gap-4">
        <PackageOpen className="mt-1 h-6 w-6 shrink-0 text-primary" />
        <div>
          <h3 className="text-sm font-semibold">{empty.title}</h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {kind === "request" ? "Diz o que procuras e recebe propostas de fornecedores." : "As novas publicações aparecerão aqui."}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to="/explorar">
            Explorar
            <ArrowRight />
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/publicar" search={{ kind }}>
            <Plus />
            {empty.action}
          </Link>
        </Button>
      </div>
    </div>
  );
}
