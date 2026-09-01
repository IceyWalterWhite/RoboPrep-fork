-- ---------------------------------------------------------------------------
-- RoboPrep — deterministic development seed
--
-- Applied automatically by `supabase db reset` (see supabase/config.toml).
-- Small on purpose: just enough to render realistic placeholder pages.
--
--   companies            7
--   positions            5
--   topics              14 (hierarchical)
--   questions           10 canonical
--   interviews           3 published
--   interview_questions 12
-- ---------------------------------------------------------------------------

begin;

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------

insert into public.companies (id, name, slug, country, industry, description) values
  ('c1000000-0000-4000-8000-000000000001', 'ByteDance',     'bytedance',             'CN', 'Internet / AI',       'Consumer internet company with an embodied AI research group (GR-3, Robix).'),
  ('c1000000-0000-4000-8000-000000000002', 'NVIDIA',        'nvidia',                'US', 'Semiconductors / AI', 'GPU platforms and robotics stacks including Isaac, GR00T and Jetson.'),
  ('c1000000-0000-4000-8000-000000000003', 'Physical Intelligence', 'physical-intelligence', 'US', 'Robotics / AI', 'Builds generalist robot foundation models such as pi0 and pi0-FAST.'),
  ('c1000000-0000-4000-8000-000000000004', 'Figure AI',     'figure-ai',             'US', 'Robotics',            'Humanoid robots for general-purpose labour, powered by the Helmsman VLA model.'),
  ('c1000000-0000-4000-8000-000000000005', 'Unitree',       'unitree',               'CN', 'Robotics',            'Quadruped and humanoid robots widely used as research hardware platforms.'),
  ('c1000000-0000-4000-8000-000000000006', 'AgiBot',        'agibot',                'CN', 'Robotics / AI',       'Embodied AI company building the Zhiyuan humanoid series and GO-1 model.'),
  ('c1000000-0000-4000-8000-000000000007', 'DJI',           'dji',                   'CN', 'Robotics',            'Consumer and enterprise drones, onboard perception and flight control.');

-- ---------------------------------------------------------------------------
-- positions
-- ---------------------------------------------------------------------------

