# Question extraction guidelines

These rules drive both the parser prompt (`src/lib/ingestion/parser/prompts.ts`)
and human reviewers. The goal is a canonical Knowledge graph free of
fragmentation: extracted occurrences preserve *what was actually asked*;
canonical questions carry the *reusable concept*.

## Extraction rules

1. **Extract actual questions.** A line qualifies when an interviewer asked
   the candidate something — including imperative coding prompts ("写一个
   LayerNorm").
2. **Do not turn answers into questions.** The candidate's response is
   context, not an occurrence.
3. **Preserve follow-ups.** "追问：那如果不加 mask 会怎样？" is its own
   occurrence linked to the same round — follow-ups are real interview
   content.
4. **Separate distinct technical questions.** One conversational sentence
   covering two topics becomes two occurrences when the topics are clearly
   distinct.
5. **Avoid splitting trivial fragments.** "好的", "嗯", "我们开始吧" are not
   occurrences.
6. **Mark coding tasks distinctly** (`question_type = "coding"`): signals are
   实现 / 手写 / 手搓 / 写一个 / implement / write / coding / algorithm /
   function/class. The reviewer can always override.
7. **Round structure**: explicit "第 N 轮 / Round N" headings create rounds.
   If the text does not clearly distinguish rounds, emit ONE round with
   `round_type = "unknown"` and lower confidence — never invent round numbers.
8. **Original wording is immutable.** `normalized_text` is a cleaned,
   self-contained version for matching only.
9. **No canonical IDs from the parser.** Canonical linking is a reviewer
   decision informed by candidate scores.

## Normalization (for matching only)

- lowercase, strip punctuation/whitespace noise
- remove conversational filler ("请问", "面试官问我", "这个问题")
- collapse repeated mentions of the same question within one submission;
  keep distinct follow-ups

## Reviewer expectations

- The canonical match score is a *suggestion*: ≥ 0.90 strong, 0.70–0.90
  possible, < 0.70 weak (hidden from the UI).
- Creating a new canonical question requires only a title (+ optional
  type/summary/topics); Knowledge content can be enriched later.
- Rejected occurrences are excluded from publish but stay auditable in the
  draft.
