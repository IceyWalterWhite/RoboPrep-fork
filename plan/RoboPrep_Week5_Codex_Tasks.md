# RoboPrep — Week 5 Codex Implementation Tasks

> Goal: extend the Week 4 Python Coding MVP into a differentiated **Embodied AI / ML Coding Platform**.
>
> Week 5 should move RoboPrep beyond generic stdin/stdout algorithm problems and support:
>
> ```text
> Function-level ML problems
> → structured test harness
> → numerical checks
> → shape checks
> → gradient checks
> → PyTorch CPU evaluation
> → richer result feedback
> ```
>
> Do not add GPU execution yet.

---

# Week 5 Definition of Done

By the end of Week 5, RoboPrep should support two evaluation modes:

```text
Mode A — Standard Program Judge
stdin → Python program → stdout → comparison
```

and:

```text
Mode B — ML Function Judge
user function/class
→ controlled harness
→ value checks
→ shape checks
→ dtype checks
→ gradient checks
→ edge cases
→ structured feedback
```

Users should be able to:

```text
browse 50+ coding problems
→ distinguish algorithm vs ML implementation problems
→ open structured coding tasks
→ implement requested function/class
→ Run visible checks
→ Submit hidden checks
→ receive test-category feedback
→ track solved / attempted progress
→ browse curated coding collections
```

Week 5 must prioritize:

```text
judge correctness
determinism
safe harness design
useful feedback
reusable evaluator abstractions
high-quality Embodied AI coding content
```

over GPU or distributed execution.

---

# Week 5 Scope

Implement:

```text
ML function judge mode
PyTorch CPU evaluator
function/class harness
shape checks
numerical checks
gradient checks
dtype checks
exception checks
custom comparators
problem evaluator config
test-category feedback
problem collections
coding progress
50+ coding problems
judge analytics helpers
submission breakdown
problem difficulty calibration
```

Do not implement:

```text
GPU judge
CUDA coding
distributed training
multi-node execution
leaderboards
contests
AI code completion
AI solution generation
```

---

# Task 1 — Coding Problem Evaluation Mode

## Goal

Extend coding problems so every problem declares how it is evaluated.

Create migration:

```text
supabase/migrations/0010_coding_evaluation_modes.sql
```

Add to `coding_problems`:

```text
evaluation_mode text not null default 'program'
entrypoint_type text
entrypoint_name text
framework text
resource_profile text
```

Initial evaluation modes:

```text
program
function
class
```

Initial frameworks:

```text
python
numpy
pytorch
```

Examples:

```text
Implement Softmax

evaluation_mode = function
entrypoint_type = function
entrypoint_name = softmax
framework = numpy
```

```text
Implement LayerNorm

evaluation_mode = class
entrypoint_type = class
entrypoint_name = LayerNorm
framework = pytorch
```

## Acceptance Criteria

- Existing Week 4 problems default to `program`
- Function/class tasks are representable
- Framework is explicit
- Existing Judge flow remains valid

---

# Task 2 — Evaluator Configuration Schema

## Goal

Store evaluator-specific configuration.

Add to `coding_problems`:

```text
evaluator_config jsonb
```

Example:

```json
{
  "comparison": "allclose",
  "rtol": 1e-5,
  "atol": 1e-6,
  "check_shape": true,
  "check_dtype": true,
  "check_gradient": false
}
```

For PyTorch:

```json
{
  "comparison": "allclose",
  "rtol": 1e-4,
  "atol": 1e-5,
  "check_shape": true,
  "check_dtype": true,
  "check_gradient": true
}
```

Validate with Zod server-side.

## Acceptance Criteria

- Invalid config rejected
- Safe defaults exist
- UI never treats arbitrary JSON as trusted evaluator instructions
- Core fields remain relational

---

# Task 3 — Structured Test Case Schema

## Goal

Extend `coding_test_cases` for function/class evaluation.

Add fields if missing:

```text
test_type text
test_group text
input_json jsonb
expected_json jsonb
metadata jsonb
```

Initial test types:

```text
example
value
shape
dtype
gradient
exception
performance
```

Initial groups:

```text
basic
edge
numerical
shape
gradient
performance
```

Keep Week 4 stdin/stdout fields for program-mode compatibility.

## Acceptance Criteria

- Program tests remain valid
- Structured inputs supported
- Hidden structured tests protected by RLS/server boundary

---

# Task 4 — ML Judge Domain Types

## Goal

Create evaluator-specific types.

Create:

```text
src/types/ml-judge.ts
```

Define:

```text
EvaluationMode
EvaluatorConfig
StructuredTestCase
TestGroup
TestType
MLJudgeRequest
MLJudgeResult
MLJudgeCaseResult
GradientCheckResult
NumericalCheckResult
ShapeCheckResult
```

