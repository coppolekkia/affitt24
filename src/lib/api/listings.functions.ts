import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Firecrawl from "@mendable/firecrawl-js";

const SOURCES = ["immobiliare.it", "idealista.it", "subito.it"] as const;

const InputSchema = z.object({
  city: z.string().trim().min(1).max(80),
  minPrice: z.number().int().min(0).max(100000).optional(),
  maxPrice: z.number().int().min(0).max(100000).optional(),
});

export type Listing = {
  title: string;
  url: string;
  description: string;
  price: number | null;
  source: string;
  image: string | null;
};

function extractPrice(text: string): number | null {
  if (!text) return null;
  // Match like "€ 1.200", "1200 €", "EUR 950"
  const re = /(?:€|EUR|eur)\s*([0-9][0-9.\s]{1,9})|([0-9][0-9.\s]{1,9})\s*(?:€|EUR|eur|\/mese|al mese)/;
  const m = text.match(re);
  const raw = m?.[1] ?? m?.[2];
  if (!raw) return null;
  const n = parseInt(raw.replace(/[.\s]/g, ""), 10);
  return Number.isFinite(n) && n > 50 && n < 100000 ? n : null;
}

function sourceFromUrl(url: string): string {
  for (const s of SOURCES) if (url.includes(s)) return s;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}

// Returns true if the URL looks like an individual listing page, not a search/index page.
function isDetailUrl(url: string): boolean {
  if (!url) return false;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  const host = u.hostname.replace(/^www\./, "");
  const path = u.pathname;

  if (host.includes("immobiliare.it")) {
    // Detail pages: /annunci/<id>/  — exclude /affitto-case/, /vendita-case/, search pages
    return /^\/annunci\/\d+\/?$/.test(path);
  }
  if (host.includes("idealista.it")) {
    // Detail pages: /immobile/<id>/
    return /^\/immobile\/\d+\/?$/.test(path);
  }
  if (host.includes("subito.it")) {
    // Detail pages end with -<id>.htm (e.g. /appartamenti/.../bilocale-milano-...-<id>.htm)
    return /-\d+\.htm$/.test(path);
  }
  return false;
}

function extractFirstImage(md: string): string | null {
  if (!md) return null;
  const m = md.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/);
  return m?.[1] ?? null;
}

function stripMarkdown(md: string): string {
  if (!md) return "";
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const searchListings = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY non configurata");
    }
    const firecrawl = new Firecrawl({ apiKey });

    const query = `appartamento in affitto ${data.city}`;

    const perSource = await Promise.all(
      SOURCES.map(async (domain) => {
        try {
          const res = await firecrawl.search(`${query} site:${domain}`, {
            limit: 6,
            sources: ["web"],
            scrapeOptions: {
              formats: ["markdown"],
              onlyMainContent: true,
            },
          } as any);
          // Normalize results across SDK shapes
          const items =
            (res as any)?.web ??
            (res as any)?.data?.web ??
            (res as any)?.data ??
            [];
          return Array.isArray(items) ? items : [];
        } catch (err) {
          console.error("Firecrawl search failed for", domain, err);
          return [];
        }
      }),
    );

    const all: Listing[] = [];
    perSource.flat().forEach((r: any) => {
      const url: string = r.url ?? r.link ?? "";
      if (!url) return;
      const title: string = r.title ?? r.name ?? "Annuncio";
      const md: string = r.markdown ?? r.data?.markdown ?? "";
      const description: string =
        r.description ?? r.snippet ?? r.metadata?.description ?? "";
      const image: string | null =
        r.metadata?.ogImage ??
        r.metadata?.["og:image"] ??
        r.metadata?.image ??
        r.image ??
        r.screenshot ??
        extractFirstImage(md) ??
        null;
      const price = extractPrice(`${title} ${description} ${md}`);
      all.push({
        title: title.slice(0, 200),
        url,
        description: (description || stripMarkdown(md)).slice(0, 300),
        price,
        source: sourceFromUrl(url),
        image,
      });
    });

    // Dedup by url
    const seen = new Set<string>();
    const deduped = all.filter((l) => {
      if (seen.has(l.url)) return false;
      seen.add(l.url);
      return true;
    });

    const filtered = deduped.filter((l) => {
      if (data.minPrice != null && (l.price ?? Infinity) < data.minPrice) return false;
      if (data.maxPrice != null && (l.price ?? 0) > data.maxPrice) return false;
      return true;
    });

    // Sort: priced first (asc), then unpriced
    filtered.sort((a, b) => {
      if (a.price == null && b.price == null) return 0;
      if (a.price == null) return 1;
      if (b.price == null) return -1;
      return a.price - b.price;
    });

    return { listings: filtered, total: filtered.length };
  });