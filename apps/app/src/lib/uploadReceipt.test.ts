import { describe, expect, it } from "vitest";

import { isAllowedReceiptFile } from "./uploadReceipt";

describe("isAllowedReceiptFile", () => {
  it("acepta PDF por tipo MIME", () => {
    const f = new File([""], "r.pdf", { type: "application/pdf" });
    expect(isAllowedReceiptFile(f)).toBe(true);
  });

  it("rechaza .txt", () => {
    const f = new File([""], "x.txt", { type: "text/plain" });
    expect(isAllowedReceiptFile(f)).toBe(false);
  });
});
