# Interview submission privacy

What RoboPrep stores, who can see it, and what ever becomes public.

## Raw submission storage

- Raw text is an **immutable source record** (`interview_submissions.raw_text`).
  Parsing, review, and publishing all happen in separate tables; nothing ever
  overwrites the raw text.
- Users create and read only their own submissions (RLS:
  `submissions_insert_own` / `submissions_select_own`). There are no
  update/delete policies for users — the record is immutable once created.
- All reviewer/admin access goes through server-only service-role code; the
  service-role key never reaches the browser.

## Public vs private fields

| Field | Visibility |
| --- | --- |
| Company/position/year/season hints | Private (input hints); parsed versions become public only after review + publish |
| Raw text | Private, forever. Never rendered publicly |
| Moderation flags (PII/spam counts) | Private — stored as type + count only, never the matched content |
| Review notes / rejection reasons | Internal only; the user sees a neutral status message |
| Parser provider/model/versions | Internal audit metadata |
| Published interview content | Public after human review |

## PII handling

1. Before review/publish, the submission is scanned for emails, phone
   numbers, messaging handles, and spam markers. Flags are counts — no content.
2. The text sent to the LLM parser is the **redacted** version
   (`redactContactInfo`), so contact info never leaves RoboPrep's server.
3. Raw text is never mutated. If reviewers publish, they publish the parsed
   rounds/questions — not the raw dump.
4. The submission form explicitly asks users not to include contact info.

## Source URL policy

- Only `http(s)` URLs pass intake validation (`javascript:`, `data:`, and
  malformed URLs are rejected at the API boundary).
- The raw URL is stored internally. Public display of a source link is
  reviewer-controlled: the published interview row carries the URL, and the
  source panel renders it as a plain link only for community/public_source
  submissions.

## Submitter anonymity

- Published interviews are always `is_anonymous = true` for community
  submissions. Public pages show at most "Community submission".
- `interviews.source_submission_id` preserves provenance **internally** so
  admins can trace published content to the raw submission and reviewer
  decisions. It is never exposed through public projections, and the
  submitter's user id/email is not copied onto the interview row.
- Even admins see raw text only in the review detail; it is excluded from the
  queue list view.

## Moderation notes

- Reviewer notes and structured rejection reasons live on
  `interview_submissions.review_notes` / `review_tasks.review_notes`
  (service-role tables only).
- The user-facing status page maps internal states to friendly labels
  (Received / Processing / Under review / Approved / Published / Needs
  attention / Not published). Internal error codes (`provider 429`,
  `schema_mismatch`, …) never reach the user.
