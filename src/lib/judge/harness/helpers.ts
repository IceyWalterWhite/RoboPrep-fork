/**
 * Shared Python helper segments for the ML judge harness (Week 5 Task 7).
 *
 * These strings are assembled by `python.ts` into one deterministic runner
 * script. Keeping them in TS segments lets `function.ts` / `class.ts` own the
 * mode-specific entrypoint handling while the numeric/tensor semantics stay
 * in one place.
 *
 * Requirements covered here:
 * - Task 9:  structured input reconstruction (tensor specs → numpy/torch)
 * - Task 10: numerical comparison (allclose semantics, NaN/Inf never equal)
 * - Task 11: shape extraction for tensor and nested-list outputs
 * - Task 13: gradient collection and comparison
 * - Task 7:  stdout capture so user prints cannot corrupt the JSON payload
 */

export const PY_HELPERS = String.raw`
import builtins
import contextlib
import importlib.util
import inspect
import io
import json
import math
import os
import random
import re
import resource
import sys
import tempfile
import time

RESULT_SENTINEL = "__ROBOPREP_RESULT__"
MAX_USER_STDOUT_CHARS = 4096
MAX_RESULT_JSON_CHARS = 512 * 1024

NUMPY_DTYPES = None  # populated lazily; numpy is always available in the runner image
TORCH = None         # populated lazily when the payload needs torch


class HarnessError(Exception):
    """Raised for harness-internal failures; never exposes hidden payloads."""


def lazy_numpy():
    global NUMPY_DTYPES
    import numpy as np
    if NUMPY_DTYPES is None:
        NUMPY_DTYPES = {
            "float32": np.float32,
            "float64": np.float64,
            "int64": np.int64,
            "bool": np.bool_,
        }
    return np


def lazy_torch():
    global TORCH
    if TORCH is None:
        import torch
        TORCH = torch
    return TORCH


def is_tensor_spec(value):
    return isinstance(value, dict) and value.get("type") == "tensor"


def build_tensor(spec, framework):
    np = lazy_numpy()
    shape = spec.get("shape") or []
    dtype_name = spec["dtype"]
    values = spec.get("values") or []
    count = 1
    for dim in shape:
        count *= dim
    if values and len(values) != count:
        raise HarnessError("张量规格中的值无法填满声明的形状")
    np_dtype = NUMPY_DTYPES[dtype_name]
    if values:
        arr = np.asarray(values, dtype=np_dtype).reshape(shape)
    else:
        arr = np.zeros(count, dtype=np_dtype).reshape(shape)
    if framework != "pytorch" and not spec.get("requires_grad"):
        return arr
    torch = lazy_torch()
    tensor = torch.from_numpy(arr.copy())
    if spec.get("requires_grad"):
        if tensor.dtype in (torch.float32, torch.float64):
            tensor.requires_grad_(True)
        else:
            raise HarnessError("只有浮点张量支持 requires_grad")
    return tensor


def build_value(value, framework):
    if is_tensor_spec(value):
        return build_tensor(value, framework)
    if isinstance(value, list):
        return [build_value(item, framework) for item in value]
    if isinstance(value, dict):
        return {key: build_value(item, framework) for key, item in value.items()}
    return value


def to_plain(value, depth=0):
    """Convert an output value into JSON-safe plain Python data."""
    if depth > 12:
        return "…"
    np = lazy_numpy()
    if TORCH is not None and isinstance(value, TORCH.Tensor):
        return to_plain(value.detach().cpu().numpy(), depth + 1)
    if isinstance(value, np.ndarray):
        return to_plain(value.tolist(), depth + 1)
    if isinstance(value, (np.floating, np.integer, np.bool_)):
        value = value.item()
    if isinstance(value, float):
        if math.isnan(value):
            return "NaN"
        if math.isinf(value):
            return "Infinity" if value > 0 else "-Infinity"
        return value
    if isinstance(value, (list, tuple)):
        return [to_plain(item, depth + 1) for item in value]
    if isinstance(value, dict):
        return {str(key): to_plain(item, depth + 1) for key, item in value.items()}
    if isinstance(value, (str, bool, int)) or value is None:
        return value
    return repr(value)


def shape_of(value, depth=0):
    """Shape of a tensor or strictly rectangular nested list; None when ragged."""
    if TORCH is not None and isinstance(value, TORCH.Tensor):
        return list(value.shape)
    np = lazy_numpy()
    if isinstance(value, np.ndarray):
        return list(value.shape)
    if isinstance(value, (list, tuple)):
        if len(value) == 0:
            return [0]
        first = shape_of(value[0], depth + 1)
        if first is None:
            return None
        return [len(value)] + first
    return []


def dtype_of(value):
    if TORCH is not None and isinstance(value, TORCH.Tensor):
        return str(value.dtype).replace("torch.", "")
    np = lazy_numpy()
    if isinstance(value, np.ndarray):
        name = value.dtype.name
        return {"float64": "float64", "float32": "float32", "int64": "int64", "bool": "bool"}.get(name, name)
    return None


def flat_numbers(value, out, depth=0):
    if depth > 12:
        return
    if TORCH is not None and isinstance(value, TORCH.Tensor):
        flat_numbers(value.detach().cpu().numpy().ravel().tolist(), out, depth + 1)
        return
    np = lazy_numpy()
    if isinstance(value, np.ndarray):
        flat_numbers(value.ravel().tolist(), out, depth + 1)
        return
    if isinstance(value, bool):
        out.append(float(value))
        return
    if isinstance(value, (int, float)):
        out.append(float(value))
        return
    if isinstance(value, (list, tuple)):
        for item in value:
            flat_numbers(item, out, depth + 1)
        return
    if isinstance(value, dict):
        for item in value.values():
            flat_numbers(item, out, depth + 1)
        return


def numeric_comparison(received, expected, mode, rtol, atol):
    """allclose-style comparison; returns dict with passed / max_abs_error / message.

    NaN / Inf policy: non-finite values never compare equal (equal_nan=False).
    The error magnitude is only reported over finite element pairs so the
    result JSON stays valid (no NaN/Inf literals).
    """
    actual_flat, expected_flat = [], []
    flat_numbers(received, actual_flat)
    flat_numbers(expected, expected_flat)
    if len(actual_flat) != len(expected_flat):
        return {"passed": False, "max_abs_error": None,
                "message": "元素数量不同（预期 %d，实际 %d）" % (len(expected_flat), len(actual_flat))}
    if len(expected_flat) == 0:
        return {"passed": True, "max_abs_error": None, "message": None}
    max_abs_error = 0.0
    for actual, expected_value in zip(actual_flat, expected_flat):
        if math.isnan(actual) or math.isnan(expected_value):
            return {"passed": False, "max_abs_error": None, "message": "NaN 不是可接受的值"}
        if math.isinf(actual) or math.isinf(expected_value):
            if actual != expected_value:
                return {"passed": False, "max_abs_error": None, "message": "非有限值不匹配"}
            continue
        abs_error = abs(actual - expected_value)
        if abs_error > max_abs_error:
            max_abs_error = abs_error
        if mode == "absolute_error":
            ok = abs_error <= atol
        elif mode == "relative_error":
            ok = abs_error <= rtol * max(abs(expected_value), 1e-12)
        elif mode == "exact":
            ok = actual == expected_value
        else:  # allclose
            ok = abs_error <= atol + rtol * abs(expected_value)
        if not ok:
            return {"passed": False, "max_abs_error": max_abs_error, "message": None}
    return {"passed": True, "max_abs_error": max_abs_error, "message": None}
`;

