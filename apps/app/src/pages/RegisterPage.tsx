import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { supabase } from "../lib/supabaseClient";

function mapSignUpError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("user already exists")) {
    return "Ese correo ya está registrado. Inicia sesión o usa otro correo.";
  }
  if (m.includes("password") && (m.includes("short") || m.includes("least"))) {
    return "La contraseña no cumple la longitud mínima (6 caracteres).";
  }
  if (m.includes("invalid email")) {
    return "El correo electrónico no es válido.";
  }
  return "No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.";
}

export default function RegisterPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">
        Cargando…
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim() || !password || !passwordConfirm) {
      setError("Complete correo, contraseña y confirmación.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setSubmitting(true);
    const { data, error: signError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (signError) {
      setError(mapSignUpError(signError.message));
      return;
    }
    if (data.session) {
      navigate("/", { replace: true });
      return;
    }
    setInfo("Cuenta creada. Revisa tu correo para confirmar el registro antes de iniciar sesión.");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="register-title">
          Crear cuenta
        </h1>
        <p className="mt-1 text-sm text-slate-400">Dental Clinic — Gastos y recibos</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-slate-300">
              Correo electrónico
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-600"
            />
          </div>
          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-slate-300">
              Contraseña
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-600"
            />
          </div>
          <div>
            <label htmlFor="register-password-confirm" className="block text-sm font-medium text-slate-300">
              Confirmar contraseña
            </label>
            <input
              id="register-password-confirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(ev) => setPasswordConfirm(ev.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-600"
            />
          </div>
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="text-sm text-sky-300" role="status">
              {info}
            </p>
          ) : null}
          <button
            type="submit"
            data-testid="register-submit"
            disabled={submitting}
            className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {submitting ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-sky-400 hover:text-sky-300" data-testid="register-link-login">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