insert into public.positions (id, company_id, title, slug, category, location) values
  ('a1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'Embodied AI Algorithm Engineer', 'embodied-ai-algorithm-engineer', 'Algorithm',  'Beijing / Shenzhen'),
  ('a1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', 'Robotics Systems Engineer',      'robotics-systems-engineer',      'Systems',    'Santa Clara, CA'),
  ('a1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000003', 'Embodied AI Research Scientist', 'embodied-ai-research-scientist', 'Research',   'San Francisco, CA'),
  ('a1000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000004', 'VLA Model Engineer',             'vla-model-engineer',             'Model',      'Sunnyvale, CA'),
  ('a1000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000006', 'Robot Learning Engineer',        'robot-learning-engineer',        'Robot Learning', 'Shanghai');

insert into public.positions (id, company_id, title, slug, category, location) values
  ('a1000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000005', 'Robot Learning Intern', 'robot-learning-intern', 'Robot Learning', 'Hangzhou'),
  ('a1000000-0000-4000-8000-000000000007', 'c1000000-0000-4000-8000-000000000007', 'Perception Algorithm Engineer', 'perception-algorithm-engineer', 'Perception', 'Shenzhen'),
  ('a1000000-0000-4000-8000-000000000008', 'c1000000-0000-4000-8000-000000000003', 'VLA Research Intern', 'vla-research-intern', 'Research', 'San Francisco, CA'),
  ('a1000000-0000-4000-8000-000000000009', 'c1000000-0000-4000-8000-000000000004', 'Humanoid Learning Engineer', 'humanoid-learning-engineer', 'Robot Learning', 'Sunnyvale, CA'),
  ('a1000000-0000-4000-8000-000000000010', 'c1000000-0000-4000-8000-000000000006', 'Robot Learning New Grad', 'robot-learning-new-grad', 'Robot Learning', 'Shanghai'),
  ('a1000000-0000-4000-8000-000000000011', 'c1000000-0000-4000-8000-000000000002', 'Robot Learning Intern', 'robot-learning-intern', 'Research', 'Santa Clara, CA'),
  ('a1000000-0000-4000-8000-000000000012', 'c1000000-0000-4000-8000-000000000001', 'VLA Research Intern', 'vla-research-intern', 'Research', 'Beijing');

-- ---------------------------------------------------------------------------
-- topics
-- ---------------------------------------------------------------------------

insert into public.topics (id, name, slug, parent_id, description) values
  ('d1000000-0000-4000-8000-000000000001', 'Embodied AI',      'embodied-ai',      null,                                 'Agents that perceive, reason and act in the physical world.'),
  ('d1000000-0000-4000-8000-000000000002', 'Transformer',      'transformer',      null,                                 'Attention-only sequence architecture used across vision, language and control.'),
  ('d1000000-0000-4000-8000-000000000003', 'Attention',        'attention',        'd1000000-0000-4000-8000-000000000002', 'Content-based weighted pooling over a set of value vectors.'),
  ('d1000000-0000-4000-8000-000000000004', 'QKV',              'qkv',              'd1000000-0000-4000-8000-000000000003', 'Query, Key and Value projections inside scaled dot-product attention.'),
  ('d1000000-0000-4000-8000-000000000005', 'KV Cache',         'kv-cache',         'd1000000-0000-4000-8000-000000000003', 'Reuse of past key/value tensors to make autoregressive decoding cheap.'),
  ('d1000000-0000-4000-8000-000000000006', 'VLA',              'vla',              'd1000000-0000-4000-8000-000000000001', 'Vision-Language-Action models that map observations plus instructions to robot actions.'),
  ('d1000000-0000-4000-8000-000000000007', 'World Model',      'world-model',      'd1000000-0000-4000-8000-000000000001', 'Learned dynamics model used for prediction, planning or data generation.'),
  ('d1000000-0000-4000-8000-000000000008', 'Diffusion Policy', 'diffusion-policy', 'd1000000-0000-4000-8000-000000000001', 'Action generation by iterative denoising of a trajectory.'),
  ('d1000000-0000-4000-8000-000000000009', 'RL',               'rl',               'd1000000-0000-4000-8000-000000000001', 'Reinforcement learning: optimising behaviour from reward signals.'),
  ('d1000000-0000-4000-8000-000000000010', 'PPO',              'ppo',              'd1000000-0000-4000-8000-000000000009', 'On-policy policy-gradient method with a clipped surrogate objective.'),
  ('d1000000-0000-4000-8000-000000000011', 'GRPO',             'grpo',             'd1000000-0000-4000-8000-000000000009', 'Group Relative Policy Optimisation — critic-free relative advantage.'),
  ('d1000000-0000-4000-8000-000000000012', 'Robotics',         'robotics',         'd1000000-0000-4000-8000-000000000001', 'Kinematics, dynamics, control and hardware-in-the-loop concerns.'),
  ('d1000000-0000-4000-8000-000000000013', 'Robot Data',       'robot-data',       'd1000000-0000-4000-8000-000000000012', 'Teleoperation, collection, cleaning and curation of robot trajectories.'),
  ('d1000000-0000-4000-8000-000000000014', 'SE(3)',            'se3',              'd1000000-0000-4000-8000-000000000012', 'Special Euclidean group of rigid rotations and translations in 3D.');

-- ---------------------------------------------------------------------------
-- questions (canonical)
-- ---------------------------------------------------------------------------

insert into public.questions (id, title, slug, question_type, difficulty, summary, canonical_answer, deep_answer) values
  (
    'f1000000-0000-4000-8000-000000000001',
    'What are Q, K and V in attention?',
    'what-are-q-k-and-v-in-attention',
    'knowledge', 'easy',
    'Queries ask, keys index, values carry the content that gets pooled.',
    'Given input embeddings X, attention learns three linear projections: Q = XW_Q, K = XW_K, V = XW_V. The query is the vector that is looking for information, the key is the label each token advertises for matching, and the value is the payload that actually gets mixed. Scores are computed as QK^T / sqrt(d_k), softmaxed, and used to take a weighted sum of V. So keys decide *how much* of each value to take; values decide *what* is taken.',
    'Matched content is separated from matching itself: if attention averaged the inputs directly, a token could only attend in proportion to how similar its own embedding is to others. Splitting into K and V lets the model learn "this is the kind of thing I am looking for" (K) independently from "this is what I will contribute once selected" (V). In multi-head attention each head gets its own W_Q, W_K, W_V with d_k = d_model / h, so different heads can attend to different relations (syntax, coreference, geometry). In cross-attention — the mechanism behind VLA conditioning — Q comes from the decoder/action stream while K and V come from the observation or language encoder, which is exactly why the asymmetry matters.'
  ),
  (
    'f1000000-0000-4000-8000-000000000002',
    'Why is KV Cache useful?',
    'why-is-kv-cache-useful',
    'knowledge', 'medium',
    'It trades memory for compute by storing past keys and values so each new token only attends to itself plus history.',
    'Autoregressive decoding recomputes attention over the whole prefix at every step. Naively that is O(n^2) work for a sequence of length n. But the key/value tensors of earlier tokens never change once produced, so they can be cached and reused. Each new token then only needs to compute its own Q, K, V and attend against the cached K/V: O(n) per step instead of O(n^2), at the cost of O(n) extra memory.',
    'The cost is memory bandwidth, not FLOPs, once the cache is large: decoding becomes a bandwidth-bound gather over (layers x heads x seq x d_k) tensors. That is why techniques like multi-query attention, grouped-query attention and KV-cache quantisation exist — they shrink the cache rather than the compute. For robots the stakes are concrete: a VLA running at 10-50 Hz on an onboard GPU has a hard latency budget, and if the observation history is long the cache, not the policy, is usually what blows the budget. Practical mitigations are chunked prompts, sliding-window attention over recent frames, and quantising KV to int8.'
  ),
  (
    'f1000000-0000-4000-8000-000000000003',
    'What is the difference between PPO and GRPO?',
    'difference-between-ppo-and-grpo',
    'knowledge', 'hard',
    'PPO scores actions against a learned critic; GRPO scores them against the average of a sampled group.',
    'PPO estimates advantage with a value network (critic) and generalised advantage estimation: A = GAE(rewards, V(s)). GRPO removes the critic entirely. For each prompt it samples a group of G outputs, scores them with a reward model or verifier, and normalises within the group: A_i = (r_i - mean(r)) / std(r). The policy is then updated with a PPO-style clipped objective (plus a KL term) using those relative advantages.',
    'The practical difference is cost and variance. Dropping the critic saves a second model of roughly policy size — its parameters, its optimiser state and its forward/backward pass — which matters a lot when the policy is a 7B+ VLA. The trade-off is that group-relative advantage is a noisier baseline than a fitted value function, so GRPO needs a reasonably large group (often 8-16) and benefits from verifiable rewards where correctness is unambiguous. PPO still wins when reward is dense and shaped, when sample efficiency dominates, or when you already maintain a critic for other reasons. In an interview it is worth adding that GRPO is not a new objective so much as PPO with a different advantage estimator.'
  ),
  (
    'f1000000-0000-4000-8000-000000000004',
    'Why does GRPO not require a critic?',
    'why-does-grpo-not-require-a-critic',
    'knowledge', 'hard',
    'Because the group mean of sampled rewards is itself a baseline for the advantage.',
    'Advantage only needs a baseline that is independent of the action being scored: A(s, a) = Q(s, a) - b(s). A learned critic V(s) is one choice of b(s). GRPO instead samples G outputs for the same prompt and uses their empirical mean reward as b(s). Since every sample in the group shares the same prompt, the mean is a valid, action-independent baseline — and it needs no extra network, no value loss and no GAE.',
    'What you give up is variance reduction. A fitted critic baselines against the *expected* return, so it can explain away how hard the prompt was; a group of G samples only estimates that expectation from G draws, and with G small the estimate is noisy. Dividing by the group std sharpens the signal but can blow up when all samples score alike (std near zero), which is why implementations clip or skip degenerate groups. This is also why GRPO became popular for verifiable tasks (math, code, unit-tested robotic subroutines) where reward is cheap and dense enough to sample many completions per prompt.'
  ),
  (
    'f1000000-0000-4000-8000-000000000005',
    'What is action chunking?',
    'what-is-action-chunking',
    'knowledge', 'medium',
    'Predicting a short sequence of future actions at once, then executing them open-loop before re-planning.',
    'Instead of mapping one observation to one action, the policy outputs a chunk of H actions a_t..a_{t+H-1}. The robot executes the chunk (often with smoothing) and re-observes. Chunking removes the strong temporal correlation between adjacent single-step predictions, shortens the effective horizon for credit assignment, and amortises one expensive forward pass over H control steps.',
    'Three consequences matter in practice. First, latency: a big model that cannot run at 50 Hz can still control at 50 Hz if it re-plans every 0.5 s and executes the chunk, which is exactly why ACT and pi0-FAST chunk. Second, compounding error: fewer re-planning events means fewer opportunities for the policy to react to drift, so chunks that are too long hurt on contact-rich tasks. Third, execution smoothness: consecutive chunks must be reconciled, usually by temporal ensembling or exponential smoothing across overlapping predictions. Interviewers often follow up on the chunk length trade-off — small H is reactive but jittery, large H is smooth but brittle.'
  ),
  (
    'f1000000-0000-4000-8000-000000000006',
    'What is Diffusion Policy?',
    'what-is-diffusion-policy',
    'knowledge', 'medium',
    'A visuomotor policy that generates action trajectories by iterative denoising.',
    'Diffusion Policy treats action generation as conditional denoising. A trajectory of H actions is initialised as Gaussian noise, then a denoising network eps_theta(a^k, k | o) — conditioned on observations o, often via a visual encoder — iteratively removes noise over K steps. Training is the standard DDPM objective: sample a clean trajectory, add noise at level k, predict the noise. At inference the denoised chunk is executed, possibly with receding-horizon control.',
    'Its appeal for robotics is representational: behaviour cloning with a deterministic MSE head must commit to one action, which on multimodal demonstrations collapses to the average of several valid strategies. A diffusion head can represent the whole mode set and still sample one concrete trajectory. It also extends naturally to score-based and energy-based conditioning and to inpainting constraints such as fixed start or goal states. The costs are inference latency (K denoising steps per decision, mitigated by DDIM samplers and distillation into one-step policies) and sensitivity to the noise schedule. Follow-ups worth preparing: how it compares to ACT (chunked transformers with a deterministic head) and to flow matching, which trains a continuous velocity field and typically needs fewer sampling steps.'
  ),
  (
    'f1000000-0000-4000-8000-000000000007',
    'What is a Vision-Language-Action model?',
    'what-is-a-vision-language-action-model',
    'knowledge', 'medium',
    'A model that takes images plus a language instruction and outputs robot actions.',
    'A VLA extends a vision-language model with an action head. Observations from one or more cameras are encoded into visual tokens, the instruction is tokenised, and a pretrained VLM backbone fuses them. A separate action expert — often a smaller transformer or a flow/diffusion head — maps the fused representation to continuous or discretised actions, and is trained on robot demonstration data.',
    'The motivation is transfer: pretraining on web-scale image-text data gives the backbone semantics ("a red mug on the left") that would take enormous robot data to learn from scratch. Design choices interviewers probe include continuous vs discretised actions (FAST tokenisers discretise action deltas, which lets the policy reuse the language modelling head and train with plain cross-entropy), single vs multiple camera views, proprioception and action chunking, and cross-embodiment training where different robots share the backbone with embodiment-specific action heads. The honest limitations to name: closed-loop latency, poor depth and force sensing from RGB alone, and the gap between semantic understanding and precise contact-rich manipulation.'
  ),
  (
    'f1000000-0000-4000-8000-000000000008',
    'What is an action-conditioned world model?',
    'what-is-an-action-conditioned-world-model',
    'knowledge', 'hard',
    'A learned dynamics model that predicts future observations given current state and a candidate action.',
    'Formally it approximates p(o_{t+1} | o_{t-k..t}, a_t..a_{t+H-1}). The model is trained on trajectories and, unlike a policy, it is queried: you propose an action sequence and ask what the world would look like. That makes it usable for model-predictive control (sample or optimise action sequences, score their imagined rollouts, execute the best first step), for planning, and for generating synthetic training data.',
    'The key design question is the latent space: pixel-space prediction is easy to supervise but wastes capacity on texture, whereas latent-space prediction (as in Dreamer-style RSSMs) is compact and cheap to roll out but needs a well-regularised latent or it collapses. The known failure mode is model exploitation — the optimiser finds action sequences the model *thinks* are good because they land in regions where the model is confidently wrong, which is why rollouts are kept short and combined with real interaction. For embodied AI specifically, world models are attractive because they promise to amortise expensive robot data: learn dynamics from large passive video, then plan with only a small amount of action-labelled data.'
  ),
  (
    'f1000000-0000-4000-8000-000000000009',
    'What is SE(3)?',
    'what-is-se3',
    'knowledge', 'medium',
    'The Special Euclidean group in 3D: all rigid-body poses — 3D rotation plus 3D translation.',
    'SE(3) is the group of transformations x -> Rx + t with R in SO(3) and t in R^3, six degrees of freedom. It is represented as a 4x4 homogeneous matrix [[R, t], [0, 1]], which makes composition a matrix product and makes it easy to chain transforms along a kinematic tree.',
    'Two things matter in robotics. Rotation parameterisation: SO(3) is a curved manifold, so representing orientation with 3 numbers (Euler angles) introduces singularities and non-Euclidean interpolation; quaternions, rotation matrices and the Lie algebra se(3) (6D twists, mapped by the exponential) are the usual fixes, and the choice of representation measurably changes how well a policy learns. Second, equivariance: because SE(3) is the symmetry group of rigid motion, models built to be SE(3)-equivariant generalise across object poses and camera viewpoints instead of memorising them — which is why equivariant and frame-canonicalising architectures show up in modern manipulation work. A good answer mentions that poses need a reference frame: SE(3) transforms are only meaningful relative to the frame they are expressed in.'
  ),
  (
    'f1000000-0000-4000-8000-000000000010',
    'What are the main stages of a robot data collection pipeline?',
    'stages-of-robot-data-collection-pipeline',
    'knowledge', 'medium',
    'Task definition, teleoperation capture, synchronisation, cleaning and labelling, curation, then training-time mixing.',
    '1) Task and embodiment definition — what is being demonstrated, on which hardware, with what success criterion. 2) Capture — teleoperation (leader-follower arms, VR or motion-capture controllers, exoskeletons) recorded at a fixed control rate, logging joint states, end-effector poses, camera streams, force/torque and gripper state. 3) Synchronisation and calibration — hardware timestamps, camera intrinsics and extrinsics, hand-eye calibration. 4) Cleaning — dropping failed or idle segments, trimming to the contact-relevant window, resampling, handling dropped frames. 5) Annotation — language instructions, sub-task segmentation, success labels, sometimes keypoints or affordances. 6) Curation and mixing — balancing task and scene diversity, deduplicating near-identical trajectories, and deciding the ratio of robot data to simulation or human video.',
    'The parts interviewers care about are the failure modes. Hardware drift and re-calibration silently invalidate collected data, so versioning each collection session with its calibration is essential. Teleoperation is the throughput bottleneck, which is why the field leans on cross-embodiment datasets, simulation augmentation and human video pretraining. Demonstration quality dominates quantity: a smaller set of consistent, smooth, successful trajectories usually beats a large noisy set, because behavioural cloning fits the noise as readily as the skill. Finally, the dataset contract matters — action and observation spaces must be pinned down per embodiment, or data collected this month will not train next quarter''s policy.'
  );

-- ---------------------------------------------------------------------------
-- interviews (published)
-- ---------------------------------------------------------------------------

insert into public.interviews (id, company_id, position_id, year, season, location, interview_type, source_type, status, verified_at) values
  ('ea000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003', 2025, 'Spring', 'San Francisco, CA', 'onsite', 'candidate_report', 'published', timezone('utc', now())),
  ('ea000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 2025, 'Summer', 'Santa Clara, CA',   'onsite', 'candidate_report', 'published', timezone('utc', now())),
  ('ea000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 2024, 'Autumn', 'Beijing',           'virtual', 'candidate_report', 'published', timezone('utc', now()));

update public.interviews set source_type = 'development_seed', verified_at = null, title = 'Embodied AI Research Scientist Interview — 2025 Spring', slug = 'physical-intelligence-embodied-ai-research-scientist-2025-spring', round_count = 2, duration_minutes = 90, experience_level = 'experienced', employment_type = 'full_time', application_stage = 'mixed', summary = 'A development example covering action chunking, diffusion policies, VLA design, and world models.', difficulty_overall = 'hard', language = 'en', is_anonymous = true, quality_score = 72, published_at = timezone('utc', now()) - interval '90 days' where id = 'ea000000-0000-4000-8000-000000000001';
update public.interviews set source_type = 'development_seed', verified_at = null, title = 'NVIDIA Robotics Systems Engineer Interview — 2025 Summer', slug = 'nvidia-robotics-systems-engineer-2025-summer', round_count = 3, duration_minutes = 135, experience_level = 'experienced', employment_type = 'full_time', application_stage = 'technical', summary = 'A development example focused on attention systems, inference latency, SE(3), and robot data pipelines.', difficulty_overall = 'hard', language = 'en', is_anonymous = true, quality_score = 72, published_at = timezone('utc', now()) - interval '120 days' where id = 'ea000000-0000-4000-8000-000000000002';
update public.interviews set source_type = 'development_seed', verified_at = null, title = 'ByteDance Embodied AI Algorithm Engineer Interview — 2024 Autumn', slug = 'bytedance-embodied-ai-algorithm-engineer-2024-autumn', round_count = 2, duration_minutes = 90, experience_level = 'experienced', employment_type = 'full_time', application_stage = 'technical', summary = 'A development example on PPO versus GRPO, VLA semantics, action chunking, and control-loop budgets.', difficulty_overall = 'hard', language = 'en', is_anonymous = true, quality_score = 72, published_at = timezone('utc', now()) - interval '150 days' where id = 'ea000000-0000-4000-8000-000000000003';

insert into public.interviews (
  id, company_id, position_id, year, season, location, interview_type,
  source_type, status, verified_at, title, slug, round_count,
  duration_minutes, experience_level, employment_type, application_stage,
  summary, difficulty_overall, language, is_anonymous, quality_score, published_at
) values
  ('ea000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000012', 2027, 'Spring', 'Beijing', 'structured_report', 'development_seed', 'published', null, 'VLA Research Intern Interview — 2027 Spring', 'bytedance-vla-research-intern-2027-spring', 3, 135, 'intern', 'internship', 'onsite', 'VLA and reinforcement-learning discussion followed by a coding exercise.', 'hard', 'zh-CN', true, 72, timezone('utc', now()) - interval '8 days'),
  ('ea000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000011', 2026, 'Fall', 'Santa Clara, CA', 'structured_report', 'development_seed', 'published', null, 'Robot Learning Intern Interview — 2026 Fall', 'nvidia-robot-learning-intern-2026-fall', 2, 90, 'intern', 'internship', 'technical', 'A development example about attention, robot data, and implementing a small control utility.', 'medium', 'zh-CN', true, 72, timezone('utc', now()) - interval '14 days'),
  ('ea000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000008', 2027, 'Winter', 'San Francisco, CA', 'structured_report', 'development_seed', 'published', null, 'VLA Research Intern Interview — 2027 Winter', 'physical-intelligence-vla-research-intern-2027-winter', 4, 180, 'intern', 'internship', 'mixed', 'A development example covering diffusion policy, action chunking, world models, and data quality.', 'hard', 'zh-CN', true, 72, timezone('utc', now()) - interval '20 days'),
  ('ea000000-0000-4000-8000-000000000007', 'c1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000009', 2027, 'Spring', 'Sunnyvale, CA', 'structured_report', 'development_seed', 'published', null, 'Humanoid Learning Engineer Interview — 2027 Spring', 'figure-ai-humanoid-learning-engineer-2027-spring', 3, 135, 'experienced', 'full_time', 'onsite', 'A development example on VLA architecture, robot data, and rigid-body representations.', 'hard', 'zh-CN', true, 72, timezone('utc', now()) - interval '27 days'),
  ('ea000000-0000-4000-8000-000000000008', 'c1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000006', 2026, 'Summer', 'Hangzhou', 'structured_report', 'development_seed', 'published', null, 'Robot Learning Intern Interview — 2026 Summer', 'unitree-robot-learning-intern-2026-summer', 2, 90, 'intern', 'internship', 'technical', 'A development example focused on action chunks, SE(3), and collecting clean demonstrations.', 'medium', 'zh-CN', true, 72, timezone('utc', now()) - interval '34 days'),
  ('ea000000-0000-4000-8000-000000000009', 'c1000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000005', 2027, 'Spring', 'Shanghai', 'structured_report', 'development_seed', 'published', null, 'Robot Learning New Grad Interview — 2027 Spring', 'agibot-robot-learning-new-grad-2027-spring', 3, 135, 'new_grad', 'full_time', 'mixed', 'A development example about critic-free policy optimisation, VLA grounding, and data curation.', 'hard', 'zh-CN', true, 72, timezone('utc', now()) - interval '41 days'),
  ('ea000000-0000-4000-8000-000000000010', 'c1000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000007', 2026, 'Autumn', 'Shenzhen', 'structured_report', 'development_seed', 'published', null, 'Perception Algorithm Engineer Interview — 2026 Autumn', 'dji-perception-algorithm-engineer-2026-autumn', 2, 90, 'experienced', 'full_time', 'technical', 'A development example combining attention, SE(3), and practical perception-system trade-offs.', 'medium', 'zh-CN', true, 72, timezone('utc', now()) - interval '48 days'),
  ('ea000000-0000-4000-8000-000000000011', 'c1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 2026, 'Summer', 'Beijing', 'structured_report', 'development_seed', 'published', null, 'Embodied AI Algorithm Engineer Interview — 2026 Summer', 'bytedance-embodied-ai-algorithm-engineer-2026-summer', 2, 90, 'experienced', 'full_time', 'technical', 'A development example on policy optimisation and deploying large policies in a control loop.', 'hard', 'zh-CN', true, 72, timezone('utc', now()) - interval '55 days'),
  ('ea000000-0000-4000-8000-000000000012', 'c1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 2027, 'Spring', 'Santa Clara, CA', 'structured_report', 'development_seed', 'published', null, 'Robotics Systems Engineer Interview — 2027 Spring', 'nvidia-robotics-systems-engineer-2027-spring', 3, 135, 'experienced', 'full_time', 'onsite', 'A development example testing KV cache intuition, coordinate frames, and data-pipeline design.', 'hard', 'zh-CN', true, 72, timezone('utc', now()) - interval '62 days'),
  ('ea000000-0000-4000-8000-000000000013', 'c1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003', 2026, 'Autumn', 'San Francisco, CA', 'structured_report', 'development_seed', 'published', null, 'Embodied AI Research Scientist Interview — 2026 Autumn', 'physical-intelligence-embodied-ai-research-scientist-2026-autumn', 2, 90, 'experienced', 'full_time', 'mixed', 'A development example focused on diffusion-policy inference and action-sequence modelling.', 'hard', 'zh-CN', true, 72, timezone('utc', now()) - interval '69 days'),
  ('ea000000-0000-4000-8000-000000000014', 'c1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000009', 2026, 'Winter', 'Sunnyvale, CA', 'structured_report', 'development_seed', 'published', null, 'Humanoid Learning Engineer Interview — 2026 Winter', 'figure-ai-humanoid-learning-engineer-2026-winter', 4, 180, 'experienced', 'full_time', 'mixed', 'A development example spanning a recruiter screen, technical round, research deep dive, and coding round.', 'hard', 'zh-CN', true, 72, timezone('utc', now()) - interval '76 days'),
  ('ea000000-0000-4000-8000-000000000015', 'c1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000006', 2027, 'Autumn', 'Hangzhou', 'structured_report', 'development_seed', 'published', null, 'Robot Learning Intern Interview — 2027 Autumn', 'unitree-robot-learning-intern-2027-autumn', 1, 45, 'intern', 'internship', 'screening', 'A development example with a compact screen on control representations and robot demonstrations.', 'easy', 'zh-CN', true, 72, timezone('utc', now()) - interval '83 days'),
  ('ea000000-0000-4000-8000-000000000016', 'c1000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000005', 2026, 'Summer', 'Shanghai', 'structured_report', 'development_seed', 'published', null, 'Robot Learning New Grad Interview — 2026 Summer', 'agibot-robot-learning-new-grad-2026-summer', 2, 90, 'new_grad', 'full_time', 'technical', 'A development example on replaying demonstrations, VLA conditioning, and RL baselines.', 'medium', 'zh-CN', true, 72, timezone('utc', now()) - interval '90 days'),
  ('ea000000-0000-4000-8000-000000000017', 'c1000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000007', 2027, 'Spring', 'Shanghai', 'structured_report', 'development_seed', 'published', null, 'Perception Algorithm Engineer Interview — 2027 Spring', 'dji-perception-algorithm-engineer-2027-spring', 3, 135, 'experienced', 'full_time', 'onsite', 'A development example on attention, visual features, rigid transforms, and control latency.', 'hard', 'zh-CN', true, 72, timezone('utc', now()) - interval '97 days'),
  ('ea000000-0000-4000-8000-000000000018', 'c1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000012', 2026, 'Winter', 'Beijing', 'structured_report', 'development_seed', 'published', null, 'VLA Research Intern Interview — 2026 Winter', 'bytedance-vla-research-intern-2026-winter', 2, 90, 'intern', 'internship', 'mixed', 'A development example on VLA grounding and how to evaluate action predictions.', 'medium', 'zh-CN', true, 72, timezone('utc', now()) - interval '104 days'),
  ('ea000000-0000-4000-8000-000000000019', 'c1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 2025, 'Autumn', 'Santa Clara, CA', 'structured_report', 'development_seed', 'published', null, 'Robot Learning Intern Interview — 2025 Autumn', 'nvidia-robotics-systems-engineer-2025-autumn', 3, 135, 'intern', 'internship', 'technical', 'A development example on transformer inference, robot data, and SE(3) conventions.', 'medium', 'zh-CN', true, 72, timezone('utc', now()) - interval '111 days'),
  ('ea000000-0000-4000-8000-000000000020', 'c1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000008', 2025, 'Winter', 'San Francisco, CA', 'structured_report', 'development_seed', 'published', null, 'VLA Research Intern Interview — 2025 Winter', 'physical-intelligence-vla-research-intern-2025-winter', 2, 90, 'intern', 'internship', 'mixed', 'A development example on action chunking, diffusion policy, and long-horizon data.', 'hard', 'zh-CN', true, 72, timezone('utc', now()) - interval '118 days');

insert into public.interview_rounds
  (id, interview_id, round_number, title, round_type, duration_minutes, interviewer_role, summary)
values
  ('0c000000-0000-4000-8000-000000000001', 'ea000000-0000-4000-8000-000000000001', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000002', 'ea000000-0000-4000-8000-000000000001', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000003', 'ea000000-0000-4000-8000-000000000002', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000004', 'ea000000-0000-4000-8000-000000000002', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000005', 'ea000000-0000-4000-8000-000000000002', 3, 'Final deep dive', 'research', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000006', 'ea000000-0000-4000-8000-000000000003', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000007', 'ea000000-0000-4000-8000-000000000003', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000008', 'ea000000-0000-4000-8000-000000000004', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000009', 'ea000000-0000-4000-8000-000000000004', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000010', 'ea000000-0000-4000-8000-000000000004', 3, 'Final deep dive', 'research', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000011', 'ea000000-0000-4000-8000-000000000005', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000012', 'ea000000-0000-4000-8000-000000000005', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000013', 'ea000000-0000-4000-8000-000000000006', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000014', 'ea000000-0000-4000-8000-000000000006', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000015', 'ea000000-0000-4000-8000-000000000006', 3, 'Practical round', 'research', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000016', 'ea000000-0000-4000-8000-000000000006', 4, 'Final deep dive', 'manager', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000017', 'ea000000-0000-4000-8000-000000000007', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000018', 'ea000000-0000-4000-8000-000000000007', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000019', 'ea000000-0000-4000-8000-000000000007', 3, 'Final deep dive', 'research', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000020', 'ea000000-0000-4000-8000-000000000008', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000021', 'ea000000-0000-4000-8000-000000000008', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000022', 'ea000000-0000-4000-8000-000000000009', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000023', 'ea000000-0000-4000-8000-000000000009', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000024', 'ea000000-0000-4000-8000-000000000009', 3, 'Final deep dive', 'research', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000025', 'ea000000-0000-4000-8000-000000000010', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000026', 'ea000000-0000-4000-8000-000000000010', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000027', 'ea000000-0000-4000-8000-000000000011', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000028', 'ea000000-0000-4000-8000-000000000011', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000029', 'ea000000-0000-4000-8000-000000000012', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000030', 'ea000000-0000-4000-8000-000000000012', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000031', 'ea000000-0000-4000-8000-000000000012', 3, 'Final deep dive', 'research', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000032', 'ea000000-0000-4000-8000-000000000013', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000033', 'ea000000-0000-4000-8000-000000000013', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000034', 'ea000000-0000-4000-8000-000000000014', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000035', 'ea000000-0000-4000-8000-000000000014', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000036', 'ea000000-0000-4000-8000-000000000014', 3, 'Practical round', 'research', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000037', 'ea000000-0000-4000-8000-000000000014', 4, 'Final deep dive', 'manager', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000038', 'ea000000-0000-4000-8000-000000000015', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000039', 'ea000000-0000-4000-8000-000000000016', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000040', 'ea000000-0000-4000-8000-000000000016', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000041', 'ea000000-0000-4000-8000-000000000017', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000042', 'ea000000-0000-4000-8000-000000000017', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000043', 'ea000000-0000-4000-8000-000000000017', 3, 'Final deep dive', 'research', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000044', 'ea000000-0000-4000-8000-000000000018', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000045', 'ea000000-0000-4000-8000-000000000018', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000046', 'ea000000-0000-4000-8000-000000000019', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000047', 'ea000000-0000-4000-8000-000000000019', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000048', 'ea000000-0000-4000-8000-000000000019', 3, 'Final deep dive', 'research', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.'),
  ('0c000000-0000-4000-8000-000000000049', 'ea000000-0000-4000-8000-000000000020', 1, 'Technical discussion', 'technical', 45, 'Research or hiring team', 'Conceptual grounding and communication.'),
  ('0c000000-0000-4000-8000-000000000050', 'ea000000-0000-4000-8000-000000000020', 2, 'Practical round', 'coding', 60, 'Technical interviewer', 'Applied reasoning, implementation, and trade-offs.');

insert into public.interview_tags (interview_id, tag) values
  ('ea000000-0000-4000-8000-000000000001', 'research-heavy'),
  ('ea000000-0000-4000-8000-000000000001', 'development-example'),
  ('ea000000-0000-4000-8000-000000000002', 'systems'),
  ('ea000000-0000-4000-8000-000000000002', 'development-example'),
  ('ea000000-0000-4000-8000-000000000003', 'rl'),
  ('ea000000-0000-4000-8000-000000000003', 'development-example'),
  ('ea000000-0000-4000-8000-000000000004', 'research-heavy'),
  ('ea000000-0000-4000-8000-000000000004', 'coding-heavy'),
  ('ea000000-0000-4000-8000-000000000005', 'coding-heavy'),
  ('ea000000-0000-4000-8000-000000000005', 'robotics'),
  ('ea000000-0000-4000-8000-000000000006', 'research-heavy'),
  ('ea000000-0000-4000-8000-000000000006', 'development-example'),
  ('ea000000-0000-4000-8000-000000000007', 'robotics'),
  ('ea000000-0000-4000-8000-000000000007', 'research-heavy'),
  ('ea000000-0000-4000-8000-000000000008', 'robotics'),
  ('ea000000-0000-4000-8000-000000000008', 'coding-heavy'),
  ('ea000000-0000-4000-8000-000000000009', 'rl'),
  ('ea000000-0000-4000-8000-000000000009', 'robot-data'),
  ('ea000000-0000-4000-8000-000000000010', 'robotics'),
  ('ea000000-0000-4000-8000-000000000010', 'systems'),
  ('ea000000-0000-4000-8000-000000000011', 'rl'),
  ('ea000000-0000-4000-8000-000000000011', 'coding-heavy'),
  ('ea000000-0000-4000-8000-000000000012', 'systems'),
  ('ea000000-0000-4000-8000-000000000012', 'robotics'),
  ('ea000000-0000-4000-8000-000000000013', 'research-heavy'),
  ('ea000000-0000-4000-8000-000000000013', 'development-example'),
  ('ea000000-0000-4000-8000-000000000014', 'research-heavy'),
  ('ea000000-0000-4000-8000-000000000014', 'coding-heavy'),
  ('ea000000-0000-4000-8000-000000000015', 'robotics'),
  ('ea000000-0000-4000-8000-000000000015', 'development-example'),
  ('ea000000-0000-4000-8000-000000000016', 'robot-data'),
  ('ea000000-0000-4000-8000-000000000016', 'rl'),
  ('ea000000-0000-4000-8000-000000000017', 'robotics'),
  ('ea000000-0000-4000-8000-000000000017', 'systems'),
  ('ea000000-0000-4000-8000-000000000018', 'research-heavy'),
  ('ea000000-0000-4000-8000-000000000018', 'development-example'),
  ('ea000000-0000-4000-8000-000000000019', 'coding-heavy'),
  ('ea000000-0000-4000-8000-000000000019', 'robotics'),
  ('ea000000-0000-4000-8000-000000000020', 'research-heavy'),
  ('ea000000-0000-4000-8000-000000000020', 'robot-data');

-- ---------------------------------------------------------------------------
-- interview_questions
-- ---------------------------------------------------------------------------

insert into public.interview_questions (id, interview_id, question_id, round_number, order_index, original_wording) values
  ('0b000000-0000-4000-8000-000000000001', 'ea000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000005', 1, 1, 'Walk me through why your policy predicts chunks of actions instead of one action at a time.'),
  ('0b000000-0000-4000-8000-000000000002', 'ea000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000006', 1, 2, 'How would you explain Diffusion Policy to an engineer who has only done supervised learning?'),
  ('0b000000-0000-4000-8000-000000000003', 'ea000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000007', 2, 1, 'What exactly is a VLA, and where does the language part end and the action part begin?'),
  ('0b000000-0000-4000-8000-000000000004', 'ea000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000008', 2, 2, 'Would a world model actually help here, or is it just compression?'),
  ('0b000000-0000-4000-8000-000000000005', 'ea000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000001', 1, 1, 'Quick warm-up: what are Q, K and V, in one sentence each?'),
  ('0b000000-0000-4000-8000-000000000006', 'ea000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000002', 1, 2, 'Your VLA is too slow at 50 Hz. Where does KV Cache fit into that budget?'),
  ('0b000000-0000-4000-8000-000000000007', 'ea000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000009', 3, 1, 'We need end-effector poses in a moving base frame. How do you represent that and why?'),
  ('0b000000-0000-4000-8000-000000000008', 'ea000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000010', 3, 2, 'Design the data pipeline you would need before any of this training starts.'),
  ('0b000000-0000-4000-8000-000000000009', 'ea000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000003', 1, 1, 'Compare PPO and GRPO. Be concrete about what each one needs at training time.'),
  ('0b000000-0000-4000-8000-000000000010', 'ea000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000004', 1, 2, 'If GRPO has no critic, what plays the role of the baseline?'),
  ('0b000000-0000-4000-8000-000000000011', 'ea000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000005', 2, 1, 'You have a 7B policy and a 10 Hz control loop. How do you reconcile them?'),
  ('0b000000-0000-4000-8000-000000000012', 'ea000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000007', 2, 2, 'Where does the semantic knowledge in a VLA actually come from?');

update public.interview_questions iq
set round_id = r.id
from public.interview_rounds r
where r.interview_id = iq.interview_id and r.round_number = coalesce(iq.round_number, 1);

insert into public.interview_questions (
  id, interview_id, question_id, round_number, order_index, original_wording,
  notes, question_context, answer_summary, difficulty
) values
  ('0b000000-0000-4000-8000-000000000013', 'ea000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000003', 1, 1, 'Compare PPO and GRPO for a policy that receives group-level rewards.', null, null, null, 'hard'),
  ('0b000000-0000-4000-8000-000000000014', 'ea000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000004', 1, 2, 'Why can GRPO use a group baseline without training a critic?', null, null, null, 'hard'),
  ('0b000000-0000-4000-8000-000000000015', 'ea000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000007', 2, 1, 'What makes a vision-language-action model different from a visual policy?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000016', 'ea000000-0000-4000-8000-000000000004', null, 2, 2, 'Describe an implementation decision you made for a robot learning system.', null, null, null, null),
  ('0b000000-0000-4000-8000-000000000017', 'ea000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000005', 3, 1, 'Why would a robot policy predict an action chunk instead of one action?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000018', 'ea000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000001', 1, 1, 'Explain Q, K and V in attention and how you would test the implementation.', null, null, null, 'easy'),
  ('0b000000-0000-4000-8000-000000000019', 'ea000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000002', 1, 2, 'Where does KV cache help when a robot policy has a tight latency budget?', null, null, null, 'easy'),
  ('0b000000-0000-4000-8000-000000000020', 'ea000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000010', 2, 1, 'What are the important stages of a robot data collection pipeline?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000021', 'ea000000-0000-4000-8000-000000000005', null, 2, 2, 'Describe an implementation decision you made for a robot learning system.', null, null, null, null),
  ('0b000000-0000-4000-8000-000000000022', 'ea000000-0000-4000-8000-000000000006', 'f1000000-0000-4000-8000-000000000005', 1, 1, 'Why would a robot policy predict an action chunk instead of one action?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000023', 'ea000000-0000-4000-8000-000000000006', 'f1000000-0000-4000-8000-000000000006', 1, 2, 'Explain Diffusion Policy to someone who knows supervised learning.', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000024', 'ea000000-0000-4000-8000-000000000006', 'f1000000-0000-4000-8000-000000000007', 2, 1, 'What makes a vision-language-action model different from a visual policy?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000025', 'ea000000-0000-4000-8000-000000000006', 'f1000000-0000-4000-8000-000000000008', 2, 2, 'When is a learned world model useful for robot planning?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000026', 'ea000000-0000-4000-8000-000000000006', 'f1000000-0000-4000-8000-000000000010', 3, 1, 'What are the important stages of a robot data collection pipeline?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000027', 'ea000000-0000-4000-8000-000000000007', 'f1000000-0000-4000-8000-000000000007', 1, 1, 'What makes a vision-language-action model different from a visual policy?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000028', 'ea000000-0000-4000-8000-000000000007', 'f1000000-0000-4000-8000-000000000008', 1, 2, 'When is a learned world model useful for robot planning?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000029', 'ea000000-0000-4000-8000-000000000007', 'f1000000-0000-4000-8000-000000000009', 2, 1, 'How do you represent a pose in SE(3), and what frame is it relative to?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000030', 'ea000000-0000-4000-8000-000000000007', null, 2, 2, 'Describe an implementation decision you made for a robot learning system.', null, null, null, null),
  ('0b000000-0000-4000-8000-000000000031', 'ea000000-0000-4000-8000-000000000008', 'f1000000-0000-4000-8000-000000000005', 1, 1, 'Why would a robot policy predict an action chunk instead of one action?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000032', 'ea000000-0000-4000-8000-000000000008', 'f1000000-0000-4000-8000-000000000009', 1, 2, 'How do you represent a pose in SE(3), and what frame is it relative to?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000033', 'ea000000-0000-4000-8000-000000000008', 'f1000000-0000-4000-8000-000000000010', 2, 1, 'What are the important stages of a robot data collection pipeline?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000034', 'ea000000-0000-4000-8000-000000000008', 'f1000000-0000-4000-8000-000000000008', 2, 2, 'When is a learned world model useful for robot planning?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000035', 'ea000000-0000-4000-8000-000000000009', 'f1000000-0000-4000-8000-000000000003', 1, 1, 'Compare PPO and GRPO for a policy that receives group-level rewards.', null, null, null, 'hard'),
  ('0b000000-0000-4000-8000-000000000036', 'ea000000-0000-4000-8000-000000000009', 'f1000000-0000-4000-8000-000000000004', 1, 2, 'Why can GRPO use a group baseline without training a critic?', null, null, null, 'hard'),
  ('0b000000-0000-4000-8000-000000000037', 'ea000000-0000-4000-8000-000000000009', 'f1000000-0000-4000-8000-000000000007', 2, 1, 'What makes a vision-language-action model different from a visual policy?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000038', 'ea000000-0000-4000-8000-000000000009', 'f1000000-0000-4000-8000-000000000010', 2, 2, 'What are the important stages of a robot data collection pipeline?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000039', 'ea000000-0000-4000-8000-000000000009', null, 3, 1, 'Describe an implementation decision you made for a robot learning system.', null, null, null, null),
  ('0b000000-0000-4000-8000-000000000040', 'ea000000-0000-4000-8000-000000000010', 'f1000000-0000-4000-8000-000000000001', 1, 1, 'Explain Q, K and V in attention and how you would test the implementation.', null, null, null, 'easy'),
  ('0b000000-0000-4000-8000-000000000041', 'ea000000-0000-4000-8000-000000000010', 'f1000000-0000-4000-8000-000000000009', 1, 2, 'How do you represent a pose in SE(3), and what frame is it relative to?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000042', 'ea000000-0000-4000-8000-000000000010', 'f1000000-0000-4000-8000-000000000010', 2, 1, 'What are the important stages of a robot data collection pipeline?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000043', 'ea000000-0000-4000-8000-000000000010', 'f1000000-0000-4000-8000-000000000002', 2, 2, 'Where does KV cache help when a robot policy has a tight latency budget?', null, null, null, 'easy'),
  ('0b000000-0000-4000-8000-000000000044', 'ea000000-0000-4000-8000-000000000011', 'f1000000-0000-4000-8000-000000000003', 1, 1, 'Compare PPO and GRPO for a policy that receives group-level rewards.', null, null, null, 'hard'),
  ('0b000000-0000-4000-8000-000000000045', 'ea000000-0000-4000-8000-000000000011', 'f1000000-0000-4000-8000-000000000005', 1, 2, 'Why would a robot policy predict an action chunk instead of one action?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000046', 'ea000000-0000-4000-8000-000000000011', 'f1000000-0000-4000-8000-000000000006', 2, 1, 'Explain Diffusion Policy to someone who knows supervised learning.', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000047', 'ea000000-0000-4000-8000-000000000011', 'f1000000-0000-4000-8000-000000000007', 2, 2, 'What makes a vision-language-action model different from a visual policy?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000048', 'ea000000-0000-4000-8000-000000000012', 'f1000000-0000-4000-8000-000000000001', 1, 1, 'Explain Q, K and V in attention and how you would test the implementation.', null, null, null, 'easy'),
  ('0b000000-0000-4000-8000-000000000049', 'ea000000-0000-4000-8000-000000000012', 'f1000000-0000-4000-8000-000000000002', 1, 2, 'Where does KV cache help when a robot policy has a tight latency budget?', null, null, null, 'easy'),
  ('0b000000-0000-4000-8000-000000000050', 'ea000000-0000-4000-8000-000000000012', 'f1000000-0000-4000-8000-000000000009', 2, 1, 'How do you represent a pose in SE(3), and what frame is it relative to?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000051', 'ea000000-0000-4000-8000-000000000012', 'f1000000-0000-4000-8000-000000000010', 2, 2, 'What are the important stages of a robot data collection pipeline?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000052', 'ea000000-0000-4000-8000-000000000012', 'f1000000-0000-4000-8000-000000000008', 3, 1, 'When is a learned world model useful for robot planning?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000053', 'ea000000-0000-4000-8000-000000000013', 'f1000000-0000-4000-8000-000000000005', 1, 1, 'Why would a robot policy predict an action chunk instead of one action?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000054', 'ea000000-0000-4000-8000-000000000013', 'f1000000-0000-4000-8000-000000000006', 1, 2, 'Explain Diffusion Policy to someone who knows supervised learning.', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000055', 'ea000000-0000-4000-8000-000000000013', 'f1000000-0000-4000-8000-000000000008', 2, 1, 'When is a learned world model useful for robot planning?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000056', 'ea000000-0000-4000-8000-000000000013', 'f1000000-0000-4000-8000-000000000007', 2, 2, 'What makes a vision-language-action model different from a visual policy?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000057', 'ea000000-0000-4000-8000-000000000014', 'f1000000-0000-4000-8000-000000000007', 1, 1, 'What makes a vision-language-action model different from a visual policy?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000058', 'ea000000-0000-4000-8000-000000000014', 'f1000000-0000-4000-8000-000000000009', 1, 2, 'How do you represent a pose in SE(3), and what frame is it relative to?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000059', 'ea000000-0000-4000-8000-000000000014', 'f1000000-0000-4000-8000-000000000005', 2, 1, 'Why would a robot policy predict an action chunk instead of one action?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000060', 'ea000000-0000-4000-8000-000000000014', 'f1000000-0000-4000-8000-000000000006', 2, 2, 'Explain Diffusion Policy to someone who knows supervised learning.', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000061', 'ea000000-0000-4000-8000-000000000014', 'f1000000-0000-4000-8000-000000000010', 3, 1, 'What are the important stages of a robot data collection pipeline?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000062', 'ea000000-0000-4000-8000-000000000015', 'f1000000-0000-4000-8000-000000000009', 1, 1, 'How do you represent a pose in SE(3), and what frame is it relative to?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000063', 'ea000000-0000-4000-8000-000000000015', 'f1000000-0000-4000-8000-000000000010', 1, 2, 'What are the important stages of a robot data collection pipeline?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000064', 'ea000000-0000-4000-8000-000000000015', 'f1000000-0000-4000-8000-000000000008', 1, 3, 'When is a learned world model useful for robot planning?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000065', 'ea000000-0000-4000-8000-000000000016', 'f1000000-0000-4000-8000-000000000003', 1, 1, 'Compare PPO and GRPO for a policy that receives group-level rewards.', null, null, null, 'hard'),
  ('0b000000-0000-4000-8000-000000000066', 'ea000000-0000-4000-8000-000000000016', 'f1000000-0000-4000-8000-000000000005', 1, 2, 'Why would a robot policy predict an action chunk instead of one action?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000067', 'ea000000-0000-4000-8000-000000000016', 'f1000000-0000-4000-8000-000000000007', 2, 1, 'What makes a vision-language-action model different from a visual policy?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000068', 'ea000000-0000-4000-8000-000000000016', 'f1000000-0000-4000-8000-000000000010', 2, 2, 'What are the important stages of a robot data collection pipeline?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000069', 'ea000000-0000-4000-8000-000000000017', 'f1000000-0000-4000-8000-000000000001', 1, 1, 'Explain Q, K and V in attention and how you would test the implementation.', null, null, null, 'easy'),
  ('0b000000-0000-4000-8000-000000000070', 'ea000000-0000-4000-8000-000000000017', 'f1000000-0000-4000-8000-000000000002', 1, 2, 'Where does KV cache help when a robot policy has a tight latency budget?', null, null, null, 'easy'),
  ('0b000000-0000-4000-8000-000000000071', 'ea000000-0000-4000-8000-000000000017', 'f1000000-0000-4000-8000-000000000009', 2, 1, 'How do you represent a pose in SE(3), and what frame is it relative to?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000072', 'ea000000-0000-4000-8000-000000000017', 'f1000000-0000-4000-8000-000000000005', 2, 2, 'Why would a robot policy predict an action chunk instead of one action?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000073', 'ea000000-0000-4000-8000-000000000017', null, 3, 1, 'Describe an implementation decision you made for a robot learning system.', null, null, null, null),
  ('0b000000-0000-4000-8000-000000000074', 'ea000000-0000-4000-8000-000000000018', 'f1000000-0000-4000-8000-000000000007', 1, 1, 'What makes a vision-language-action model different from a visual policy?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000075', 'ea000000-0000-4000-8000-000000000018', 'f1000000-0000-4000-8000-000000000008', 1, 2, 'When is a learned world model useful for robot planning?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000076', 'ea000000-0000-4000-8000-000000000018', 'f1000000-0000-4000-8000-000000000006', 2, 1, 'Explain Diffusion Policy to someone who knows supervised learning.', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000077', 'ea000000-0000-4000-8000-000000000018', null, 2, 2, 'Describe an implementation decision you made for a robot learning system.', null, null, null, null),
  ('0b000000-0000-4000-8000-000000000078', 'ea000000-0000-4000-8000-000000000019', 'f1000000-0000-4000-8000-000000000001', 1, 1, 'Explain Q, K and V in attention and how you would test the implementation.', null, null, null, 'easy'),
  ('0b000000-0000-4000-8000-000000000079', 'ea000000-0000-4000-8000-000000000019', 'f1000000-0000-4000-8000-000000000002', 1, 2, 'Where does KV cache help when a robot policy has a tight latency budget?', null, null, null, 'easy'),
  ('0b000000-0000-4000-8000-000000000080', 'ea000000-0000-4000-8000-000000000019', 'f1000000-0000-4000-8000-000000000009', 2, 1, 'How do you represent a pose in SE(3), and what frame is it relative to?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000081', 'ea000000-0000-4000-8000-000000000019', 'f1000000-0000-4000-8000-000000000010', 2, 2, 'What are the important stages of a robot data collection pipeline?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000082', 'ea000000-0000-4000-8000-000000000020', 'f1000000-0000-4000-8000-000000000005', 1, 1, 'Why would a robot policy predict an action chunk instead of one action?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000083', 'ea000000-0000-4000-8000-000000000020', 'f1000000-0000-4000-8000-000000000006', 1, 2, 'Explain Diffusion Policy to someone who knows supervised learning.', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000084', 'ea000000-0000-4000-8000-000000000020', 'f1000000-0000-4000-8000-000000000008', 2, 1, 'When is a learned world model useful for robot planning?', null, null, null, 'medium'),
  ('0b000000-0000-4000-8000-000000000085', 'ea000000-0000-4000-8000-000000000020', null, 2, 2, 'Describe an implementation decision you made for a robot learning system.', null, null, null, null);

-- ---------------------------------------------------------------------------
-- ---------------------------------------------------------------------------
-- coding problems (20 Python-first exercises)
-- ---------------------------------------------------------------------------

insert into public.coding_problems (
  id, title, slug, difficulty, category, description, constraints,
  starter_code, solution_code, function_name, language, time_limit_ms,
  memory_limit_mb, comparison_mode, tolerance, is_published, is_featured
) values
  (
    'b1000000-0000-4000-8000-000000000001', 'Implement Stable Softmax', 'implement-stable-softmax',
    'easy', 'transformer',
    'Compute a numerically stable softmax for a list of logits. Subtract the largest logit before exponentiating, then return probabilities rounded to six decimal places.', '1 <= len(logits) <= 128
Input and output are JSON.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json, math

def solve(data):
    logits = data["logits"]
    pivot = max(logits)
    values = [math.exp(value - pivot) for value in logits]
    total = sum(values)
    return [round(value / total, 6) for value in values]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, true
  ),
  (
    'b1000000-0000-4000-8000-000000000002', 'Implement Layer Normalization', 'implement-layer-normalization',
    'medium', 'transformer',
    'Normalize one feature vector with population variance. Use the supplied epsilon inside the square root and round each normalized value to six decimal places.', '1 <= len(values) <= 256
Input contains values and eps as JSON.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json, math

def solve(data):
    values = data["values"]
    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / len(values)
    scale = math.sqrt(variance + data["eps"])
    return [round((value - mean) / scale, 6) for value in values]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, true
  ),
  (
    'b1000000-0000-4000-8000-000000000003', 'Scaled Dot-Product Attention', 'scaled-dot-product-attention',
    'medium', 'transformer',
    'Implement one query of scaled dot-product attention. Apply softmax to query-key scores and return the weighted value vector rounded to four decimal places.', 'Keys have the same dimension as query.
Input and output are JSON.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json, math

def solve(data):
    query, keys, values = data["query"], data["keys"], data["values"]
    scale = math.sqrt(len(query))
    scores = [sum(a * b for a, b in zip(query, key)) / scale for key in keys]
    pivot = max(scores)
    weights = [math.exp(score - pivot) for score in scores]
    total = sum(weights)
    weights = [weight / total for weight in weights]
    return [round(sum(weight * value[j] for weight, value in zip(weights, values)), 4) for j in range(len(values[0]))]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, true
  ),
  (
    'b1000000-0000-4000-8000-000000000004', 'Average Multi-Head Attention', 'average-multi-head-attention',
    'hard', 'transformer',
    'Each attention head independently pools its value vectors for the same query. Compute scaled attention in every head and average the head outputs.', 'Every head has the same value dimension.
Round the averaged vector to four decimal places.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json, math

def solve(data):
    query, outputs = data["query"], []
    for head in data["heads"]:
        scale = math.sqrt(len(query))
        scores = [sum(a * b for a, b in zip(query, key)) / scale for key in head["keys"]]
        pivot = max(scores)
        weights = [math.exp(score - pivot) for score in scores]
        total = sum(weights)
        weights = [weight / total for weight in weights]
        outputs.append([sum(weight * value[j] for weight, value in zip(weights, head["values"])) for j in range(len(head["values"][0]))])
    return [round(sum(output[j] for output in outputs) / len(outputs), 4) for j in range(len(outputs[0]))]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, true
  ),
  (
    'b1000000-0000-4000-8000-000000000005', 'Build a Causal Attention Mask', 'build-causal-attention-mask',
    'easy', 'transformer',
    'Turn each row of attention scores into a causal softmax: position i may attend only to positions at most i. Future positions must receive probability zero.', 'The score matrix is square and has at most 64 rows.
Round probabilities to six decimal places.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json, math

def solve(data):
    result = []
    for index, row in enumerate(data["scores"]):
        visible = row[:index + 1]
        pivot = max(visible)
        weights = [math.exp(value - pivot) for value in visible]
        total = sum(weights)
        result.append([round(value / total, 6) for value in weights] + [0.0] * (len(row) - len(visible)))
    return result

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  ),
  (
    'b1000000-0000-4000-8000-000000000006', 'Compute Discounted Returns', 'compute-discounted-returns',
    'easy', 'rl',
    'Given a reward sequence and discount factor, compute the return at every timestep by accumulating rewards backwards.', '0 <= gamma <= 1
Return one value per reward, rounded to six decimal places.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json

def solve(data):
    running, returns = 0.0, []
    for reward in reversed(data["rewards"]):
        running = reward + data["gamma"] * running
        returns.append(round(running, 6))
    return list(reversed(returns))

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  ),
  (
    'b1000000-0000-4000-8000-000000000007', 'Generalized Advantage Estimation', 'generalized-advantage-estimation',
    'medium', 'rl',
    'Compute GAE advantages from rewards and one extra bootstrap value. Walk backwards using gamma and lambda, then round to six decimal places.', 'len(values) = len(rewards) + 1
0 <= gamma, lambda <= 1.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json

def solve(data):
    rewards, values = data["rewards"], data["values"]
    running, advantages = 0.0, [0.0] * len(rewards)
    for index in range(len(rewards) - 1, -1, -1):
        delta = rewards[index] + data["gamma"] * values[index + 1] - values[index]
        running = delta + data["gamma"] * data["lambda"] * running
        advantages[index] = round(running, 6)
    return advantages

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  ),
  (
    'b1000000-0000-4000-8000-000000000008', 'PPO Clipped Objective', 'ppo-clipped-objective',
    'hard', 'rl',
    'For each action compute the PPO clipped surrogate term and return the mean. Clip ratios to one plus or minus epsilon before multiplying by the advantage.', 'Ratios and advantages have equal non-zero length.
Return the scalar rounded to six decimal places.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json

def solve(data):
    epsilon, terms = data["epsilon"], []
    for ratio, advantage in zip(data["ratios"], data["advantages"]):
        clipped = max(1 - epsilon, min(1 + epsilon, ratio))
        terms.append(min(ratio * advantage, clipped * advantage))
    return round(sum(terms) / len(terms), 6)

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  ),
  (
    'b1000000-0000-4000-8000-000000000009', 'Group-Relative Advantage', 'group-relative-advantage',
    'hard', 'rl',
    'Standardize rewards sampled for one prompt. Subtract the group mean and divide by the population standard deviation; degenerate groups return zeros.', '1 <= len(rewards) <= 128
Round each advantage to six decimal places.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json, math

def solve(data):
    rewards = data["rewards"]
    mean = sum(rewards) / len(rewards)
    deviation = math.sqrt(sum((reward - mean) ** 2 for reward in rewards) / len(rewards))
    if deviation == 0:
        return [0.0] * len(rewards)
    return [round((reward - mean) / deviation, 6) for reward in rewards]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  ),
  (
    'b1000000-0000-4000-8000-000000000010', 'Euler Angles to Quaternion', 'euler-angles-to-quaternion',
    'medium', 'robotics',
    'Convert roll, pitch, and yaw in radians into an xyzw unit quaternion. Return components rounded to six decimal places.', 'Angles are in radians.
Use the roll-pitch-yaw convention and return [x, y, z, w].',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json, math

def solve(data):
    roll, pitch, yaw = data["rpy"]
    cr, sr = math.cos(roll / 2), math.sin(roll / 2)
    cp, sp = math.cos(pitch / 2), math.sin(pitch / 2)
    cy, sy = math.cos(yaw / 2), math.sin(yaw / 2)
    return [round(sr * cp * cy - cr * sp * sy, 6), round(cr * sp * cy + sr * cp * sy, 6), round(cr * cp * sy - sr * sp * cy, 6), round(cr * cp * cy + sr * sp * sy, 6)]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  ),
  (
    'b1000000-0000-4000-8000-000000000011', 'Multiply Unit Quaternions', 'multiply-unit-quaternions',
    'medium', 'robotics',
    'Compose two xyzw unit quaternions using the Hamilton product and return the result in xyzw order.', 'Inputs are unit quaternions in [x, y, z, w] order.
Round components to six decimal places.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json

def solve(data):
    x1, y1, z1, w1 = data["q1"]
    x2, y2, z2, w2 = data["q2"]
    return [round(w1*x2 + x1*w2 + y1*z2 - z1*y2, 6), round(w1*y2 - x1*z2 + y1*w2 + z1*x2, 6), round(w1*z2 + x1*y2 - y1*x2 + z1*w2, 6), round(w1*w2 - x1*x2 - y1*y2 - z1*z2, 6)]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  ),
  (
    'b1000000-0000-4000-8000-000000000012', 'Spherical Quaternion Interpolation', 'spherical-quaternion-interpolation',
    'hard', 'robotics',
    'Interpolate between two unit quaternions on the shortest spherical path. Use linear interpolation only for nearly parallel inputs and round the result.', 'Quaternions are unit length and use xyzw order.
0 <= t <= 1.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json, math

def solve(data):
    first, second, t = data["q1"], data["q2"], data["t"]
    dot = sum(a * b for a, b in zip(first, second))
    if dot < 0:
        second, dot = [-value for value in second], -dot
    if dot > 0.9995:
        result = [a + t * (b - a) for a, b in zip(first, second)]
    else:
        angle = math.acos(dot)
        sine = math.sin(angle)
        left, right = math.sin((1 - t) * angle) / sine, math.sin(t * angle) / sine
        result = [left * a + right * b for a, b in zip(first, second)]
    norm = math.sqrt(sum(value * value for value in result))
    return [round(value / norm, 6) for value in result]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  ),
  (
    'b1000000-0000-4000-8000-000000000013', 'Transform a Point with SE(3)', 'transform-point-with-se3',
    'medium', 'robotics',
    'Apply a rigid transform to one 3D point. Multiply the rotation matrix first, then add the translation vector.', 'Rotation is 3x3; translation and point are length-three vectors.
Round coordinates to six decimal places.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json

def solve(data):
    rotation, translation, point = data["rotation"], data["translation"], data["point"]
    return [round(sum(rotation[row][column] * point[column] for column in range(3)) + translation[row], 6) for row in range(3)]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  ),
  (
    'b1000000-0000-4000-8000-000000000014', 'DDPM Forward Noise Step', 'ddpm-forward-noise-step',
    'hard', 'diffusion',
    'Apply one forward diffusion step x_t = sqrt(alpha_bar) x_0 + sqrt(1 - alpha_bar) epsilon to every coordinate.', '0 <= alpha_bar <= 1
x0 and noise have equal length.
Round coordinates to six decimal places.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json, math

def solve(data):
    alpha = data["alpha_bar"]
    return [round(math.sqrt(alpha) * clean + math.sqrt(1 - alpha) * noise, 6) for clean, noise in zip(data["x0"], data["noise"])]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  ),
  (
    'b1000000-0000-4000-8000-000000000015', 'Linear Noise Schedule', 'linear-noise-schedule',
    'easy', 'diffusion',
    'Generate an inclusive linear beta schedule from beta_start to beta_end with the requested number of diffusion steps.', 'steps is positive.
For one step return beta_start; otherwise include both endpoints.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json

def solve(data):
    start, end, steps = data["beta_start"], data["beta_end"], data["steps"]
    if steps == 1:
        return [round(start, 6)]
    return [round(start + (end - start) * index / (steps - 1), 6) for index in range(steps)]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  ),
  (
    'b1000000-0000-4000-8000-000000000016', 'Flow-Matching Vector Field', 'flow-matching-vector-field',
    'easy', 'diffusion',
    'For a straight interpolation path from x0 to x1, compute the constant flow-matching target vector x1 - x0.', 'x0 and x1 have equal length.
Round each component to six decimal places.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json

def solve(data):
    return [round(end - start, 6) for start, end in zip(data["x0"], data["x1"])]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  ),
  (
    'b1000000-0000-4000-8000-000000000017', 'Replay Buffer Retention', 'replay-buffer-retention',
    'easy', 'robot_learning',
    'Simulate a FIFO replay buffer after inserting all items, then read valid sample indices from the retained buffer.', 'capacity is positive.
Ignore sample indices outside the retained buffer.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json

def solve(data):
    buffer = data["items"][-data["capacity"]:]
    return [buffer[index] for index in data["sample_indices"] if 0 <= index < len(buffer)]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  ),
  (
    'b1000000-0000-4000-8000-000000000018', 'Blend Overlapping Action Chunks', 'blend-overlapping-action-chunks',
    'medium', 'robot_learning',
    'Blend action chunks with scalar confidence weights. Every chunk has the same shape; compute a weighted average for each timestep and action dimension.', 'All chunks have equal shape and weights are positive.
Round every action to six decimal places.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json

def solve(data):
    chunks, weights = data["chunks"], data["weights"]
    total = sum(weights)
    return [[round(sum(weight * chunk[t][d] for weight, chunk in zip(weights, chunks)) / total, 6) for d in range(len(chunks[0][0]))] for t in range(len(chunks[0]))]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  ),
  (
    'b1000000-0000-4000-8000-000000000019', 'Create Sliding Windows', 'create-sliding-windows',
    'easy', 'algorithms',
    'Split a sequence into full sliding windows using a window size and stride. Discard any incomplete window at the end.', 'window and stride are positive.
Return only windows with exactly window elements.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json

def solve(data):
    sequence, window, stride = data["sequence"], data["window"], data["stride"]
    return [sequence[start:start + window] for start in range(0, len(sequence) - window + 1, stride)]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  ),
  (
    'b1000000-0000-4000-8000-000000000020', 'Top-K Token Frequencies', 'top-k-token-frequencies',
    'easy', 'algorithms',
    'Count tokens and return the k most frequent as [token, count] pairs. Break ties lexicographically for deterministic evaluation.', '1 <= k <= number of distinct tokens.
Tokens are strings.',
    $code$
import json

def solve(data):
    # TODO: implement the solution
    raise NotImplementedError

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, $code$
import json

def solve(data):
    counts = {}
    for token in data["tokens"]:
        counts[token] = counts.get(token, 0) + 1
    ordered = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    return [[token, count] for token, count in ordered[:data["k"]]]

data = json.loads(input())
print(json.dumps(solve(data), separators=(",", ":")))
$code$, 'solve',
    'python', 3000, 256, 'trimmed', 0.000001, true, false
  );

insert into public.coding_test_cases (
  id, problem_id, name, input_data, expected_output, is_hidden, weight, order_index
) values
  (
    'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Two equal logits',
    $data${"logits":[0,0]}$data$, $data$[0.5,0.5]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'Three logits',
    $data${"logits":[1,2,3]}$data$, $data$[0.090031,0.244728,0.665241]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'Large spread',
    $data${"logits":[2,0,-2]}$data$, $data$[0.866813,0.11731,0.015876]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000002', 'Three features',
    $data${"values":[1,2,3],"eps":0}$data$, $data$[-1.224745,0.0,1.224745]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000002', 'Constant vector',
    $data${"values":[5,5,5],"eps":0.000001}$data$, $data$[0.0,0.0,0.0]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000002', 'Two features',
    $data${"values":[-1,1],"eps":0}$data$, $data$[-1.0,1.0]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000003', 'Equal scores',
    $data${"query":[1,0],"keys":[[1,0],[1,0]],"values":[[10,0],[0,20]]}$data$, $data$[5.0,10.0]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000003', 'Different scores',
    $data${"query":[1,0],"keys":[[1,0],[0,1]],"values":[[10,0],[0,20]]}$data$, $data$[6.6976,6.6048]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000003', 'Swapped query',
    $data${"query":[0,1],"keys":[[1,0],[0,1]],"values":[[10,0],[0,20]]}$data$, $data$[3.3024,13.3952]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000004', 'Two heads',
    $data${"query":[1,0],"heads":[{"keys":[[1,0],[1,0]],"values":[[1,0],[0,1]]},{"keys":[[1,0],[1,0]],"values":[[2,0],[0,2]]}]}$data$, $data$[0.75,0.75]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000004', 'Focused heads',
    $data${"query":[1,0],"heads":[{"keys":[[1,0],[1,0]],"values":[[4,0],[0,2]]},{"keys":[[1,0],[1,0]],"values":[[0,4],[2,0]]}]}$data$, $data$[1.5,1.5]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000004', 'One head',
    $data${"query":[0,1],"heads":[{"keys":[[0,1],[0,1]],"values":[[10,0],[0,20]]}]}$data$, $data$[5.0,10.0]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000005', 'Two positions',
    $data${"scores":[[1,0],[0,1]]}$data$, $data$[[1.0,0.0],[0.268941,0.731059]]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000014', 'b1000000-0000-4000-8000-000000000005', 'Three positions',
    $data${"scores":[[0,0,0],[0,0,0],[1,0,1]]}$data$, $data$[[1.0,0.0,0.0],[0.5,0.5,0.0],[0.422319,0.155362,0.422319]]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000015', 'b1000000-0000-4000-8000-000000000005', 'Strong first token',
    $data${"scores":[[2,0,0],[2,1,0],[2,1,0]]}$data$, $data$[[1.0,0.0,0.0],[0.731059,0.268941,0.0],[0.665241,0.244728,0.090031]]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000016', 'b1000000-0000-4000-8000-000000000006', 'Unit rewards',
    $data${"rewards":[1,1,1],"gamma":0.9}$data$, $data$[2.71,1.9,1.0]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000017', 'b1000000-0000-4000-8000-000000000006', 'No discount',
    $data${"rewards":[1,0,2],"gamma":1}$data$, $data$[3.0,2.0,2.0]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000018', 'b1000000-0000-4000-8000-000000000006', 'Zero discount',
    $data${"rewards":[3,-1,5],"gamma":0}$data$, $data$[3.0,-1.0,5.0]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000019', 'b1000000-0000-4000-8000-000000000007', 'Unit bootstrap',
    $data${"rewards":[1,0,2],"values":[0,0,1,0],"gamma":1,"lambda":1}$data$, $data$[3.0,2.0,1.0]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000020', 'b1000000-0000-4000-8000-000000000007', 'Partial trace',
    $data${"rewards":[0,1],"values":[0,0,0],"gamma":0.9,"lambda":0.5}$data$, $data$[0.45,1.0]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000021', 'b1000000-0000-4000-8000-000000000007', 'Terminal reward',
    $data${"rewards":[0,0,1],"values":[0,0,0,0],"gamma":1,"lambda":0.5}$data$, $data$[0.25,0.5,1.0]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000022', 'b1000000-0000-4000-8000-000000000008', 'Mixed advantages',
    $data${"ratios":[1.2,0.8,1.05],"advantages":[1,-1,2],"epsilon":0.2}$data$, $data$0.833333$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000023', 'b1000000-0000-4000-8000-000000000008', 'Both clipped',
    $data${"ratios":[0.5,1.5],"advantages":[1,-1],"epsilon":0.2}$data$, $data$-0.5$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000024', 'b1000000-0000-4000-8000-000000000008', 'No clipping',
    $data${"ratios":[1,1],"advantages":[2,-2],"epsilon":0.2}$data$, $data$0.0$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000025', 'b1000000-0000-4000-8000-000000000009', 'Three rewards',
    $data${"rewards":[1,3,2]}$data$, $data$[-1.224745,1.224745,0.0]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000026', 'b1000000-0000-4000-8000-000000000009', 'Degenerate group',
    $data${"rewards":[5,5,5]}$data$, $data$[0.0,0.0,0.0]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000027', 'b1000000-0000-4000-8000-000000000009', 'Symmetric group',
    $data${"rewards":[0,2,4,2]}$data$, $data$[-1.414214,0.0,1.414214,0.0]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000028', 'b1000000-0000-4000-8000-000000000010', 'Identity',
    $data${"rpy":[0,0,0]}$data$, $data$[0.0,0.0,0.0,1.0]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000029', 'b1000000-0000-4000-8000-000000000010', 'Quarter turn yaw',
    $data${"rpy":[0,0,1.5707963267948966]}$data$, $data$[0.0,0.0,0.707107,0.707107]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000030', 'b1000000-0000-4000-8000-000000000010', 'Quarter turn roll',
    $data${"rpy":[1.5707963267948966,0,0]}$data$, $data$[0.707107,0.0,0.0,0.707107]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000031', 'b1000000-0000-4000-8000-000000000011', 'Identity composition',
    $data${"q1":[0,0,0,1],"q2":[0,0,0.707107,0.707107]}$data$, $data$[0.0,0.0,0.707107,0.707107]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000032', 'b1000000-0000-4000-8000-000000000011', 'Two quarter turns',
    $data${"q1":[0.707107,0,0,0.707107],"q2":[0,0.707107,0,0.707107]}$data$, $data$[0.5,0.5,0.5,0.5]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000033', 'b1000000-0000-4000-8000-000000000011', 'Right identity',
    $data${"q1":[0.5,0.5,0.5,0.5],"q2":[0,0,0,1]}$data$, $data$[0.5,0.5,0.5,0.5]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000034', 'b1000000-0000-4000-8000-000000000012', 'Half yaw turn',
    $data${"q1":[0,0,0,1],"q2":[0,0,0.707107,0.707107],"t":0.5}$data$, $data$[0.0,0.0,0.382683,0.92388]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000035', 'b1000000-0000-4000-8000-000000000012', 'Start point',
    $data${"q1":[0,0,0,1],"q2":[0,0,0.707107,0.707107],"t":0}$data$, $data$[0.0,0.0,0.0,1.0]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000036', 'b1000000-0000-4000-8000-000000000012', 'Orthogonal rotations',
    $data${"q1":[0.707107,0,0,0.707107],"q2":[0,0.707107,0,0.707107],"t":0.5}$data$, $data$[0.408248,0.408248,0.0,0.816497]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000037', 'b1000000-0000-4000-8000-000000000013', 'Identity rotation',
    $data${"rotation":[[1,0,0],[0,1,0],[0,0,1]],"translation":[1,2,3],"point":[2,0,-1]}$data$, $data$[3,2,2]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000038', 'b1000000-0000-4000-8000-000000000013', 'Quarter turn',
    $data${"rotation":[[0,-1,0],[1,0,0],[0,0,1]],"translation":[1,0,0],"point":[1,0,0]}$data$, $data$[1,1,0]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000039', 'b1000000-0000-4000-8000-000000000013', 'Translation only',
    $data${"rotation":[[1,0,0],[0,1,0],[0,0,1]],"translation":[-2,4,0.5],"point":[0.5,1,2]}$data$, $data$[-1.5,5.0,2.5]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000040', 'b1000000-0000-4000-8000-000000000014', 'Mixed signal',
    $data${"alpha_bar":0.81,"x0":[1,-1],"noise":[0,1]}$data$, $data$[0.9,-0.46411]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000041', 'b1000000-0000-4000-8000-000000000014', 'No noise',
    $data${"alpha_bar":1,"x0":[2,-3],"noise":[5,5]}$data$, $data$[2.0,-3.0]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000042', 'b1000000-0000-4000-8000-000000000014', 'Equal blend',
    $data${"alpha_bar":0.25,"x0":[2],"noise":[2]}$data$, $data$[2.732051]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000043', 'b1000000-0000-4000-8000-000000000015', 'Four steps',
    $data${"beta_start":0.1,"beta_end":0.2,"steps":4}$data$, $data$[0.1,0.133333,0.166667,0.2]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000044', 'b1000000-0000-4000-8000-000000000015', 'Single step',
    $data${"beta_start":0.01,"beta_end":0.2,"steps":1}$data$, $data$[0.01]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000045', 'b1000000-0000-4000-8000-000000000015', 'Three steps',
    $data${"beta_start":0,"beta_end":1,"steps":3}$data$, $data$[0.0,0.5,1.0]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000046', 'b1000000-0000-4000-8000-000000000016', 'Unit displacement',
    $data${"x0":[0,0],"x1":[2,4]}$data$, $data$[2,4]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000047', 'b1000000-0000-4000-8000-000000000016', 'Reverse displacement',
    $data${"x0":[3,-1],"x1":[1,2]}$data$, $data$[-2,3]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000048', 'b1000000-0000-4000-8000-000000000016', 'Fractional displacement',
    $data${"x0":[0.5,1.5],"x1":[1.25,1.75]}$data$, $data$[0.75,0.25]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000049', 'b1000000-0000-4000-8000-000000000017', 'Evict oldest item',
    $data${"capacity":3,"items":["a","b","c","d"],"sample_indices":[0,2]}$data$, $data$["b","d"]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000050', 'b1000000-0000-4000-8000-000000000017', 'Keep last two',
    $data${"capacity":2,"items":[1,2,3],"sample_indices":[0,1]}$data$, $data$[2,3]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000051', 'b1000000-0000-4000-8000-000000000017', 'Ignore invalid index',
    $data${"capacity":5,"items":["x"],"sample_indices":[0,1,-1]}$data$, $data$["x"]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000052', 'b1000000-0000-4000-8000-000000000018', 'Two predictions',
    $data${"chunks":[[[1,2]],[[3,4]]],"weights":[0.25,0.75]}$data$, $data$[[2.5,3.5]]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000053', 'b1000000-0000-4000-8000-000000000018', 'Three predictions',
    $data${"chunks":[[[0],[2],[4]],[[2],[4],[6]]],"weights":[1,1]}$data$, $data$[[1.0],[3.0],[5.0]]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000054', 'b1000000-0000-4000-8000-000000000018', 'Two timesteps',
    $data${"chunks":[[[1,0],[0,1]],[[3,2],[2,3]]],"weights":[0.5,0.5]}$data$, $data$[[2.0,1.0],[1.0,2.0]]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000055', 'b1000000-0000-4000-8000-000000000019', 'Stride two',
    $data${"sequence":[1,2,3,4,5],"window":3,"stride":2}$data$, $data$[[1,2,3],[3,4,5]]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000056', 'b1000000-0000-4000-8000-000000000019', 'Stride one',
    $data${"sequence":[1,2,3,4],"window":2,"stride":1}$data$, $data$[[1,2],[2,3],[3,4]]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000057', 'b1000000-0000-4000-8000-000000000019', 'Window too large',
    $data${"sequence":[1,2],"window":3,"stride":1}$data$, $data$[]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000058', 'b1000000-0000-4000-8000-000000000020', 'Most common tokens',
    $data${"tokens":["a","b","a","c","b","a"],"k":2}$data$, $data$[["a",3],["b",2]]$data$, false,
    1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000059', 'b1000000-0000-4000-8000-000000000020', 'Lexical tie break',
    $data${"tokens":["z","a","z","a","m"],"k":2}$data$, $data$[["a",2],["z",2]]$data$, false,
    1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000060', 'b1000000-0000-4000-8000-000000000020', 'All tokens unique',
    $data${"tokens":["c","b","a"],"k":3}$data$, $data$[["a",1],["b",1],["c",1]]$data$, true,
    1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000061',
    'b1000000-0000-4000-8000-000000000001',
    'Single logit', $data${"logits":[5]}$data$, $data$[1.0]$data$, true, 1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000062',
    'b1000000-0000-4000-8000-000000000001',
    'Negative tie', $data${"logits":[-1,-1]}$data$, $data$[0.5,0.5]$data$, true, 1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000063',
    'b1000000-0000-4000-8000-000000000002',
    'Two features', $data${"values":[0,2],"eps":0}$data$, $data$[-1.0,1.0]$data$, true, 1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000064',
    'b1000000-0000-4000-8000-000000000002',
    'Four features', $data${"values":[1,2,3,4],"eps":0}$data$, $data$[-1.341641,-0.447214,0.447214,1.341641]$data$, true, 1.0, 3
  ),
  (
    'b2000000-0000-4000-8000-000000000065',
    'b1000000-0000-4000-8000-000000000003',
    'Equal two-dimensional keys', $data${"query":[1,1],"keys":[[1,1],[1,1]],"values":[[1,2],[3,4]]}$data$, $data$[2.0,3.0]$data$, true, 1.0, 4
  ),
  (
    'b2000000-0000-4000-8000-000000000066',
    'b1000000-0000-4000-8000-000000000003',
    'Zero query', $data${"query":[0,0],"keys":[[1,0],[0,1]],"values":[[2,4],[4,2]]}$data$, $data$[3.0,3.0]$data$, true, 1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000067',
    'b1000000-0000-4000-8000-000000000004',
    'Three equal keys', $data${"query":[1],"heads":[{"keys":[[1],[1],[1]],"values":[[1],[3],[5]]}]}$data$, $data$[3.0]$data$, true, 1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000068',
    'b1000000-0000-4000-8000-000000000004',
    'Head average', $data${"query":[1],"heads":[{"keys":[[1],[1]],"values":[[0],[2]]},{"keys":[[1],[1]],"values":[[2],[4]]}]}$data$, $data$[2.0]$data$, true, 1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000069',
    'b1000000-0000-4000-8000-000000000005',
    'One position', $data${"scores":[[-2]]}$data$, $data$[[1.0]]$data$, true, 1.0, 3
  ),
  (
    'b2000000-0000-4000-8000-000000000070',
    'b1000000-0000-4000-8000-000000000005',
    'Negative scores', $data${"scores":[[-1,-2],[-3,-2]]}$data$, $data$[[1.0,0.0],[0.268941,0.731059]]$data$, true, 1.0, 4
  ),
  (
    'b2000000-0000-4000-8000-000000000071',
    'b1000000-0000-4000-8000-000000000006',
    'Single reward', $data${"rewards":[5],"gamma":0.5}$data$, $data$[5.0]$data$, true, 1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000072',
    'b1000000-0000-4000-8000-000000000006',
    'Negative reward', $data${"rewards":[-1,2],"gamma":0.5}$data$, $data$[0.0,2.0]$data$, true, 1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000073',
    'b1000000-0000-4000-8000-000000000007',
    'Bootstrap value', $data${"rewards":[1],"values":[0,1],"gamma":0.9,"lambda":0.9}$data$, $data$[1.9]$data$, true, 1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000074',
    'b1000000-0000-4000-8000-000000000007',
    'Two-step values', $data${"rewards":[1,2],"values":[1,1,0],"gamma":1,"lambda":0.5}$data$, $data$[1.5,1.0]$data$, true, 1.0, 3
  ),
  (
    'b2000000-0000-4000-8000-000000000075',
    'b1000000-0000-4000-8000-000000000008',
    'Positive clipping', $data${"ratios":[1.3],"advantages":[2],"epsilon":0.2}$data$, $data$2.4$data$, true, 1.0, 4
  ),
  (
    'b2000000-0000-4000-8000-000000000076',
    'b1000000-0000-4000-8000-000000000008',
    'Negative clipping', $data${"ratios":[0.7],"advantages":[-2],"epsilon":0.1}$data$, $data$-1.8$data$, true, 1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000077',
    'b1000000-0000-4000-8000-000000000009',
    'Two rewards', $data${"rewards":[0,1]}$data$, $data$[-1.0,1.0]$data$, true, 1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000078',
    'b1000000-0000-4000-8000-000000000009',
    'Symmetric spread', $data${"rewards":[-2,0,2]}$data$, $data$[-1.224745,0.0,1.224745]$data$, true, 1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000079',
    'b1000000-0000-4000-8000-000000000010',
    'Quarter pitch', $data${"rpy":[0,1.5707963267948966,0]}$data$, $data$[0.0,0.707107,0.0,0.707107]$data$, true, 1.0, 3
  ),
  (
    'b2000000-0000-4000-8000-000000000080',
    'b1000000-0000-4000-8000-000000000010',
    'Combined turns', $data${"rpy":[1.5707963267948966,1.5707963267948966,0]}$data$, $data$[0.5,0.5,-0.5,0.5]$data$, true, 1.0, 4
  ),
  (
    'b2000000-0000-4000-8000-000000000081',
    'b1000000-0000-4000-8000-000000000011',
    'Two z turns', $data${"q1":[0,0,0.7071067811865476,0.7071067811865476],"q2":[0,0,0.7071067811865476,0.7071067811865476]}$data$, $data$[0.0,0.0,1.0,0.0]$data$, true, 1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000082',
    'b1000000-0000-4000-8000-000000000011',
    'Identity right', $data${"q1":[0.5,0.5,0.5,0.5],"q2":[0,0,0,1]}$data$, $data$[0.5,0.5,0.5,0.5]$data$, true, 1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000083',
    'b1000000-0000-4000-8000-000000000012',
    'Half yaw turn', $data${"q1":[0,0,0,1],"q2":[0,0,0.707107,0.707107],"t":0.5}$data$, $data$[0.0,0.0,0.382683,0.92388]$data$, true, 1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000084',
    'b1000000-0000-4000-8000-000000000012',
    'Same quaternion', $data${"q1":[0,0,0,1],"q2":[0,0,0,1],"t":0.25}$data$, $data$[0.0,0.0,0.0,1.0]$data$, true, 1.0, 3
  ),
  (
    'b2000000-0000-4000-8000-000000000085',
    'b1000000-0000-4000-8000-000000000013',
    'Negative point', $data${"rotation":[[1,0,0],[0,1,0],[0,0,1]],"translation":[0,0,0],"point":[-1,2,3]}$data$, $data$[-1,2,3]$data$, true, 1.0, 4
  ),
  (
    'b2000000-0000-4000-8000-000000000086',
    'b1000000-0000-4000-8000-000000000013',
    'Half turn', $data${"rotation":[[-1,0,0],[0,-1,0],[0,0,1]],"translation":[0,1,0],"point":[2,1,0]}$data$, $data$[-2,0,0]$data$, true, 1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000087',
    'b1000000-0000-4000-8000-000000000014',
    'All noise', $data${"alpha_bar":0,"x0":[1,2],"noise":[3,4]}$data$, $data$[3.0,4.0]$data$, true, 1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000088',
    'b1000000-0000-4000-8000-000000000014',
    'Half noise', $data${"alpha_bar":0.5,"x0":[0,0],"noise":[1,1]}$data$, $data$[0.707107,0.707107]$data$, true, 1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000089',
    'b1000000-0000-4000-8000-000000000015',
    'Constant schedule', $data${"beta_start":0.2,"beta_end":0.2,"steps":3}$data$, $data$[0.2,0.2,0.2]$data$, true, 1.0, 3
  ),
  (
    'b2000000-0000-4000-8000-000000000090',
    'b1000000-0000-4000-8000-000000000015',
    'Two steps', $data${"beta_start":-0.1,"beta_end":0.1,"steps":2}$data$, $data$[-0.1,0.1]$data$, true, 1.0, 4
  ),
  (
    'b2000000-0000-4000-8000-000000000091',
    'b1000000-0000-4000-8000-000000000016',
    'No movement', $data${"x0":[1,2,3],"x1":[1,2,3]}$data$, $data$[0,0,0]$data$, true, 1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000092',
    'b1000000-0000-4000-8000-000000000016',
    'Signed movement', $data${"x0":[-1,2],"x1":[0,-2]}$data$, $data$[1,-4]$data$, true, 1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000093',
    'b1000000-0000-4000-8000-000000000017',
    'Capacity one', $data${"capacity":1,"items":["a","b"],"sample_indices":[0]}$data$, $data$["b"]$data$, true, 1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000094',
    'b1000000-0000-4000-8000-000000000017',
    'Empty buffer', $data${"capacity":3,"items":[],"sample_indices":[]}$data$, $data$[]$data$, true, 1.0, 3
  ),
  (
    'b2000000-0000-4000-8000-000000000095',
    'b1000000-0000-4000-8000-000000000018',
    'Weighted blend', $data${"chunks":[[[0,0]],[[4,8]]],"weights":[1,3]}$data$, $data$[[3.0,6.0]]$data$, true, 1.0, 4
  ),
  (
    'b2000000-0000-4000-8000-000000000096',
    'b1000000-0000-4000-8000-000000000018',
    'Single chunk', $data${"chunks":[[[1,2],[3,4]]],"weights":[2]}$data$, $data$[[1.0,2.0],[3.0,4.0]]$data$, true, 1.0, 0
  ),
  (
    'b2000000-0000-4000-8000-000000000097',
    'b1000000-0000-4000-8000-000000000019',
    'Large stride', $data${"sequence":[0,1,2,3,4,5],"window":4,"stride":3}$data$, $data$[[0,1,2,3]]$data$, true, 1.0, 1
  ),
  (
    'b2000000-0000-4000-8000-000000000098',
    'b1000000-0000-4000-8000-000000000019',
    'Empty sequence', $data${"sequence":[],"window":1,"stride":1}$data$, $data$[]$data$, true, 1.0, 2
  ),
  (
    'b2000000-0000-4000-8000-000000000099',
    'b1000000-0000-4000-8000-000000000020',
    'Robotics token', $data${"tokens":["robot","arm","robot","arm","arm"],"k":1}$data$, $data$[["arm",3]]$data$, true, 1.0, 3
  ),
  (
    'b2000000-0000-4000-8000-000000000100',
    'b1000000-0000-4000-8000-000000000020',
    'All equal tokens', $data${"tokens":["z","y","x","z","y","x"],"k":3}$data$, $data$[["x",2],["y",2],["z",2]]$data$, true, 1.0, 4
  );

insert into public.coding_problem_topics (problem_id, topic_id, weight) values
  ('b1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000002', 1.0),
  ('b1000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002', 1.0),
  ('b1000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000003', 1.0),
  ('b1000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000003', 1.0),
  ('b1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000004', 1.0),
  ('b1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000009', 1.0),
  ('b1000000-0000-4000-8000-000000000007', 'd1000000-0000-4000-8000-000000000010', 1.0),
  ('b1000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-000000000010', 1.0),
  ('b1000000-0000-4000-8000-000000000009', 'd1000000-0000-4000-8000-000000000011', 1.0),
  ('b1000000-0000-4000-8000-000000000010', 'd1000000-0000-4000-8000-000000000014', 1.0),
  ('b1000000-0000-4000-8000-000000000011', 'd1000000-0000-4000-8000-000000000014', 1.0),
  ('b1000000-0000-4000-8000-000000000012', 'd1000000-0000-4000-8000-000000000014', 1.0),
  ('b1000000-0000-4000-8000-000000000013', 'd1000000-0000-4000-8000-000000000014', 1.0),
  ('b1000000-0000-4000-8000-000000000014', 'd1000000-0000-4000-8000-000000000008', 1.0),
  ('b1000000-0000-4000-8000-000000000015', 'd1000000-0000-4000-8000-000000000008', 1.0),
  ('b1000000-0000-4000-8000-000000000016', 'd1000000-0000-4000-8000-000000000008', 1.0),
  ('b1000000-0000-4000-8000-000000000017', 'd1000000-0000-4000-8000-000000000013', 1.0),
  ('b1000000-0000-4000-8000-000000000018', 'd1000000-0000-4000-8000-000000000001', 1.0),
  ('b1000000-0000-4000-8000-000000000019', 'd1000000-0000-4000-8000-000000000005', 1.0),
  ('b1000000-0000-4000-8000-000000000020', 'd1000000-0000-4000-8000-000000000012', 1.0);

-- Link representative interview prompts to hands-on exercises.
update public.interview_questions iq
set coding_problem_id = p.id
from public.coding_problems p
where p.slug = case iq.question_id
  when 'f1000000-0000-4000-8000-000000000001' then 'scaled-dot-product-attention'
  when 'f1000000-0000-4000-8000-000000000005' then 'blend-overlapping-action-chunks'
  when 'f1000000-0000-4000-8000-000000000009' then 'transform-point-with-se3'
  else null
end;

 -- ---------------------------------------------------------------------------
-- question_topics
-- ---------------------------------------------------------------------------

insert into public.question_topics (question_id, topic_id, weight) values
  ('f1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000003', 1.0),
  ('f1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000004', 1.0),
  ('f1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000002', 0.6),

  ('f1000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000005', 1.0),
  ('f1000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000003', 0.7),
  ('f1000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002', 0.5),

  ('f1000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000010', 1.0),
  ('f1000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000011', 1.0),
  ('f1000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000009', 0.8),

  ('f1000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000011', 1.0),
  ('f1000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000009', 0.8),
  ('f1000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000010', 0.5),

  ('f1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000001', 0.9),
  ('f1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000006', 0.8),
  ('f1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000013', 0.4),

  ('f1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000008', 1.0),
  ('f1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000001', 0.8),
  ('f1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000012', 0.5),

  ('f1000000-0000-4000-8000-000000000007', 'd1000000-0000-4000-8000-000000000006', 1.0),
  ('f1000000-0000-4000-8000-000000000007', 'd1000000-0000-4000-8000-000000000001', 0.9),
  ('f1000000-0000-4000-8000-000000000007', 'd1000000-0000-4000-8000-000000000002', 0.4),

  ('f1000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-000000000007', 1.0),
  ('f1000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-000000000001', 0.8),

  ('f1000000-0000-4000-8000-000000000009', 'd1000000-0000-4000-8000-000000000014', 1.0),
  ('f1000000-0000-4000-8000-000000000009', 'd1000000-0000-4000-8000-000000000012', 0.9),

  ('f1000000-0000-4000-8000-000000000010', 'd1000000-0000-4000-8000-000000000013', 1.0),
  ('f1000000-0000-4000-8000-000000000010', 'd1000000-0000-4000-8000-000000000012', 0.8),
  ('f1000000-0000-4000-8000-000000000010', 'd1000000-0000-4000-8000-000000000001', 0.6);

commit;
