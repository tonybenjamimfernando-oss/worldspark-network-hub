// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// Public client config (URL + publishable key; protected by RLS). Used only when the
// build environment does not provide them, so hosted builds never ship a blank app.
const PUBLIC_FALLBACK = {
  VITE_SUPABASE_URL: "https://vrwutsbnciyqdhuscylh.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_MaKGvH0kHk8W5i5Yr3Of2w_MUgb5PQq",
  VITE_SUPABASE_PROJECT_ID: "vrwutsbnciyqdhuscylh",
};

const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
const define: Record<string, string> = {};
for (const [key, value] of Object.entries(PUBLIC_FALLBACK)) {
  if (!env[key]) define[`import.meta.env.${key}`] = JSON.stringify(value);
}

export default defineConfig({
  vite: { define },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
