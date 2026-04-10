import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "../auth/AuthContext";
import RegisterPage from "./RegisterPage";

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(() => Promise.resolve()),
    },
  },
}));

import { supabase } from "../lib/supabaseClient";

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<div>Home OK</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(supabase.auth.signUp).mockReset();
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null } } as never);
});

function registerSubmit() {
  return screen.getAllByTestId("register-submit")[0]!;
}

describe("RegisterPage", () => {
  it("R1: campos vacíos muestran error y no llaman a signUp", async () => {
    renderRegister();
    await waitFor(() => expect(screen.getAllByTestId("register-title")[0]).toBeInTheDocument());
    fireEvent.click(registerSubmit());
    expect(await screen.findByText(/complete correo, contraseña y confirmación/i)).toBeInTheDocument();
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("R2: contraseñas distintas no llaman a signUp", async () => {
    renderRegister();
    await waitFor(() => expect(screen.getAllByTestId("register-title")[0]).toBeInTheDocument());
    fireEvent.change(screen.getAllByLabelText(/correo electrónico/i)[0]!, { target: { value: "a@b.co" } });
    const passwordInputs = screen.getAllByLabelText(/^contraseña$/i);
    fireEvent.change(passwordInputs[0]!, { target: { value: "secret1" } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: "secret2" } });
    fireEvent.click(registerSubmit());
    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument();
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("R3: contraseña corta no llama a signUp", async () => {
    renderRegister();
    await waitFor(() => expect(screen.getAllByTestId("register-title")[0]).toBeInTheDocument());
    fireEvent.change(screen.getAllByLabelText(/correo electrónico/i)[0]!, { target: { value: "a@b.co" } });
    const passwordInputs = screen.getAllByLabelText(/^contraseña$/i);
    fireEvent.change(passwordInputs[0]!, { target: { value: "12345" } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: "12345" } });
    fireEvent.click(registerSubmit());
    expect(await screen.findByText(/al menos 6 caracteres/i)).toBeInTheDocument();
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("R4: error de Supabase muestra mensaje", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "User already registered" },
    } as never);
    renderRegister();
    await waitFor(() => expect(screen.getAllByTestId("register-title")[0]).toBeInTheDocument());
    fireEvent.change(screen.getAllByLabelText(/correo electrónico/i)[0]!, { target: { value: "a@b.co" } });
    const passwordInputs = screen.getAllByLabelText(/^contraseña$/i);
    fireEvent.change(passwordInputs[0]!, { target: { value: "secret12" } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: "secret12" } });
    fireEvent.click(registerSubmit());
    expect(await screen.findByText(/ya está registrado/i)).toBeInTheDocument();
  });

  it("R5: registro con sesión navega al Home", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { session: {} as never, user: {} as never },
      error: null,
    } as never);
    renderRegister();
    await waitFor(() => expect(screen.getAllByTestId("register-title")[0]).toBeInTheDocument());
    fireEvent.change(screen.getAllByLabelText(/correo electrónico/i)[0]!, { target: { value: "new@test.com" } });
    const passwordInputs = screen.getAllByLabelText(/^contraseña$/i);
    fireEvent.change(passwordInputs[0]!, { target: { value: "okpass1" } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: "okpass1" } });
    fireEvent.click(registerSubmit());
    expect(await screen.findByText("Home OK")).toBeInTheDocument();
  });

  it("R6: registro sin sesión muestra aviso de correo", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { session: null, user: { id: "x" } as never },
      error: null,
    } as never);
    renderRegister();
    await waitFor(() => expect(screen.getAllByTestId("register-title")[0]).toBeInTheDocument());
    fireEvent.change(screen.getAllByLabelText(/correo electrónico/i)[0]!, { target: { value: "new@test.com" } });
    const passwordInputs = screen.getAllByLabelText(/^contraseña$/i);
    fireEvent.change(passwordInputs[0]!, { target: { value: "okpass1" } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: "okpass1" } });
    fireEvent.click(registerSubmit());
    expect(await screen.findByText(/revisa tu correo/i)).toBeInTheDocument();
  });
});
