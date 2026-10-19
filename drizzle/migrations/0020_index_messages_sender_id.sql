-- Index the sender foreign key to keep message ownership lookups efficient.
create index if not exists messages_sender_id_idx
  on public.messages (sender_id);
