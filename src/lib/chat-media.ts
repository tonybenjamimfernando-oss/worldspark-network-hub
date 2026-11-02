import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const CHAT_MAX_BYTES = 25 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/zip": "zip",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

/** Returns the safe extension for a chat attachment, or throws a user-facing error. */
export function validateChatFile(type: string, size: number): string {
  const base = type.split(";")[0]!.trim().toLowerCase();
  const ext = ALLOWED[base];
  if (!ext) throw new Error("Tipo de ficheiro não suportado.");
  if (size <= 0 || size > CHAT_MAX_BYTES) throw new Error("O ficheiro tem de ter no máximo 25 MB.");
  return ext;
}

export function attachmentKind(type: string | null): "image" | "video" | "audio" | "file" {
  if (!type) return "file";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return "file";
}

export async function uploadChatFile(conversationId: string, userId: string, blob: Blob) {
  const ext = validateChatFile(blob.type, blob.size);
  const path = `${conversationId}/${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("chat").upload(path, blob, { contentType: blob.type.split(";")[0] });
  if (error) throw error;
  return path;
}

export function useChatUrl(path: string | null) {
  return useQuery({
    queryKey: ["chat-url", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("chat").createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