## Acceptance Criteria

- No `any`
- Public and hidden types separated
- Config uses discriminated unions where useful

---

# Task 5 — Judge Service Extension

## Goal

Extend Week 4 `JudgeService` so program/function/class evaluation share one abstraction.

Recommended concept:

```ts
interface JudgeService {
  evaluate(request: EvaluationRequest): Promise<EvaluationResult>;
}
```

where `EvaluationRequest` is a discriminated union.

## Acceptance Criteria

- Program judge still works
- ML modes fit the same service boundary
- Page components do not know provider details

---

# Task 6 — ML Evaluator Adapter

## Goal

Add a structured Python/PyTorch evaluator adapter.

Create:

```text
src/lib/judge/adapters/ml-python.ts
```

Architecture:

```text
RoboPrep Server
→ JudgeService
→ ML evaluator adapter
→ isolated Python runner
→ trusted harness
→ structured JSON result
```

Do not execute arbitrary user code inside the Next.js server process.

Local/dev child-process execution may exist only if clearly documented as non-production-safe.

## Acceptance Criteria

- Runner has timeout
- Structured result returned
- Server process does not directly `exec` user source in-process
- Production limitations documented

---

# Task 7 — Python Harness Generator

## Goal

Generate controlled harness code around user implementations.

Create:

```text
src/lib/judge/harness/
├── python.ts
├── function.ts
├── class.ts
└── helpers.ts
```

Harness must support:

```text
known entrypoint
controlled inputs
stdout capture
exception capture
structured JSON result
```

## Acceptance Criteria

- Missing function/class produces readable error
- User stdout cannot corrupt machine-readable payload
- Harness generation is deterministic

---

# Task 8 — Entrypoint Validation

## Goal

Validate required function/class before full test execution.

Examples:

```text
def scaled_dot_product_attention(...)
```

or:

```text
class LayerNorm(...)
```

Check:

```text
entrypoint exists
entrypoint is callable/class
basic signature compatibility when practical
```

Do not require exact argument names unless semantically necessary.

## Acceptance Criteria

- Missing entrypoint fails early
- Clear user-facing error
- Hidden tests not revealed

---

# Task 9 — Structured Input Serialization

## Goal

Create deterministic serialization for evaluator inputs.

Support:

```text
int
float
bool
string
list
nested list
dict
```

And tensor spec:

```json
{
  "type": "tensor",
  "shape": [2, 4, 8],
  "dtype": "float32",
  "values": [],
  "requires_grad": true
}
```

## Acceptance Criteria

- Deterministic reconstruction
- Unsupported types fail clearly
- Hidden inputs stay server-side

---

# Task 10 — Numerical Comparator Framework

## Goal

Generalize comparison logic.

Create:

```text
src/lib/judge/comparators/
├── exact.ts
├── numeric.ts
├── tensor.ts
└── index.ts
```

Support:

```text
exact
allclose
absolute_error
relative_error
```

Configuration:

```text
rtol
atol
```

## Acceptance Criteria

- NaN/Inf behavior documented
- Error magnitude can be returned
- Comparator independent of UI

---

# Task 11 — Shape Check

## Goal

Validate output shape separately from value correctness.

Visible feedback example:

```text
Shape Check
Expected: [2, 8, 64]
Received: [2, 64]
Failed
```

Hidden submit should redact sensitive dimensions when appropriate.

## Acceptance Criteria

- Tensor and nested-array outputs supported
- Shape result independent from value result
- Hidden feedback redaction supported

---

# Task 12 — Dtype Check

## Goal

Validate expected dtype when configured.

Support:

```text
float32
float64
int64
bool
```

Example:

```text
Value Check   ✓
Shape Check   ✓
Dtype Check   ✗
```

## Acceptance Criteria

- Configurable
- Optional by default
- No penalty if no dtype requirement

---

# Task 13 — Gradient Check Infrastructure

## Goal

Add autograd correctness checks for PyTorch problems.

Support:

```text
requires_grad inputs
forward output
backward
compare user gradients against trusted reference gradients
```

Initial use cases:

```text
LayerNorm
Attention
loss functions
```

## Acceptance Criteria

- Missing gradient detected
- Incorrect gradient detected
- Tolerance configurable
- Forward and backward failures separated

---

# Task 14 — Gradient Check Result UI

## Goal

Display structured gradient feedback.

Create:

```text
src/components/coding/ml-check-results.tsx
```

Example:

```text
Forward Value       ✓
Output Shape        ✓
Input Gradient      ✓
Parameter Gradient  ✗
```

## Acceptance Criteria

