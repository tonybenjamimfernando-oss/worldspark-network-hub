import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("A confirmar o teu email…");

  useEffect(() => {
    let cancelled = false;

    async function completeAuthentication() {
      try {
        const query = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const authError = query.get("error_description") || hash.get("error_description");

        if (authError) {
          throw new Error("A ligação de confirmação expirou ou já foi utilizada. Solicita uma nova mensagem.");
        }

        const code = query.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          throw new Error("Não foi possível confirmar a sessão. Solicita uma nova ligação de confirmação.");
        }

        if (!cancelled) {
          setMessage("Email confirmado. A abrir o teu painel…");
          await navigate({ to: "/painel" });
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível concluir a confirmação. Tenta novamente.",
          );
        }
      }
    }

    void completeAuthentication();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="mx-auto max-w-md px-5 py-14">
      <div className="border-t-2 border-primary py-7">
        <p className="eyebrow mb-4 text-primary">A TUA LIGAÇÃO AO MUNDO</p>
        <h1 className="text-2xl font-extrabold">Confirmação de email</h1>
        <p role="status" className="mt-3 text-sm text-muted-foreground">{message}</p>
        <Button type="button" className="mt-5 w-full" onClick={() => void navigate({ to: "/auth" })}>
          Voltar à autenticação
        </Button>
      </div>
    </main>
  );
}
