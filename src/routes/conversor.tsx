import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InfoPage, meta } from "@/components/InfoPage";
import { CURRENCIES, formatPrice } from "@/lib/catalog";
import { convertAmount } from "@/lib/currency.functions";
import { useRates } from "@/components/CurrencyConverter";

export const Route = createFileRoute("/conversor")({
  head: () => meta("Conversor de moedas — GCNM", "Converte preços entre moedas com cotações atualizadas, fonte e data indicadas."),
  component: ConverterPage,
});

function ConverterPage() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("EUR");
  const [to, setTo] = useState("MZN");
  const { data, isLoading, isError, refetch } = useRates(from);
  const n = Number(amount.replace(",", "."));
  const result = Number.isFinite(n) && data ? convertAmount(n, data.rates[to]) : null;
  const select = (v: string, set: (s: string) => void, label: string) => (
    <select aria-label={label} className="h-11 rounded-md border bg-card px-3" value={v} onChange={(e) => set(e.target.value)}>
      {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
    </select>
  );
  return (
    <InfoPage title="Conversor de moedas" intro="Cotações reais e indicativas para comparar ofertas internacionais. O pagamento é sempre feito na moeda do vendedor.">
      <div className="editor-section space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input aria-label="Valor" inputMode="decimal" className="w-36" value={amount} onChange={(e) => setAmount(e.target.value)} />
          {select(from, setFrom, "Moeda de origem")}
          <Button variant="secondary" size="icon" aria-label="Trocar moedas" onClick={() => { setFrom(to); setTo(from); }}>
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          {select(to, setTo, "Moeda de destino")}
        </div>
        <p className="text-3xl font-extrabold text-primary" aria-live="polite">
          {isLoading ? "A obter cotação…" : isError ? "Cotação indisponível" : result == null ? "—" : formatPrice(result, to)}
        </p>
        {isError && <Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>}
        {data && (
          <p className="text-sm text-muted-foreground">
            1 {from} = {data.rates[to]?.toFixed(4)} {to} · Fonte: {data.source} · Atualizado em {new Date(data.updatedAt).toLocaleString("pt-PT")}
          </p>
        )}
      </div>
    </InfoPage>
  );
}
