import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      const pathname = location.pathname;
      const search = location.search as { kind?: unknown };
      let next: "publish-product" | "publish-service" | "publish-request" | "messages" | "panel" | undefined;

      if (pathname === "/mensagens") {
        next = "messages";
      } else if (pathname === "/painel") {
        next = "panel";
      } else if (pathname === "/publicar") {
        next =
          search.kind === "service"
            ? "publish-service"
            : search.kind === "request"
              ? "publish-request"
              : "publish-product";
      }

      throw redirect({ to: "/auth", search: next ? { next } : {} });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
