import { Link } from "@tanstack/react-router";
import { MapPin, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KINDS, categoryLabel, formatPrice, type Kind } from "@/lib/catalog";
import { useSignedUrls } from "@/lib/media";

export type ListingRow = {
  id: string; kind: Kind; title: string; category: string; images: string[];
  price: number | null; currency: string; city: string | null; country: string | null;
};

export function ListingGrid({ items }: { items: ListingRow[] }) {
  const { data: urls } = useSignedUrls(items.map((i) => i.images[0]));
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((l) => (
        <Link key={l.id} to="/anuncio/$id" params={{ id: l.id }} className="group overflow-hidden rounded-2xl border bg-card transition hover:shadow-md">
          <div className="relative aspect-[4/3] bg-muted">
            {l.images[0] && urls?.[l.images[0]] ? (
              <img src={urls[l.images[0]]} alt={l.title} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground"><PackageOpen className="h-8 w-8" /></div>
            )}
            <span className="absolute left-2 top-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-accent-foreground">{KINDS[l.kind]}</span>
          </div>
          <div className="space-y-1 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{categoryLabel(l.category)}</p>
            <h3 className="line-clamp-2 font-semibold group-hover:text-primary">{l.title}</h3>
            <p className="font-bold text-primary">{formatPrice(l.price, l.currency)}</p>
            {(l.city || l.country) && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{[l.city, l.country].filter(Boolean).join(", ")}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export function EmptyListings({ kind = "product" }: { kind?: Kind }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
      <PackageOpen className="mx-auto h-10 w-10 text-primary" />
      <h3 className="mt-3 text-lg font-bold">Ainda não há anúncios aqui</h3>
      <p className="mt-1 text-sm text-muted-foreground">O GCNM está a começar. Sê o primeiro a publicar nesta secção.</p>
      <Button asChild className="mt-5"><Link to="/publicar" search={{ kind }}>Publicar</Link></Button>
    </div>
  );
}
