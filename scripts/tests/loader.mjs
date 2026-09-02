import { extname } from "node:path";

const EMPTY_MODULE_URL = "data:text/javascript,export default {};";

/** Resolve the extensionless TS imports used by the Next.js bundler in Node's test runner. */
export async function resolve(specifier, context, nextResolve) {
  // Maintenance scripts legitimately reuse app service modules; neutralize the
  // React server-only import wall outside the bundler.
  if (specifier === "server-only") {
    return { url: EMPTY_MODULE_URL, shortCircuit: true };
  }
  if (specifier.startsWith("@/")) {
    const sourcePath = new URL(`../../src/${specifier.slice(2)}.ts`, import.meta.url).href;
    return nextResolve(sourcePath, context);
  }

  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (specifier.startsWith(".") && !extname(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    throw error;
  }
}
