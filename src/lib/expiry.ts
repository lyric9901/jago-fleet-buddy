export type ExpiryStatus = "expired" | "soon" | "valid" | "missing";

export function expiryStatus(iso?: string | null): ExpiryStatus {
  if (!iso) return "missing";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "expired";
  if (diff <= 30) return "soon";
  return "valid";
}

export function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
