import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeCheck, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  business_name: z.string().trim().min(2, "Indica o nome comercial").max(160),
  registration_number: z.string().trim().max(80),
  website: z.string().trim().max(300).refine((v) => !v || /^https:\/\//.test(v), "O site deve começar por https://"),
  notes: z.string().trim().max(2000),
});

/** Seller-side: request the verified badge and see the latest decision. */
export function VerificationRequest({ userId, verified }: { userId: string; verified: boolean }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ business_name: "", registration_number: "", website: "", notes: "" });
  const latest = useQuery({
    queryKey: ["verification", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("verification_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const submit = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse(form);
      const { error } = await supabase.from("verification_requests").insert({
        user_id: userId,
        business_name: parsed.business_name,
        registration_number: parsed.registration_number || null,
        website: parsed.website || null,
        notes: parsed.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pedido enviado para análise."); void qc.invalidateQueries({ queryKey: ["verification", userId] }); },
    onError: (e) => toast.error(e instanceof z.ZodError ? e.issues[0]!.message : e instanceof Error ? e.message : "Não foi possível enviar."),
  });

  const r = latest.data;
  return (
    <section className="py-2">
      <h2 className="font-bold">Verificação comercial</h2>
      {verified ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-primary"><BadgeCheck className="h-4 w-4" />O teu perfil está verificado.</p>
      ) : r?.status === "pending" ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />Pedido em análise desde {new Date(r.created_at).toLocaleDateString("pt-PT")}.</p>
      ) : (
        <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}>
          {r?.status === "rejected" && (
            <p className="flex items-start gap-2 text-sm text-destructive"><XCircle className="mt-0.5 h-4 w-4 shrink-0" />Pedido anterior recusado{r.review_note ? `: ${r.review_note}` : "."} Podes corrigir e voltar a pedir.</p>
          )}
          <p className="text-sm text-muted-foreground">A equipa GCNM analisa os dados antes de atribuir o selo. Não partilhes documentos pessoais aqui.</p>
          <Input aria-label="Nome comercial" placeholder="Nome comercial *" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
          <Input aria-label="Número de registo" placeholder="Número de registo comercial (opcional)" value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} />
          <Input aria-label="Site oficial" placeholder="https://site-oficial.com (opcional)" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <Textarea aria-label="Notas" placeholder="Como podemos confirmar o teu negócio?" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button type="submit" disabled={submit.isPending}>{submit.isPending ? "A enviar…" : "Pedir verificação"}</Button>
        </form>
      )}
    </section>
  );
}

/** Admin-side: list pending requests and approve/reject through the secured database function. */
export function VerificationQueue() {
  const qc = useQueryClient();
  const pending = useQuery({
    queryKey: ["verification-queue"],
    queryFn: async () => {
      const { data, error } = await supabase.from("verification_requests").select("*").eq("status", "pending").order("created_at").limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
  const decide = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const note = approve ? null : window.prompt("Motivo da recusa (visível para o vendedor):") ?? null;
      const { error } = await supabase.rpc("review_verification", { _id: id, _approve: approve, _note: note ?? undefined });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Decisão registada."); void qc.invalidateQueries({ queryKey: ["verification-queue"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  return (
    <section className="mt-8 rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3"><BadgeCheck className="h-5 w-5 text-primary" /><h2 className="font-semibold">Pedidos de verificação</h2></div>
      {pending.isLoading ? <p className="mt-3 text-sm text-muted-foreground">A carregar…</p> :
        !pending.data?.length ? <p className="mt-3 text-sm text-muted-foreground">Sem pedidos pendentes.</p> :
        <ul className="mt-3 divide-y">
          {pending.data.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold">{r.business_name}</p>
                <p className="text-muted-foreground">{[r.registration_number, r.website].filter(Boolean).join(" · ") || "Sem registo/site indicado"}</p>
                {r.notes && <p className="mt-1 whitespace-pre-wrap">{r.notes}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ id: r.id, approve: true })}>Aprovar</Button>
                <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => decide.mutate({ id: r.id, approve: false })}>Recusar</Button>
              </div>
            </li>
          ))}
        </ul>}
    </section>
  );
}
