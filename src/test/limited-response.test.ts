import { describe, expect, it } from "vitest";
import { readLimitedText } from "@/lib/limited-response";

describe("readLimitedText", () => {
  it("reads a response within the byte limit", async () => {
    const response = new Response("Product title");
    await expect(readLimitedText(response, 32)).resolves.toBe("Product title");
  });

  it("counts UTF-8 bytes rather than JavaScript characters", async () => {
    const response = new Response("éé");
    await expect(readLimitedText(response, 4)).resolves.toBe("éé");
    await expect(readLimitedText(new Response("éé"), 3)).rejects.toThrow(/size limit/i);
  });

  it("rejects a body that exceeds the limit", async () => {
    await expect(readLimitedText(new Response("12345"), 4)).rejects.toThrow(/size limit/i);
  });

  it("rejects an invalid limit", async () => {
    await expect(readLimitedText(new Response("x"), -1)).rejects.toThrow(/invalid/i);
  });
});
