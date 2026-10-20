import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().trim().email();
const MIN_PASSWORD_LENGTH = 8;
const RATE_LIMIT_COOLDOWN_SECONDS = 60;

// Cloudflare Turnstile is intentionally inactive until the site key is supplied.

type AuthErrorLike = { message?: string; status?: number; code?: string };

function traduzirErroAuth(error: AuthErrorLike): string {
  const message = (error.message || "").toLowerCase();
  const code = (error.code || "").toLowerCase();

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    message.includes("email rate limit exceeded") ||
    message.includes("rate limit") ||
    error.status === 429
  ) {
    return "Muitas tentativas. Aguarda alguns minutos e tenta novamente.";
  }
  if (
    code === "user_already_exists" ||
    message.includes("user already registered") ||
    message.includes("already been registered") ||
    message.includes("already registered")
  ) {
    return "Este email já tem conta. Faz login ou recupera a palavra-passe.";
  }
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Confirma o teu email. Queres que reenviemos a mensagem?";
  }
  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials")
  ) {
    return "Email ou palavra-passe incorretos.";
  }
  if (message.includes("password") || code.includes("weak_password")) {
    return "A palavra-passe deve ter pelo menos 8 caracteres.";
  }
  return "Não foi possível concluir a operação. Tenta novamente.";
}

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
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resendBusy, setResendBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(
      () => setCooldown((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);

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

  async function reenviarConfirmacao(targetEmail = confirmationEmail || email.trim().toLowerCase()) {
    if (!targetEmail || cooldown > 0 || resendBusy || busy) return;
    const parsedEmail = emailSchema.safeParse(targetEmail);
    if (!parsedEmail.success) {
      toast.error("Indica um email válido.");
      return;
    }
    setResendBusy(true);
    setAuthError("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: parsedEmail.data,
        options: { emailRedirectTo: window.location.origin + "/auth/callback" },
      });
      if (error) throw error;
      setConfirmationEmail(parsedEmail.data);
      setCooldown(RATE_LIMIT_COOLDOWN_SECONDS);
      toast.success("E-mail de confirmação reenviado. Verifica também o spam.");
    } catch (err) {
      const error = err as AuthErrorLike;
      const translated = traduzirErroAuth(error);
      setAuthError(translated);
      toast.error(translated);
      if (translated.startsWith("Muitas tentativas")) setCooldown(RATE_LIMIT_COOLDOWN_SECONDS);
    } finally {
      setResendBusy(false);
    }
  }

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

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || cooldown > 0) return;

    // Honeypot: silently ignore automated submissions without calling Auth.
    if (website.trim()) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!recovery && mode !== "reset" && !emailSchema.safeParse(normalizedEmail).success) {
      toast.error("Indica um email válido.");
      return;
    }
    if ((mode === "up" && !recovery) && !name.trim()) {
      toast.error("Indica o teu nome.");
      return;
    }
    if ((mode === "up" || recovery) && password.length < MIN_PASSWORD_LENGTH) {
      toast.error("A palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }

    setBusy(true);
    setAuthError("");
    try {
      if (recovery) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setRecovery(false);
        setPassword("");
        toast.success("Palavra-passe alterada. Já podes continuar.");
        navigateAfterAuth();
      } else if (mode === "reset") {
        if (!emailSchema.safeParse(normalizedEmail).success) {
          toast.error("Indica um email válido.");
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Se existir uma conta com esse email, receberás instruções para recuperar o acesso.");
        setMode("in");
      } else if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth/callback",
            data: { full_name: name.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setConfirmationEmail(normalizedEmail);
          setCooldown(RATE_LIMIT_COOLDOWN_SECONDS);
          setAuthError("");
        }
      }
    } catch (err) {
      const error = err as AuthErrorLike;
      const translated = traduzirErroAuth(error);
      setAuthError(translated);
      toast.error(translated);
      if (translated.startsWith("Muitas tentativas")) {
        setCooldown(RATE_LIMIT_COOLDOWN_SECONDS);
      }
      if (translated.startsWith("Confirma o teu email")) {
        setEmail(normalizedEmail);
        setMode("in");
      }
    } finally {
      setBusy(false);
    }
  }

  const heading = confirmationEmail && !recovery
    ? "Confirma o teu e-mail"
    : recovery
      ? "Escolher nova palavra-passe"
      : mode === "reset"
        ? "Recuperar acesso"
        : mode === "in"
          ? "Entrar no GCNM"
          : "Criar conta";

  const needsResend = authError.toLowerCase().includes("confirma o teu email");

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
            <p className="text-sm text-muted-foreground">
              Enviámos um e-mail de confirmação para <strong>{confirmationEmail}</strong>. Verifica a caixa de entrada e o spam.
            </p>
            {authError && <p role="alert" className="text-sm text-destructive">{authError}</p>}
            <Button type="button" className="w-full" disabled={busy || resendBusy || cooldown > 0} onClick={() => void reenviarConfirmacao(confirmationEmail)}>
              {resendBusy ? "A reenviar…" : cooldown > 0 ? "Reenviar e-mail (" + cooldown + "s)" : "Reenviar e-mail"}
            </Button>
            <Button type="button" variant="link" className="w-full" onClick={() => { setConfirmationEmail(""); setMode("in"); setAuthError(""); }}>
              Voltar a entrar
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
              <Label htmlFor="website">Deixa este campo vazio</Label>
              <Input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
            </div>
            {mode === "up" && !recovery && (
              <div>
                <Label htmlFor="n">Nome</Label>
                <Input id="n" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} disabled={busy} />
              </div>
            )}
            {!recovery && (
              <div>
                <Label htmlFor="e">Email</Label>
                <Input id="e" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} />
              </div>
            )}
            {mode !== "reset" && (
              <div>
                <Label htmlFor="p">Palavra-passe{recovery ? " nova" : ""}</Label>
                <Input
                  id="p"
                  type="password"
                  autoComplete={recovery ? "new-password" : mode === "in" ? "current-password" : "new-password"}
                  minLength={recovery || mode === "up" ? MIN_PASSWORD_LENGTH : undefined}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={busy}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={busy || cooldown > 0}>
              {busy
                ? "A processar…"
                : cooldown > 0
                  ? "Tenta novamente em " + cooldown + "s"
                  : recovery
                    ? "Guardar nova palavra-passe"
                    : mode === "reset"
                      ? "Enviar instruções"
                      : mode === "in"
                        ? "Entrar"
                        : "Criar conta"}
            </Button>
          </form>
        )}
        {!recovery && !confirmationEmail && mode === "in" && (
          <Button variant="link" className="mt-2 h-auto w-full whitespace-normal text-sm" disabled={busy} onClick={() => { setMode("reset"); setAuthError(""); }}>
            Esqueci-me da palavra-passe
          </Button>
        )}
        {!recovery && !confirmationEmail && mode !== "in" && (
          <Button variant="link" className="mt-4 h-auto w-full whitespace-normal text-sm" disabled={busy} onClick={() => { setMode("in"); setAuthError(""); }}>
            Voltar a entrar
          </Button>
        )}
        {!recovery && !confirmationEmail && mode === "in" && (
          <Button variant="link" className="mt-2 h-auto w-full whitespace-normal text-sm" disabled={busy} onClick={() => { setMode("up"); setAuthError(""); }}>
            Ainda não tens conta? Regista-te
          </Button>
        )}
        {authError && !confirmationEmail && <p role="alert" className="mt-3 text-sm text-destructive">{authError}</p>}
        {needsResend && !confirmationEmail && mode === "in" && (
          <Button type="button" variant="link" className="w-full" disabled={busy || resendBusy || cooldown > 0} onClick={() => void reenviarConfirmacao(email.trim().toLowerCase())}>
            {resendBusy ? "A reenviar…" : cooldown > 0 ? "Reenviar e-mail (" + cooldown + "s)" : "Reenviar"}
          </Button>
        )}
      </div>
    </div>
  );
}
