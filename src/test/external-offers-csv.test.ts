import { describe, expect, it } from "vitest";
import { parseExternalOffersCsv } from "@/lib/external-offers-csv";

describe("parseExternalOffersCsv", () => {
  it("parses comma-separated data with quoted commas", () => {
    const result = parseExternalOffersCsv(
      'title,source_url,price,currency,description\n"Phone, Pro",https://shop.example/item,12.50,USD,"Fast, reliable phone"',
    );
    expect(result.errors).toEqual([]);
    expect(result.offers).toHaveLength(1);
    expect(result.offers[0]).toMatchObject({
      title: "Phone, Pro",
      price: 12.5,
      description: "Fast, reliable phone",
      source_url: "https://shop.example/item",
    });
  });

  it("accepts Portuguese headers and semicolon delimiters", () => {
    const result = parseExternalOffersCsv(
      "Título;Link;Preço;Moeda\nCadeira;https://loja.example/cadeira;15,90;MZN",
    );
    expect(result.offers[0]).toMatchObject({ title: "Cadeira", price: 15.9, currency: "MZN" });
    expect(result.errors).toEqual([]);
  });

  it("rejects non-HTTPS links and invalid prices", () => {
    const result = parseExternalOffersCsv(
      "title,source_url,price\nBad link,http://shop.example/item,5\nBad price,https://shop.example/item,abc",
    );
    expect(result.offers).toEqual([]);
    expect(result.errors).toHaveLength(2);
  });

  it("requires title and link columns", () => {
    expect(parseExternalOffersCsv("name,price\nPhone,10").errors[0]).toContain("cabeçalho");
  });

  it("rejects more than 100 data rows", () => {
    const rows = Array.from({ length: 101 }, (_, i) => `Item ${i},https://shop.example/${i}`);
    const result = parseExternalOffersCsv(["title,source_url", ...rows].join("\n"));
    expect(result.offers).toEqual([]);
    expect(result.errors[0]).toContain("100");
  });
});
