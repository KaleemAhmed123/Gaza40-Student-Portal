import crypto from "crypto";

/**
 * Deterministically maps a 36-character UUID string (with or without hyphens)
 * to a 24-character hex string, which is a valid MongoDB ObjectId.
 * This ensures migration script run idempotently and preserves all references correctly.
 */
export function uuidToObjectId(uuid: string): string {
  if (!uuid) {
    return "";
  }
  
  const trimmed = uuid.trim();
  
  // If it's already a 24-character hex string, return it as-is
  if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  
  // Normalize the UUID string (remove hyphens)
  const cleanUuid = trimmed.replace(/-/g, "");
  
  // Hash using md5 and return first 24 characters (12 bytes)
  return crypto.createHash("md5").update(cleanUuid).digest("hex").slice(0, 24);
}
