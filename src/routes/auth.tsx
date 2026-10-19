import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — GCNM" },
      { name: "description", content: "Entra ou cria a tua conta no GCNM para publicar e contactar vendedores." },
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
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/painel" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/painel" });
        else toast.success("Conta criada. Confirma o teu email para entrar.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Não foi possível entrar com Google");
    else if (!r.redirected) navigate({ to: "/painel" });
  }

  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <div className="border-t-2 border-primary py-7">
        <p className="eyebrow mb-4 text-primary">A TUA LIGAÇÃO AO MUNDO</p>
        <h1 className="text-2xl font-extrabold">{mode === "in" ? "Entrar no GCNM" : "Criar conta"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Publica, avalia e liga-te a compradores e vendedores.</p>
        <Button variant="outline" className="mt-6 w-full" onClick={google}>Continuar com Google</Button>
        <div className="my-5 text-center text-xs text-muted-foreground">ou com email</div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "up" && (
            <div><Label htmlFor="n">Nome</Label><Input id="n" required value={name} onChange={(e) => setName(e.target.value)} /></div>
          )}
          <div><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label htmlFor="p">Palavra-passe</Label><Input id="p" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Entrar" : "Criar conta"}</Button>
        </form>
        <Button variant="link" className="mt-4 h-auto w-full whitespace-normal text-sm" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Ainda não tens conta? Regista-te" : "Já tens conta? Entra"}
        </Button>
      </div>
    </div>
  );
}
