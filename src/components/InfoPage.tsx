import type { ReactNode } from "react";

export function InfoPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{intro}</p>
      <div className="mt-8 space-y-4">{children}</div>
    </div>
  );
}

export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-2xl border bg-card p-5"><h2 className="font-bold">{title}</h2><div className="mt-1 text-sm text-muted-foreground">{children}</div></div>;
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