- Hidden reference tensors never shown
- Pass/fail not conveyed by color only
- Mobile readable

---

# Task 15 — Exception Test Support

## Goal

Support tests expecting an exception.

Examples:

```text
invalid dimension
invalid axis
negative size
```

Allow expected exception type and optional message pattern.

## Acceptance Criteria

- Correct exception passes
- Wrong exception fails
- Internal stack trace sanitized

---

# Task 16 — Performance Metadata

## Goal

Record informational CPU performance metadata.

Support test type:

```text
performance
```

Record:

```text
runtime_ms
memory when available
```

Performance is informational in Week 5 unless a problem explicitly requires a safe generous threshold.

## Acceptance Criteria

- No fake speed score
- Timing noise does not unfairly fail users

---

# Task 17 — Test Group Aggregation

## Goal

Aggregate tests into user-readable categories.

Example:

```text
Correctness       4 / 4
Edge Cases        2 / 3
Shape             3 / 3
Gradient          1 / 2
Performance       Info
```

Required groups must all pass for Accepted.

## Acceptance Criteria

- Deterministic aggregation
- Optional groups do not fail submission
- Hidden test counts summarized safely

---

# Task 18 — ML Result Panel

## Goal

Create richer result presentation for ML tasks.

Create:

```text
src/components/coding/ml-result-panel.tsx
```

Example:

```text
Submission Result

Correctness  5 / 5
Shape        3 / 3
Numerical    4 / 4
Gradient     2 / 3

Wrong Answer
```

## Acceptance Criteria

- Program-mode remains simple
- ML mode automatically selects structured panel
- Result persists from submission summary

---

# Task 19 — Evaluation Metadata UI

## Goal

Show users how a problem is evaluated.

Example:

```text
Evaluation
Function

Framework
PyTorch

Entrypoint
scaled_dot_product_attention
```

## Acceptance Criteria

- Clear before coding begins
- Hidden evaluator configuration not exposed
- Program-mode stays uncluttered

---

# Task 20 — Starter Code Templates

## Goal

Create high-quality function/class scaffolds.

Examples:

```python
def discounted_returns(rewards, gamma):
    pass
```

```python
import torch

def scaled_dot_product_attention(q, k, v, mask=None):
    pass
```

```python
import torch
import torch.nn as nn

class LayerNorm(nn.Module):
    def __init__(self, dim, eps=1e-5):
        super().__init__()

    def forward(self, x):
        pass
```

## Acceptance Criteria

- Starter code matches evaluator entrypoint exactly
- Imports explicit
- No accidental solution leakage

---

# Task 21 — PyTorch CPU Environment Definition

## Goal

Define a reproducible ML execution environment.

Create:

```text
docs/judge-environment.md
```

Document:

```text
Python version
PyTorch version
NumPy version
CPU-only policy
resource limits
available packages
```

## Acceptance Criteria

- No CUDA dependency
- Supported APIs clear to problem authors

---

# Task 22 — Framework Allowlist Policy

## Goal

Define supported imports for authored problems.

Initial policy:

```text
math
statistics
collections
itertools
functools
heapq
bisect
numpy
torch
torch.nn
torch.nn.functional
```

Important: document that import policy is not itself a security sandbox.

## Acceptance Criteria

- Unsupported dependency gives readable error
- Security boundary remains runner isolation

---

# Task 23 — PyTorch Visible Run Feedback

## Goal

Show useful diagnostics for visible tests.

Example:

```text
Example 1

Input shape       [2, 4, 8]
Expected shape    [2, 4, 8]
Your shape        [2, 4, 8]
Max abs error     2.3e-7

Passed
```

## Acceptance Criteria

- Detailed info only for visible tests
- Hidden tests redacted
- Numerical diagnostics useful but concise

---

# Task 24 — Hidden ML Test Redaction

## Goal

Centralize safe hidden feedback.

Allowed:

```text
Shape Check      Passed
Gradient Check   Failed
Edge Cases       2 / 3
```

Do not expose:

```text
hidden input tensors
expected tensors
reference gradients
reference source
```

## Acceptance Criteria

- Redaction helper centralized
- API and submission detail both use it

---

# Task 25 — Submission Breakdown Persistence

## Goal

Persist structured evaluation summary.

Create migration:

```text
supabase/migrations/0011_coding_submission_breakdown.sql
```

Add:

```text
evaluation_summary jsonb
```

Example:

```json
{
  "correctness": {"passed": 5, "total": 5},
  "shape": {"passed": 3, "total": 3},
  "gradient": {"passed": 2, "total": 3}
}
```

Do not store hidden raw test payloads here.

## Acceptance Criteria

- History renders breakdown without rerun
- RLS remains owner-only

---

