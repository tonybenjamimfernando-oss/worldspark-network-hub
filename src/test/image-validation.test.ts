import { describe, expect, it } from "vitest";
import { validateImageFile } from "@/lib/image-validation";

function file(type: string, bytes: number[], size = bytes.length): File {
  const data = new Uint8Array(bytes);
  return {
    type,
    size,
    slice: () => ({ arrayBuffer: async () => data.buffer }),
  } as unknown as File;
}

describe("validateImageFile", () => {
  it("accepts valid JPEG, PNG, GIF and WebP signatures", async () => {
    await expect(validateImageFile(file("image/jpeg", [0xff, 0xd8, 0xff]))).resolves.toBe("jpg");
    await expect(validateImageFile(file("image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).resolves.toBe("png");
    await expect(validateImageFile(file("image/gif", [...new TextEncoder().encode("GIF89a")]))).resolves.toBe("gif");
    await expect(validateImageFile(file("image/webp", [...new TextEncoder().encode("RIFFxxxxWEBP")]))).resolves.toBe("webp");
  });

  it("rejects a declared image type with a mismatched signature", async () => {
    await expect(validateImageFile(file("image/png", [...new TextEncoder().encode("<script>")]))).rejects.toThrow(/não corresponde/i);
  });

  it("rejects unsupported formats", async () => {
    await expect(validateImageFile(file("image/svg+xml", [...new TextEncoder().encode("<svg/>")]))).rejects.toThrow(/não suportado/i);
  });

  it("rejects files over 10 MB before reading their contents", async () => {
    const large = file("image/png", [0x89], 10 * 1024 * 1024 + 1);
    await expect(validateImageFile(large)).rejects.toThrow(/10 MB/);
  });
});
