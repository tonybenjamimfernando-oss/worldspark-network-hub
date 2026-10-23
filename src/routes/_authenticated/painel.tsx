import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, MousePointerClick, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { ACCOUNT_TYPES, KINDS } from "@/lib/catalog";
import { uploadImage, useSignedUrls } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel de parceiro — GCNM" },
      { name: "description", content: "Gere o teu perfil, ofertas e links de afiliado no GCNM." },
      { property: "og:title", content: "Painel de parceiro — GCNM" },
      { property: "og:description", content: "O teu perfil e as tuas ofertas no mercado global." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

type ProfileForm = {
  display_name: string;
  account_type: keyof typeof ACCOUNT_TYPES;
  bio: string;
  company_name: string;
  tax_id: string;
  services: string;
  public_phone: string;
  public_email: string;
  website: string;
  city: string;
  country: string;
  avatar_url: string | null;
  is_public: boolean;
};

function Dashboard() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useQuery({
    queryKey: ["me", user.id],
    queryFn: async () =>
      (await supabase.from("profiles").select("*").eq("id", user.id).single()).data,
  });
  const { data: privateProfile, isLoading: privateProfileLoading, isError: privateProfileError } = useQuery({
    queryKey: ["private-profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_private")
        .select("tax_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: listings } = useQuery({
    queryKey: ["my-listings", user.id],
    queryFn: async () =>
      (
        await supabase
          .from("listings")
          .select("id,title,kind,status,views,outbound_clicks,is_external,created_at")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });
  const { data: affLinks } = useQuery({
    queryKey: ["my-aff", user.id],
    queryFn: async () =>
      (
        await supabase
          .from("affiliate_links")
          .select("code,clicks,listing_id,listing:listings(title)")
          .eq("affiliate_id", user.id)
      ).data ?? [],
  });
  const [f, setF] = useState<ProfileForm | null>(null);
  useEffect(() => {
    if (profile && !privateProfileLoading && !privateProfileError)
      setF({
        display_name: profile.display_name,
        account_type: profile.account_type,
        bio: profile.bio ?? "",
        company_name: profile.company_name ?? "",
        tax_id: privateProfile?.tax_id ?? "",
        services: profile.services.join(", "),
        public_phone: profile.public_phone ?? "",
        public_email: profile.public_email ?? "",
        website: profile.website ?? "",
        city: profile.city ?? "",
        country: profile.country ?? "",
        avatar_url: profile.avatar_url,
        is_public: profile.is_public,
      });
  }, [profile, privateProfile, privateProfileLoading, privateProfileError]);
  const { data: urls } = useSignedUrls([f?.avatar_url]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f) return;
    const n = (v: string) => v.trim() || null;
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: f.display_name.trim(),
        account_type: f.account_type,
        bio: n(f.bio),
        company_name: n(f.company_name),
        services: f.services
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 20),
        public_phone: n(f.public_phone),
        public_email: n(f.public_email),
        website: n(f.website),
        city: n(f.city),
        country: n(f.country),
        avatar_url: f.avatar_url,
        is_public: f.is_public,
      })
      .eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { error: privateError } = await supabase
      .from("profile_private")
      .upsert({ user_id: user.id, tax_id: n(f.tax_id) }, { onConflict: "user_id" });
    if (privateError) {
      toast.error("O perfil foi guardado, mas não foi possível guardar o NIF privado.");
      return;
    }
    toast.success("Perfil guardado");
    qc.invalidateQueries({ queryKey: ["me"] });
    qc.invalidateQueries({ queryKey: ["private-profile", user.id] });
  }
  async function toggle(id: string, status: string) {
    const nextStatus = status === "active" ? "hidden" : "active";
    const { error } = await supabase
      .from("listings")
      .update({ status: nextStatus })
      .eq("id", id)
      .eq("owner_id", user.id);

    if (error) {
      toast.error("Não foi possível atualizar o anúncio. Verifica a ligação e tenta novamente.");
      return;
    }

    toast.success(nextStatus === "active" ? "Anúncio reactivado." : "Anúncio ocultado.");
    await qc.invalidateQueries({ queryKey: ["my-listings", user.id] });
  }
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const s =
    (k: keyof ProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      f && setF({ ...f, [k]: e.target.value });
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="page-heading flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Painel de parceiro</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/u/$id" params={{ id: user.id }}>
              Ver perfil público
            </Link>
          </Button>
          <Button variant="ghost" onClick={signOut}>
            Sair
          </Button>
        </div>
      </div>

      <section className="mt-7 space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Centro de gestão GCNM</p>
          <h2 className="mt-1 text-2xl font-extrabold">A tua presença comercial, num só lugar</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Escolhe o tipo de atividade que queres desenvolver. Os atalhos levam às áreas existentes; os módulos financeiros e analíticos avançados só devem apresentar dados reais quando estiverem ligados às respetivas fontes.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Vendedor e catálogo", description: "Produtos, ofertas externas, estado das publicações e apresentação comercial.", href: "/publicar", label: "Gerir catálogo" },
            { title: "Empresa e marca", description: "Presença empresarial, identidade pública, contactos e oportunidades B2B.", href: "/empresas", label: "Área empresarial" },
            { title: "Freelancer e especialista", description: "Especialidades, serviços, portefólio e descoberta por clientes.", href: "/freelancers", label: "Área profissional" },
            { title: "Marketing e promoção", description: "Planos, posicionamento da oferta e caminhos para ampliar o alcance.", href: "/planos", label: "Ver promoção" },
            { title: "Clientes e conversas", description: "Acede às mensagens para dar seguimento aos contactos comerciais.", href: "/mensagens", label: "Abrir mensagens" },
            { title: "Mercado e localização", description: "Descobre mercados e oportunidades regionais através do mapa.", href: "/mapa", label: "Explorar mapa" },
            { title: "Pedidos e oportunidades", description: "Encontra necessidades publicadas e oportunidades comerciais.", href: "/explorar?kind=request", label: "Ver pedidos" },
            { title: "Confiança e conta", description: "Consulta regras e mantém a tua atividade comercial transparente.", href: "/regras", label: "Ver orientações" },
          ].map((item) => (
            <article key={item.title} className="group rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <h3 className="font-bold">{item.title}</h3>
              <p className="mt-2 min-h-12 text-sm leading-5 text-muted-foreground">{item.description}</p>
              <Link to={item.href as never} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                {item.label} <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-sky-400/20 bg-sky-500/[.06] p-4"><p className="text-sm text-muted-foreground">Visualizações dos anúncios</p><p className="mt-2 text-2xl font-extrabold">{(listings ?? []).reduce((sum, item) => sum + (item.views ?? 0), 0).toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">Total reportado pelos anúncios da tua conta</p></div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[.06] p-4"><p className="text-sm text-muted-foreground">Cliques de saída</p><p className="mt-2 text-2xl font-extrabold">{(listings ?? []).reduce((sum, item) => sum + (item.outbound_clicks ?? 0), 0).toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">Interações de saída registadas</p></div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[.06] p-4"><p className="text-sm text-muted-foreground">Ofertas publicadas</p><p className="mt-2 text-2xl font-extrabold">{(listings ?? []).length.toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">Anúncios associados à tua conta</p></div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {privateProfileError && (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível carregar os dados privados do perfil. Actualiza a página antes de editar.
          </p>
        )}
        {f && !privateProfileLoading && !privateProfileError && (
          <form onSubmit={save} className="space-y-4 lg:border-r lg:pr-6">
            <h2 className="font-bold">O meu perfil</h2>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-brand-soft">
                {f.avatar_url && urls[f.avatar_url] && (
                  <img src={urls[f.avatar_url]} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <label className="cursor-pointer text-sm text-primary">
                Alterar fotografia
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const p = await uploadImage(user.id, file, "avatar");
                      setF({ ...f, avatar_url: p });
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Erro");
                    }
                  }}
                />
              </label>
            </div>
            <L label="Tipo de conta">
              <select
                className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                value={f.account_type}
                onChange={s("account_type")}
              >
                {Object.entries(ACCOUNT_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </L>
            <L label="Nome">
              <Input required value={f.display_name} onChange={s("display_name")} />
            </L>
            {f.account_type === "business" && (
              <div className="grid grid-cols-2 gap-2">
                <L label="Empresa">
                  <Input value={f.company_name} onChange={s("company_name")} />
                </L>
                <L label="NIF (privado)">
                  <Input value={f.tax_id} onChange={s("tax_id")} />
                </L>
              </div>
            )}
            {f.account_type !== "personal" && (
              <L label="Serviços / especialidades (separados por vírgula)">
                <Input value={f.services} onChange={s("services")} />
              </L>
            )}
            <L label="Biografia">
              <Textarea rows={3} value={f.bio} onChange={s("bio")} />
            </L>
            <div className="grid grid-cols-2 gap-2">
              <L label="Cidade">
                <Input value={f.city} onChange={s("city")} />
              </L>
              <L label="País">
                <Input value={f.country} onChange={s("country")} />
              </L>
            </div>
            <p className="text-xs text-muted-foreground">
              Os contactos abaixo ficam visíveis publicamente. Deixa em branco para os ocultar.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <L label="Telefone público">
                <Input value={f.public_phone} onChange={s("public_phone")} />
              </L>
              <L label="Email público">
                <Input type="email" value={f.public_email} onChange={s("public_email")} />
              </L>
            </div>
            <L label="Website">
              <Input type="url" value={f.website} onChange={s("website")} />
            </L>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={f.is_public} onCheckedChange={(v) => setF({ ...f, is_public: v })} />
              Perfil público
            </label>
            <Button type="submit">Guardar</Button>
          </form>
        )}

        <div className="space-y-6">
          <section className="border-b pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold">As minhas ofertas</h2>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to="/publicar" search={{ kind: "product", external: true }}>
                    Importar link externo
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/publicar" search={{ kind: "product" }}>
                    <Plus className="h-4 w-4" />
                    Nova
                  </Link>
                </Button>
              </div>
            </div>
            <ul className="mt-3 divide-y">
              {listings?.map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/anuncio/$id"
                      params={{ id: l.id }}
                      className="block truncate font-medium hover:text-primary"
                    >
                      {l.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {KINDS[l.kind]}
                      {l.is_external && " · externa"} · <Eye className="inline h-3 w-3" /> {l.views}{" "}
                      · <MousePointerClick className="inline h-3 w-3" /> {l.outbound_clicks}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toggle(l.id, l.status)}>
                    {l.status === "active" ? "Ocultar" : "Ativar"}
                  </Button>
                </li>
              ))}
              {listings?.length === 0 && (
                <li className="py-3 text-sm text-muted-foreground">Ainda não publicaste nada.</li>
              )}
            </ul>
          </section>
          <section className="py-2">
            <h2 className="font-bold">Links de afiliado</h2>
            <ul className="mt-3 divide-y text-sm">
              {affLinks?.map((a) => (
                <li key={a.code} className="flex justify-between py-2">
                  <Link
                    to="/anuncio/$id"
                    params={{ id: a.listing_id }}
                    className="truncate hover:text-primary"
                  >
                    {a.listing?.title}
                  </Link>
                  <span>{a.clicks} cliques</span>
                </li>
              ))}
              {affLinks?.length === 0 && (
                <li className="py-2 text-muted-foreground">
                  Gera links nas páginas de anúncios com afiliação ativa.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
