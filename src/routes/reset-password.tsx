import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
      if (event === "SIGNED_IN") setReady(true);
    });
    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) { toast.error("A palavra-passe deve ter pelo menos 8 caracteres."); return; }
    if (password !== confirm) { toast.error("As palavras-passe não coincidem."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Palavra-passe alterada com sucesso.");
      await navigate({ to: "/auth" });
    } catch {
      toast.error("Não foi possível alterar a palavra-passe. Solicita uma nova ligação de recuperação.");
    } finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-md px-5 py-14"><div className="border-t-2 border-primary py-7"><p className="eyebrow mb-4 text-primary">A TUA LIGAÇÃO AO MUNDO</p><h1 className="text-2xl font-extrabold">Escolher nova palavra-passe</h1><p className="mt-1 text-sm text-muted-foreground">Define uma palavra-passe nova para proteger a tua conta.</p>{!ready && <p className="mt-4 text-sm text-muted-foreground">Abre esta página através da ligação enviada para o teu e-mail.</p>}<form onSubmit={submit} className="mt-5 space-y-4"><div><Label htmlFor="new-password">Nova palavra-passe</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></div><div><Label htmlFor="confirm-password">Confirmar palavra-passe</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div><Button type="submit" className="w-full" disabled={busy || !ready}>{busy ? "A guardar…" : "Guardar nova palavra-passe"}</Button></form></div></div>;
}
