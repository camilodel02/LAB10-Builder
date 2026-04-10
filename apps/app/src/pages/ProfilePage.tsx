import { type FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { supabase } from "../lib/supabaseClient";

function mapUpdateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("password") && (m.includes("short") || m.includes("least"))) {
    return "La contraseña no cumple la longitud mínima (6 caracteres).";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "El correo electrónico no es válido.";
  }
  if (m.includes("same")) {
    return "El nuevo valor debe ser distinto al actual.";
  }
  return "No se pudo actualizar. Revisa los datos e inténtalo de nuevo.";
}

export default function ProfilePage() {
  const { session, loading } = useAuth();

  const [newEmail, setNewEmail] = useState("");
  const [newEmailConfirm, setNewEmailConfirm] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailInfo, setEmailInfo] = useState<string | null>(null);
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordInfo, setPasswordInfo] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">
        Cargando…
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/login" replace />;
  }

  const currentEmail = session.user.email ?? "";

  async function onSubmitEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError(null);
    setEmailInfo(null);
    const next = newEmail.trim();
    if (!next || !newEmailConfirm.trim()) {
      setEmailError("Complete el nuevo correo y su confirmación.");
      return;
    }
    if (next !== newEmailConfirm.trim()) {
      setEmailError("Los correos no coinciden.");
      return;
    }
    if (next.toLowerCase() === currentEmail.toLowerCase()) {
      setEmailError("El nuevo correo debe ser distinto al actual.");
      return;
    }
    setEmailSubmitting(true);
    const { data, error } = await supabase.auth.updateUser({ email: next });
    setEmailSubmitting(false);
    if (error) {
      setEmailError(mapUpdateError(error.message));
      return;
    }
    setNewEmail("");
    setNewEmailConfirm("");
    if (data.user?.new_email) {
      setEmailInfo(
        "Revisa tu correo actual y el nuevo para confirmar el cambio (en local: bandeja de Inbucket / correo de prueba de Supabase).",
      );
    } else if (data.user?.email === next) {
      setEmailInfo("Correo actualizado correctamente.");
    } else {
      setEmailInfo("Revisa tu correo para completar el cambio de dirección si tu entorno requiere confirmación.");
    }
  }

  async function onSubmitPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordInfo(null);
    if (!newPassword || !newPasswordConfirm) {
      setPasswordError("Complete la nueva contraseña y su confirmación.");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setPasswordSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSubmitting(false);
    if (error) {
      setPasswordError(mapUpdateError(error.message));
      return;
    }
    setNewPassword("");
    setNewPasswordConfirm("");
    setPasswordInfo("Contraseña actualizada correctamente.");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-md w-full rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="profile-title">
          Mi cuenta
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Correo actual: <span className="text-slate-200">{currentEmail || "—"}</span>
        </p>

        <section className="mt-8 border-t border-slate-800 pt-6">
          <h2 className="text-lg font-medium text-slate-200">Cambiar correo</h2>
          <p className="mt-1 text-xs text-slate-500">
            Puede requerir confirmación por email según la configuración del proyecto.
          </p>
          <form className="mt-4 space-y-4" onSubmit={(ev) => void onSubmitEmail(ev)} noValidate>
            <div>
              <label htmlFor="profile-new-email" className="block text-sm font-medium text-slate-300">
                Nuevo correo
              </label>
              <input
                id="profile-new-email"
                name="newEmail"
                type="email"
                autoComplete="email"
                value={newEmail}
                onChange={(ev) => setNewEmail(ev.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-600"
              />
            </div>
            <div>
              <label htmlFor="profile-new-email-confirm" className="block text-sm font-medium text-slate-300">
                Confirmar nuevo correo
              </label>
              <input
                id="profile-new-email-confirm"
                name="newEmailConfirm"
                type="email"
                autoComplete="email"
                value={newEmailConfirm}
                onChange={(ev) => setNewEmailConfirm(ev.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-600"
              />
            </div>
            {emailError ? (
              <p className="text-sm text-red-400" role="alert">
                {emailError}
              </p>
            ) : null}
            {emailInfo ? (
              <p className="text-sm text-sky-300" role="status">
                {emailInfo}
              </p>
            ) : null}
            <button
              type="submit"
              data-testid="profile-submit-email"
              disabled={emailSubmitting}
              className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {emailSubmitting ? "Guardando…" : "Actualizar correo"}
            </button>
          </form>
        </section>

        <section className="mt-8 border-t border-slate-800 pt-6">
          <h2 className="text-lg font-medium text-slate-200">Cambiar contraseña</h2>
          <form className="mt-4 space-y-4" onSubmit={(ev) => void onSubmitPassword(ev)} noValidate>
            <div>
              <label htmlFor="profile-new-password" className="block text-sm font-medium text-slate-300">
                Nueva contraseña
              </label>
              <input
                id="profile-new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(ev) => setNewPassword(ev.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-600"
              />
            </div>
            <div>
              <label htmlFor="profile-new-password-confirm" className="block text-sm font-medium text-slate-300">
                Confirmar nueva contraseña
              </label>
              <input
                id="profile-new-password-confirm"
                name="newPasswordConfirm"
                type="password"
                autoComplete="new-password"
                value={newPasswordConfirm}
                onChange={(ev) => setNewPasswordConfirm(ev.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-600"
              />
            </div>
            {passwordError ? (
              <p className="text-sm text-red-400" role="alert">
                {passwordError}
              </p>
            ) : null}
            {passwordInfo ? (
              <p className="text-sm text-emerald-400" role="status">
                {passwordInfo}
              </p>
            ) : null}
            <button
              type="submit"
              data-testid="profile-submit-password"
              disabled={passwordSubmitting}
              className="w-full rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
            >
              {passwordSubmitting ? "Guardando…" : "Actualizar contraseña"}
            </button>
          </form>
        </section>

        <p className="mt-8 text-center">
          <Link to="/" className="text-sm text-sky-400 hover:text-sky-300" data-testid="profile-link-home">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
