import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "../auth/AuthContext";
import LoginPage from "./LoginPage";

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

import { supabase } from "../lib/supabaseClient";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Home OK</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(supabase.auth.signInWithPassword).mockReset();
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null } } as never);
});

function loginSubmit() {
  return screen.getAllByTestId("login-submit")[0]!;
}

describe("LoginPage", () => {
  it("F1: campos vacíos muestran error y no llaman a signInWithPassword", async () => {
    renderLogin();
    await waitFor(() => expect(screen.getAllByTestId("login-title")[0]).toBeInTheDocument());
    fireEvent.click(loginSubmit());
    expect(await screen.findByText(/complete correo y contraseña/i)).toBeInTheDocument();
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("F2: credenciales incorrectas muestran mensaje", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ error: { message: "Invalid" } } as never);
    renderLogin();
    await waitFor(() => expect(screen.getAllByTestId("login-title")[0]).toBeInTheDocument());
    fireEvent.change(screen.getAllByLabelText(/correo electrónico/i)[0]!, { target: { value: "a@b.co" } });
    fireEvent.change(screen.getAllByLabelText(/contraseña/i)[0]!, { target: { value: "secret" } });
    fireEvent.click(loginSubmit());
    expect(await screen.findByText(/credenciales incorrectas/i)).toBeInTheDocument();
  });

  it("F3: login correcto navega al Home", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ error: null } as never);
    renderLogin();
    await waitFor(() => expect(screen.getAllByTestId("login-title")[0]).toBeInTheDocument());
    fireEvent.change(screen.getAllByLabelText(/correo electrónico/i)[0]!, { target: { value: "user@test.com" } });
    fireEvent.change(screen.getAllByLabelText(/contraseña/i)[0]!, { target: { value: "okpass" } });
    fireEvent.click(loginSubmit());
    expect(await screen.findByText("Home OK")).toBeInTheDocument();
  });
});
