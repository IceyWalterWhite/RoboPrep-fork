import { z } from "zod";

/**
 * Form schemas shared by the client forms and (later) any server-side handler.
 * Kept in one place so validation messages stay consistent.
 */

const email = z.string().trim().min(1, "请输入邮箱").email("请输入有效的邮箱地址");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "请输入密码"),
});

export const signUpSchema = z
  .object({
    email,
    displayName: z.string().trim().max(50, "显示名称不能超过 50 个字符"),
    password: z
      .string()
      .min(8, "密码至少需要 8 个字符")
      .max(72, "密码不能超过 72 个字符"),
    confirmPassword: z.string().min(1, "请确认密码"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "两次输入的密码不一致",
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
    return "邮箱或密码错误。";
  }
  if (normalized.includes("email not confirmed")) {
    return "请先确认邮箱地址，再登录。";
  }
  if (normalized.includes("user already registered")) {
    return "该邮箱已经注册过账户。";
  }
  if (normalized.includes("password should be")) {
    return "密码至少需要 8 个字符。";
  }
  if (
    normalized.includes("over_email_send_rate_limit") ||
    normalized.includes("rate limit")
  ) {
    return "操作次数过多，请稍后再试。";
  }
  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return "无法连接 Supabase，请检查环境配置。";
  }

  return message;
}
