const MAX_BYTES = 10 * 1024 * 1024;

const IMAGE_SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  "image/gif": (b) => b.length >= 6 && String.fromCharCode(...b.slice(0, 6)).match(/^GIF8[79]a$/) !== null,
  "image/webp": (b) => b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
};

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Checks declared MIME type against the file signature and returns a canonical extension. */
export async function validateImageFile(file: Pick<File, "type" | "size" | "slice">): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error("Imagem demasiado grande (máx. 10 MB).");
  const signatureCheck = IMAGE_SIGNATURES[file.type];
  if (!signatureCheck) throw new Error("Formato não suportado. Use JPG, PNG, WEBP ou GIF.");

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!signatureCheck(header)) {
    throw new Error("O conteúdo do ficheiro não corresponde ao formato de imagem declarado.");
  }
  return EXTENSIONS[file.type];
}