# Task 26 — Problem Collections Schema

## Goal

Introduce curated coding collections.

Create:

```text
coding_collections
```

Fields:

```text
id uuid primary key
name text not null
slug text unique not null
description text
is_published boolean default true
order_index integer
created_at timestamptz
updated_at timestamptz
```

And:

```text
coding_collection_problems
```

Fields:

```text
collection_id uuid
problem_id uuid
order_index integer
```

Composite key:

```text
(collection_id, problem_id)
```

## Acceptance Criteria

- Many-to-many works
- Ordered problems supported
- No arrays of IDs

---

# Task 27 — Coding Collections Pages

## Goal

Add:

```text
/coding/collections
/coding/collections/[slug]
```

Initial collections:

```text
Embodied AI Top 30
Transformer Essentials
RL Post-Training Core
Robotics Math Essentials
Diffusion Fundamentals
Robot Learning Utilities
```

## Acceptance Criteria

- Reuses existing problem card/row
- Ordered learning progression
- User progress displayed when authenticated

---

# Task 28 — Coding Progress Model

## Goal

Support efficient user progress.

Prefer deriving truth from submissions.

If cache table is useful:

```text
user_coding_progress
```

Fields:

```text
user_id
problem_id
status
attempt_count
best_runtime_ms
first_solved_at
last_attempt_at
```

Cache must be rebuildable from submissions.

## Acceptance Criteria

- Submission remains source of truth
- Accepted submission always produces solved state

---

# Task 29 — Coding Progress Query Layer

## Goal

Add:

```ts
getUserCodingProgress(...)
getCollectionProgress(...)
getTopicProgress(...)
getCodingOverview(...)
```

Return:

```text
solved
attempted
unsolved
total
```

## Acceptance Criteria

- Anonymous handled cleanly
- No N+1 per problem

---

# Task 30 — Coding Progress UI

## Goal

Add restrained progress display.

Examples:

```text
Solved 18 / 50
```

```text
Transformer Essentials
6 / 10 solved
```

## Acceptance Criteria

- No fake streaks
- Accessible progress text
- No excessive gamification

---

# Task 31 — Problem Completion State Refinement

## Goal

Ensure solved/attempted/unsolved works across all evaluation modes.

Rules:

```text
solved     → at least one Accepted submission
attempted  → submissions exist but none Accepted
unsolved   → no submissions
```

## Acceptance Criteria

- Evaluation mode does not change semantics
- Accepted is server-authoritative

---

# Task 32 — Difficulty Calibration Report

## Goal

Create a lightweight difficulty-analysis script.

Create:

```text
scripts/report-coding-difficulty.ts
```

Signals:

```text
manual difficulty
acceptance rate
median attempts to solve
unique users
```

Do not auto-change production difficulty.

## Acceptance Criteria

- Low-sample problems flagged
- No mutations

---

# Task 33 — Coding Analytics Helpers

## Goal

Add basic per-problem analytics queries.

Support:

```text
submission_count
unique_attempt_users
accepted_users
acceptance_rate
median_runtime
median_attempts_to_solve
```

## Acceptance Criteria

- queued/running excluded where appropriate
- no divide-by-zero
- no dashboard required yet

---

# Task 34 — Expand to 50+ Coding Problems

## Goal

Expand from Week 4's 20 problems to at least 50 high-quality tasks.

Recommended distribution:

```text
Transformer / Attention       10
RL / GRPO / PPO               10
Robotics Math                 10
Diffusion / Flow Matching      8
Robot Learning                 7
Python / Numerical             5
```

Suggested set:

### Transformer

```text
Stable Softmax
LayerNorm
RMSNorm
Scaled Dot-Product Attention
Multi-Head Attention
Causal Attention Mask
KV Cache Append
RoPE Rotation
Top-k Sampling
Cross Attention
```

### RL

```text
Discounted Returns
GAE
Advantage Normalization
PPO Ratio
PPO Clip Loss
GRPO Group Advantage
GRPO Loss
Reward Whitening
KL Penalty
Trajectory Return
```

### Robotics

```text
Euler to Quaternion
Quaternion Normalize
Quaternion Multiply
Quaternion Inverse
Quaternion SLERP
Rotation Matrix to Quaternion
SE(3) Point Transform
Compose SE(3)
Invert SE(3)
Linear Trajectory Interpolation
```

### Diffusion

```text
Linear Beta Schedule
Cosine Schedule Helper
DDPM Forward Noise
Predict x0
Classifier-Free Guidance
Flow Matching Target
Euler ODE Step
Diffusion Action Chunk Reshape
```

### Robot Learning

```text
Replay Buffer
Action Chunking
Temporal Ensemble
Normalize Robot Actions
Mask Padded Actions
Trajectory Window Sampling
Episode Return
```

