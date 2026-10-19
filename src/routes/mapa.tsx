import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { LocateFixed, Minus, Plus, MapPin, Compass } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { KINDS, formatPrice, type Kind } from "@/lib/catalog";
import { meta } from "@/components/InfoPage";

export const Route = createFileRoute("/mapa")({
  head: () => meta("Mapa global — GCNM", "Descobre anúncios com localização aproximada no mapa."),
  component: GlobalMap,
});

type GeoListing = {
  id: string;
  title: string;
  kind: Kind;
  category: string;
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  price: number | null;
  currency: string;
};

type Center = { latitude: number; longitude: number };

function worldPoint(latitude: number, longitude: number, zoom: number) {
  const safeLatitude = Math.max(-85.0511, Math.min(85.0511, latitude));
  const scale = 2 ** zoom;
  const x = ((longitude + 180) / 360) * scale;
  const sin = Math.sin((safeLatitude * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function GlobalMap() {
  const [center, setCenter] = useState<Center>({ latitude: 0, longitude: 20 });
  const [zoom, setZoom] = useState(2);
  const [customCenter, setCustomCenter] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["map-listings"],
    queryFn: async (): Promise<GeoListing[]> => {
      const { data, error } = await supabase
        .from("listings")
        .select("id,title,kind,category,city,country,latitude,longitude,price,currency")
        .eq("status", "active")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("created_at", { ascending: false })
        .limit(150);
      if (error) throw error;
      return (data ?? []).filter((item) => item.latitude != null && item.longitude != null) as GeoListing[];
    },
  });
  const listings = data ?? [];

  useEffect(() => {
    if (!customCenter && listings.length) {
      setCenter({ latitude: listings[0].latitude, longitude: listings[0].longitude });
    }
  }, [listings, customCenter]);

  const centerWorld = worldPoint(center.latitude, center.longitude, zoom);
  const tileData = useMemo(() => {
    const count = 2 ** zoom;
    const tiles: { key: string; x: number; y: number; left: number; top: number }[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      const rawY = Math.floor(centerWorld.y) + dy;
      if (rawY < 0 || rawY >= count) continue;
      for (let dx = -2; dx <= 2; dx++) {
        const rawX = Math.floor(centerWorld.x) + dx;
        const wrappedX = ((rawX % count) + count) % count;
        tiles.push({
          key: `${zoom}-${wrappedX}-${rawY}`,
          x: wrappedX,
          y: rawY,
          left: (rawX - centerWorld.x) * 256,
          top: (rawY - centerWorld.y) * 256,
        });
      }
    }
    return tiles;
  }, [centerWorld.x, centerWorld.y, zoom]);

  const pins = useMemo(() => listings.map((listing) => {
    const point = worldPoint(listing.latitude, listing.longitude, zoom);
    const count = 2 ** zoom;
    const deltaX = ((point.x - centerWorld.x + count / 2) % count + count) % count - count / 2;
    return {
      ...listing,
      left: deltaX * 256,
      top: (point.y - centerWorld.y) * 256,
    };
  }), [listings, centerWorld.x, centerWorld.y, zoom]);
  const selected = listings.find((item) => item.id === selectedId);

  function locateMe() {
    if (!navigator.geolocation) {
      toast.error("Este navegador não disponibiliza geolocalização.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCenter({ latitude: coords.latitude, longitude: coords.longitude });
        setZoom(12);
        setCustomCenter(true);
      },
      () => toast.error("Permite o acesso à localização para centrar o mapa."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-primary">DESCOBERTA REGIONAL</p>
          <h1 className="mt-2 text-3xl font-extrabold">Mapa global</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Explora ofertas georreferenciadas. A localização é aproximada e só aparece quando o anunciante opta por a indicar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={locateMe}><LocateFixed className="mr-2 h-4 w-4" />A minha localização</Button>
          <Button variant="outline" asChild><a href={`https://www.openstreetmap.org/?mlat=${center.latitude}&mlon=${center.longitude}#map=${zoom}/${center.latitude}/${center.longitude}`} target="_blank" rel="noreferrer"><Compass className="mr-2 h-4 w-4" />Abrir mapa completo</a></Button>
        </div>
      </div>

      <div className="relative h-[430px] overflow-hidden rounded-2xl border bg-muted sm:h-[520px]" aria-label="Mapa de anúncios">
        {tileData.map((tile) => (
          <img key={tile.key} src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`} alt="" draggable={false} className="pointer-events-none absolute h-64 w-64 max-w-none select-none" style={{ left: `calc(50% + ${tile.left}px)`, top: `calc(50% + ${tile.top}px)` }} />
        ))}
        {pins.map((pin) => {
          const visible = Math.abs(pin.left) < 3 * 256 && Math.abs(pin.top) < 2 * 256;
          if (!visible) return null;
          return (
            <button key={pin.id} type="button" onClick={() => setSelectedId(pin.id)} title={pin.title} aria-label={`Ver ${pin.title}`} className={`absolute z-10 -translate-x-1/2 -translate-y-full rounded-full border-2 border-white p-1.5 shadow-lg ${selectedId === pin.id ? "bg-primary text-primary-foreground" : "bg-card text-primary"}`} style={{ left: `calc(50% + ${pin.left}px)`, top: `calc(50% + ${pin.top}px)` }}>
              <MapPin className="h-4 w-4" />
            </button>
          );
        })}
        <div className="absolute right-3 top-3 z-20 flex flex-col overflow-hidden rounded-lg border bg-card shadow">
          <Button variant="ghost" size="icon" aria-label="Aumentar zoom" disabled={zoom >= 16} onClick={() => setZoom((value) => Math.min(16, value + 1))}><Plus className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" aria-label="Diminuir zoom" disabled={zoom <= 2} onClick={() => setZoom((value) => Math.max(2, value - 1))}><Minus className="h-4 w-4" /></Button>
        </div>
        <div className="absolute bottom-2 left-2 z-20 rounded bg-card/90 px-2 py-1 text-[10px] text-muted-foreground">© OpenStreetMap contributors</div>
      </div>

      {selected && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
          <div>
            <p className="text-xs text-muted-foreground">{KINDS[selected.kind]} · {[selected.city, selected.country].filter(Boolean).join(", ") || "Localização aproximada"}</p>
            <h2 className="mt-1 font-semibold">{selected.title}</h2>
            <p className="mt-1 text-sm text-primary">{formatPrice(selected.price, selected.currency)}</p>
          </div>
          <Button asChild><Link to="/anuncio/$id" params={{ id: selected.id }}>Ver anúncio</Link></Button>
        </div>
      )}

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Ofertas no mapa</h2>
          <p className="text-xs text-muted-foreground">{isLoading ? "A carregar…" : `${listings.length} localizações`}</p>
        </div>
        {isError ? <Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button> :
          listings.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{listings.slice(0, 12).map((item) => (
            <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setCenter({ latitude: item.latitude, longitude: item.longitude }); setCustomCenter(true); }} className="rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted">
              <p className="text-xs text-muted-foreground">{KINDS[item.kind]} · {[item.city, item.country].filter(Boolean).join(", ") || "Localização aproximada"}</p>
              <p className="mt-2 line-clamp-2 font-semibold">{item.title}</p>
              <p className="mt-2 text-sm text-primary">{formatPrice(item.price, item.currency)}</p>
            </button>
          ))}</div> :
          !isLoading ? <div className="rounded-xl border border-dashed p-8 text-center"><MapPin className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">Ainda não há anúncios com coordenadas</h2><p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">Os anúncios antigos continuam visíveis em Explorar. Ao publicar um novo anúncio, podes indicar cidade e país e, se quiseres, activar a localização aproximada para o colocar no mapa.</p><Button className="mt-4" asChild><Link to="/explorar">Explorar anúncios</Link></Button></div> : null}
      </section>
    </main>
  );
}
