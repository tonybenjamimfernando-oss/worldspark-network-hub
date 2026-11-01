import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoPage, meta } from "@/components/InfoPage";

export const Route = createFileRoute("/planos")({
  head: () => meta("Planos — GCNM", "Compara os planos para vendedores, lojas e empresas no GCNM."),
  component: PlansPage,
});

const PLANS = [
  { name: "Gratuito", status: "Disponível agora", features: ["Perfil público", "Produtos, serviços e pedidos de compra", "Ofertas externas por link e CSV", "Avaliações e links de afiliado", "Mensagens com compradores"], cta: true },
  { name: "Parceiro verificado", status: "Em preparação", features: ["Selo de verificação após análise", "Estatísticas detalhadas", "Destaques identificados como patrocinados"], cta: false },
  { name: "Empresarial", status: "Em preparação", features: ["Contactos qualificados", "Equipas e várias lojas", "Integrações de catálogo autorizadas"], cta: false },
];

function PlansPage() {
  return (
    <InfoPage title="Planos" intro="Publicar é gratuito. Os planos pagos só abrirão quando os pagamentos estiverem ligados a um fornecedor real.">
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <section key={p.name} className={`editor-section flex flex-col ${p.cta ? "border-t-4 border-primary" : ""}`}>
            <h2 className="text-xl font-extrabold">{p.name}</h2>
            <p className="text-sm text-muted-foreground">{p.status}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{f}</li>
              ))}
            </ul>
            {p.cta ? (
              <Button asChild className="mt-5"><Link to="/painel">Começar grátis</Link></Button>
            ) : (
              <Button className="mt-5" variant="secondary" disabled>Brevemente</Button>
            )}
          </section>
        ))}
      </div>
    </InfoPage>
  );
}