## Acceptance Criteria

- At least 50 published problems
- Every problem has visible examples
- Every non-trivial problem has hidden tests
- At least 20 use function/class mode
- At least 10 use PyTorch

---

# Task 35 — Transformer Evaluator Problems

## Goal

Create robust hidden checks for:

```text
LayerNorm
Scaled Dot-Product Attention
Multi-Head Attention
Causal Attention
KV Cache
```

Check:

```text
shape
numerical correctness
batch dimensions
mask behavior
dtype
gradient where appropriate
```

## Acceptance Criteria

- Naive incorrect implementations fail
- Tolerances documented
- Reference implementations trusted and server-only

---

# Task 36 — RL Evaluator Problems

## Goal

Create robust tests for:

```text
GAE
PPO Clip Loss
GRPO Group Advantage
GRPO Loss
Reward Whitening
```

Check:

```text
single sample
batch
zero variance
broadcasting
shape
numerical correctness
```

## Acceptance Criteria

- GRPO normalization semantics explicitly defined
- Divide-by-zero edge cases handled

---

# Task 37 — Robotics Evaluator Problems

## Goal

Create tests for:

```text
Quaternion multiplication
Quaternion inverse
Quaternion SLERP
SE(3) transform
SE(3) composition
```

Check:

```text
identity
near-zero rotation
180-degree case
normalization
batch inputs where supported
```

## Acceptance Criteria

- Quaternion convention documented
- Coordinate convention documented
- Ambiguous conventions avoided

---

# Task 38 — Diffusion Evaluator Problems

## Goal

Create tests for:

```text
DDPM forward process
beta schedule
classifier-free guidance
flow matching target
Euler integration step
```

Check:

```text
shape
broadcasting
fixed random seed
edge timestep
numerical correctness
```

## Acceptance Criteria

- Deterministic randomness
- Expected formulas documented for maintainers

---

# Task 39 — Robot Learning Evaluator Problems

## Goal

Create tests for:

```text
Replay Buffer
Action Chunking
Temporal Ensemble
Action Normalization
Trajectory Window Sampling
```

Check:

```text
shape
boundary indices
padding
masking
empty/full buffer behavior
```

## Acceptance Criteria

- Stateful tests deterministic
- Boundary behavior explicit

---

# Task 40 — Numerical Reproducibility Policy

## Goal

Document and enforce deterministic evaluation.

Create:

```text
docs/judge-reproducibility.md
```

Define:

```text
Python random seed
NumPy seed
PyTorch seed
CPU-only execution
deterministic ops where practical
```

## Acceptance Criteria

- Same submission produces same pass/fail
- Randomized tests use fixed/stored seeds

---

# Task 41 — Judge Resource Profiles

## Goal

Define server-owned resource profiles.

Initial profiles:

```text
standard_python
ml_cpu_small
ml_cpu_medium
```

Each defines:

```text
timeout
memory
CPU expectations
```

## Acceptance Criteria

- Client cannot choose arbitrary limits
- Problem selects a valid profile
- Safe defaults exist

---

# Task 42 — Submission Failure Diagnostics

## Goal

Make ML failures actionable without leaking answers.

Examples:

```text
Entrypoint Error
Expected function `gae`, but no callable was found.
```

```text
Shape Error
Your output rank does not match the expected output.
```

```text
Gradient Error
Forward values are correct, but backward gradients failed hidden checks.
```

## Acceptance Criteria

- Diagnostics are categorized
- Provider stack traces sanitized
- Hidden test contents remain hidden

---

# Task 43 — ML Problem Authoring Validation

## Goal

Extend coding integrity checks.

Update:

```text
scripts/check-coding-integrity.ts
```

Validate:

```text
evaluation_mode
entrypoint_name
framework
evaluator_config
structured tests
hidden tests
resource profile
```

## Acceptance Criteria

- Bad authored problem fails integrity check
- Error messages point to problem slug

---

# Task 44 — Problem Authoring Guide

## Goal

Create:

```text
docs/coding-problem-authoring.md
```

Document:

```text
problem statement
starter code
entrypoint
framework
visible tests
hidden tests
comparison mode
shape checks
gradient checks
resource profile
topic mapping
difficulty
```

## Acceptance Criteria

A contributor can add a function-level problem without reading evaluator internals.

---

# Task 45 — Seed Problem Collections

## Goal

Seed at least six useful collections:

```text
Embodied AI Top 30
Transformer Essentials
RL Post-Training Core
Robotics Math Essentials
Diffusion Fundamentals
Robot Learning Utilities
```

## Acceptance Criteria

- Each collection has meaningful ordered problems
- No empty collection
- Problem may belong to multiple collections

