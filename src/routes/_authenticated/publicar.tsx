import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { FileSpreadsheet, Link2, Upload, X } from "lucide-react";
import { parseExternalOffersCsv, type CsvExternalOffer } from "@/lib/external-offers-csv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, CONDITIONS, CURRENCIES, KINDS, type Kind } from "@/lib/catalog";
import { uploadImage, useSignedUrls } from "@/lib/media";
import { fetchUrlMeta } from "@/lib/meta.functions";

export const Route = createFileRoute("/_authenticated/publicar")({
  validateSearch: z.object({
    kind: z.enum(["product", "service", "request", "opportunity"]).optional(),
    external: z.boolean().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Publicar uma oferta — GCNM" },
      {
        name: "description",
        content: "Publica produtos, serviços, ofertas externas e pedidos de compra no GCNM.",
      },
      { property: "og:title", content: "Publicar uma oferta — GCNM" },
      { property: "og:description", content: "Apresenta a tua oferta ao mercado GCNM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Publish,
});

const empty = {
  title: "",
  description: "",
  category: "other",
  price: "",
  currency: "EUR",
  stock: "",
  brand: "",
  condition: "",
  variants: "",
  features: "",
  city: "",
  country: "",
  delivery: "",
  warranty: "",
  returns_policy: "",
  terms: "",
  video_url: "",
  affiliate_commission: "",
  source_url: "",
  source_platform: "",
  source_store: "",
  budget_max: "",
  quantity: "",
  deadline: "",
};

function Publish() {
  const search = Route.useSearch();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const fetchMeta = useServerFn(fetchUrlMeta);
  const [kind, setKind] = useState<Kind>(search.kind ?? "product");
  const [external, setExternal] = useState(!!search.external);
  const [relation, setRelation] = useState<"owner" | "representative" | "sharer">("owner");
  const [contactVis, setContactVis] = useState<"public" | "proposers" | "private">("proposers");
  const [f, setF] = useState(empty);
  const [images, setImages] = useState<string[]>([]);
  const [affiliate, setAffiliate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [csvOffers, setCsvOffers] = useState<CsvExternalOffer[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvBusy, setCsvBusy] = useState(false);
  const { data: urls } = useSignedUrls(images);
  const set =
    (k: keyof typeof empty) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF({ ...f, [k]: e.target.value });

  async function onFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files).slice(0, 8 - images.length)) {
      try {
        const p = await uploadImage(user.id, file, "listings");
        setImages((s) => [...s, p]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha no envio");
      }
    }
  }

  async function readCsv(file: File | undefined) {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setCsvOffers([]);
      setCsvErrors(["O ficheiro não pode ultrapassar 1 MB."]);
      return;
    }
    try {
      const result = parseExternalOffersCsv(await file.text());
      setCsvOffers(result.offers);
      setCsvErrors(result.errors);
      if (result.offers.length) toast.success(`${result.offers.length} ofertas válidas prontas para revisão.`);
      if (!result.offers.length && !result.errors.length) setCsvErrors(["Não foram encontradas ofertas válidas."]);
    } catch {
      setCsvOffers([]);
      setCsvErrors(["Não foi possível ler o ficheiro CSV."]);
    }
  }

  async function importCsvOffers() {
    if (!csvOffers.length) return;
    setCsvBusy(true);
    const rows = csvOffers.map((offer) => ({
      owner_id: user.id,
      kind: "product" as const,
      title: offer.title,
      description: offer.description || "",
      category: CATEGORIES.some((category) => category.id === offer.category) ? offer.category : "other",
      images: [],
      price: offer.price,
      currency: CURRENCIES.includes(offer.currency) ? offer.currency : "USD",
      is_external: true,
      source_url: offer.source_url,
      source_platform: offer.source_platform,
      source_store: offer.source_store,
      publisher_relation: "sharer" as const,
      source_checked_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("listings").insert(rows);
    setCsvBusy(false);
    if (error) {
      toast.error(error.message.includes("listings_source_url_unique")
        ? "Uma ou mais ofertas já estão publicadas. Remove duplicados e tenta novamente."
        : "Não foi possível importar as ofertas. Verifica os dados e tenta novamente.");
      return;
    }
    toast.success(`${rows.length} ofertas importadas com sucesso.`);
    setCsvOffers([]);
    setCsvErrors([]);
  }

  async function importUrl() {
    if (!f.source_url) return;
    setImporting(true);
    try {
      const r = await fetchMeta({ data: { url: f.source_url } });
      if (!r.ok) {
        setF((s) => ({ ...s, source_platform: r.platform ?? s.source_platform }));
        toast.warning(r.error);
        return;
      }
      setF((s) => ({
        ...s,
        title: r.title?.slice(0, 140) ?? s.title,
        description: r.description ?? s.description,
        source_platform: r.platform,
        source_store: r.store ?? s.source_store,
        price: r.price ?? s.price,
        currency: r.currency && CURRENCIES.includes(r.currency) ? r.currency : s.currency,
      }));
      if (r.image?.startsWith("https://"))
        setImages((s) => (s.includes(r.image!) ? s : [r.image!, ...s]));
      toast.success("Dados lidos da página da loja. Revê antes de publicar.");
    } catch {
      toast.error("Falha ao importar");
    } finally {
      setImporting(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const num = (v: string) => (v === "" ? null : Number(v));
    setBusy(true);
    const { data, error } = await supabase
      .from("listings")
      .insert({
        owner_id: user.id,
        kind,
        title: f.title.trim(),
        description: f.description.trim(),
        category: f.category,
        images,
        video_url: f.video_url || null,
        price: num(f.price),
        currency: f.currency,
        stock: num(f.stock),
        brand: f.brand || null,
        condition: f.condition || null,
        variants: f.variants || null,
        features: f.features || null,
        city: f.city || null,
        country: f.country || null,
        delivery: f.delivery || null,
        warranty: f.warranty || null,
        returns_policy: f.returns_policy || null,
        terms: f.terms || null,
        affiliate_enabled: affiliate && !external,
        affiliate_commission: affiliate ? num(f.affiliate_commission) : null,
        is_external: external,
        source_url: external ? f.source_url : null,
        source_platform: external ? f.source_platform || null : null,
        source_store: external ? f.source_store || null : null,
        publisher_relation: external ? relation : "owner",
        source_checked_at: external ? new Date().toISOString() : null,
        budget_max: kind === "request" ? num(f.budget_max) : null,
        quantity: num(f.quantity),
        deadline: kind === "request" && f.deadline ? f.deadline : null,
        contact_visibility: contactVis,
      })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("listings_source_url_unique")
          ? "Esta oferta externa já está publicada no GCNM."
          : error.message,
      );
      return;
    }
    toast.success("Publicado!");
    navigate({ to: "/anuncio/$id", params: { id: data.id } });
  }

  const isRequest = kind === "request";
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="page-heading">
        <p className="eyebrow mb-3 text-primary">ABRE AS PORTAS AO MERCADO</p>
        <h1 className="text-3xl font-bold">Publicar</h1>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(KINDS) as Kind[]).map((k) => (
          <Button
            key={k}
            type="button"
            variant={kind === k ? "default" : "outline"}
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
          >
            {KINDS[k]}
          </Button>
        ))}
      </div>

      <Section title="Importar ofertas em lote (CSV)">
        <p className="text-sm text-muted-foreground">
          Importa até 100 ofertas de um ficheiro CSV. Cada oferta deve ter título e link HTTPS.
          Os dados são pré-visualizados antes da publicação.
        </p>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-4 text-sm hover:border-primary">
          <FileSpreadsheet className="h-5 w-5" />
          <span>Escolher ficheiro CSV (máximo 1 MB)</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              void readCsv(e.target.files?.[0]);
              e.currentTarget.value = "";
            }}
          />
        </label>
        {csvErrors.length > 0 && (
          <div role="status" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-semibold">Avisos de importação</p>
            <ul className="mt-1 list-disc pl-5">
              {csvErrors.slice(0, 8).map((error, i) => <li key={i}>{error}</li>)}
            </ul>
            {csvErrors.length > 8 && <p className="mt-1">E mais {csvErrors.length - 8} avisos.</p>}
          </div>
        )}
        {csvOffers.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">{csvOffers.length} ofertas válidas para importar</p>
            <div className="max-h-56 overflow-auto rounded-md border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-muted">
                  <tr><th className="p-2">Título</th><th className="p-2">Preço</th><th className="p-2">Loja</th></tr>
                </thead>
                <tbody>
                  {csvOffers.slice(0, 20).map((offer, i) => (
                    <tr key={offer.source_url} className="border-t">
                      <td className="p-2">{offer.title}</td>
                      <td className="p-2">{offer.price ?? "—"} {offer.currency}</td>
                      <td className="p-2">{offer.source_store ?? offer.source_platform ?? new URL(offer.source_url).hostname}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvOffers.length > 20 && <p className="p-2 text-muted-foreground">A mostrar 20 de {csvOffers.length} ofertas.</p>}
            </div>
            <Button type="button" onClick={importCsvOffers} disabled={csvBusy}>
              {csvBusy ? "A importar…" : `Importar ${csvOffers.length} ofertas`}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setCsvOffers([]); setCsvErrors([]); }} disabled={csvBusy}>
              Limpar pré-visualização
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Colunas aceites: title/título, source_url/link, description/descrição, category/categoria,
          price/preço, currency/moeda, source_platform/plataforma e source_store/loja.
          Também aceita CSV separado por ponto e vírgula.
        </p>
      </Section>

      <form onSubmit={submit} className="mt-6 space-y-6">
        {!isRequest && (
          <Section title="Origem da oferta">
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={external} onCheckedChange={setExternal} />
              Esta oferta é vendida noutra loja (Amazon, AliExpress, loja própria…)
            </label>
            {external && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://loja.com/produto"
                    value={f.source_url}
                    onChange={set("source_url")}
                    required
                    type="url"
                  />
                  <Button type="button" variant="outline" onClick={importUrl} disabled={importing}>
                    <Link2 className="h-4 w-4" />
                    {importing ? "A ler…" : "Importar"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lemos apenas os dados públicos da página. Algumas lojas bloqueiam a leitura
                  automática — nesse caso preenche manualmente. Preço e stock não são sincronizados
                  automaticamente.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Plataforma">
                    <Input value={f.source_platform} onChange={set("source_platform")} />
                  </Field>
                  <Field label="Loja / vendedor original">
                    <Input value={f.source_store} onChange={set("source_store")} />
                  </Field>
                </div>
                <Field label="A tua relação com esta oferta">
                  <select
                    className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                    value={relation}
                    onChange={(e) => setRelation(e.target.value as typeof relation)}
                  >
                    <option value="owner">Sou o proprietário da loja</option>
                    <option value="representative">Sou representante autorizado</option>
                    <option value="sharer">Apenas partilho o link de terceiros</option>
                  </select>
                </Field>
              </div>
            )}
          </Section>
        )}

        <Section title="Informação principal">
          <Field label="Título">
            <Input required minLength={3} maxLength={140} value={f.title} onChange={set("title")} />
          </Field>
          <Field label="Descrição">
            <Textarea
              rows={5}
              maxLength={8000}
              value={f.description}
              onChange={set("description")}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Categoria">
              <select
                className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                value={f.category}
                onChange={set("category")}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            {!isRequest && (
              <Field label="Marca">
                <Input value={f.brand} onChange={set("brand")} />
              </Field>
            )}
          </div>
        </Section>

        <Section title={isRequest ? "Orçamento e quantidade" : "Preço e stock"}>
          <div className="grid gap-3 sm:grid-cols-3">
            {isRequest ? (
              <Field label="Orçamento máximo">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={f.budget_max}
                  onChange={set("budget_max")}
                />
              </Field>
            ) : (
              <Field label="Preço">
                <Input type="number" min="0" step="0.01" value={f.price} onChange={set("price")} />
              </Field>
            )}
            <Field label="Moeda">
              <select
                className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                value={f.currency}
                onChange={set("currency")}
              >
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            {isRequest ? (
              <Field label="Quantidade">
                <Input type="number" min="1" value={f.quantity} onChange={set("quantity")} />
              </Field>
            ) : (
              <Field label="Stock">
                <Input type="number" min="0" value={f.stock} onChange={set("stock")} />
              </Field>
            )}
          </div>
          {isRequest && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Prazo pretendido">
                <Input type="date" value={f.deadline} onChange={set("deadline")} />
              </Field>
              <Field label="Quem pode ver o teu contacto">
                <select
                  className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                  value={contactVis}
                  onChange={(e) => setContactVis(e.target.value as typeof contactVis)}
                >
                  <option value="proposers">Só fornecedores que enviem proposta</option>
                  <option value="public">Todos</option>
                  <option value="private">Ninguém (respondo às propostas)</option>
                </select>
              </Field>
            </div>
          )}
          {kind === "product" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Estado">
                <select
                  className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                  value={f.condition}
                  onChange={set("condition")}
                >
                  <option value="">—</option>
                  {CONDITIONS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Variantes (ex.: tamanhos, cores)">
                <Input value={f.variants} onChange={set("variants")} />
              </Field>
            </div>
          )}
          {!isRequest && (
            <Field label="Características (uma por linha)">
              <Textarea rows={3} value={f.features} onChange={set("features")} />
            </Field>
          )}
        </Section>

        <Section title="Imagens e vídeo">
          <div className="flex flex-wrap gap-3">
            {images.map((p) => (
              <div
                key={p}
                className="relative h-24 w-24 overflow-hidden rounded-xl border bg-muted"
              >
                {urls[p] && <img src={urls[p]} alt="" className="h-full w-full object-cover" />}
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  aria-label="Remover"
                  onClick={() => setImages(images.filter((x) => x !== p))}
                  className="absolute right-1 top-1 h-8 w-8"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {images.length < 8 && (
              <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-xl border border-dashed text-muted-foreground hover:border-primary">
                <Upload className="h-5 w-5" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => onFiles(e.target.files)}
                />
              </label>
            )}
          </div>
          <Field label="Link de vídeo (YouTube, Vimeo…)">
            <Input type="url" value={f.video_url} onChange={set("video_url")} />
          </Field>
        </Section>

        <Section title="Localização e entrega">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cidade">
              <Input value={f.city} onChange={set("city")} />
            </Field>
            <Field label="País">
              <Input value={f.country} onChange={set("country")} />
            </Field>
          </div>
          {!isRequest && (
            <>
              <Field label="Entrega">
                <Input
                  value={f.delivery}
                  onChange={set("delivery")}
                  placeholder="Ex.: Envio nacional em 3 dias"
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Garantia">
                  <Input value={f.warranty} onChange={set("warranty")} />
                </Field>
                <Field label="Devoluções">
                  <Input value={f.returns_policy} onChange={set("returns_policy")} />
                </Field>
              </div>
              <Field label="Condições comerciais">
                <Textarea rows={2} value={f.terms} onChange={set("terms")} />
              </Field>
            </>
          )}
        </Section>

        {!isRequest && !external && (
          <Section title="Programa de afiliados">
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={affiliate} onCheckedChange={setAffiliate} />
              Permitir que outros utilizadores promovam este anúncio com link de afiliado
            </label>
            {affiliate && (
              <Field label="Comissão proposta (%)">
                <Input
                  type="number"
                  min="0"
                  max="90"
                  step="0.5"
                  value={f.affiliate_commission}
                  onChange={set("affiliate_commission")}
                />
              </Field>
            )}
          </Section>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "A publicar…" : "Publicar"}
        </Button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="editor-section space-y-4">
      <h2 className="font-bold">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
