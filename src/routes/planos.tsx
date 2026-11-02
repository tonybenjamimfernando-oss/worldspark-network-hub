import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoPage, meta } from "@/components/InfoPage";

export const Route = createFileRoute("/planos")({
  head: () => meta("Planos — GCNM", "Compara os planos para vendedores, lojas e empresas no GCNM."),
  component: PlansPage,
});

const PLANS = [
  { name: "Gratuito", status: "Disponível agora", features: ["Perfil público", "Produtos, serviços e pedidos de compra", "Ofertas externas por link e CSV", "Avaliações e links de afiliado", "Mensagens com compradores"], cta: "free" },
  { name: "Parceiro verificado", status: "Gratuito durante o lançamento · pedido no painel", features: ["Selo de verificação após análise manual", "Mais confiança nas tuas ofertas e propostas", "Estatísticas de visualizações e cliques"], cta: "verify" },
  { name: "Empresarial", status: "Em preparação · sem cobrança ativa", features: ["Contactos qualificados", "Equipas e várias lojas", "Integrações de catálogo autorizadas"], cta: null },
];

function PlansPage() {
  return (
    <InfoPage title="Planos" intro="Publicar é gratuito. Os planos pagos só abrirão quando os pagamentos estiverem ligados a um fornecedor real.">
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <section key={p.name} className={`editor-section flex flex-col ${p.cta === "free" ? "border-t-4 border-primary" : ""}`}>
            <h2 className="text-xl font-extrabold">{p.name}</h2>
            <p className="text-sm text-muted-foreground">{p.status}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{f}</li>
              ))}
            </ul>
            {p.cta ? (
              <Button asChild className="mt-5" variant={p.cta === "free" ? "default" : "outline"}><Link to="/painel">{p.cta === "free" ? "Começar grátis" : "Pedir verificação"}</Link></Button>
            ) : (
              <Button className="mt-5" variant="secondary" disabled>Brevemente</Button>
            )}
          </section>
        ))}
      </div>
      <section className="editor-section mt-6 overflow-x-auto">
        <h2 className="text-lg font-extrabold">Comparação</h2>
        <table className="mt-3 w-full min-w-[480px] text-left text-sm">
          <thead><tr className="border-b text-muted-foreground"><th className="py-2">Funcionalidade</th>{PLANS.map((p) => <th key={p.name} className="py-2">{p.name}</th>)}</tr></thead>
          <tbody>
            {[["Publicar ofertas e pedidos", true, true, true], ["Mensagens com anexos e notas de voz", true, true, true], ["Selo verificado", false, true, true], ["Várias lojas e equipas", false, false, true]].map(([label, ...vals]) => (
              <tr key={String(label)} className="border-b last:border-0"><td className="py-2">{label}</td>{vals.map((v, i) => <td key={i} className="py-2">{v ? <Check className="h-4 w-4 text-primary" aria-label="Incluído" /> : <span className="text-muted-foreground" aria-label="Não incluído">—</span>}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </section>
    </InfoPage>
  );
}