---

# Task 46 — Collection Progress UX Audit

## Goal

Ensure collection pages are practical study surfaces.

Display:

```text
title
description
progress
ordered problems
difficulty
status
```

## Acceptance Criteria

- Dense but readable
- Mobile works
- No oversized marketing hero

---

# Task 47 — Coding Progress Page

## Goal

Add a lightweight authenticated page:

```text
/coding/progress
```

Show:

```text
Solved
Attempted
By Topic
Collection Progress
Recent Submissions
```

Avoid unnecessary charts.

## Acceptance Criteria

- Server-rendered
- No fake streaks
- No heavy dashboard feel

---

# Task 48 — Submission History Breakdown

## Goal

Enhance ML submission rows.

Example:

```text
Wrong Answer

Correctness 5/5
Shape       3/3
Gradient    2/3

Python · 126 ms
```

## Acceptance Criteria

- No rerun required
- Program-mode submissions remain compact

---

# Task 49 — Run vs Submit Audit

## Goal

Enforce clear semantics.

### Run

```text
visible tests
detailed diagnostics
not official solve state
```

### Submit

```text
hidden tests
persistent result
redacted diagnostics
updates solved state
```

## Acceptance Criteria

- Hidden tests never reachable through Run
- Client cannot provide expected output to Submit

---

# Task 50 — ML Judge Security Audit

## Goal

Review attack surface introduced by structured evaluators.

Check:

```text
filesystem access
network access
process spawning
fork bombs
memory exhaustion
infinite loops
stdout flooding
environment secrets
arbitrary imports
module shadowing
```

Create:

```text
docs/week5-ml-judge-security.md
```

## Acceptance Criteria

- Production limitations explicit
- Secrets absent from runner environment
- Resource limits enforced
- Next.js process never directly executes user code

---

# Task 51 — PyTorch Evaluator Performance Audit

## Goal

Measure representative CPU judge performance.

Test:

```text
LayerNorm
Attention
GRPO loss
Quaternion batch transform
DDPM forward
```

Record:

```text
startup overhead
execution time
memory
```

## Acceptance Criteria

- Bottlenecks documented
- No GPU assumed
- No premature optimization

---

# Task 52 — Coding Mobile Audit

## Goal

Re-audit mobile UX with ML feedback.

Test:

```text
375px
430px
768px
```

Review:

```text
Problem / Code / Result tabs
ML result groups
long diagnostics
collections
progress page
```

## Acceptance Criteria

- No horizontal overflow
- Result groups readable
- Editor remains usable

---

# Task 53 — Coding Desktop Audit

## Goal

Make ML coding feel professional on desktop.

Test:

```text
1024px
1280px
1440px
1728px
```

Review:

```text
editor
problem panel
evaluation metadata
result panel
submission history
```

## Acceptance Criteria

- Structured feedback visible without excessive scrolling
- Apple-inspired restraint preserved

---

# Task 54 — Accessibility Audit

## Goal

Audit Week 5 additions.

Check:

```text
test result semantics
progress indicators
collection navigation
error announcements
tabs
editor labels
submission state
```

## Acceptance Criteria

- Pass/fail not color-only
- Progress has text equivalent
- Keyboard navigation works

---

# Task 55 — ML Judge Utility Tests

## Goal

Add tests for:

```text
evaluator config validation
structured serialization
numeric comparator
tensor comparator
shape checks
dtype checks
gradient normalization
group aggregation
hidden redaction
```

## Acceptance Criteria

- Offline and deterministic
- No live judge required

---

# Task 56 — End-to-End ML Evaluator Smoke Test

## Goal

Create:

```text
scripts/test-ml-judge.ts
```

Test at least:

```text
correct function
incorrect shape
incorrect gradient
timeout
missing entrypoint
```

## Acceptance Criteria

- Expected statuses returned
- No secret output
- Command documented

---

# Task 57 — Coding Content Quality Audit

## Goal

Review all 50+ problems for real interview usefulness.

For each ask:

```text
Would an Embodied AI / ML interviewer plausibly ask this?
Is the task implementation-focused?
Is the function signature clear?
Are mathematical conventions explicit?
Are hidden tests fair?
Is difficulty appropriate?
```

Remove filler.

## Acceptance Criteria

- No obvious duplicates
- No ambiguous robotics conventions
- No ambiguous RL formulas
- No low-value filler added just to hit 50

---

# Task 58 — Week 5 Integration Audit

## Goal

Perform final Week 5 end-to-end validation.

Do not add major new features here.

## Flow A — Function Problem

```text
/coding
→ LayerNorm
→ edit implementation
→ Run
→ visible value/shape checks
→ Submit
→ hidden checks
```

