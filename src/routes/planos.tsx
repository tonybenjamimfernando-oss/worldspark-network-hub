import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { InfoPage, InfoCard, meta } from "@/components/InfoPage";

export const Route = createFileRoute("/planos")({
  head: () => meta("Planos — GCNM", "Planos para vendedores, lojas e empresas no GCNM."),
  component: () => (
    <InfoPage title="Planos" intro="Publicar no GCNM é gratuito. Os planos pagos serão ativados quando os pagamentos estiverem ligados.">
      <InfoCard title="Gratuito — disponível">Perfil público, publicação de produtos e serviços, importação de ofertas externas por link, pedidos de compra, propostas, avaliações e links de afiliado.</InfoCard>
      <InfoCard title="Premium para lojas — em preparação">Destaque identificado como patrocinado, estatísticas avançadas e importação em massa.</InfoCard>
      <InfoCard title="Empresarial — em preparação">Contactos qualificados, análise de mercado e equipas.</InfoCard>
      <Button asChild><Link to="/painel">Começar grátis</Link></Button>
    </InfoPage>
  ),
});
