import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "../auth/AuthContext";
import ProfilePage from "./ProfilePage";

const mockUser = { id: "user-1", email: "current@test.com" };

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(),
      getSession: vi.fn(() =>
        Promise.resolve({
          data: { session: { user: mockUser, access_token: "tok" } },
        }),
      ),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(() => Promise.resolve()),
    },
  },
}));

import { supabase } from "../lib/supabaseClient";

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={["/profile"]}>
      <AuthProvider>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(supabase.auth.updateUser).mockReset();
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { user: mockUser, access_token: "tok" } },
  } as never);
});

describe("ProfilePage", () => {
  it("P1: contraseñas vacías muestran error y no llaman updateUser", async () => {
    renderProfile();
    await waitFor(() => expect(screen.getAllByTestId("profile-title")[0]).toBeInTheDocument());
    fireEvent.click(screen.getAllByTestId("profile-submit-password")[0]!);
    expect(await screen.findByText(/complete la nueva contraseña/i)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("P2: contraseñas distintas no llaman updateUser", async () => {
    renderProfile();
    await waitFor(() => expect(screen.getAllByTestId("profile-title")[0]).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/^nueva contraseña$/i), { target: { value: "aaaaaa" } });
    fireEvent.change(screen.getByLabelText(/confirmar nueva contraseña/i), { target: { value: "bbbbbb" } });
    fireEvent.click(screen.getAllByTestId("profile-submit-password")[0]!);
    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("P3: contraseña corta no llama updateUser", async () => {
    renderProfile();
    await waitFor(() => expect(screen.getAllByTestId("profile-title")[0]).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/^nueva contraseña$/i), { target: { value: "12345" } });
    fireEvent.change(screen.getByLabelText(/confirmar nueva contraseña/i), { target: { value: "12345" } });
    fireEvent.click(screen.getAllByTestId("profile-submit-password")[0]!);
    expect(await screen.findByText(/al menos 6 caracteres/i)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("P4: error de API en contraseña muestra mensaje", async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({ error: { message: "Password too short" } } as never);
    renderProfile();
    await waitFor(() => expect(screen.getAllByTestId("profile-title")[0]).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/^nueva contraseña$/i), { target: { value: "secret12" } });
    fireEvent.change(screen.getByLabelText(/confirmar nueva contraseña/i), { target: { value: "secret12" } });
    fireEvent.click(screen.getAllByTestId("profile-submit-password")[0]!);
    expect(await screen.findByText(/longitud mínima/i)).toBeInTheDocument();
  });

  it("P5: contraseña actualizada correctamente", async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({ error: null, data: { user: mockUser } } as never);
    renderProfile();
    await waitFor(() => expect(screen.getAllByTestId("profile-title")[0]).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/^nueva contraseña$/i), { target: { value: "secret12" } });
    fireEvent.change(screen.getByLabelText(/confirmar nueva contraseña/i), { target: { value: "secret12" } });
    fireEvent.click(screen.getAllByTestId("profile-submit-password")[0]!);
    expect(await screen.findByText(/contraseña actualizada correctamente/i)).toBeInTheDocument();
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "secret12" });
  });

  it("P6: correos distintos en confirmación no llaman updateUser", async () => {
    renderProfile();
    await waitFor(() => expect(screen.getAllByTestId("profile-title")[0]).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/^nuevo correo$/i), { target: { value: "a@b.co" } });
    fireEvent.change(screen.getByLabelText(/confirmar nuevo correo/i), { target: { value: "a@c.co" } });
    fireEvent.click(screen.getAllByTestId("profile-submit-email")[0]!);
    expect(await screen.findByText(/los correos no coinciden/i)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("P7: mismo correo que el actual muestra error", async () => {
    renderProfile();
    await waitFor(() => expect(screen.getAllByTestId("profile-title")[0]).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/^nuevo correo$/i), { target: { value: "current@test.com" } });
    fireEvent.change(screen.getByLabelText(/confirmar nuevo correo/i), { target: { value: "current@test.com" } });
    fireEvent.click(screen.getAllByTestId("profile-submit-email")[0]!);
    expect(await screen.findByText(/distinto al actual/i)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("P8: email con new_email pendiente muestra aviso de confirmación", async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      error: null,
      data: { user: { ...mockUser, new_email: "next@test.com" } },
    } as never);
    renderProfile();
    await waitFor(() => expect(screen.getAllByTestId("profile-title")[0]).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/^nuevo correo$/i), { target: { value: "next@test.com" } });
    fireEvent.change(screen.getByLabelText(/confirmar nuevo correo/i), { target: { value: "next@test.com" } });
    fireEvent.click(screen.getAllByTestId("profile-submit-email")[0]!);
    expect(await screen.findByText(/confirmar el cambio/i)).toBeInTheDocument();
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ email: "next@test.com" });
  });

  it("P9: email actualizado sin pendiente", async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      error: null,
      data: { user: { ...mockUser, email: "fresh@test.com" } },
    } as never);
    renderProfile();
    await waitFor(() => expect(screen.getAllByTestId("profile-title")[0]).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/^nuevo correo$/i), { target: { value: "fresh@test.com" } });
    fireEvent.change(screen.getByLabelText(/confirmar nuevo correo/i), { target: { value: "fresh@test.com" } });
    fireEvent.click(screen.getAllByTestId("profile-submit-email")[0]!);
    expect(await screen.findByText(/correo actualizado correctamente/i)).toBeInTheDocument();
  });
});
