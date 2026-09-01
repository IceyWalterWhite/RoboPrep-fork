/**
 * Function-mode harness segment (Week 5 Task 7).
 *
 * Resolves a callable entrypoint on the user module and validates basic
 * signature compatibility (Task 8) without requiring exact argument names.
 */

export const PY_FUNCTION_ENTRY = String.raw`
def resolve_entrypoint(module, name):
    target = getattr(module, name, None)
    if target is None:
        return None, {"category": "entrypoint_missing",
                      "message": "Expected function '%s', but no callable with that name was found." % name}
    if not callable(target):
        return None, {"category": "entrypoint_not_callable",
                      "message": "'%s' exists but is not callable." % name}
    return target, None


def signature_probe(target, payload):
    """Best-effort bind check against the first case. Details never include
    hidden input values."""
    cases = payload.get("cases") or []
    if not cases:
        return None
    first = cases[0]
    try:
        inspect.signature(target).bind(
            *[build_value(v, payload["framework"]) for v in first.get("args", [])],
            **{k: build_value(v, payload["framework"]) for k, v in first.get("kwargs", {}).items()},
        )
        return None
    except TypeError:
        return {"category": "entrypoint_signature",
                "message": "The entrypoint does not accept the expected arguments. Check the signature in the starter code."}


def invoke_case(entrypoint, case):
    args = [build_value(value, FRAMEWORK) for value in case.get("args", [])]
    kwargs = {key: build_value(value, FRAMEWORK) for key, value in case.get("kwargs", {}).items()}
    handles = []
    for index, value in enumerate(args):
        if TORCH is not None and isinstance(value, TORCH.Tensor) and value.requires_grad:
            handles.append({"label": "arg%d" % index, "tensor": value})
    for key, value in kwargs.items():
        if TORCH is not None and isinstance(value, TORCH.Tensor) and value.requires_grad:
            handles.append({"label": key, "tensor": value})
    return {"callable": entrypoint, "args": args, "kwargs": kwargs, "instance": None, "handles": handles, "error": None}
`;
