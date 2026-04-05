import { describe, expect, it } from "vitest";

import { formatTitle } from "./formatTitle";

describe("formatTitle", () => {
  it("recorta espacios", () => {
    expect(formatTitle("  hola  ")).toBe("hola");
  });

  it("usa valor por defecto si queda vacío", () => {
    expect(formatTitle("   ")).toBe("LAB10");
  });
});
