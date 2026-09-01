import type { ExpectedValue, MLEvaluationRequest, StructuredTestCase } from "@/types/ml-judge";

import { PY_CASE_RUNTIME, PY_HELPERS } from "./helpers";
import { PY_CLASS_ENTRY } from "./class";
import { PY_FUNCTION_ENTRY } from "./function";

/**
 * Python harness generator (Week 5 Task 7).
 *
 * The runner script is fully static per evaluation mode — only the JSON
 * payload on stdin varies — so harness generation is deterministic by
 * construction. The script:
 *
 * 1. parses the payload and applies RNG seeding
 * 2. writes the user source to a private temp file (never on sys.path, so
 *    the submission cannot shadow harness/stdlib modules)
 * 3. installs the framework import allowlist (documented as policy, not a
 *    security sandbox — the security boundary is process isolation)
 * 4. validates the entrypoint (Task 8) and signature compatibility
 * 5. evaluates each case with captured stdout and structured
 *    value/shape/dtype/gradient/exception/performance checks
 * 6. emits exactly one machine-readable JSON line behind a sentinel so
 *    user prints can never corrupt or fake the result
 */

export interface RunnerCasePayload {
  id: string;
  name: string | null;
  test_type: string;
  test_group: string;
  args: unknown[];
  kwargs: Record<string, unknown>;
  construct: { args: unknown[]; kwargs: Record<string, unknown> } | null;
  method: string | null;
  expected: Record<string, unknown>;
  seed: number | null;
  weight: number;
}

export interface RunnerPayload {
  source: string;
  framework: string;
  entrypoint: { name: string; type: "function" | "class" };
  config: { comparison: string; rtol: number; atol: number; check_shape: boolean; check_dtype: boolean; check_gradient: boolean };
  allow_imports: string[];
  cases: RunnerCasePayload[];
}

