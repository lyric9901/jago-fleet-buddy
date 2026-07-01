import imageCompression from "browser-image-compression";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  encodePathToken,
} from "./cloudinary";

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_MB = 1;
const MAX_PDF_MB = 10;

export class UploadError extends Error {}

async function prepareFile(file: File): Promise<File> {
  if (IMAGE_TYPES.includes(file.type)) {
    const compressed = await imageCompression(file, {
      maxSizeMB: MAX_IMAGE_MB,
      maxWidthOrHeight: 2000,
      useWebWorker: true,
      fileType: "image/webp",
      initialQuality: 0.85,
    });
    return new File(
      [compressed],
      file.name.replace(/\.[^.]+$/, "") + ".webp",
      { type: "image/webp" },
    );
  }
  if (file.type === "application/pdf") {
    if (file.size <= MAX_PDF_MB * 1024 * 1024) return file;
    throw new UploadError(
      `PDF is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please upload a PDF smaller than ${MAX_PDF_MB} MB.`,
    );
  }
  throw new UploadError(
    "Unsupported file type. Allowed: PDF, JPG, JPEG, PNG, WEBP.",
  );
}

export function isAllowedFile(file: File) {
  return IMAGE_TYPES.includes(file.type) || file.type === "application/pdf";
}

export async function uploadVehicleFile(
  vehicleNumber: string,
  subPath: string,
  file: File,
): Promise<{ url: string; path: string; name: string }> {
  const prepared = await prepareFile(file);
  const cleanVehicle = vehicleNumber.replace(/[^A-Za-z0-9_-]/g, "") || "unknown";
  const folder = `jago-travels/${cleanVehicle}/${subPath}`;
  const res = await uploadToCloudinary(prepared, { folder });
  return {
    url: res.url,
    path: encodePathToken(res.resourceType, res.publicId),
    name: prepared.name,
  };
}

export async function deleteStoragePath(path: string) {
  if (!path) return;
  await deleteFromCloudinary(path);
}
