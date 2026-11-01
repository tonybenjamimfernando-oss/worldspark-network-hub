import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CURRENCIES, formatPrice } from "@/lib/catalog";
import { convertAmount, fetchRates } from "@/lib/currency.functions";

const STORAGE_KEY = "gcnm-display-currency";

export function useDisplayCurrency() {
  const [cur, setCur] = useState("EUR");
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && CURRENCIES.includes(saved)) setCur(saved);
  }, []);
  const set = (c: string) => {
    setCur(c);
    localStorage.setItem(STORAGE_KEY, c);
  };
  return [cur, set] as const;
}

export function useRates(base: string) {
  return useQuery({
    queryKey: ["rates", base],
    queryFn: () => fetchRates({ data: { base } }),
    staleTime: 1000 * 60 * 60,
  });
}

/** Shows a listing price converted to the visitor's chosen currency, with source and date. */
export function ConvertedPrice({ amount, currency }: { amount: number; currency: string }) {
  const [target, setTarget] = useDisplayCurrency();
  const { data, isError } = useRates(currency);
  const value = target === currency ? amount : convertAmount(amount, data?.rates[target]);
  return (
    <div className="mt-2 rounded-lg border bg-card p-3 text-sm">
      <label className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground">Ver em</span>
        <select
          aria-label="Moeda de visualização"
          className="h-9 rounded-md border bg-background px-2"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        >
          {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <strong className="text-foreground">
          {isError ? "Cotação indisponível" : value == null ? "…" : `≈ ${formatPrice(value, target)}`}
        </strong>
      </label>
      {data && target !== currency && (
        <p className="mt-1 text-xs text-muted-foreground">
          Valor indicativo. Fonte: {data.source}, {new Date(data.updatedAt).toLocaleString("pt-PT")}. O vendedor cobra em {currency}.
        </p>
      )}
    </div>
  );
}
