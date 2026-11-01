import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type RatesResult = {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
  source: string;
};

/** Real exchange rates from the public ExchangeRate-API open endpoint (no key). */
export const fetchRates = createServerFn({ method: "GET" })
  .inputValidator((input: { base: string }) =>
    z.object({ base: z.string().regex(/^[A-Z]{3}$/) }).parse(input),
  )
  .handler(async ({ data }): Promise<RatesResult> => {
    const res = await fetch(`https://open.er-api.com/v6/latest/${data.base}`);
    if (!res.ok) throw new Error("Serviço de câmbio indisponível");
    const json = (await res.json()) as {
      result: string;
      base_code: string;
      rates: Record<string, number>;
      time_last_update_utc: string;
    };
    if (json.result !== "success") throw new Error("Cotação indisponível");
    return {
      base: json.base_code,
      rates: json.rates,
      updatedAt: new Date(json.time_last_update_utc).toISOString(),
      source: "ExchangeRate-API (open.er-api.com)",
    };
  });

export function convertAmount(amount: number, rate: number | undefined) {
  if (rate == null || !Number.isFinite(rate)) return null;
  return Math.round(amount * rate * 100) / 100;
}
