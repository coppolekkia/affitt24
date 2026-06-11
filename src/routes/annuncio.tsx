import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

type AnnuncioSearch = {
  url: string;
  title: string;
  image?: string;
  price?: number;
  source?: string;
  description?: string;
};

const SITE_URL = "https://affitt24.lovable.app";

export const Route = createFileRoute("/annuncio")({
  validateSearch: (raw: Record<string, unknown>): AnnuncioSearch => ({
    url: typeof raw.url === "string" ? raw.url : "",
    title: typeof raw.title === "string" ? raw.title : "Annuncio",
    image: typeof raw.image === "string" ? raw.image : undefined,
    price:
      typeof raw.price === "number"
        ? raw.price
        : typeof raw.price === "string" && raw.price
          ? Number(raw.price)
          : undefined,
    source: typeof raw.source === "string" ? raw.source : undefined,
    description: typeof raw.description === "string" ? raw.description : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => deps,
  head: ({ loaderData }) => {
    const s = loaderData as AnnuncioSearch | undefined;
    const title = s?.title ? `${s.title} — Affitt24` : "Annuncio — Affitt24";
    const desc =
      s?.description ||
      (s?.price
        ? `Affitto a € ${s.price.toLocaleString("it-IT")} al mese${s?.source ? ` su ${s.source}` : ""}.`
        : "Annuncio di affitto aggregato da Affitt24.");
    const shareUrl = s
      ? `${SITE_URL}/annuncio?${new URLSearchParams({
          url: s.url,
          title: s.title,
          ...(s.image ? { image: s.image } : {}),
          ...(s.price != null ? { price: String(s.price) } : {}),
          ...(s.source ? { source: s.source } : {}),
          ...(s.description ? { description: s.description } : {}),
        }).toString()}`
      : `${SITE_URL}/annuncio`;
    const meta = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { property: "og:url", content: shareUrl },
      { name: "twitter:card", content: s?.image ? "summary_large_image" : "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: desc },
    ];
    if (s?.image) {
      meta.push({ property: "og:image", content: s.image });
      meta.push({ name: "twitter:image", content: s.image });
    }
    return { meta };
  },
  component: AnnuncioPage,
});

function AnnuncioPage() {
  const s = Route.useSearch();
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `${SITE_URL}/annuncio`;
  const shareText = `${s.title}${s.price ? ` — € ${s.price.toLocaleString("it-IT")}/mese` : ""}`;

  const shareTargets = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: "X / Twitter",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodeURIComponent(s.title)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`,
    },
  ];

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const onNativeShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as any).share({
          title: s.title,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // user dismissed
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span className="font-serif text-xl tracking-tight">Casalibera</span>
          </Link>
          <Link
            to="/"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-accent"
          >
            ← Torna alla ricerca
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <article>
          {s.source && (
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3">
              {s.source}
            </p>
          )}
          <h1 className="font-serif text-3xl md:text-4xl leading-tight tracking-tight">
            {s.title}
          </h1>
          {s.price != null && (
            <p className="mt-3 font-serif text-2xl">
              € {s.price.toLocaleString("it-IT")}{" "}
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                al mese
              </span>
            </p>
          )}

          {s.image && (
            <div className="mt-8 overflow-hidden rounded-lg border border-border bg-muted">
              <img
                src={s.image}
                alt={s.title}
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {s.description && (
            <p className="mt-8 text-base leading-relaxed text-muted-foreground whitespace-pre-line">
              {s.description}
            </p>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            {s.url && (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm uppercase tracking-[0.15em] hover:bg-accent transition-colors"
              >
                Apri annuncio originale ↗
              </a>
            )}
          </div>

          <section className="mt-12 border-t border-border pt-8">
            <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">
              Condividi
            </h2>
            <div className="flex flex-wrap gap-2">
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={onNativeShare}
                  className="px-4 py-2 rounded-md border border-border hover:border-accent text-sm transition-colors"
                >
                  Condividi…
                </button>
              )}
              {shareTargets.map((t) => (
                <a
                  key={t.label}
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-md border border-border hover:border-accent text-sm transition-colors"
                >
                  {t.label}
                </a>
              ))}
              <button
                onClick={onCopy}
                className="px-4 py-2 rounded-md border border-border hover:border-accent text-sm transition-colors"
              >
                {copied ? "Copiato ✓" : "Copia link"}
              </button>
            </div>
          </section>
        </article>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Casalibera · Annunci aggregati da fonti pubbliche.
        </div>
      </footer>
    </div>
  );
}