import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowLeft, Building2, ClipboardList, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Centro administrativo — GCNM" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminCenter,
});

function AdminCenter() {
  const { user } = Route.useRouteContext();

  const access = useQuery({
    queryKey: ["admin-access", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) throw error;
      return data === true;
    },
    retry: false,
  });

  const metrics = useQuery({
    queryKey: ["admin-overview"],
    enabled: access.data === true,
    queryFn: async () => {
      const [listings, profiles, reports] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_public", true),
        supabase.from("review_reports").select("id", { count: "exact", head: true }),
      ]);
      const failed = [listings, profiles, reports].find((result) => result.error);
      if (failed?.error) throw failed.error;
      return {
        activeListings: listings.count ?? 0,
        publicProfiles: profiles.count ?? 0,
        reviewReports: reports.count ?? 0,
      };
    },
    retry: false,
  });

  if (access.isLoading) return <StatePanel title="A verificar permissões" message="Estamos a confirmar o acesso administrativo da tua conta." />;
  if (access.isError) return <StatePanel title="Não foi possível validar o acesso" message="Não foi possível confirmar o teu papel administrativo. Actualiza a página ou tenta novamente mais tarde." />;
  if (access.data !== true) return <StatePanel title="Acesso restrito" message="Este centro está disponível apenas para contas com o papel administrativo atribuído na base de dados." />;

  const cards = [
    { label: "Anúncios activos visíveis", value: metrics.data?.activeListings, icon: ClipboardList, detail: "Contagem dos anúncios activos que as políticas actuais permitem consultar." },
    { label: "Perfis públicos", value: metrics.data?.publicProfiles, icon: Users, detail: "Perfis marcados como públicos e visíveis pela aplicação." },
    { label: "Denúncias de avaliações", value: metrics.data?.reviewReports, icon: ShieldAlert, detail: "Denúncias acessíveis à função administrativa para acompanhamento." },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <header className="rounded-2xl bg-navy px-6 py-8 text-navy-foreground md:px-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow flex items-center gap-2 text-gold"><ShieldCheck className="h-4 w-4" /> GCNM · OPERAÇÕES</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Centro administrativo</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-navy-foreground/80">Visão inicial da operação do mercado, com acesso validado pela função administrativa da base de dados.</p>
          </div>
          <Button asChild variant="secondary"><Link to="/centro"><ArrowLeft className="mr-2 h-4 w-4" /> Centro de comando</Link></Button>
        </div>
      </header>

      {metrics.isError && <p role="alert" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Não foi possível carregar as métricas. Confirma as políticas de acesso e a ligação ao Supabase.</p>}

      <section aria-label="Indicadores operacionais" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return <article key={card.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              <span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></span>
            </div>
            <p className="mt-4 text-3xl font-bold tabular-nums">{metrics.isLoading ? "…" : metrics.isError ? "—" : (card.value ?? 0).toLocaleString("pt-PT")}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{card.detail}</p>
          </article>;
        })}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3"><Activity className="h-5 w-5 text-primary" /><h2 className="font-semibold">Estado operacional</h2></div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Este primeiro painel apresenta apenas dados disponíveis pelas políticas existentes. Ainda não executa acções destrutivas nem altera anúncios, contas ou configurações de produção.</p>
        </article>
        <article className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-primary" /><h2 className="font-semibold">Próximos módulos</h2></div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Moderação de anúncios, avaliações e denúncias.</li>
            <li>Monitorização de tráfego e actividade por região.</li>
            <li>Gestão de utilizadores, permissões e auditoria.</li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Cada módulo exigirá políticas de autorização próprias e validação antes de operar sobre dados reais.</p>
        </article>
      </section>
    </div>
  );
}

function StatePanel({ title, message }: { title: string; message: string }) {
  return <div className="mx-auto flex min-h-[55vh] w-full max-w-3xl items-center px-4 py-12">
    <section className="w-full rounded-2xl border bg-card p-6 md:p-8">
      <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold">{title}</h1></div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
      <Button asChild className="mt-6"><Link to="/centro">Voltar ao centro de comando</Link></Button>
    </section>
  </div>;
}