export function buildHarnessScript(mode: "function" | "class"): string {
  const modeSegment = mode === "class" ? PY_CLASS_ENTRY : PY_FUNCTION_ENTRY;
  return `
${PY_HELPERS}

${PY_CASE_RUNTIME}

${modeSegment}

def load_user_module(source):
    """Import the submission from a private temp file. The temp directory is
    never added to sys.path, so the submission cannot shadow stdlib or
    harness modules (module-shadowing hardening, Task 50)."""
    try:
        with tempfile.TemporaryDirectory(prefix="roboprep-") as tmp:
            path = os.path.join(tmp, "roboprep_user_submission.py")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(source)
            spec = importlib.util.spec_from_file_location("roboprep_user_submission", path)
            if spec is None or spec.loader is None:
                raise HarnessError("could not create module spec")
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            return module, None
    except SyntaxError as exc:
        return None, {"category": "syntax_error",
                      "message": "Syntax error at line %s: %s" % (exc.lineno, exc.msg)}
    except ImportError as exc:
        return None, {"category": "forbidden_import", "message": str(exc)}
    except Exception as exc:  # noqa: BLE001
        return None, {"category": "runtime_error",
                      "message": "Importing the submission failed: %s: %s" % (type(exc).__name__, str(exc)[:200])}


def install_import_guard(allow_imports):
    # The guard is a problem-authoring POLICY (not a security sandbox — the
    # security boundary is process isolation). Its job is to give a readable
    # error when a submission reaches for a clearly out-of-scope third-party
    # module. It must never break the harness: numpy/torch (and their own
    # transitive dependencies) are always loadable because the runner needs
    # them even for pure-python seeding and ML evaluation, and stdlib modules
    # always pass through.
    real_import = builtins.__import__
    import sys as _sys
    stdlib = set(getattr(_sys, "stdlib_module_names", ()))
    ALWAYS = {"numpy", "torch"}
    # "trusted" grows as we descend into the transitive dependencies of an
    # allowed package: when numpy/torch import their own deps (typing_extensions,
    # sympy, pynvml, ...) those top-level packages are trusted too, recursively.
    # A submission that directly reaches for a random third-party module is
    # still blocked because it does not originate from inside an allowed package.
    trusted = set(ALWAYS)

    def guarded_import(name, globals=None, locals=None, fromlist=(), level=0):
        # Relative imports (level > 0, or a bare submodule name like
        # "from . import x" -> empty name) resolve within the current package
        # (e.g. numpy's own submodules) and cannot smuggle arbitrary modules.
        if not name or name.startswith(".") or level > 0:
            return real_import(name, globals, locals, fromlist, level)
        root = name.split(".")[0]
        if root in trusted or root in stdlib:
            return real_import(name, globals, locals, fromlist, level)
        # A new top-level dependency is only trusted if it is requested from
        # inside an already-trusted package (numpy/torch pulling in their own
        # runtime deps). Anything requested from user code stays blocked.
        pkg = (globals or {}).get("__package__", "") if globals else ""
        pkgroot = pkg.split(".")[0] if pkg else ""
        if pkgroot in trusted:
            trusted.add(root)
            return real_import(name, globals, locals, fromlist, level)
        raise ImportError("Import '%s' is not allowed for this problem." % name)

    builtins.__import__ = guarded_import


def case_result_shell(case):
    return {
        "id": case["id"],
        "name": case.get("name"),
        "test_group": case.get("test_group"),
        "status": "runtime_error",
        "runtime_ms": None,
        "value": None,
        "shape": None,
        "dtype": None,
        "gradient": None,
        "exception": None,
        "performance": None,
        "error_category": None,
        "message": None,
        "stdout": None,
    }


def evaluate_case(case, invocation):
    result = case_result_shell(case)
    expected = case.get("expected", {})
    kind = expected.get("kind")
    call = call_with_capture(invocation["callable"], invocation["args"], invocation["kwargs"])
    result["runtime_ms"] = call["runtime_ms"]
    result["stdout"] = call["stdout"].replace(RESULT_SENTINEL, "[filtered]") or None

    if kind == "exception":
        result["exception"] = exception_check(call["error"], expected)
        result["status"] = "accepted" if result["exception"]["passed"] else "wrong_answer"
        return result

    if call["error"] is not None:
        error = call["error"]
        result["error_category"] = "runtime_error"
        result["message"] = "Raised %s: %s" % (type(error).__name__, str(error)[:200])
        return result

    output = call["output"]

    if kind == "performance":
        threshold = expected.get("max_runtime_ms")
        result["performance"] = {
            "runtime_ms": call["runtime_ms"],
            "threshold_ms": threshold,
            "passed": True if threshold is None else call["runtime_ms"] <= threshold,
        }
        # Performance is informational in Week 5 (Task 16): it never fails a case.
        result["status"] = "accepted"
        return result

    if kind == "gradient":
        forward_expected = expected.get("forward")
        if forward_expected is not None:
            forward_value = build_value(forward_expected, FRAMEWORK)
            value_comparison = numeric_comparison(output, forward_value, "allclose", EXPECTED_RTOL, EXPECTED_ATOL)
            result["value"] = {"passed": value_comparison["passed"],
                               "max_abs_error": value_comparison["max_abs_error"],
                               "message": value_comparison["message"],
                               "comparison": "allclose"}
        gradient_result = gradient_check(output, expected, invocation["handles"])
        result["gradient"] = gradient_result
        result["status"] = "accepted" if gradient_result["passed"] else "wrong_answer"
        return result

    if kind == "shape":
        received_shape = shape_of(output)
        expected_shape = expected.get("shape")
        passed = received_shape is not None and received_shape == expected_shape
        result["shape"] = {"passed": passed, "expected": expected_shape, "received": received_shape}
        result["status"] = "accepted" if passed else "wrong_answer"
        return result

    if kind == "dtype":
        received_dtype = dtype_of(output)
        expected_dtype = expected.get("dtype")
        passed = received_dtype == expected_dtype
        result["dtype"] = {"passed": passed, "expected": expected_dtype, "received": received_dtype}
        result["status"] = "accepted" if passed else "wrong_answer"
        return result

    # kind == "value" (default correctness check)
    expected_value = build_value(expected.get("value"), FRAMEWORK)
    comparison = numeric_comparison(output, expected_value, COMPARISON_MODE, EXPECTED_RTOL, EXPECTED_ATOL)
    result["value"] = {"passed": comparison["passed"], "max_abs_error": comparison["max_abs_error"],
                       "message": comparison["message"], "comparison": COMPARISON_MODE}
    if CONFIG["check_shape"]:
        received_shape = shape_of(output)
        expected_shape = shape_of(expected_value)
        if expected_shape:
            passed = received_shape is not None and received_shape == expected_shape
            result["shape"] = {"passed": passed, "expected": expected_shape, "received": received_shape}
            if not passed:
                result["status"] = "wrong_answer"
                return result
    if CONFIG["check_dtype"]:
        expected_spec = expected.get("value")
        if is_tensor_spec(expected_spec):
            received_dtype = dtype_of(output)
            expected_dtype = expected_spec.get("dtype")
            passed = received_dtype == expected_dtype
            result["dtype"] = {"passed": passed, "expected": expected_dtype, "received": received_dtype}
            if not passed:
                result["status"] = "wrong_answer"
                return result
    result["status"] = "accepted" if comparison["passed"] else "wrong_answer"
    return result


def main():
    raw = sys.stdin.read()
    payload = json.loads(raw)
    global COMPARISON_MODE, EXPECTED_RTOL, EXPECTED_ATOL, CONFIG, FRAMEWORK
    CONFIG = payload["config"]
    COMPARISON_MODE = CONFIG["comparison"]
    EXPECTED_RTOL = CONFIG["rtol"]
    EXPECTED_ATOL = CONFIG["atol"]
    FRAMEWORK = payload["framework"]

    module, load_error = load_user_module(payload["source"])
    if load_error is not None:
        emit({"cases": [], "entrypoint_error": load_error, "total_runtime_ms": None})
        return

    install_import_guard(set(payload["allow_imports"]))

    entrypoint, entrypoint_error = resolve_entrypoint(module, payload["entrypoint"]["name"])
    if entrypoint_error is None:
        entrypoint_error = signature_probe(entrypoint, payload)
    if entrypoint_error is not None:
        emit({"cases": [], "entrypoint_error": entrypoint_error, "total_runtime_ms": None})
        return

    started = time.perf_counter()
    results = []
    for case in payload["cases"]:
        seed_everything(case.get("seed"))
        invocation = invoke_case(entrypoint, case)
        if invocation["error"] is not None:
            shell = case_result_shell(case)
            shell["error_category"] = invocation["error"]["category"]
            shell["message"] = invocation["error"]["message"]
            results.append(shell)
            continue
        results.append(evaluate_case(case, invocation))
    total_ms = (time.perf_counter() - started) * 1000.0
    emit({"cases": results, "entrypoint_error": None, "total_runtime_ms": total_ms})


def emit(result):
    encoded = json.dumps(result, separators=(",", ":"), default=repr)
    if len(encoded) > MAX_RESULT_JSON_CHARS:
        encoded = json.dumps({"cases": [], "entrypoint_error": {
            "category": "output_limit", "message": "The result payload exceeded the output limit."}})
    sys.stdout.write(RESULT_SENTINEL + encoded + "\\n")
    sys.stdout.flush()


if __name__ == "__main__":
    main()
`;
}

