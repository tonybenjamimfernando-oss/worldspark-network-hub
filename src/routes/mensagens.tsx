import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { InfoPage, InfoCard, meta } from "@/components/InfoPage";

export const Route = createFileRoute("/mensagens")({
  head: () => meta("Mensagens — GCNM", "Conversa com compradores e vendedores no GCNM."),
  component: () => (
    <InfoPage title="Mensagens" intro="O chat com texto, voz, ficheiros e chamadas está na próxima etapa.">
      <InfoCard title="Entretanto">Contacta vendedores pelos contactos públicos do perfil, ou envia propostas nos pedidos de compra.</InfoCard>
      <Button asChild><Link to="/explorar" search={{ kind: "request" }}>Ver pedidos de compra</Link></Button>
    </InfoPage>
  ),
});
