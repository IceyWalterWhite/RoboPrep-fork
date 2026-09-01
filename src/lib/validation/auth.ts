import { z } from "zod";

/**
 * Form schemas shared by the client forms and (later) any server-side handler.
 * Kept in one place so validation messages stay consistent.
 */

const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z
  .object({
    email,
    displayName: z.string().trim().max(50, "Keep the name under 50 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

/** Flatten Zod issues into `{ field: message }` for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in result)) {
      result[key] = issue.message;
    }
  }
  return result;
}

/**
 * Turn Supabase auth failures into something a candidate can act on.
 * Supabase messages are already user-facing for most codes; these are the
 * cases where they are not.
 */
export function readableAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Confirm your email address before signing in.";
  }
  if (normalized.includes("user already registered")) {
    return "An account with this email already exists.";
  }
  if (normalized.includes("password should be")) {
    return "Password must be at least 8 characters.";
  }
  if (
    normalized.includes("over_email_send_rate_limit") ||
    normalized.includes("rate limit")
  ) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return "Could not reach Supabase. Check your environment configuration.";
  }

  return message;
}
