import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { MessageCircle, Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { meta } from "@/components/InfoPage";

export const Route = createFileRoute("/mensagens")({
  validateSearch: z.object({ conversation: z.string().uuid().optional() }),
  head: () => meta("Mensagens — GCNM", "Conversa em privado com compradores e vendedores do GCNM."),
  component: MessagesPage,
});

type ConversationRow = {
  id: string;
  listing_id: string;
  participant_a: string;
  participant_b: string;
  last_message_at: string;
  listingTitle: string;
  otherName: string;
};

function MessagesPage() {
  const { conversation } = Route.useSearch();
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const conversationsQuery = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<ConversationRow[]> => {
      if (!user) return [];
      const { data, error } = await supabase.from("conversations").select("*").order("last_message_at", { ascending: false }).limit(100);
      if (error) throw error;
      if (!data?.length) return [];
      const listingIds = [...new Set(data.map((item) => item.listing_id))];
      const profileIds = [...new Set(data.map((item) => item.participant_a === user.id ? item.participant_b : item.participant_a))];
      const [listingResult, profileResult] = await Promise.all([
        supabase.from("listings").select("id,title").in("id", listingIds),
        supabase.from("profiles").select("id,display_name").in("id", profileIds),
      ]);
      if (listingResult.error) throw listingResult.error;
      if (profileResult.error) throw profileResult.error;
      const listingNames = new Map((listingResult.data ?? []).map((item) => [item.id, item.title]));
      const profileNames = new Map((profileResult.data ?? []).map((item) => [item.id, item.display_name]));
      return data.map((item) => {
        const otherId = item.participant_a === user.id ? item.participant_b : item.participant_a;
        return {
          ...item,
          listingTitle: listingNames.get(item.listing_id) ?? "Anúncio indisponível",
          otherName: profileNames.get(otherId) ?? "Utilizador",
        };
      });
    },
  });

  const selectedId = conversation ?? conversationsQuery.data?.[0]?.id;
  const messagesQuery = useQuery({
    queryKey: ["messages", selectedId],
    enabled: Boolean(user && selectedId),
    queryFn: async () => {
      const { data, error } = await supabase.from("messages").select("*").eq("conversation_id", selectedId!).order("created_at", { ascending: true }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`marketplace-messages-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        const row = payload.new as { conversation_id?: string };
        if (row.conversation_id) void queryClient.invalidateQueries({ queryKey: ["messages", row.conversation_id] });
        void queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!user || !selectedId || !body || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedId,
        sender_id: user.id,
        body,
      });
      if (error) throw error;
      setDraft("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["messages", selectedId] }),
        queryClient.invalidateQueries({ queryKey: ["conversations", user.id] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-6xl px-5 py-12 text-sm text-muted-foreground">A verificar sessão…</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <MessageCircle className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">As tuas mensagens</h1>
        <p className="mt-2 text-muted-foreground">Entra na tua conta para conversar com compradores e vendedores.</p>
        <Button className="mt-5" onClick={() => navigate({ to: "/auth" })}>Entrar</Button>
      </div>
    );
  }

  const conversations = conversationsQuery.data ?? [];
  const active = conversations.find((item) => item.id === selectedId);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-primary">GCNM · CONTACTO DIRECTO</p>
        <h1 className="mt-2 text-3xl font-extrabold">Mensagens</h1>
        <p className="mt-2 text-sm text-muted-foreground">Conversa privada, ligada ao anúncio e acessível apenas aos participantes.</p>
      </div>
      <div className="grid min-h-[560px] overflow-hidden rounded-2xl border bg-card md:grid-cols-[300px_1fr]">
        <aside className="border-b p-3 md:border-b-0 md:border-r">
          <h2 className="px-2 py-3 text-sm font-semibold">Conversas</h2>
          {conversationsQuery.isLoading ? <p className="p-3 text-sm text-muted-foreground">A carregar…</p> :
            conversationsQuery.isError ? <Button variant="outline" className="w-full" onClick={() => void conversationsQuery.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Tentar novamente</Button> :
            conversations.length === 0 ? <p className="p-3 text-sm text-muted-foreground">Ainda não tens conversas. Abre um anúncio e escolhe “Enviar mensagem”.</p> :
            <div className="space-y-1">{conversations.map((item) => (
              <button key={item.id} onClick={() => navigate({ to: "/mensagens", search: { conversation: item.id } })} className={`w-full rounded-xl p-3 text-left transition-colors hover:bg-muted ${item.id === selectedId ? "bg-muted" : ""}`}>
                <span className="block truncate text-sm font-semibold">{item.otherName}</span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">{item.listingTitle}</span>
                <span className="mt-1 block text-[11px] text-muted-foreground">{new Date(item.last_message_at).toLocaleString("pt-PT")}</span>
              </button>
            ))}</div>}
        </aside>
        <section className="flex min-h-[560px] flex-col">
          {!active ? (
            <div className="grid flex-1 place-items-center p-8 text-center text-sm text-muted-foreground"><div><MessageCircle className="mx-auto mb-3 h-8 w-8" />Escolhe uma conversa ou inicia-a a partir de um anúncio.</div></div>
          ) : (
            <>
              <header className="border-b px-5 py-4">
                <p className="font-semibold">{active.otherName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{active.listingTitle}</p>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messagesQuery.isLoading ? <p className="text-sm text-muted-foreground">A carregar mensagens…</p> :
                  messagesQuery.isError ? <Button variant="outline" onClick={() => void messagesQuery.refetch()}>Tentar novamente</Button> :
                  messagesQuery.data?.length ? messagesQuery.data.map((message) => (
                    <div key={message.id} className={`flex ${message.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm ${message.sender_id === user.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {message.body}
                        <p className={`mt-1 text-[10px] opacity-70 ${message.sender_id === user.id ? "text-right" : ""}`}>{new Date(message.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  )) : <p className="py-8 text-center text-sm text-muted-foreground">Diz olá para iniciar a conversa.</p>}
              </div>
              <form onSubmit={sendMessage} className="flex items-end gap-2 border-t p-3">
                <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escreve a tua mensagem…" rows={2} maxLength={4000} className="min-h-12 resize-none" />
                <Button type="submit" disabled={!draft.trim() || sending} aria-label="Enviar mensagem"><Send className="h-4 w-4" /></Button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
