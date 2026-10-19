import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MapPin, Users, ArrowUpRight, Building2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSignedUrls } from "@/lib/media";

export function ProfileDirectory({
  type,
  title,
  intro,
}: {
  type: "business" | "provider";
  title: string;
  intro: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["dir", type],
    queryFn: async () =>
      (
        await supabase
          .from("profiles")
          .select("id,display_name,company_name,avatar_url,city,country,services,is_verified")
          .eq("account_type", type)
          .order("is_verified", { ascending: false })
          .limit(60)
      ).data ?? [],
  });
  const { data: urls } = useSignedUrls((data ?? []).map((p) => p.avatar_url));
  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="page-heading">
        <p className="eyebrow mb-3 text-primary">A REDE POR TRÁS DO MERCADO</p>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{intro}</p>
      </div>
      {isLoading ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted" />
      ) : data?.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <Link
              key={p.id}
              to="/u/$id"
              params={{ id: p.id }}
              className="listing-card flex gap-4 rounded-lg border bg-card p-5 transition hover:border-primary"
            >
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary text-primary">
                {p.avatar_url && urls[p.avatar_url] ? (
                  <img src={urls[p.avatar_url]} alt="" className="h-full w-full object-cover" />
                ) : type === "business" ? (
                  <Building2 />
                ) : (
                  <UserRound />
                )}
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1 font-semibold">
                  {p.company_name || p.display_name}
                  {p.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                </p>
                {(p.city || p.country) && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {[p.city, p.country].filter(Boolean).join(", ")}
                  </p>
                )}
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {p.services.join(" · ")}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 border-l-2 border-primary bg-secondary p-8">
          <Users className="h-8 w-8 text-primary" />
          <p className="mt-3 font-bold">Ainda não há perfis nesta secção</p>
          <p className="text-sm text-muted-foreground">
            Cria a tua conta e escolhe o tipo de perfil no painel.
          </p>
          <Button asChild className="mt-4">
            <Link to="/painel">Criar o meu perfil</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
