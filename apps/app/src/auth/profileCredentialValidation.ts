export const PROFILE_MIN_PASSWORD_LENGTH = 6;

export function validateProfileEmailChange(
  next: string,
  confirm: string,
  currentEmail: string,
): string | null {
  if (!next || !confirm.trim()) {
    return "Complete el nuevo correo y su confirmación.";
  }
  if (next !== confirm.trim()) {
    return "Los correos no coinciden.";
  }
  if (next.toLowerCase() === currentEmail.toLowerCase()) {
    return "El nuevo correo debe ser distinto al actual.";
  }
  return null;
}

export function validateProfilePasswordChange(password: string, confirm: string): string | null {
  if (!password || !confirm) {
    return "Complete la nueva contraseña y su confirmación.";
  }
  if (password !== confirm) {
    return "Las contraseñas no coinciden.";
  }
  if (password.length < PROFILE_MIN_PASSWORD_LENGTH) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  return null;
}