## Flow B — Gradient Failure

```text
correct forward
→ incorrect backward
→ gradient group fails
```

## Flow C — Robotics Numerical Task

```text
Quaternion SLERP
→ hidden edge cases
→ numeric tolerance
```

## Flow D — Collection

```text
/coding/collections
→ Transformer Essentials
→ solve problem
→ collection progress updates
```

## Flow E — Progress

```text
/coding/progress
→ solved / attempted
→ recent submissions
```

## Flow F — Security

```text
browser
→ hidden structured test query
→ denied
```

## Flow G — Reproducibility

```text
same source
→ repeated submit
→ same pass/fail
```

Run repository checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Also run:

```text
coding integrity check
ML judge smoke test
judge integration test when configured
```

## Deliverables

Create:

```text
docs/week5-status.md
docs/judge-environment.md
docs/judge-reproducibility.md
docs/coding-problem-authoring.md
docs/week5-ml-judge-security.md
```

`week5-status.md` must contain:

```text
Implemented
Database changes
Evaluator architecture
Supported frameworks
Supported checks
Problem count
Collections
Progress features
Security limitations
Known limitations
Deferred to Week 6
```

---

# Recommended Execution Order

Give Codex tasks in this order:

```text
01 Coding Problem Evaluation Mode
02 Evaluator Configuration Schema
03 Structured Test Case Schema
04 ML Judge Domain Types
05 Judge Service Extension
06 ML Evaluator Adapter
07 Python Harness Generator
08 Entrypoint Validation
09 Structured Input Serialization
10 Numerical Comparator Framework
11 Shape Check
12 Dtype Check
13 Gradient Check Infrastructure
14 Gradient Check Result UI
15 Exception Test Support
16 Performance Metadata
17 Test Group Aggregation
18 ML Result Panel
19 Evaluation Metadata UI
20 Starter Code Templates
21 PyTorch CPU Environment Definition
22 Framework Allowlist Policy
23 PyTorch Visible Run Feedback
24 Hidden ML Test Redaction
25 Submission Breakdown Persistence
26 Problem Collections Schema
27 Coding Collections Pages
28 Coding Progress Model
29 Coding Progress Query Layer
30 Coding Progress UI
31 Problem Completion State Refinement
32 Difficulty Calibration Report
33 Coding Analytics Helpers
34 Expand to 50+ Coding Problems
35 Transformer Evaluator Problems
36 RL Evaluator Problems
37 Robotics Evaluator Problems
38 Diffusion Evaluator Problems
39 Robot Learning Evaluator Problems
40 Numerical Reproducibility Policy
41 Judge Resource Profiles
42 Submission Failure Diagnostics
43 ML Problem Authoring Validation
44 Problem Authoring Guide
45 Seed Problem Collections
46 Collection Progress UX Audit
47 Coding Progress Page
48 Submission History Breakdown
49 Run vs Submit Audit
50 ML Judge Security Audit
51 PyTorch Evaluator Performance Audit
52 Coding Mobile Audit
53 Coding Desktop Audit
54 Accessibility Audit
55 ML Judge Utility Tests
56 End-to-End ML Evaluator Smoke Test
57 Coding Content Quality Audit
58 Week 5 Integration Audit
```

Do not give all 58 tasks to Codex in one prompt.

Recommended workflow:

```text
one task
→ inspect repository
→ implement
→ run checks
→ inspect diff
→ commit
→ next task
```

---

# Recommended Commit Groups

```text
feat(db): add structured coding evaluation modes
feat(judge): add ML evaluator abstraction
feat(judge): add function and class harness
feat(judge): add numerical shape and dtype checks
feat(judge): add gradient evaluation
feat(coding): add ML result breakdown UI
feat(coding): add coding collections
feat(coding): add progress tracking
content: expand embodied ai coding problem set
content: add transformer rl robotics diffusion evaluators
docs: add coding authoring and reproducibility guides
security: audit ML execution boundary
test(judge): add ML evaluator coverage
chore: complete week 5 audit
```

---

# Codex Global Instruction — Week 5

Paste this at the beginning of a fresh Codex session:

