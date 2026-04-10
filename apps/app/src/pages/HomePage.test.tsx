import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "./HomePage";

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

const signOut = vi.fn();

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    session: { access_token: "test-access-token" },
    loading: false,
    signOut,
  }),
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    signOut.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("F7: archivo no permitido muestra error sin llamar fetch", async () => {
    renderHome();
    const input = screen.getAllByTestId("receipt-file-input")[0] as HTMLInputElement;
    const bad = new File(["x"], "note.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [bad] } });
    expect(await screen.findByText(/solo se permiten pdf/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("F5: subida exitosa muestra receipt_id", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ receipt_id: "rid-123" })),
    } as Response);

    renderHome();
    const input = screen.getAllByTestId("receipt-file-input")[0] as HTMLInputElement;
    const good = new File(["%PDF"], "r.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [good] } });

    expect(await screen.findByText(/rid-123/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/receipts/upload",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer test-access-token" },
      }),
    );
  });

  it("F6: error API muestra mensaje", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({ detail: "Tipo no permitido: x." })),
    } as Response);

    renderHome();
    const input = screen.getAllByTestId("receipt-file-input")[0] as HTMLInputElement;
    const good = new File(["%PDF"], "r.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [good] } });

    expect(await screen.findByText(/tipo no permitido/i)).toBeInTheDocument();
  });
});
