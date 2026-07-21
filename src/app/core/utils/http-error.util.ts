import { HttpErrorResponse } from '@angular/common/http';

/** Extracts the backend's ErrorResponse.message, falling back to a default when absent. */
export function extractErrorMessage(err: HttpErrorResponse, fallback: string): string {
  const body = err.error as { message?: string } | null;
  return body?.message ?? fallback;
}