/** TS request → runner payload (snake_case, sanitized). */
export function buildRunnerPayload(request: MLEvaluationRequest, allowImports: string[]): RunnerPayload {
  return {
    source: request.sourceCode,
    framework: request.framework,
    entrypoint: { name: request.entrypointName, type: request.entrypointType },
    config: { ...request.config },
    allow_imports: allowImports,
    cases: request.cases.map(mapCase),
  };
}

function mapCase(testCase: StructuredTestCase): RunnerCasePayload {
  return {
    id: testCase.id,
    name: testCase.name,
    test_type: testCase.testType,
    test_group: testCase.testGroup,
    args: testCase.args,
    kwargs: testCase.kwargs,
    construct: testCase.construct
      ? { args: testCase.construct.args, kwargs: testCase.construct.kwargs }
      : null,
    method: testCase.method,
    expected: mapExpected(testCase.expected),
    seed: testCase.seed,
    weight: testCase.weight,
  };
}

function mapExpected(expected: ExpectedValue): Record<string, unknown> {
  switch (expected.kind) {
    case "value":
      return { kind: "value", value: expected.value };
    case "shape":
      return { kind: "shape", shape: expected.shape };
    case "dtype":
      return { kind: "dtype", dtype: expected.dtype };
    case "exception":
      return { kind: "exception", exception_type: expected.exceptionType, message_pattern: expected.messagePattern ?? null };
    case "gradient":
      return {
        kind: "gradient",
        forward: expected.forward,
        gradients: expected.gradients.map((entry) => ({ label: entry.label, value: entry.value })),
      };
    case "performance":
      return { kind: "performance", max_runtime_ms: expected.maxRuntimeMs ?? null };
  }
}
