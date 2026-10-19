import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { validateImageFile } from "@/lib/image-validation";

export async function uploadImage(userId: string, file: File, folder: string) {
  const ext = await validateImageFile(file);
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

/** Resolves storage paths to signed URLs; external https URLs pass through unchanged. */
export function useSignedUrls(paths: (string | null | undefined)[]) {
  const all = paths.filter((p): p is string => !!p);
  const stored = all.filter((p) => !p.startsWith("https://"));
  const q = useQuery({
    queryKey: ["signed", stored],
    enabled: stored.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("media").createSignedUrls(stored, 3600);
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((d) => { if (d.path && d.signedUrl) map[d.path] = d.signedUrl; });
      return map;
    },
  });
  const map: Record<string, string> = { ...(q.data ?? {}) };
  all.forEach((p) => { if (p.startsWith("https://")) map[p] = p; });
  return { data: map };
}
