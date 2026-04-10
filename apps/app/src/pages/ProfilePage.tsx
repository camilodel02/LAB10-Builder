import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { useProfileEmailChange } from "../auth/useProfileEmailChange";
import { useProfilePasswordChange } from "../auth/useProfilePasswordChange";

export default function ProfilePage() {
  const { session, loading } = useAuth();

  const emailForm = useProfileEmailChange(session?.user?.email ?? "");
  const passwordForm = useProfilePasswordChange();

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
          <form className="mt-4 space-y-4" onSubmit={(ev) => void emailForm.onSubmit(ev)} noValidate>
            <div>
              <label htmlFor="profile-new-email" className="block text-sm font-medium text-slate-300">
                Nuevo correo
              </label>
              <input
                id="profile-new-email"
                name="newEmail"
                type="email"
                autoComplete="email"
                value={emailForm.newEmail}
                onChange={(ev) => emailForm.setNewEmail(ev.target.value)}
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
                value={emailForm.newEmailConfirm}
                onChange={(ev) => emailForm.setNewEmailConfirm(ev.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-600"
              />
            </div>
            {emailForm.error ? (
              <p className="text-sm text-red-400" role="alert">
                {emailForm.error}
              </p>
            ) : null}
            {emailForm.info ? (
              <p className="text-sm text-sky-300" role="status">
                {emailForm.info}
              </p>
            ) : null}
            <button
              type="submit"
              data-testid="profile-submit-email"
              disabled={emailForm.submitting}
              className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {emailForm.submitting ? "Guardando…" : "Actualizar correo"}
            </button>
          </form>
        </section>

        <section className="mt-8 border-t border-slate-800 pt-6">
          <h2 className="text-lg font-medium text-slate-200">Cambiar contraseña</h2>
          <form className="mt-4 space-y-4" onSubmit={(ev) => void passwordForm.onSubmit(ev)} noValidate>
            <div>
              <label htmlFor="profile-new-password" className="block text-sm font-medium text-slate-300">
                Nueva contraseña
              </label>
              <input
                id="profile-new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(ev) => passwordForm.setNewPassword(ev.target.value)}
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
                value={passwordForm.newPasswordConfirm}
                onChange={(ev) => passwordForm.setNewPasswordConfirm(ev.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-600"
              />
            </div>
            {passwordForm.error ? (
              <p className="text-sm text-red-400" role="alert">
                {passwordForm.error}
              </p>
            ) : null}
            {passwordForm.info ? (
              <p className="text-sm text-emerald-400" role="status">
                {passwordForm.info}
              </p>
            ) : null}
            <button
              type="submit"
              data-testid="profile-submit-password"
              disabled={passwordForm.submitting}
              className="w-full rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
            >
              {passwordForm.submitting ? "Guardando…" : "Actualizar contraseña"}
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
