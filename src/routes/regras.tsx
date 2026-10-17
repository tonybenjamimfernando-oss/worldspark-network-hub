import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoCard, meta } from "@/components/InfoPage";

export const Route = createFileRoute("/regras")({
  head: () => meta("Regras e segurança — GCNM", "Regras de publicação, avaliações e segurança no GCNM."),
  component: () => (
    <InfoPage title="Regras e segurança" intro="Para manter o GCNM confiável para compradores e vendedores.">
      <InfoCard title="Publicação">Publica apenas ofertas reais. Ofertas externas devem indicar a loja de origem e a tua relação com ela (proprietário, representante ou partilha).</InfoCard>
      <InfoCard title="Avaliações">Não podes avaliar os teus próprios anúncios. Comentários denunciados por vários utilizadores são ocultados para moderação.</InfoCard>
      <InfoCard title="Privacidade">Os teus contactos só aparecem se os preencheres como públicos. Nos pedidos de compra escolhes quem vê o teu contacto.</InfoCard>
      <InfoCard title="Compras externas">Quando compras numa loja externa, a transação é feita diretamente com essa loja. Confirma sempre preço e condições na loja original.</InfoCard>
    </InfoPage>
  ),
});
