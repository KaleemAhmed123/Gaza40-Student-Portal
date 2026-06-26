/**
 * csv-doc-token.ts
 *
 * Generates and verifies short-lived JWT tokens that allow unauthenticated
 * direct download of offer letter documents embedded in exported CSVs.
 *
 * Flow:
 *   1. At CSV generation time: generateCsvDocToken(docId) → embed URL in CSV
 *   2. When user clicks the link in the CSV: GET /api/documents/:docId/signed-download?token=<jwt>
 *   3. Endpoint verifies token, fetches a fresh R2 presigned URL, 302-redirects → browser downloads file
 */

import jwt from "jsonwebtoken";
import { env } from "../../config/env";

const PURPOSE = "csv_doc_link";

type CsvDocTokenPayload = {
  docId:   string;
  purpose: typeof PURPOSE;
};

/**
 * Sign a token for a specific document ID.
 * TTL is CSV_DOC_LINK_TTL_DAYS (default 30 days) — matches CSV expiry.
 */
export function generateCsvDocToken(docId: string): string {
  const payload: CsvDocTokenPayload = { docId, purpose: PURPOSE };
  const expiresIn = env.CSV_DOC_LINK_TTL_DAYS * 24 * 60 * 60; // seconds
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn });
}

/**
 * Verify a CSV doc token.
 * Throws if token is invalid, expired, wrong purpose, or docId mismatch.
 */
export function verifyCsvDocToken(token: string, expectedDocId: string): void {
  let payload: CsvDocTokenPayload;

  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as CsvDocTokenPayload;
  } catch {
    throw new Error("Invalid or expired document token");
  }

  if (payload.purpose !== PURPOSE) {
    throw new Error("Invalid token purpose");
  }

  if (payload.docId !== expectedDocId) {
    throw new Error("Token document ID mismatch");
  }
}
