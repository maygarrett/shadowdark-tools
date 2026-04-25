import type { ZodError } from "zod";

export function formatValidationError(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join("; ");
}
