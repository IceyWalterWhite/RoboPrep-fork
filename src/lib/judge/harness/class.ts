/**
 * Class-mode harness segment (Week 5 Task 7).
 *
 * Instantiates the user's class with controlled constructor arguments, then
 * calls the requested instance method (default `forward`). Gradient handles
 * include both requires_grad inputs and nn.Module parameters so parameter
 * gradient checks work for PyTorch problems.
 */

export const PY_CLASS_ENTRY = String.raw`
def resolve_entrypoint(module, name):
    target = getattr(module, name, None)
    if target is None:
        return None, {"category": "entrypoint_missing",
                      "message": "未找到名为 '%s' 的类。" % name}
    if not (isinstance(target, type) and callable(target)):
        return None, {"category": "entrypoint_not_callable",
                      "message": "'%s' 存在，但不是类。" % name}
    return target, None


def signature_probe(target, payload):
    """Validate the constructor signature (best effort, no hidden details)."""
    cases = payload.get("cases") or []
    if not cases:
        return None
    construct = cases[0].get("construct") or {"args": [], "kwargs": {}}
    try:
        inspect.signature(target).bind(
            *[build_value(v, payload["framework"]) for v in construct.get("args", [])],
            **{k: build_value(v, payload["framework"]) for k, v in construct.get("kwargs", {}).items()},
        )
        return None
    except TypeError:
        return {"category": "entrypoint_signature",
                "message": "类构造函数不接受预期参数，请检查起始代码中的函数签名。"}


def invoke_case(entrypoint, case):
    construct = case.get("construct") or {"args": [], "kwargs": {}}
    construct_args = [build_value(value, FRAMEWORK) for value in construct.get("args", [])]
    construct_kwargs = {key: build_value(value, FRAMEWORK) for key, value in construct.get("kwargs", {}).items()}
    try:
        instance = entrypoint(*construct_args, **construct_kwargs)
    except Exception as exc:  # noqa: BLE001
        return {"callable": None, "args": [], "kwargs": {}, "instance": None, "handles": [],
                "error": {"category": "runtime_error",
                          "message": "构造 %s 失败：%s：%s" % (getattr(entrypoint, "__name__", "?"), type(exc).__name__, str(exc)[:200])}}
    method_name = case.get("method") or "forward"
    method = getattr(instance, method_name, None)
    if method is None or not callable(method):
        return {"callable": None, "args": [], "kwargs": {}, "instance": None, "handles": [],
                "error": {"category": "entrypoint_missing",
                          "message": "实例没有名为 '%s' 的可调用方法。" % method_name}}
    args = [build_value(value, FRAMEWORK) for value in case.get("args", [])]
    kwargs = {key: build_value(value, FRAMEWORK) for key, value in case.get("kwargs", {}).items()}
    handles = []
    for index, value in enumerate(args):
        if TORCH is not None and isinstance(value, TORCH.Tensor) and value.requires_grad:
            handles.append({"label": "arg%d" % index, "tensor": value})
    for key, value in kwargs.items():
        if TORCH is not None and isinstance(value, TORCH.Tensor) and value.requires_grad:
            handles.append({"label": key, "tensor": value})
    if TORCH is not None and isinstance(instance, TORCH.nn.Module):
        for param_name, param in instance.named_parameters():
            if param.requires_grad:
                handles.append({"label": "param:%s" % param_name, "tensor": param})
    return {"callable": method, "args": args, "kwargs": kwargs, "instance": instance, "handles": handles, "error": None}
`;
