import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "./AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(() => Promise.resolve()),
    },
  },
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("F4: sin sesión redirige a /login", async () => {
    const { supabase } = await import("../lib/supabaseClient");
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null } } as never);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div>Secreto</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Página login</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Página login")).toBeInTheDocument();
    expect(screen.queryByText("Secreto")).not.toBeInTheDocument();
  });
});
