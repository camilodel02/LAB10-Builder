import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { isAllowedReceiptFile, uploadReceipt } from "../lib/uploadReceipt";

export default function HomePage() {
  const { session, signOut } = useAuth();
  const [status, setStatus] = useState<"idle" | "uploading">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = session?.access_token;

  const onFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || !token) {
        return;
      }
      const file = files[0];
      setMessage(null);
      setError(null);
      if (!isAllowedReceiptFile(file)) {
        setError("Solo se permiten PDF, JPEG, PNG o WEBP.");
        return;
      }
      setStatus("uploading");
      try {
        const res = await uploadReceipt(file, token);
        const text = await res.text();
        let body: { receipt_id?: string; detail?: string } = {};
        try {
          body = text ? JSON.parse(text) : {};
        } catch {
          body = {};
        }
        if (!res.ok) {
          const d = (body as { detail?: unknown }).detail;
          let detailMsg = text || res.statusText;
          if (typeof d === "string") {
            detailMsg = d;
          } else if (Array.isArray(d)) {
            detailMsg = d
              .map((item) =>
                typeof item === "object" && item !== null && "msg" in item
                  ? String((item as { msg?: string }).msg ?? "")
                  : "",
              )
              .filter(Boolean)
              .join(" ");
          }
          setError(detailMsg || "No se pudo subir el recibo.");
          return;
        }
        setMessage(
          body.receipt_id
            ? `Recibo cargado. ID: ${body.receipt_id}`
            : "Recibo cargado correctamente.",
        );
      } catch {
        setError("Error de red al subir el archivo.");
      } finally {
        setStatus("idle");
      }
    },
    [token],
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-lg">
        <header className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Recibos de gasto</h1>
            <p className="mt-1 text-sm text-slate-400">
              Sube PDF o imagen del recibo de pago (alineado a la API).
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
            <Link
              to="/profile"
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-sky-400 hover:bg-slate-800"
              data-testid="home-link-profile"
            >
              Mi cuenta
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <div
          className="mt-8 rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/40 p-8 text-center hover:border-slate-600"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            void onFiles(e.dataTransfer.files);
          }}
        >
          <p className="text-slate-300">Arrastra un archivo aquí o elige uno</p>
          <p className="mt-2 text-xs text-slate-500">PDF, JPEG, PNG o WEBP</p>
          <label className="mt-4 inline-block cursor-pointer rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">
            Elegir archivo
            <input
              data-testid="receipt-file-input"
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={status === "uploading" || !token}
              onChange={(e) => void onFiles(e.target.files)}
            />
          </label>
        </div>

        {status === "uploading" ? (
          <p className="mt-4 text-sm text-slate-400">Subiendo…</p>
        ) : null}
        {message ? (
          <p className="mt-4 text-sm text-emerald-400" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
