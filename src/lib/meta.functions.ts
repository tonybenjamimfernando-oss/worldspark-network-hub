import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.|\[?::1\]?)/i;
const NON_PUBLIC_SUFFIX = /\.(local|internal|localhost|test|invalid)$/i;
const IP_LITERAL = /^(?:\d{1,3}\.){3}\d{1,3}$|^\[.*\]$/;

function isAllowedPublicUrl(url: URL) {
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  return url.protocol === "https:"
    && !url.username
    && !url.password
    && !PRIVATE_HOST.test(host)
    && !NON_PUBLIC_SUFFIX.test(host)
    && !IP_LITERAL.test(host);
}

const KNOWN: Record<string, string> = {
  "amazon.": "Amazon", "aliexpress.": "AliExpress", "alibaba.": "Alibaba", "ebay.": "eBay",
  "shopee.": "Shopee", "jumia.": "Jumia", "mercadolivre.": "Mercado Livre", "etsy.": "Etsy", "temu.": "Temu",
};

function pick(html: string, re: RegExp) {
  const m = html.match(re);
  return m?.[1]?.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim() || null;
}
function meta(html: string, prop: string) {
  return pick(html, new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"))
    ?? pick(html, new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
}

export const fetchUrlMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ url: z.string().url().max(2000) }).parse(d))
  .handler(async ({ data }) => {
    const u = new URL(data.url);
    if (!isAllowedPublicUrl(u)) {
      return { ok: false as const, error: "Só são aceites links https públicos." };
    }
    const host = u.hostname.toLowerCase();
    const platform = Object.entries(KNOWN).find(([k]) => host.includes(k))?.[1] ?? host.replace(/^www\./, "");
    try {
      const res = await fetch(u.toString(), {
        headers: { "user-agent": "Mozilla/5.0 (compatible; GCNMBot/1.0)", accept: "text/html" },
        // Never follow redirects automatically: a public URL could redirect to a private network host.
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
      });
      if (res.status >= 300 && res.status < 400) {
        return { ok: false as const, platform, error: "A loja redireccionou o link. Por segurança, preencha os dados manualmente com o endereço final." };
      }
      if (!res.ok) return { ok: false as const, platform, error: `A loja respondeu com o estado ${res.status}. Preencha os dados manualmente.` };
      const html = (await res.text()).slice(0, 400_000);
      return {
        ok: true as const,
        platform,
        title: meta(html, "og:title") ?? pick(html, /<title[^>]*>([^<]+)<\/title>/i),
        description: meta(html, "og:description") ?? meta(html, "description"),
        image: meta(html, "og:image"),
        store: meta(html, "og:site_name"),
        price: meta(html, "product:price:amount") ?? meta(html, "og:price:amount"),
        currency: meta(html, "product:price:currency") ?? meta(html, "og:price:currency"),
      };
    } catch {
      return { ok: false as const, platform, error: "Não foi possível ler a página da loja. Preencha os dados manualmente." };
    }
  });