```text
You are implementing Week 5 of RoboPrep, a production-oriented Embodied AI interview preparation platform.

Week 1 established:
- Next.js App Router
- TypeScript
- Supabase
- authentication
- Apple-inspired design system

Week 2 established:
- Knowledge System
- topic hierarchy
- canonical questions

Week 3 established:
- Interview System
- interview rounds
- interview provenance

Week 4 established:
- Python coding problem list
- Monaco editor
- Run
- Submit
- hidden tests
- JudgeService abstraction
- judge provider adapter
- submission history
- solved state

Week 5 goal:
Differentiate RoboPrep from generic LeetCode by supporting Embodied AI / ML function-level coding evaluation.

Required evaluation modes:

1. program
   stdin → stdout

2. function
   controlled function call → structured checks

3. class
   instantiate class → method calls → structured checks

Required structured checks:

- correctness
- numerical comparison
- shape
- dtype
- gradient
- exception handling
- performance metadata where appropriate

Engineering rules:

1. Inspect the existing repository before modifying code.
2. Preserve all Week 1–4 functionality.
3. Keep Python-only support.
4. PyTorch support is CPU-only.
5. Do not add CUDA or GPU execution.
6. Never execute arbitrary user code directly inside the Next.js server process.
7. Keep execution providers isolated behind JudgeService.
8. Never expose hidden tests to the browser.
9. Never expose reference implementations to the browser.
10. Never expose hidden expected tensors or gradients.
11. Keep evaluator configuration server-authoritative.
12. Use deterministic random seeds.
13. Use strict TypeScript.
14. Validate evaluator JSON with Zod.
15. Reuse the existing topic taxonomy.
16. Reuse the existing coding editor/list/submission architecture.
17. Program-mode and ML-mode must coexist.
18. Do not build a parallel second coding system.
19. Avoid unnecessary dependencies.
20. Do not add large orchestration infrastructure this week.
21. Do not add AI code generation.
22. Do not add leaderboards or contests.
23. Run relevant lint/typecheck/test/build checks after each task.
24. Fix regressions introduced by your changes.
25. Summarize files changed, schema changes, evaluator architecture, security implications, commands run, and limitations.

Judge architecture:

Browser
→ RoboPrep Server
→ server-authoritative problem config
→ hidden tests
→ JudgeService
→ isolated evaluator
→ structured result
→ redacted client feedback

The client provides only:

- problem ID / slug
- source code

The client must not provide authoritative:

- hidden tests
- expected output
- resource limits
- final status
- evaluator configuration

Visual direction:

Coding is the densest RoboPrep surface, but should still feel restrained.

Use:
- clean editor layout
- compact evaluation metadata
- structured test feedback
- neutral colors
- explicit pass/fail text
- strong typography hierarchy

Avoid:
- neon IDE themes
- giant success animations
- cluttered tabs
- excessive gamification
```

---

# Week 5 Suggested Route Map

At the end of Week 5:

```text
/coding
/coding/[slug]
/coding/collections
/coding/collections/[slug]
/coding/progress
/coding/submissions/[id]
```

Examples:

```text
/coding/implement-layernorm
/coding/scaled-dot-product-attention
/coding/grpo-group-advantage
/coding/quaternion-slerp
/coding/ddpm-forward-noise
/coding/collections/transformer-essentials
/coding/collections/rl-post-training-core
/coding/collections/robotics-math-essentials
```

---

# Suggested Component Structure

```text
src/components/coding/

ml-result-panel.tsx
ml-check-results.tsx
evaluation-metadata.tsx
collection-card.tsx
collection-progress.tsx
coding-progress-overview.tsx
topic-progress.tsx
recent-submissions.tsx
```

Reuse Week 4 components:

```text
code-editor
coding-workspace
problem-statement
console-panel
judge-result
submission-history
```

---

# Suggested ML Judge Architecture

```text
Coding Problem
        │
        ├── evaluation_mode
        ├── framework
        ├── entrypoint
        ├── evaluator_config
        └── resource_profile
                │
                ▼
        Structured Test Cases
                │
                ▼
           JudgeService
                │
                ▼
        ML Python Evaluator
                │
        ┌───────┼────────┐
        │       │        │
        ▼       ▼        ▼
      Value    Shape   Gradient
        │       │        │
        └───────┴────────┘
                │
                ▼
         Aggregated Result
                │
                ▼
         Redacted Feedback
```

---

# Week 5 Product Principle

RoboPrep Coding should answer:

```text
Can this candidate actually implement
building blocks used in modern
Embodied AI systems?
```

Not only:

```text
Can this candidate solve generic
array and graph problems?
```

The long-term moat is:

```text
Real Interview Occurrence
        ↕
Canonical Coding Problem
        ↕
Embodied AI Topic
        ↕
Structured ML Evaluator
```

---

# Week 6 Handoff

Once Week 5 is accepted, Week 6 should focus on:

```text
Interview Submission + Content Ingestion Pipeline
```

Recommended Week 6 scope:

```text
Submit Interview form
raw interview storage
LLM-assisted extraction
question canonicalization suggestions
duplicate detection
topic classification
admin review queue
publish workflow
source provenance
moderation
```

Week 6 should make RoboPrep capable of continuously growing from new real interview data.
