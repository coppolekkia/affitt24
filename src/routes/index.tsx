import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { searchListings, type Listing } from "@/lib/api/listings.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Casalibera — Affitti aggregati in Italia" },
      { name: "description", content: "Cerca appartamenti in affitto su Immobiliare, Idealista e Subito in un'unica ricerca, con filtri per città e canone." },
      { property: "og:title", content: "Casalibera — Affitti aggregati" },
      { property: "og:description", content: "Un solo posto per cercare annunci di affitto su Immobiliare, Idealista e Subito." },
    ],
  }),
  component: Index,
});

function Index() {
  const search = useServerFn(searchListings);
  const [city, setCity] = useState("Milano");
  const [minPrice, setMinPrice] = useState<string>("500");
  const [maxPrice, setMaxPrice] = useState<string>("900");

  const mutation = useMutation({
    mutationFn: (input: { city: string; minPrice?: number; maxPrice?: number }) =>
      search({ data: input }),
  });

  // Auto-run a default search on first load: Milano, 500–900€
  useEffect(() => {
    mutation.mutate({ city: "Milano", minPrice: 500, maxPrice: 900 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;
    mutation.mutate({
      city: city.trim(),
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
  };

  const listings: Listing[] = mutation.data?.listings ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span className="font-serif text-xl tracking-tight">Casalibera</span>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Affitti · Italia
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="pt-16 pb-12 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-6">
            Un solo posto per cercare
          </p>
          <h1 className="font-serif text-5xl md:text-6xl leading-[1.05] tracking-tight">
            Affitti aggregati da{" "}
            <span className="italic text-accent">Immobiliare, Idealista e Subito</span>.
          </h1>
          <p className="mt-6 text-muted-foreground text-lg max-w-xl">
            Inserisci la città e il canone desiderato. Raccogliamo gli annunci in
            tempo reale dai tre principali portali italiani.
          </p>
        </section>

        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 bg-card border border-border rounded-lg p-4 shadow-sm"
        >
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Città</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="es. Milano"
              className="bg-transparent border-b border-border focus:border-accent outline-none py-2 text-base"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Canone min €</span>
            <input
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="500"
              className="bg-transparent border-b border-border focus:border-accent outline-none py-2 text-base"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Canone max €</span>
            <input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="1500"
              className="bg-transparent border-b border-border focus:border-accent outline-none py-2 text-base"
            />
          </label>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm uppercase tracking-[0.15em] hover:bg-accent transition-colors disabled:opacity-60"
          >
            {mutation.isPending ? "Cerco…" : "Cerca"}
          </button>
        </form>

        <section className="mt-12">
          {mutation.isError && (
            <p className="text-destructive text-sm">
              Errore nella ricerca. Riprova tra qualche istante.
            </p>
          )}

          {mutation.isSuccess && (
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-serif text-2xl">
                {listings.length} annunci trovati
              </h2>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                ordinati per prezzo
              </span>
            </div>
          )}

          {mutation.isSuccess && listings.length === 0 && (
            <p className="text-muted-foreground">
              Nessun annuncio corrisponde ai filtri. Prova ad ampliare il range
              di prezzo o cambia città.
            </p>
          )}

          <ul className="divide-y divide-border border-t border-b border-border">
            {listings.map((l) => (
              <li key={l.url} className="py-6 group">
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-6 items-start"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-md bg-muted border border-border">
                    {l.image ? (
                      <img
                        src={l.image}
                        alt={l.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                        nessuna foto
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-accent">
                        {l.source}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl leading-snug group-hover:text-accent transition-colors">
                      {l.title}
                    </h3>
                    {l.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                        {l.description}
                      </p>
                    )}
                    <span className="inline-block mt-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground group-hover:text-accent">
                      Vedi annuncio ↗
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-serif text-2xl">
                      {l.price ? `€ ${l.price.toLocaleString("it-IT")}` : "—"}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {l.price ? "al mese" : "prezzo n.d."}
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground flex justify-between">
          <span>© {new Date().getFullYear()} Casalibera</span>
          <span>Risultati aggregati da fonti pubbliche.</span>
        </div>
      </footer>
    </div>
  );
}
