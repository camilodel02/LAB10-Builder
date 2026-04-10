import { type FormEvent, useState } from "react";

import { validateProfileEmailChange } from "./profileCredentialValidation";
import { updateAccountEmail } from "./updateAccountCredentials";

export function useProfileEmailChange(currentEmail: string) {
  const [newEmail, setNewEmail] = useState("");
  const [newEmailConfirm, setNewEmailConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const next = newEmail.trim();
    const validationError = validateProfileEmailChange(next, newEmailConfirm, currentEmail);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    const result = await updateAccountEmail(next);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNewEmail("");
    setNewEmailConfirm("");
    setInfo(result.info);
  }

  return {
    newEmail,
    setNewEmail,
    newEmailConfirm,
    setNewEmailConfirm,
    error,
    info,
    submitting,
    onSubmit,
  };
}
