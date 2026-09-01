-- ---------------------------------------------------------------------------
-- RoboPrep — Ingestion tables RLS + publish transaction (Week 6, Tasks 35/36,
-- 62, and Task 2 acceptance)
--
-- Draft/job/event/review tables hold raw user content and moderation state:
-- they have RLS enabled with no public policies. Only the service-role client
-- (server-only code) can read or write them.
--
-- publish_interview_draft converts a reviewed draft into the canonical
-- published graph in a single SQL transaction:
--   interviews → interview_rounds → interview_questions → question_topics
-- plus question_stats refresh (Task 62), submission/review-task updates, and
-- a publish_succeeded event. It is idempotent: once
-- interview_drafts.published_interview_id is set, repeated calls return the
-- same interview instead of duplicating rows (Task 36).
-- ---------------------------------------------------------------------------

begin;

alter table public.interview_drafts enable row level security;
alter table public.interview_round_drafts enable row level security;
alter table public.interview_question_drafts enable row level security;
alter table public.ingestion_jobs enable row level security;
alter table public.ingestion_events enable row level security;
alter table public.review_tasks enable row level security;

-- No policies granted: anon/authenticated have no access. Service role bypasses RLS.

-- --------------------------------------------------------------------------
-- publish transaction
-- --------------------------------------------------------------------------

