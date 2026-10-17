import { createFileRoute } from "@tanstack/react-router";
import { ProfileDirectory } from "@/components/ProfileDirectory";

export const Route = createFileRoute("/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas e lojas — GCNM" },
      { name: "description", content: "Empresas, lojas, fabricantes e distribuidores no GCNM." },
      { property: "og:title", content: "Empresas e lojas — GCNM" },
      { property: "og:description", content: "Empresas, lojas, fabricantes e distribuidores no GCNM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ProfileDirectory type="business" title="Empresas e lojas" intro="Lojas, fabricantes, distribuidores e marcas com perfil no GCNM." />,
});
