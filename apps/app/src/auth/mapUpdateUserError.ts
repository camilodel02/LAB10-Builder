/** Mensajes en español para errores de `supabase.auth.updateUser`. */
export function mapUpdateUserError(message: string): string {
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
