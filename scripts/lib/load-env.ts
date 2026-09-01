import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Small dependency-free loader for local maintenance scripts. */
export function loadProjectEnv(): Record<string, string> {
  const result: Record<string, string> = {};
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return result;

  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1].startsWith("#")) continue;
    const value = match[2].replace(/^(["'])(.*)\1$/, "$2");
    result[match[1]] = value;
  }
  return result;
}

export function envValue(values: Record<string, string>, key: string): string | undefined {
  return process.env[key] || values[key] || undefined;
}
