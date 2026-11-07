import { supabase } from "@/lib/supabaseClient";

export const PHOTO_BUCKET = "dish-photos";

const MAX_DIMENSION = 1600;

// Shrinks a photo to at most 1600px on its longest side and re-encodes it as
// JPEG, so phone photos (often 5–10 MB) upload quickly and fit the 5 MB limit.
async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    throw new Error(
      "Couldn't read that image. Try a JPEG or PNG (iPhone HEIC photos may need converting)."
    );
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process image."))),
      "image/jpeg",
      0.85
    )
  );
}

// Uploads into the user's own folder (required by the storage policies) and
// returns the storage path to save on the dish.
export async function uploadDishPhoto(userId: string, file: File) {
  const blob = await resizeImage(file);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg" });

  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return path;
}

export async function deleteDishPhoto(path?: string | null) {
  if (!path) return;
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
}

// The bucket is private, so photos are shown through short-lived signed URLs.
// Fetches them all in one request; returns a map of path -> URL.
export async function getPhotoUrls(paths: (string | null | undefined)[]) {
  const unique = [...new Set(paths.filter(Boolean) as string[])];
  if (unique.length === 0) return {};

  const { data } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(unique, 60 * 60);

  const urls: Record<string, string> = {};
  data?.forEach((item) => {
    if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
  });
  return urls;
}
