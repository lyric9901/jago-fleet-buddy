// Cloudinary client-side config.
// NOTE: This app is admin-only behind a Firebase login, so we accept the
// tradeoff of embedding the API secret in the browser bundle to keep the
// implementation simple (signed uploads directly from the client).
export const CLOUDINARY = {
  cloudName: "dz23hkigf",
  apiKey: "186829819645665",
  apiSecret: "rW9qAtwrNXafLfY1_TAzFYm335w",
};

async function sha1Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-1", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Build a Cloudinary signature over the given params (alphabetical, k=v joined by &). */
export async function signCloudinaryParams(
  params: Record<string, string | number>,
): Promise<string> {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return sha1Hex(toSign + CLOUDINARY.apiSecret);
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  format: string;
  originalFilename: string;
}

/** Upload a File to Cloudinary using a signed request. */
export async function uploadToCloudinary(
  file: File,
  opts: { folder: string; publicId?: string },
): Promise<CloudinaryUploadResult> {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = {
    folder: opts.folder,
    timestamp,
  };
  if (opts.publicId) paramsToSign.public_id = opts.publicId;

  const signature = await signCloudinaryParams(paramsToSign);
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", CLOUDINARY.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", opts.folder);
  if (opts.publicId) form.append("public_id", opts.publicId);
  form.append("signature", signature);

  // resource_type=auto handles PDFs (as image/raw) and images uniformly.
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/auto/upload`;
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as {
    secure_url: string;
    public_id: string;
    resource_type: string;
    bytes: number;
    format: string;
    original_filename: string;
  };
  return {
    url: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type,
    bytes: data.bytes,
    format: data.format,
    originalFilename: data.original_filename,
  };
}

/**
 * Delete a Cloudinary asset. We encode "{resource_type}::{public_id}" in the
 * VehicleDocument.path field so we can locate the asset later.
 */
export async function deleteFromCloudinary(pathToken: string): Promise<void> {
  if (!pathToken) return;
  const [resourceType, ...rest] = pathToken.split("::");
  const publicId = rest.join("::");
  if (!resourceType || !publicId) return;

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await signCloudinaryParams({ public_id: publicId, timestamp });
  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", CLOUDINARY.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/${resourceType}/destroy`;
  try {
    await fetch(url, { method: "POST", body: form });
  } catch {
    /* ignore — asset may already be gone */
  }
}

export function encodePathToken(resourceType: string, publicId: string) {
  return `${resourceType}::${publicId}`;
}
