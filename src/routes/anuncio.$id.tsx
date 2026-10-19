import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { BadgeCheck, ExternalLink, Flag, MapPin, Share2, Star, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { KINDS, categoryLabel, formatPrice } from "@/lib/catalog";
import { useSignedUrls } from "@/lib/media";
import { RequestMatches } from "@/components/RequestMatches";

export const Route = createFileRoute("/anuncio/$id")({
  validateSearch: z.object({ ref: z.string().max(20).optional() }),
  head: () => ({
    meta: [
      { title: "Anúncio — GCNM" },
      {
        name: "description",
        content: "Detalhes do anúncio, vendedor, avaliações e condições no GCNM.",
      },
      { property: "og:title", content: "Anúncio — GCNM" },
      {
        property: "og:description",
        content: "Detalhes do anúncio, vendedor e avaliações no GCNM.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ListingPage,
});

const RELATION = {
  owner: "Loja proprietária",
  representative: "Representante autorizado",
  sharer: "Link partilhado por um utilizador",
} as const;

function ListingPage() {
  const { id } = Route.useParams();
  const { ref } = Route.useSearch();
  const { user } = useUser();
  const { data: l, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(
          "*, owner:profiles!listings_owner_id_fkey(id,display_name,avatar_url,is_verified,account_type,city,country,public_phone,public_email)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: urls } = useSignedUrls([...(l?.images ?? []), l?.owner?.avatar_url]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    supabase.rpc("track_listing", { _id: id, _kind: "view" });
    if (ref && !sessionStorage.getItem(`ref-${ref}`)) {
      sessionStorage.setItem(`ref-${ref}`, "1");
      supabase.rpc("track_affiliate_click", { _code: ref });
    }
  }, [id, ref]);

  if (isLoading)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-96 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  if (!l)
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Anúncio não encontrado</h1>
        <Button asChild className="mt-6">
          <Link to="/explorar">Explorar anúncios</Link>
        </Button>
      </div>
    );

  const isOwner = user?.id === l.owner_id;
  const img = l.images[active];
  const share = async () => {
    const url = `${window.location.origin}/anuncio/${l.id}`;
    if (navigator.share) await navigator.share({ title: l.title, url }).catch(() => {});
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    }
  };
  const goExternal = () => {
    supabase.rpc("track_listing", { _id: l.id, _kind: "out" });
    window.open(l.source_url!, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link to="/explorar" search={{ kind: l.kind }} className="hover:text-primary">
          {KINDS[l.kind]}
        </Link>{" "}
        /{" "}
        <Link to="/explorar" search={{ category: l.category }} className="hover:text-primary">
          {categoryLabel(l.category)}
        </Link>
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="aspect-[4/3] overflow-hidden rounded-lg border bg-card">
            {img && urls[img] ? (
              <img src={urls[img]} alt={l.title} className="h-full w-full object-contain" />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">Sem imagem</div>
            )}
          </div>
          {l.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {l.images.map((p, i) => (
                <Button
                  key={p}
                  variant="ghost"
                  onClick={() => setActive(i)}
                  aria-label={`Imagem ${i + 1}`}
                  aria-pressed={i === active}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 p-0 ${i === active ? "border-primary" : "border-transparent"}`}
                >
                  {urls[p] && <img src={urls[p]} alt="" className="h-full w-full object-cover" />}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-accent-foreground">
              {KINDS[l.kind]}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight">{l.title}</h1>
            <p className="mt-2 text-3xl font-extrabold text-primary">
              {l.kind === "request"
                ? l.budget_max != null
                  ? `Até ${formatPrice(l.budget_max, l.currency)}`
                  : "Orçamento aberto"
                : formatPrice(l.price, l.currency)}
            </p>
            {(l.city || l.country) && (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {[l.city, l.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          {l.is_external && l.source_url && (
            <div className="border-l-2 border-primary bg-secondary p-5 text-sm">
              <p className="flex items-center gap-2 font-semibold">
                <Store className="h-4 w-4" />
                Vendido em {l.source_platform ?? "loja externa"}
                {l.source_store ? ` · ${l.source_store}` : ""}
              </p>
              <p className="mt-1 text-muted-foreground">
                {RELATION[l.publisher_relation as keyof typeof RELATION]}. A compra é feita na loja
                original.
              </p>
              {l.source_checked_at && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Dados atualizados em {new Date(l.source_checked_at).toLocaleDateString("pt-PT")} —
                  confirma o preço na loja.
                </p>
              )}
              <Button className="mt-3 w-full" onClick={goExternal}>
                <ExternalLink className="h-4 w-4" />
                Ver na loja original
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={share}>
              <Share2 className="h-4 w-4" />
              Partilhar
            </Button>
          </div>

          <SellerCard
            owner={l.owner}
            avatar={l.owner?.avatar_url ? urls[l.owner.avatar_url] : undefined}
            showContact={l.kind !== "request" || l.contact_visibility === "public"}
          />

          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Marca", l.brand],
              ["Estado", l.condition],
              ["Stock", l.stock],
              ["Quantidade", l.quantity],
              ["Variantes", l.variants],
              ["Entrega", l.delivery],
              ["Garantia", l.warranty],
              ["Devoluções", l.returns_policy],
              ["Prazo", l.deadline && new Date(l.deadline).toLocaleDateString("pt-PT")],
            ]
              .filter(([, v]) => v != null && v !== "")
              .map(([k, v]) => (
                <div key={k as string} className="border-b py-3">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-1 font-medium">{String(v)}</dd>
                </div>
              ))}
          </dl>
        </div>
      </div>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold">Descrição</h2>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">
              {l.description || "Sem descrição."}
            </p>
          </div>
          {l.features && (
            <div>
              <h2 className="text-xl font-bold">Características</h2>
              <ul className="mt-2 list-inside list-disc text-muted-foreground">
                {l.features
                  .split("\n")
                  .filter(Boolean)
                  .map((x) => (
                    <li key={x}>{x}</li>
                  ))}
              </ul>
            </div>
          )}
          {l.terms && (
            <div>
              <h2 className="text-xl font-bold">Condições comerciais</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{l.terms}</p>
            </div>
          )}
          {l.video_url && (
            <a
              href={l.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary"
            >
              Ver vídeo <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {l.kind === "request" && (
            <RequestMatches
              request={{
                id: l.id,
                category: l.category,
                budget_max: l.budget_max,
                currency: l.currency,
                city: l.city,
                country: l.country,
              }}
            />
          )}
          {l.kind === "request" ? (
            <Proposals requestId={l.id} isOwner={isOwner} userId={user?.id} currency={l.currency} />
          ) : (
            <Reviews listingId={l.id} isOwner={isOwner} userId={user?.id} />
          )}
        </div>
        <div>
          {l.affiliate_enabled && !isOwner && (
            <AffiliateBox listingId={l.id} commission={l.affiliate_commission} userId={user?.id} />
          )}
        </div>
      </section>
    </div>
  );
}

type Owner = {
  id: string;
  display_name: string;
  is_verified: boolean;
  city: string | null;
  country: string | null;
  public_phone: string | null;
  public_email: string | null;
} | null;
function SellerCard({
  owner,
  avatar,
  showContact,
}: {
  owner: Owner;
  avatar?: string | undefined;
  showContact: boolean;
}) {
  if (!owner) return null;
  return (
    <div className="flex items-center gap-3 border-y py-5">
      <div className="h-12 w-12 overflow-hidden rounded-full bg-brand-soft">
        {avatar && <img src={avatar} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <Link
          to="/u/$id"
          params={{ id: owner.id }}
          className="flex items-center gap-1 font-semibold hover:text-primary"
        >
          {owner.display_name || "Utilizador"}
          {owner.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
        </Link>
        {showContact && (owner.public_phone || owner.public_email) && (
          <p className="truncate text-xs text-muted-foreground">
            {[owner.public_phone, owner.public_email].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <Button asChild size="sm" variant="outline">
        <Link to="/u/$id" params={{ id: owner.id }}>
          Ver perfil
        </Link>
      </Button>
    </div>
  );
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Button
          key={i}
          type="button"
          variant="ghost"
          className="h-10 w-8 p-0 disabled:opacity-100"
          disabled={!onChange}
          onClick={() => onChange?.(i)}
          aria-label={`${i} estrelas`}
        >
          <Star className={`h-5 w-5 ${i <= value ? "fill-star text-star" : "text-border"}`} />
        </Button>
      ))}
    </div>
  );
}

function Reviews({
  listingId,
  isOwner,
  userId,
}: {
  listingId: string;
  isOwner: boolean;
  userId?: string | undefined;
}) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["reviews", listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id,rating,comment,created_at,author_id,author:profiles!reviews_author_id_fkey(display_name)",
        )
        .eq("listing_id", listingId)
        .eq("status", "visible")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const avg = data?.length ? data.reduce((s, r) => s + r.rating, 0) / data.length : 0;
  const mine = data?.some((r) => r.author_id === userId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      return;
    }
    const { error } = await supabase
      .from("reviews")
      .insert({ listing_id: listingId, author_id: userId, rating, comment: comment.trim() });
    if (error) {
      toast.error(error.message);
      return;
    }
    setComment("");
    toast.success("Avaliação publicada");
    qc.invalidateQueries({ queryKey: ["reviews", listingId] });
  }
  async function report(id: string) {
    if (!userId) {
      toast.error("Entra para denunciar");
      return;
    }
    const reason = window.prompt("Motivo da denúncia");
    if (!reason || reason.trim().length < 3) {
      return;
    }
    const { error } = await supabase
      .from("review_reports")
      .insert({ review_id: id, reporter_id: userId, reason: reason.trim() });
    toast[error ? "error" : "success"](
      error ? "Já denunciaste este comentário" : "Denúncia enviada para moderação",
    );
  }

  return (
    <div>
      <h2 className="flex items-center gap-3 text-xl font-bold">
        Avaliações{" "}
        {data?.length ? (
          <span className="flex items-center gap-1 text-base">
            <Stars value={Math.round(avg)} />
            {avg.toFixed(1)} ({data.length})
          </span>
        ) : null}
      </h2>
      {userId && !isOwner && !mine && (
        <form onSubmit={submit} className="mt-4 space-y-3 border-y py-5">
          <Stars value={rating} onChange={setRating} />
          <Textarea
            maxLength={2000}
            placeholder="Partilha a tua experiência"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button type="submit" size="sm">
            Publicar avaliação
          </Button>
        </form>
      )}
      {!userId && (
        <p className="mt-2 text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary">
            Entra
          </Link>{" "}
          para avaliar.
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {data?.map((r) => (
          <li key={r.id} className="border-b py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{r.author?.display_name ?? "Utilizador"}</span>
              <Stars value={r.rating} />
            </div>
            {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{new Date(r.created_at).toLocaleDateString("pt-PT")}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => report(r.id)}
                className="flex items-center gap-1 hover:text-destructive"
              >
                <Flag className="h-3 w-3" />
                Denunciar
              </Button>
            </div>
          </li>
        ))}
        {data?.length === 0 && (
          <li className="text-sm text-muted-foreground">Ainda sem avaliações.</li>
        )}
      </ul>
    </div>
  );
}

function Proposals({
  requestId,
  isOwner,
  userId,
  currency,
}: {
  requestId: string;
  isOwner: boolean;
  userId?: string | undefined;
  currency: string;
}) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["proposals", requestId, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select(
          "*, supplier:profiles!proposals_supplier_id_fkey(id,display_name,is_verified,public_phone,public_email)",
        )
        .eq("request_id", requestId)
        .order("price", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");
  const [msg, setMsg] = useState("");
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("proposals").insert({
      request_id: requestId,
      supplier_id: userId!,
      price: price ? Number(price) : null,
      currency,
      delivery_days: days ? Number(days) : null,
      message: msg.trim(),
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Já enviaste uma proposta" : error.message);
      return;
    }
    toast.success("Proposta enviada");
    qc.invalidateQueries({ queryKey: ["proposals", requestId] });
  }
  async function setStatus(id: string, status: "accepted" | "declined") {
    const { error } = await supabase.from("proposals").update({ status }).eq("id", id);
    if (error) {
      toast.error("Não foi possível atualizar a proposta. Tenta novamente.");
      return;
    }
    toast.success(status === "accepted" ? "Proposta aceite" : "Proposta recusada");
    await qc.invalidateQueries({ queryKey: ["proposals", requestId] });
  }
  return (
    <div>
      <h2 className="text-xl font-bold">Propostas de fornecedores</h2>
      {!userId && (
        <p className="mt-2 text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary">
            Entra
          </Link>{" "}
          para enviar uma proposta.
        </p>
      )}
      {userId && !isOwner && !data?.length && (
        <form onSubmit={send} className="mt-4 space-y-3 border-y py-5">
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder={`Preço (${currency})`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Input
              type="number"
              min="0"
              placeholder="Prazo (dias)"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>
          <Textarea
            required
            minLength={5}
            maxLength={3000}
            placeholder="Descreve a tua oferta"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
          <Button type="submit" size="sm">
            Enviar proposta
          </Button>
        </form>
      )}
      <ul className="mt-4 space-y-3">
        {data?.map((p) => (
          <li key={p.id} className="rounded-lg border bg-card p-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2 font-semibold">
              <span>{p.supplier?.display_name}</span>
              <span className="text-primary">
                {formatPrice(p.price, p.currency)}
                {p.delivery_days != null && ` · ${p.delivery_days} dias`}
              </span>
            </div>
            <p className="mt-1 text-muted-foreground">{p.message}</p>
            {isOwner && p.supplier && (p.supplier.public_phone || p.supplier.public_email) && (
              <p className="mt-1 text-xs">
                {[p.supplier.public_phone, p.supplier.public_email].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="rounded-full bg-secondary px-2 py-0.5">
                {p.status === "sent" ? "Enviada" : p.status === "accepted" ? "Aceite" : "Recusada"}
              </span>
              {isOwner && p.status === "sent" && (
                <>
                  <Button size="sm" onClick={() => setStatus(p.id, "accepted")}>
                    Aceitar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "declined")}>
                    Recusar
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
        {isOwner && data?.length === 0 && (
          <li className="text-sm text-muted-foreground">Ainda sem propostas.</li>
        )}
      </ul>
    </div>
  );
}

function AffiliateBox({
  listingId,
  commission,
  userId,
}: {
  listingId: string;
  commission: number | null;
  userId?: string | undefined;
}) {
  const qc = useQueryClient();
  const { data: link } = useQuery({
    queryKey: ["aff", listingId, userId],
    enabled: !!userId,
    queryFn: async () =>
      (
        await supabase
          .from("affiliate_links")
          .select("code,clicks")
          .eq("listing_id", listingId)
          .eq("affiliate_id", userId!)
          .maybeSingle()
      ).data,
  });
  async function create() {
    const { error } = await supabase
      .from("affiliate_links")
      .insert({ listing_id: listingId, affiliate_id: userId! });
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["aff", listingId] });
  }
  const url = link
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/anuncio/${listingId}?ref=${link.code}`
    : "";
  return (
    <div className="border-l-2 border-primary bg-secondary p-5">
      <h3 className="font-bold">Promover como afiliado</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        O vendedor propõe {commission ?? 0}% de comissão. Os cliques são contados; conversões e
        pagamentos de comissões ficarão disponíveis quando os pagamentos estiverem ativos.
      </p>
      {!userId ? (
        <Button asChild className="mt-3" size="sm">
          <Link to="/auth">Entrar para gerar link</Link>
        </Button>
      ) : link ? (
        <div className="mt-3 space-y-2">
          <Input readOnly value={url} onFocus={(e) => e.target.select()} />
          <div className="flex items-center justify-between text-sm">
            <span>{link.clicks} cliques</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(url);
                toast.success("Copiado");
              }}
            >
              Copiar
            </Button>
          </div>
        </div>
      ) : (
        <Button className="mt-3" size="sm" onClick={create}>
          Gerar o meu link
        </Button>
      )}
    </div>
  );
}