create or replace function public.publish_interview_draft(
  p_draft_id uuid,
  p_company_id uuid,
  p_position_id uuid default null,
  p_slug text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draft public.interview_drafts%rowtype;
  v_submission public.interview_submissions%rowtype;
  v_interview_id uuid;
  v_question_id uuid;
  v_round public.interview_round_drafts%rowtype;
  v_question public.interview_question_drafts%rowtype;
  v_round_number integer;
  v_published_count integer;
  v_canonical jsonb;
begin
  -- Idempotency (Task 36): already published → return the existing interview.
  select * into v_draft from public.interview_drafts where id = p_draft_id;
  if not found then
    raise exception 'draft % not found', p_draft_id;
  end if;
  if v_draft.published_interview_id is not null then
    return v_draft.published_interview_id;
  end if;
  if v_draft.status <> 'approved' then
    raise exception 'draft % is not approved for publish (status=%)', p_draft_id, v_draft.status;
  end if;

  select * into v_submission from public.interview_submissions where id = v_draft.submission_id;
  if not found then
    raise exception 'submission % not found', v_draft.submission_id;
  end if;

  -- Publish validation gate (Task 77): company must resolve, at least one
  -- accepted question, orderings valid.
  if p_company_id is null then
    raise exception 'publish requires a resolved company';
  end if;
  if not exists (select 1 from public.companies where id = p_company_id) then
    raise exception 'company % does not exist', p_company_id;
  end if;

  -- Accepted questions; repeated canonical links collapse to the first
  -- occurrence so the interviews unique (interview_id, question_id) holds.
  drop table if exists publish_questions;
  create temp table publish_questions on commit drop as
    select q.*, row_number() over (order by q.order_index) as seq
    from (
      select distinct on (coalesce(candidate_question_id, id))
        *
      from public.interview_question_drafts
      where draft_id = p_draft_id
        and review_status in ('accepted', 'edited', 'new_canonical')
      order by coalesce(candidate_question_id, id), order_index
    ) q;

  if not exists (select 1 from publish_questions) then
    raise exception 'draft % has no accepted questions', p_draft_id;
  end if;

  -- Interview row.
  insert into public.interviews (
    company_id, position_id, year, season, location, interview_type,
    source_type, source_url, status, created_at, updated_at, verified_at,
    title, slug, round_count, experience_level, employment_type,
    application_stage, summary, language, is_anonymous, published_at,
    source_submission_id
  ) values (
    p_company_id, p_position_id, coalesce(v_draft.year, date_part('year', now())::int),
    v_draft.season, v_draft.location, v_draft.interview_type,
    case when v_submission.submission_type = 'user_text' then 'community' else v_submission.submission_type end,
    v_submission.source_url, 'published', now(), now(), now(),
    coalesce(v_submission.position_hint, v_draft.position_title, 'Interview experience'),
    p_slug, (select count(*)::int from public.interview_round_drafts where draft_id = p_draft_id),
    v_draft.experience_level, v_draft.employment_type,
    'mixed', v_draft.summary, v_submission.language, true, now(),
    v_draft.submission_id
  ) returning id into v_interview_id;

  -- Rounds.
  for v_round in
    select * from public.interview_round_drafts where draft_id = p_draft_id order by order_index
  loop
    insert into public.interview_rounds (
      interview_id, round_number, title, round_type, duration_minutes,
      interviewer_role, summary
    ) values (
      v_interview_id,
      coalesce(v_round.round_number, v_round.order_index),
      v_round.title, v_round.round_type, v_round.duration_minutes,
      v_round.interviewer_role, v_round.summary
    );
  end loop;

  -- Questions: occurrences with canonical links, plus new canonical questions.
  for v_question in
    select * from publish_questions order by seq
  loop
    if v_question.candidate_question_id is not null then
      v_question_id := v_question.candidate_question_id;
    elsif v_question.review_status = 'new_canonical' and v_question.new_canonical is not null then
      v_canonical := v_question.new_canonical;

      insert into public.questions (title, slug, question_type, difficulty, summary, is_published)
      values (
        v_canonical->>'title',
        coalesce(v_canonical->>'slug', 'question-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
        coalesce(v_canonical->>'question_type', 'knowledge'),
        nullif(v_canonical->>'difficulty', ''),
        nullif(v_canonical->>'summary', ''),
        true
      )
      on conflict (slug) do update set updated_at = now()
      returning id into v_question_id;

      -- Topic links for the new canonical, validated against the taxonomy.
      insert into public.question_topics (question_id, topic_id)
      select v_question_id, t.id
      from jsonb_array_elements_text(coalesce(v_canonical->'topic_ids', '[]'::jsonb)) as topic_id,
           public.topics t
      where t.id::text = topic_id
      on conflict do nothing;
    else
      -- Accepted/edited without a canonical link: keep the occurrence without
      -- a canonical question (question_id is nullable since Week 3).
      v_question_id := null;
    end if;

    v_round_number := (
      select coalesce(r.round_number, r.order_index)
      from public.interview_round_drafts r
      where r.id = v_question.round_draft_id
    );

    if v_question_id is not null then
      insert into public.interview_questions (
        interview_id, question_id, round_number, order_index,
        original_wording, difficulty
      ) values (
        v_interview_id, v_question_id, v_round_number, v_question.order_index,
        v_question.original_wording, v_question.difficulty
      ) on conflict do nothing;
    else
      insert into public.interview_questions (
        interview_id, round_number, order_index, original_wording, difficulty
      ) values (
        v_interview_id, v_round_number, v_question.order_index,
        v_question.original_wording, v_question.difficulty
      );
    end if;
  end loop;

  -- Question stats refresh (Task 62): recompute occurrence-derived columns for
  -- every canonical question referenced by this interview.
  for v_question_id in
    select distinct iq.question_id
    from public.interview_questions iq
    where iq.interview_id = v_interview_id and iq.question_id is not null
  loop
    insert into public.question_stats (
      question_id, interview_count, company_count, last_seen_at, updated_at
    )
    select
      v_question_id,
      (select count(distinct iq.interview_id) from public.interview_questions iq where iq.question_id = v_question_id),
      (select count(distinct i.company_id)
         from public.interview_questions iq
         join public.interviews i on i.id = iq.interview_id
        where iq.question_id = v_question_id),
      (select max(i.published_at) from public.interview_questions iq
         join public.interviews i on i.id = iq.interview_id
        where iq.question_id = v_question_id),
      now()
    on conflict (question_id) do update
      set interview_count = excluded.interview_count,
          company_count = excluded.company_count,
          last_seen_at = excluded.last_seen_at,
          updated_at = now();
  end loop;

  -- Publish events (append-only).
  insert into public.ingestion_events (submission_id, event_type, message, metadata)
  values (
    v_draft.submission_id, 'publish_succeeded',
    'interview published', jsonb_build_object('interview_id', v_interview_id, 'draft_id', p_draft_id)
  );

  update public.interview_drafts
    set status = 'published',
        published_interview_id = v_interview_id,
        updated_at = now()
    where id = p_draft_id;

  update public.interview_submissions
    set status = 'published', processed_at = now(), updated_at = now()
    where id = v_draft.submission_id;

  update public.review_tasks
    set status = 'approved', completed_at = now(), updated_at = now()
    where submission_id = v_draft.submission_id;

  return v_interview_id;
end;
$$;

revoke all on function public.publish_interview_draft(uuid, uuid, uuid, text) from public, anon, authenticated;

commit;
