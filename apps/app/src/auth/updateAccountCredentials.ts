import type { User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabaseClient";
import { mapUpdateUserError } from "./mapUpdateUserError";

function emailChangeInfo(user: User | null, requestedEmail: string): string {
  if (user?.new_email) {
    return "Revisa tu correo actual y el nuevo para confirmar el cambio (en local: bandeja de Inbucket / correo de prueba de Supabase).";
  }
  if (user?.email === requestedEmail) {
    return "Correo actualizado correctamente.";
  }
  return "Revisa tu correo para completar el cambio de dirección si tu entorno requiere confirmación.";
}

export async function updateAccountEmail(nextEmail: string): Promise<
  | { ok: true; info: string }
  | { ok: false; error: string }
> {
  const { data, error } = await supabase.auth.updateUser({ email: nextEmail });
  if (error) {
    return { ok: false, error: mapUpdateUserError(error.message) };
  }
  return { ok: true, info: emailChangeInfo(data.user ?? null, nextEmail) };
}

export async function updateAccountPassword(
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { ok: false, error: mapUpdateUserError(error.message) };
  }
  return { ok: true };
}
