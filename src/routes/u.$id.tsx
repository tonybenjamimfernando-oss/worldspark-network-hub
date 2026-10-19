import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Globe, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ACCOUNT_TYPES } from "@/lib/catalog";
import { useSignedUrls } from "@/lib/media";
import { ListingGrid, type ListingRow } from "@/components/ListingCard";

export const Route = createFileRoute("/u/$id")({
  head: () => ({
    meta: [
      { title: "Perfil — GCNM" },
      { name: "description", content: "Perfil público, ofertas e reputação no GCNM." },
      { property: "og:title", content: "Perfil — GCNM" },
      { property: "og:description", content: "Perfil público, ofertas e reputação no GCNM." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { id } = Route.useParams();
  const { data: p, isLoading } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => (await supabase.from("profiles").select("id,display_name,account_type,bio,avatar_url,company_name,services,public_phone,public_email,website,city,country,is_verified,created_at").eq("id", id).maybeSingle()).data,
  });
  const { data: listings } = useQuery({
    queryKey: ["profile-listings", id],
    queryFn: async () => (await supabase.from("listings").select("id,kind,title,category,images,price,currency,city,country").eq("owner_id", id).eq("status", "active").order("created_at", { ascending: false })).data as ListingRow[] ?? [],
  });
  const { data: rating } = useQuery({
    queryKey: ["profile-rating", id, listings?.length],
    enabled: !!listings?.length,
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("rating").in("listing_id", listings!.map((l) => l.id)).eq("status", "visible");
      return data?.length ? { avg: data.reduce((s, r) => s + r.rating, 0) / data.length, n: data.length } : null;
    },
  });
  const { data: urls } = useSignedUrls([p?.avatar_url]);

  if (isLoading) return <div className="mx-auto max-w-5xl px-4 py-10"><div className="h-48 animate-pulse rounded-3xl bg-muted" /></div>;
  if (!p) return <div className="py-20 text-center"><h1 className="text-2xl font-bold">Perfil indisponível</h1><Button asChild className="mt-4"><Link to="/">Início</Link></Button></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="hero-glow flex flex-col gap-5 border-b-4 border-primary p-6 text-navy-foreground sm:flex-row sm:items-center sm:p-8">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-primary bg-navy-soft">{p.avatar_url && urls[p.avatar_url] && <img src={urls[p.avatar_url]} alt={p.display_name} className="h-full w-full object-cover" />}</div>
        <div>
          <span className="rounded-full bg-navy-soft px-3 py-1 text-xs">{ACCOUNT_TYPES[p.account_type]}</span>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-extrabold">{p.company_name || p.display_name}{p.is_verified && <BadgeCheck className="h-6 w-6 text-primary" aria-label="Verificado" />}</h1>
          <p className="mt-1 text-sm opacity-80">
            {(p.city || p.country) && <><MapPin className="inline h-4 w-4" /> {[p.city, p.country].filter(Boolean).join(", ")} · </>}
            Membro desde {new Date(p.created_at).getFullYear()}{rating && ` · ★ ${rating.avg.toFixed(1)} (${rating.n})`}
          </p>
        </div>
      </section>
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_2fr]">
        <aside className="space-y-4 border-t pt-5 text-sm md:border-r md:border-t-0 md:pr-6">
          {p.bio && <p className="text-muted-foreground">{p.bio}</p>}
          {p.services.length > 0 && <div className="flex flex-wrap gap-1">{p.services.map((s) => <span key={s} className="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-accent-foreground">{s}</span>)}</div>}
          {p.public_phone && <a href={`tel:${p.public_phone}`} className="flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4" />{p.public_phone}</a>}
          {p.public_email && <a href={`mailto:${p.public_email}`} className="flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4" />{p.public_email}</a>}
          {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-2 hover:text-primary"><Globe className="h-4 w-4" />Website</a>}
        </aside>
        <div>
          <h2 className="mb-3 text-xl font-bold">Ofertas ({listings?.length ?? 0})</h2>
          {listings?.length ? <ListingGrid items={listings} /> : <p className="text-sm text-muted-foreground">Sem ofertas ativas.</p>}
        </div>
      </div>
    </div>
  );
}