export const PY_CASE_RUNTIME = String.raw`
def seed_everything(seed):
    if seed is None:
        return
    random.seed(seed)
    np = lazy_numpy()
    np.random.seed(seed % (2 ** 32))
    if TORCH is not None:
        TORCH.manual_seed(seed)


class _CallTimer:
    def __enter__(self):
        self.started = time.perf_counter()
        return self

    def __exit__(self, *exc):
        self.elapsed_ms = (time.perf_counter() - self.started) * 1000.0


def call_with_capture(callable_target, args, kwargs):
    """Call the user code with stdout/stderr captured so prints cannot
    corrupt the machine-readable result payload (Task 7)."""
    stdout_buffer, stderr_buffer = io.StringIO(), io.StringIO()
    with _CallTimer() as timer:
        try:
            with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):
                output = callable_target(*args, **kwargs)
            error = None
        except Exception as exc:  # noqa: BLE001 — user code can raise anything
            output, error = None, exc
    return {
        "output": output,
        "error": error,
        "stdout": stdout_buffer.getvalue()[:MAX_USER_STDOUT_CHARS],
        "runtime_ms": timer.elapsed_ms,
    }


def exception_check(error, expected):
    """Task 15: expected-exception tests. Stack traces are sanitized — only
    the exception type name and a bounded message survive."""
    expected_type = expected.get("exception_type")
    pattern = expected.get("message_pattern")
    if error is None:
        return {"passed": False, "raised_type": None, "expected_type": expected_type,
                "message": "预期抛出异常，但调用成功了"}
    raised_type = type(error).__name__
    if raised_type != expected_type:
        return {"passed": False, "raised_type": raised_type, "expected_type": expected_type,
                "message": "实际抛出 %s，而不是 %s" % (raised_type, expected_type)}
    if pattern and not re.search(pattern, str(error)):
        return {"passed": False, "raised_type": raised_type, "expected_type": expected_type,
                "message": "异常消息不符合预期模式"}
    return {"passed": True, "raised_type": raised_type, "expected_type": expected_type, "message": None}


def gradient_check(forward_output, expected, input_handles):
    """Task 13: compare user gradients against trusted reference gradients.

    input_handles: list of {label, tensor} for inputs created with
    requires_grad. Backward runs from sum(output) so the reference gradients
    must be authored under the same convention (documented in
    docs/judge-reproducibility.md).
    """
    torch = lazy_torch()
    forward_ok = isinstance(forward_output, torch.Tensor)
    result = {"passed": False, "forward_passed": forward_ok, "tensors": []}
    if not forward_ok:
        result["tensors"].append({"label": "output", "passed": False, "missing": True, "max_abs_error": None})
        result["message"] = "反向传播需要前向输出为单个张量"
        return result
    try:
        torch = lazy_torch()
        forward_output.backward(torch.ones_like(forward_output))
    except Exception as exc:  # noqa: BLE001
        result["message"] = "反向传播失败：%s：%s" % (type(exc).__name__, str(exc)[:200])
        return result
    computed = {}
    for handle in input_handles:
        tensor = handle["tensor"]
        grad = getattr(tensor, "grad", None)
        computed[handle["label"]] = grad
    for reference in expected.get("gradients", []):
        label = reference["label"]
        grad = computed.get(label)
        if grad is None:
            result["tensors"].append({"label": label, "passed": False, "missing": True, "max_abs_error": None})
            continue
        expected_spec = reference["value"]
        expected_tensor = build_tensor({**expected_spec, "requires_grad": False}, "pytorch")
        comparison = numeric_comparison(grad, expected_tensor, "allclose", EXPECTED_RTOL, EXPECTED_ATOL)
        result["tensors"].append({
            "label": label,
            "passed": comparison["passed"],
            "missing": False,
            "max_abs_error": comparison["max_abs_error"],
        })
    result["passed"] = all(item["passed"] for item in result["tensors"])
    if not result["passed"] and result.get("message") is None:
        result["message"] = "梯度检查未通过"
    return result
`;
