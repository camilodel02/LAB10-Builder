/** POST /api/receipts/upload con Bearer (proxy Vite → FastAPI). */

export async function uploadReceipt(file: File, accessToken: string): Promise<Response> {
  const body = new FormData();
  body.append("file", file);
  return fetch("/api/receipts/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body,
  });
}

export const ALLOWED_RECEIPT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isAllowedReceiptFile(file: File): boolean {
  if (ALLOWED_RECEIPT_TYPES.has(file.type)) {
    return true;
  }
  return /\.(pdf|jpe?g|png|webp)$/i.test(file.name);
}
