import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { InfoPage, InfoCard, meta } from "@/components/InfoPage";

export const Route = createFileRoute("/mapa")({
  head: () => meta("Mapa global — GCNM", "Descobre ofertas, empresas e serviços por localização."),
  component: () => (
    <InfoPage title="Mapa global" intro="O mapa interativo com GPS está na próxima etapa de desenvolvimento.">
      <InfoCard title="Entretanto">Usa a pesquisa por cidade ou país — cada anúncio mostra a sua localização.</InfoCard>
      <Button asChild><Link to="/explorar">Explorar anúncios</Link></Button>
    </InfoPage>
  ),
});
