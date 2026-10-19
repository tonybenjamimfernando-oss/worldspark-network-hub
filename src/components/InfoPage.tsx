import type { ReactNode } from "react";

export function InfoPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="page-heading"><p className="eyebrow mb-3 text-primary">GLOBAL COMMERCE NETWORK MAP</p><h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{intro}</p></div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return <section className="grid gap-3 border-b pb-6 sm:grid-cols-[220px_1fr]"><h2 className="text-base font-bold">{title}</h2><div className="text-sm leading-7 text-muted-foreground">{children}</div></section>;
}

export function meta(title: string, description: string) {
  return {
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  };
}
