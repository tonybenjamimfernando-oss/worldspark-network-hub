import { useEffect, useRef } from "react";

/** Lightweight 2D-canvas rotating dot globe with golden connection arcs. Static frame when reduced motion is preferred. */
export function Globe({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const css = getComputedStyle(document.documentElement);
    const gold = css.getPropertyValue("--globe-gold").trim() || "#f2b84b";

    const pts: [number, number][] = [];
    for (let lat = -80; lat <= 80; lat += 6) {
      const step = 6 / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
      for (let lon = -180; lon < 180; lon += step) pts.push([lat, lon]);
    }
    const hubs: [number, number][] = [[38.7, -9.1], [-19.8, 34.8], [-23.5, -46.6], [40.7, -74], [51.5, -0.1], [31.2, 121.5], [25.2, 55.3], [-8.8, 13.2], [1.3, 103.8], [6.5, 3.4]];
    const arcs: [number, number][] = [[0, 1], [1, 7], [0, 2], [3, 4], [4, 5], [5, 8], [6, 1], [9, 4], [2, 3]];

    let raf = 0, rot = 0, w = 0, h = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    const project = (lat: number, lon: number, R: number, cx: number, cy: number) => {
      const la = (lat * Math.PI) / 180, lo = ((lon + rot) * Math.PI) / 180, tilt = 0.35;
      const x = Math.cos(la) * Math.sin(lo);
      let y = Math.sin(la), z = Math.cos(la) * Math.cos(lo);
      const y2 = y * Math.cos(tilt) - z * Math.sin(tilt); z = y * Math.sin(tilt) + z * Math.cos(tilt); y = y2;
      return { x: cx + x * R, y: cy - y * R, z };
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.46, cx = w / 2, cy = h / 2;
      const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.1, cx, cy, R * 1.1);
      g.addColorStop(0, "rgba(242,184,75,0.28)"); g.addColorStop(1, "rgba(242,184,75,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2); ctx.fill();
      for (const [la, lo] of pts) {
        const p = project(la, lo, R, cx, cy);
        if (p.z < 0) continue;
        ctx.globalAlpha = 0.15 + p.z * 0.6; ctx.fillStyle = gold;
        ctx.fillRect(p.x, p.y, 1.6, 1.6);
      }
      ctx.globalAlpha = 1; ctx.strokeStyle = gold; ctx.lineWidth = 1.2;
      for (const [a, b] of arcs) {
        const A = project(hubs[a]![0], hubs[a]![1], R, cx, cy), B = project(hubs[b]![0], hubs[b]![1], R, cx, cy);
        if (A.z < 0 || B.z < 0) continue;
        const mx = (A.x + B.x) / 2 + (A.x + B.x - 2 * cx) * 0.25, my = (A.y + B.y) / 2 + (A.y + B.y - 2 * cy) * 0.25;
        ctx.globalAlpha = Math.min(A.z, B.z) * 0.9;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(mx, my, B.x, B.y); ctx.stroke();
      }
      for (const hb of hubs) {
        const p = project(...hb, R, cx, cy);
        if (p.z < 0) continue;
        ctx.globalAlpha = p.z; ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce) { rot += 0.12; raf = requestAnimationFrame(draw); }
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} aria-hidden className={className} />;
}
