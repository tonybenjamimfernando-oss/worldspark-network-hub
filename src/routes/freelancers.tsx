import { createFileRoute } from "@tanstack/react-router";
import { ProfileDirectory } from "@/components/ProfileDirectory";

export const Route = createFileRoute("/freelancers")({
  head: () => ({
    meta: [
      { title: "Freelancers e prestadores — GCNM" },
      { name: "description", content: "Profissionais e prestadores de serviços no GCNM." },
      { property: "og:title", content: "Freelancers e prestadores — GCNM" },
      { property: "og:description", content: "Profissionais e prestadores de serviços no GCNM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ProfileDirectory type="provider" title="Freelancers e prestadores" intro="Profissionais independentes e prestadores de serviços." />,
});
