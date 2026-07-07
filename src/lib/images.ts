// A note's `imagePath` is stored either as a bare filename (local dev, served
// through /api/uploads/<name>) or as a full https URL (Vercel Blob in the
// cloud). These helpers resolve the right full/thumbnail URL for either case.

function toThumb(path: string): string {
  return path.replace(/(\.[a-z]+)$/i, "_thumb$1");
}

function resolve(path: string): string {
  return /^https?:\/\//.test(path) ? path : `/api/uploads/${path}`;
}

export function noteImageUrl(imagePath: string): string {
  return resolve(imagePath);
}

export function noteThumbUrl(imagePath: string): string {
  return resolve(toThumb(imagePath));
}
