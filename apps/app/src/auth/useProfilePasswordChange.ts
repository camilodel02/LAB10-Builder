import { type FormEvent, useState } from "react";

import { validateProfilePasswordChange } from "./profileCredentialValidation";
import { updateAccountPassword } from "./updateAccountCredentials";

export function useProfilePasswordChange() {
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const validationError = validateProfilePasswordChange(newPassword, newPasswordConfirm);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    const result = await updateAccountPassword(newPassword);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNewPassword("");
    setNewPasswordConfirm("");
    setInfo("Contraseña actualizada correctamente.");
  }

  return {
    newPassword,
    setNewPassword,
    newPasswordConfirm,
    setNewPasswordConfirm,
    error,
    info,
    submitting,
    onSubmit,
  };
}
