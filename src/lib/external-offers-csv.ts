export type CsvExternalOffer = {
  title: string;
  description: string;
  category: string;
  price: number | null;
  currency: string;
  source_url: string;
  source_platform: string | null;
  source_store: string | null;
};

export type CsvOfferParseResult = {
  offers: CsvExternalOffer[];
  errors: string[];
};

const MAX_ROWS = 100;

function splitRow(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      cells.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }

  cells.push(value.trim());
  return cells;
}

function detectDelimiter(header: string): string {
  const commas = splitRow(header, ",").length;
  const semicolons = splitRow(header, ";").length;
  return semicolons > commas ? ";" : ",";
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

const HEADER_ALIASES: Record<string, keyof CsvExternalOffer> = {
  title: "title",
  titulo: "title",
  name: "title",
  nome: "title",
  description: "description",
  descricao: "description",
  category: "category",
  categoria: "category",
  price: "price",
  preco: "price",
  currency: "currency",
  moeda: "currency",
  source_url: "source_url",
  url: "source_url",
  link: "source_url",
  product_url: "source_url",
  link_produto: "source_url",
  source_platform: "source_platform",
  platform: "source_platform",
  plataforma: "source_platform",
  source_store: "source_store",
  store: "source_store",
  loja: "source_store",
  vendedor: "source_store",
};

export function parseExternalOffersCsv(input: string): CsvOfferParseResult {
  const cleaned = input.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return { offers: [], errors: ["O ficheiro está vazio."] };

  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) {
    return { offers: [], errors: ["O CSV deve conter um cabeçalho e pelo menos uma oferta."] };
  }

  const header = lines[0];
  if (!header) return { offers: [], errors: ["O ficheiro está vazio."] };
  const delimiter = detectDelimiter(header);
  const headers = splitRow(header, delimiter).map(normalizeHeader);
  const mapped = headers.map((header) => HEADER_ALIASES[header] ?? null);
  const titleIndex = mapped.indexOf("title");
  const urlIndex = mapped.indexOf("source_url");

  if (titleIndex < 0 || urlIndex < 0) {
    return {
      offers: [],
      errors: ["O cabeçalho deve incluir as colunas título (title) e link (source_url/url)."],
    };
  }

  const offers: CsvExternalOffer[] = [];
  const errors: string[] = [];
  const dataLines = lines.slice(1);

  if (dataLines.length > MAX_ROWS) {
    return {
      offers: [],
      errors: [`O limite é de ${MAX_ROWS} ofertas por importação; o ficheiro contém ${dataLines.length}.`],
    };
  }

  dataLines.forEach((line, index) => {
    const lineNumber = index + 2;
    const cells = splitRow(line, delimiter);
    const value = (key: keyof CsvExternalOffer) => {
      const column = mapped.indexOf(key);
      return column < 0 ? "" : (cells[column] ?? "").trim();
    };
    const title = value("title");
    const sourceUrl = value("source_url");

    if (!title || title.length < 3) {
      errors.push(`Linha ${lineNumber}: título ausente ou demasiado curto.`);
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      errors.push(`Linha ${lineNumber}: link inválido.`);
      return;
    }
    if (parsedUrl.protocol !== "https:") {
      errors.push(`Linha ${lineNumber}: o link deve começar por https://.`);
      return;
    }

    const rawPrice = value("price");
    const normalizedPrice = rawPrice.replace(/\s/g, "").replace(",", ".");
    const price = normalizedPrice === "" ? null : Number(normalizedPrice);
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      errors.push(`Linha ${lineNumber}: preço inválido.`);
      return;
    }

    offers.push({
      title: title.slice(0, 140),
      description: value("description").slice(0, 8000),
      category: value("category") || "other",
      price,
      currency: (value("currency") || "USD").toUpperCase().slice(0, 3),
      source_url: parsedUrl.toString(),
      source_platform: value("source_platform") || null,
      source_store: value("source_store") || null,
    });
  });

  return { offers, errors };
}
