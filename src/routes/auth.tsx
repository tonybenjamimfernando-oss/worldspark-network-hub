import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    next: z.enum(["publish-product", "publish-service", "publish-request", "messages", "panel"]).optional(),
  }),
  head: () => ({
    meta: [
      { title: "Entrar — GCNM" },
      {
        name: "description",
        content: "Entra ou cria a tua conta no GCNM para publicar e contactar vendedores.",
      },
      { property: "og:title", content: "Entrar — GCNM" },
      { property: "og:description", content: "Entra ou cria a tua conta no GCNM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [recovery, setRecovery] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const navigateAfterAuth = useCallback(() => {
    switch (next) {
      case "publish-product":
        navigate({ to: "/publicar", search: { kind: "product" } });
        break;
      case "publish-service":
        navigate({ to: "/publicar", search: { kind: "service" } });
        break;
      case "publish-request":
        navigate({ to: "/publicar", search: { kind: "request" } });
        break;
      case "messages":
        navigate({ to: "/mensagens" });
        break;
      default:
        navigate({ to: "/painel" });
    }
  }, [navigate, next]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecovery(true);
        setMode("in");
        setPassword("");
      } else if (event === "SIGNED_IN") {
        navigateAfterAuth();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [navigateAfterAuth]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (recovery) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setRecovery(false);
        setPassword("");
        toast.success("Palavra-passe alterada. Já podes continuar.");
        navigateAfterAuth();
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?next=${next ?? "panel"}`,
        });
        if (error) throw error;
        toast.success("Se existir uma conta com esse email, receberás instruções para recuperar o acesso.");
        setMode("in");
      } else if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigateAfterAuth();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth?next=${next ?? "panel"}`, data: { full_name: name } },
        });
        if (error) throw error;
        if (data.session) navigateAfterAuth();
        else toast.success("Conta criada. Confirma o teu email para entrar.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir a operação.");
    } finally {
      setBusy(false);
    }
  }

  const heading = recovery
    ? "Escolher nova palavra-passe"
    : mode === "reset"
      ? "Recuperar acesso"
      : mode === "in"
        ? "Entrar no GCNM"
        : "Criar conta";

  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <div className="border-t-2 border-primary py-7">
        <p className="eyebrow mb-4 text-primary">A TUA LIGAÇÃO AO MUNDO</p>
        <h1 className="text-2xl font-extrabold">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {recovery
            ? "Define uma palavra-passe nova para proteger a tua conta."
            : mode === "reset"
              ? "Indica o email da tua conta para receberes as instruções de recuperação."
              : "Publica, avalia e liga-te a compradores e vendedores."}
        </p>
        <form onSubmit={submit} className="space-y-4">
          {mode === "up" && !recovery && (
            <div>
              <Label htmlFor="n">Nome</Label>
              <Input id="n" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          {!recovery && (
            <div>
              <Label htmlFor="e">Email</Label>
              <Input
                id="e"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}
          {mode !== "reset" && (
            <div>
              <Label htmlFor="p">Palavra-passe{recovery ? " nova" : ""}</Label>
              <Input
                id="p"
                type="password"
                autoComplete={recovery ? "new-password" : mode === "in" ? "current-password" : "new-password"}
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy
              ? "A processar…"
              : recovery
                ? "Guardar nova palavra-passe"
                : mode === "reset"
                  ? "Enviar instruções"
                  : mode === "in"
                    ? "Entrar"
                    : "Criar conta"}
          </Button>
        </form>
        {!recovery && mode === "in" && (
          <Button
            variant="link"
            className="mt-2 h-auto w-full whitespace-normal text-sm"
            onClick={() => setMode("reset")}
          >
            Esqueci-me da palavra-passe
          </Button>
        )}
        {!recovery && mode !== "in" && (
          <Button
            variant="link"
            className="mt-4 h-auto w-full whitespace-normal text-sm"
            onClick={() => setMode("in")}
          >
            Voltar a entrar
          </Button>
        )}
        {!recovery && mode === "in" && (
          <Button
            variant="link"
            className="mt-2 h-auto w-full whitespace-normal text-sm"
            onClick={() => setMode("up")}
          >
            Ainda não tens conta? Regista-te
          </Button>
        )}
      </div>
    </div>
  );
}
