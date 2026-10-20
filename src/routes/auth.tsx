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

export function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [recovery, setRecovery] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resendBusy, setResendBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function traduzirErroAuth(error: { message?: string; status?: number; code?: string }) {
    const m = (error?.message || "").toLowerCase();
    if (m.includes("rate limit") || error?.status === 429 || error?.code === "over_email_send_rate_limit") return "Muitos pedidos de e-mail. Aguarda alguns minutos e tenta novamente.";
    if (m.includes("invalid login credentials")) return "Email ou palavra-passe incorretos, ou a conta ainda não foi confirmada.";
    if (m.includes("email not confirmed")) return "Confirma o teu e-mail antes de entrar. Verifica a caixa de entrada e o spam.";
    if (m.includes("already registered") || m.includes("already been registered")) return "Este e-mail já tem conta. Tenta entrar.";
    if (m.includes("password")) return "A palavra-passe deve ter pelo menos 8 caracteres.";
    return "Ocorreu um erro. Tenta novamente.";
  }

  async function reenviarConfirmacao(targetEmail = confirmationEmail || email.trim().toLowerCase()) {
    if (!targetEmail || cooldown > 0 || resendBusy) return;
    setResendBusy(true);
    setAuthError("");
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: targetEmail, options: { emailRedirectTo: window.location.origin + "/" } });
      if (error) throw error;
      setConfirmationEmail(targetEmail); setCooldown(60);
      toast.success("E-mail de confirmação reenviado. Verifica também o spam.");
    } catch (err) {
      const error = err as { message?: string; status?: number; code?: string };
      const translated = traduzirErroAuth(error);
      setAuthError(translated);
      toast.error(translated);
      const raw = (error.message || "").toLowerCase();
      if (raw.includes("rate limit") || error.status === 429 || error.code === "over_email_send_rate_limit") setCooldown(60);
    } finally { setResendBusy(false); }
  }

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
    const normalizedEmail = email.trim().toLowerCase();
    if (mode === "up" && !recovery && !name.trim()) {
      toast.error("Indica o teu nome.");
      return;
    }
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
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Se existir uma conta com esse email, receberás instruções para recuperar o acesso.");
        setMode("in");
      } else if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/",
            data: { full_name: name.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) { setConfirmationEmail(normalizedEmail); setAuthError(""); }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/invalid login credentials/i.test(message)) {
        toast.error("Email ou palavra-passe incorretos.");
      } else if (/user already registered|already been registered/i.test(message)) {
        toast.error("Já existe uma conta com este email. Entra ou recupera a palavra-passe.");
      } else if (/password.*(characters|length|short)|weak password/i.test(message)) {
        toast.error("A palavra-passe deve cumprir os requisitos de segurança.");
      } else if (/email not confirmed/i.test(message)) {
        toast.error("Confirma o teu email antes de entrar.");
      } else {
        toast.error(message || "Não foi possível concluir a operação. Tenta novamente.");
      }
    } finally {
      setBusy(false);
    }
  }

  const heading = confirmationEmail && !recovery ? "Confirma o teu e-mail"
    : recovery
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
        {confirmationEmail && !recovery ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-muted-foreground">Enviámos um e-mail de confirmação para <strong>{confirmationEmail}</strong>. Verifica a caixa de entrada e o spam.</p>
            {authError && <p role="alert" className="text-sm text-destructive">{authError}</p>}
            <Button type="button" className="w-full" disabled={resendBusy || cooldown > 0} onClick={() => void reenviarConfirmacao(confirmationEmail)}>{resendBusy ? "A reenviar…" : cooldown > 0 ? "Reenviar e-mail (" + cooldown + "s)" : "Reenviar e-mail"}</Button>
            <Button type="button" variant="link" className="w-full" onClick={() => { setConfirmationEmail(""); setMode("in"); setAuthError(""); }}>Voltar a entrar</Button>
          </div>
        ) : <form onSubmit={submit} className="space-y-4">
          {mode === "up" && !recovery && (
            <div>
              <Label htmlFor="n">Nome</Label>
              <Input id="n" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
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
                minLength={recovery || mode === "up" ? 8 : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={busy || (mode === "up" && cooldown > 0)}>
            {busy
              ? "A processar…"
              : recovery
                ? "Guardar nova palavra-passe"
                : mode === "reset"
                  ? "Enviar instruções"
                  : mode === "in"
                    ? "Entrar"
                    : mode === "up" && cooldown > 0 ? "Tenta novamente em " + cooldown + "s" : "Criar conta"}
          </Button>
        </form>}
        {!recovery && !confirmationEmail && mode === "in" && (
          <Button
            variant="link"
            className="mt-2 h-auto w-full whitespace-normal text-sm"
            disabled={busy}
            onClick={() => setMode("reset")}
          >
            Esqueci-me da palavra-passe
          </Button>
        )}
        {!recovery && !confirmationEmail && mode !== "in" && (
          <Button
            variant="link"
            className="mt-4 h-auto w-full whitespace-normal text-sm"
            disabled={busy}
            onClick={() => setMode("in")}
          >
            Voltar a entrar
          </Button>
        )}
        {!recovery && !confirmationEmail && mode === "in" && (
          <Button
            variant="link"
            className="mt-2 h-auto w-full whitespace-normal text-sm"
            disabled={busy}
            onClick={() => setMode("up")}
          >
            Ainda não tens conta? Regista-te
          </Button>
        )}
        {authError && !confirmationEmail && <p role="alert" className="mt-3 text-sm text-destructive">{authError}</p>}
        {authError.includes("Confirma o teu e-mail") && !confirmationEmail && mode === "in" && <Button type="button" variant="link" className="w-full" disabled={resendBusy || cooldown > 0} onClick={() => void reenviarConfirmacao(email.trim().toLowerCase())}>{resendBusy ? "A reenviar…" : cooldown > 0 ? "Reenviar e-mail (" + cooldown + "s)" : "Reenviar e-mail de confirmação"}</Button>}
      </div>
    </div>
  );
}
