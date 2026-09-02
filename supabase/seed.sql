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
  ('c1000000-0000-4000-8000-000000000001', 'ByteDance',     'bytedance',             'CN', '互联网 / AI',       '拥有具身智能研究团队（GR-3、Robix）的互联网公司。'),
  ('c1000000-0000-4000-8000-000000000002', 'NVIDIA',        'nvidia',                'US', '半导体 / AI', '提供 Isaac、GR00T 和 Jetson 等 GPU 平台与机器人技术栈。'),
  ('c1000000-0000-4000-8000-000000000003', 'Physical Intelligence', 'physical-intelligence', 'US', '机器人 / AI', '开发 pi0、pi0-FAST 等通用机器人基础模型。'),
  ('c1000000-0000-4000-8000-000000000004', 'Figure AI',     'figure-ai',             'US', '机器人',            '借助 Helmsman VLA 模型开发面向通用任务的人形机器人。'),
  ('c1000000-0000-4000-8000-000000000005', 'Unitree',       'unitree',               'CN', '机器人',            '提供广泛用于科研硬件平台的四足与人形机器人。'),
  ('c1000000-0000-4000-8000-000000000006', 'AgiBot',        'agibot',                'CN', '机器人 / AI',       '开发智元人形机器人系列与 GO-1 模型的具身智能公司。'),
  ('c1000000-0000-4000-8000-000000000007', 'DJI',           'dji',                   'CN', '机器人',            '提供消费级与企业级无人机，以及机载感知和飞控技术。');

-- ---------------------------------------------------------------------------
-- positions
-- ---------------------------------------------------------------------------

insert into public.positions (id, company_id, title, slug, category, location) values
  ('a1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', '具身智能算法工程师', 'embodied-ai-algorithm-engineer', '算法',  '北京 / 深圳'),
  ('a1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', '机器人系统工程师',      'robotics-systems-engineer',      '系统',    '圣克拉拉, CA'),
  ('a1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000003', '具身智能研究科学家', 'embodied-ai-research-scientist', '研究',   '旧金山, CA'),
  ('a1000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000004', 'VLA 模型工程师',             'vla-model-engineer',             '模型',      '桑尼维尔, CA'),
  ('a1000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000006', '机器人学习工程师',        'robot-learning-engineer',        '机器人学习', '上海');

insert into public.positions (id, company_id, title, slug, category, location) values
  ('a1000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000005', '机器人学习实习生', 'robot-learning-intern', '机器人学习', '杭州'),
  ('a1000000-0000-4000-8000-000000000007', 'c1000000-0000-4000-8000-000000000007', '感知算法工程师', 'perception-algorithm-engineer', '感知', '深圳'),
  ('a1000000-0000-4000-8000-000000000008', 'c1000000-0000-4000-8000-000000000003', 'VLA 研究实习生', 'vla-research-intern', '研究', '旧金山, CA'),
  ('a1000000-0000-4000-8000-000000000009', 'c1000000-0000-4000-8000-000000000004', '人形机器人学习工程师', 'humanoid-learning-engineer', '机器人学习', '桑尼维尔, CA'),
  ('a1000000-0000-4000-8000-000000000010', 'c1000000-0000-4000-8000-000000000006', '机器人学习应届生', 'robot-learning-new-grad', '机器人学习', '上海'),
  ('a1000000-0000-4000-8000-000000000011', 'c1000000-0000-4000-8000-000000000002', '机器人学习实习生', 'robot-learning-intern', '研究', '圣克拉拉, CA'),
  ('a1000000-0000-4000-8000-000000000012', 'c1000000-0000-4000-8000-000000000001', 'VLA 研究实习生', 'vla-research-intern', '研究', '北京');

-- ---------------------------------------------------------------------------
-- topics
-- ---------------------------------------------------------------------------

insert into public.topics (id, name, slug, parent_id, description) values
  ('d1000000-0000-4000-8000-000000000001', '具身智能',      'embodied-ai',      null,                                 '能够在物理世界中感知、推理并采取行动的智能体。'),
  ('d1000000-0000-4000-8000-000000000002', 'Transformer',      'transformer',      null,                                 '广泛用于视觉、语言和控制的纯 Attention 序列架构。'),
  ('d1000000-0000-4000-8000-000000000003', 'Attention',        'attention',        'd1000000-0000-4000-8000-000000000002', '基于内容对一组 value 向量进行加权汇聚。'),
  ('d1000000-0000-4000-8000-000000000004', 'QKV',              'qkv',              'd1000000-0000-4000-8000-000000000003', '缩放点积 Attention 中的 Query、Key 和 Value 投影。'),
  ('d1000000-0000-4000-8000-000000000005', 'KV Cache',         'kv-cache',         'd1000000-0000-4000-8000-000000000003', '复用过去的 key/value 张量，降低自回归解码的计算成本。'),
  ('d1000000-0000-4000-8000-000000000006', 'VLA',              'vla',              'd1000000-0000-4000-8000-000000000001', '将观测和指令映射为机器人动作的 Vision-Language-Action 模型。'),
  ('d1000000-0000-4000-8000-000000000007', '世界模型',      'world-model',      'd1000000-0000-4000-8000-000000000001', '用于预测、规划或生成数据的学习型动力学模型。'),
  ('d1000000-0000-4000-8000-000000000008', 'Diffusion Policy', 'diffusion-policy', 'd1000000-0000-4000-8000-000000000001', '通过对轨迹进行迭代去噪来生成动作。'),
  ('d1000000-0000-4000-8000-000000000009', 'RL',               'rl',               'd1000000-0000-4000-8000-000000000001', '强化学习：根据奖励信号优化行为。'),
  ('d1000000-0000-4000-8000-000000000010', 'PPO',              'ppo',              'd1000000-0000-4000-8000-000000000009', '使用截断代理目标的 on-policy policy-gradient 方法。'),
  ('d1000000-0000-4000-8000-000000000011', 'GRPO',             'grpo',             'd1000000-0000-4000-8000-000000000009', 'Group Relative Policy Optimisation：不需要 critic 的相对优势估计。'),
  ('d1000000-0000-4000-8000-000000000012', '机器人学',         'robotics',         'd1000000-0000-4000-8000-000000000001', '涵盖运动学、动力学、控制和硬件在环等问题。'),
  ('d1000000-0000-4000-8000-000000000013', '机器人数据',       'robot-data',       'd1000000-0000-4000-8000-000000000012', '机器人的遥操作、采集、清洗和轨迹整理。'),
  ('d1000000-0000-4000-8000-000000000014', 'SE(3)',            'se3',              'd1000000-0000-4000-8000-000000000012', '三维空间中刚体旋转和平移组成的特殊欧氏群。');

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

-- ---------------------------------------------------------------------------
-- Chinese display content
-- ---------------------------------------------------------------------------

update public.questions
set
  title = case id
    when 'f1000000-0000-4000-8000-000000000001' then 'Attention 中的 Q、K 和 V 是什么？'
    when 'f1000000-0000-4000-8000-000000000002' then '为什么 KV Cache 有用？'
    when 'f1000000-0000-4000-8000-000000000003' then 'PPO 和 GRPO 有什么区别？'
    when 'f1000000-0000-4000-8000-000000000004' then '为什么 GRPO 不需要 critic？'
    when 'f1000000-0000-4000-8000-000000000005' then '什么是 Action Chunking？'
    when 'f1000000-0000-4000-8000-000000000006' then '什么是 Diffusion Policy？'
    when 'f1000000-0000-4000-8000-000000000007' then '什么是 Vision-Language-Action 模型？'
    when 'f1000000-0000-4000-8000-000000000008' then '什么是动作条件世界模型？'
    when 'f1000000-0000-4000-8000-000000000009' then '什么是 SE(3)？'
    when 'f1000000-0000-4000-8000-000000000010' then '机器人数据采集流水线主要有哪些阶段？'
  end,
  summary = case id
    when 'f1000000-0000-4000-8000-000000000001' then 'Query 负责提出查询，Key 用于索引，Value 携带最终汇聚的内容。'
    when 'f1000000-0000-4000-8000-000000000002' then 'KV Cache 用额外内存换取计算量，让每个新 token 只需关注自身和历史缓存。'
    when 'f1000000-0000-4000-8000-000000000003' then 'PPO 使用学习到的 critic 评估动作，GRPO 则使用采样组的平均奖励作为基线。'
    when 'f1000000-0000-4000-8000-000000000004' then 'GRPO 使用同一 prompt 的采样组平均奖励作为优势基线，因此不需要额外的 critic 网络。'
    when 'f1000000-0000-4000-8000-000000000005' then '一次预测一小段未来动作，执行后再重新观测和规划。'
    when 'f1000000-0000-4000-8000-000000000006' then '通过迭代去噪生成动作轨迹的视觉运动策略。'
    when 'f1000000-0000-4000-8000-000000000007' then '同时接收图像和语言指令，并输出机器人动作的模型。'
    when 'f1000000-0000-4000-8000-000000000008' then '根据当前状态和候选动作预测未来观测的学习型动力学模型。'
    when 'f1000000-0000-4000-8000-000000000009' then '三维空间中的特殊欧氏群，表示刚体的旋转和平移。'
    when 'f1000000-0000-4000-8000-000000000010' then '任务定义、遥操作采集、同步校准、清洗标注、整理以及训练期混合。'
  end,
  canonical_answer = case id
    when 'f1000000-0000-4000-8000-000000000001' then '给定输入嵌入 X，Attention 学习三个线性投影：Q = XW_Q、K = XW_K、V = XW_V。Query 是寻找信息的向量，Key 是每个 token 用于匹配的标签，Value 则是实际参与加权混合的内容。分数按照 QK^T / sqrt(d_k) 计算，经过 softmax 后对 V 做加权求和。因此，Key 决定取多少，Value 决定取什么。'
    when 'f1000000-0000-4000-8000-000000000002' then '自回归解码在每一步都会重新计算整个前缀的 Attention。长度为 n 时，朴素做法需要 O(n^2) 的工作量。早先 token 的 key/value 在生成后不会改变，因此可以缓存并复用。生成新 token 时，只需计算自己的 Q、K、V，并与缓存的 K/V 做 Attention：每一步从 O(n^2) 降为 O(n)，代价是额外的 O(n) 内存。'
    when 'f1000000-0000-4000-8000-000000000003' then 'PPO 用 value network，也就是 critic，估计 advantage，通常写作 A = GAE(rewards, V(s))。GRPO 完全移除了 critic：对同一个 prompt 采样 G 个输出，用 reward model 或 verifier 打分，再在组内归一化 A_i = (r_i - mean(r)) / std(r)。最后仍然使用带 clipping 的 PPO 风格目标和 KL 项来更新 policy。'
    when 'f1000000-0000-4000-8000-000000000004' then '优势只需要一个与当前动作无关的基线：A(s, a) = Q(s, a) - b(s)。学习到的 critic V(s) 只是 b(s) 的一种实现。GRPO 对同一个 prompt 采样 G 个输出，并把这组样本的平均奖励作为 b(s)。由于组内样本共享同一个 prompt，这个均值可以作为与动作无关的基线，不需要额外的 value loss 或 GAE。'
    when 'f1000000-0000-4000-8000-000000000005' then '策略不再把一个观测映射为一个动作，而是输出 H 个动作组成的 chunk：a_t 到 a_{t+H-1}。机器人执行这段动作后重新观测。这样可以摊薄一次昂贵前向计算的成本，并缩短 credit assignment 的有效时间跨度。chunk 太短会带来抖动和更高的计算开销，太长则会降低对漂移和接触变化的反应能力。'
    when 'f1000000-0000-4000-8000-000000000006' then 'Diffusion Policy 把动作生成视为条件去噪。先将长度为 H 的动作轨迹初始化为高斯噪声，再使用以观测 o 为条件的去噪网络，经过 K 步逐渐移除噪声。训练时从干净轨迹出发加噪并预测噪声，推理时执行去噪后的动作 chunk，并可结合 receding-horizon control。它能够表示多峰示范行为，但代价是每次决策需要多步去噪，带来推理延迟。'
    when 'f1000000-0000-4000-8000-000000000007' then 'VLA 在 Vision-Language Model 的基础上增加 action head。一个或多个相机的观测被编码成视觉 token，语言指令经过 token 化后与视觉信息由预训练 VLM backbone 融合。独立的 action expert 再把融合表示映射为连续或离散动作，并使用机器人示范数据训练。它的优势是能够迁移互联网图像文本预训练得到的语义知识，局限则包括闭环延迟、深度和力觉不足以及语义理解到精细接触操作之间的差距。'
    when 'f1000000-0000-4000-8000-000000000008' then '动作条件世界模型近似 p(o_{t+1} | o_{t-k..t}, a_t..a_{t+H-1})。它在轨迹数据上训练，不像 policy 那样直接选择动作，而是回答候选动作序列会带来什么未来观测，因此可以用于 model-predictive control、规划和生成合成训练数据。设计上的关键是 latent space：像素空间容易监督但会浪费容量，latent space 更紧凑高效却需要良好正则化，否则可能发生模型利用。'
    when 'f1000000-0000-4000-8000-000000000009' then 'SE(3) 是形如 x -> Rx + t 的刚体变换群，其中 R 属于 SO(3)，t 属于 R^3，共有六个自由度。它通常表示为 4x4 齐次矩阵 [[R, t], [0, 1]]，这样变换组合可以直接写成矩阵乘法。在机器人学中还要注意参考坐标系：一个位姿只有相对于明确的 frame 才有意义。'
    when 'f1000000-0000-4000-8000-000000000010' then '典型流程包括：1）定义任务、机器人本体和成功标准；2）以固定控制频率进行遥操作采集，记录关节状态、末端位姿、相机、力矩和夹爪状态；3）完成时间同步、相机标定和手眼标定；4）删除失败或空闲片段并处理丢帧；5）标注语言指令、子任务和成功标签；6）整理数据、平衡任务与场景多样性，并决定机器人数据与仿真或人类视频的混合比例。'
  end,
  deep_answer = case id
    when 'f1000000-0000-4000-8000-000000000001' then 'Q、K、V 的拆分让匹配和内容传递彼此独立。如果直接对输入做平均，一个 token 只能按自身 embedding 与其他 token 的相似度参与。拆开后，Key 可以表达这是模型正在寻找的类型，Value 可以表达被选中后真正贡献的内容。多头 Attention 中每个 head 都有自己的 W_Q、W_K、W_V，可以学习语法、指代或几何等不同关系。Cross-Attention 中 Q 来自 decoder 或动作流，K 和 V 来自观测或语言编码器，这正是 VLA 中这种不对称结构重要的原因。'
    when 'f1000000-0000-4000-8000-000000000002' then 'KV Cache 变大后，瓶颈通常从 FLOPs 转向内存带宽：解码要在 layers、heads、seq 和 d_k 组成的张量上进行带宽受限的读取。因此才会出现 multi-query attention、grouped-query attention 和 KV-cache quantisation，它们缩小的是缓存而不是计算。对机器人来说，运行在机载 GPU 上的 VLA 往往有严格的 10 到 50 Hz 延迟预算，可以采用分块 prompt、对最近帧使用 sliding-window attention，或将 KV 量化为 int8。'
    when 'f1000000-0000-4000-8000-000000000003' then '两者最实际的区别是成本和方差。去掉 critic 可以省下一个接近 policy 大小的模型，包括参数、优化器状态和前向反向计算，这对 7B 级别以上的 VLA 很重要。代价是组相对优势比拟合出的 value function 更嘈杂，所以 GRPO 通常需要较大的采样组，并且更适合正确性明确的可验证奖励。奖励稠密且经过良好塑形，或样本效率最重要时，PPO 仍然可能更合适。'
    when 'f1000000-0000-4000-8000-000000000004' then 'critic 提供的是期望回报基线，能够解释 prompt 本身有多难；GRPO 的采样组只是用有限个样本估计这个期望，组太小时方差会变大。除以组内标准差可以增强信号，但当所有样本得分接近时标准差会接近零，所以实现通常会 clipping 或跳过退化组。这也是 GRPO 适合数学、代码和经过单元测试的机器人子程序等可验证任务的原因。'
    when 'f1000000-0000-4000-8000-000000000005' then 'Action Chunking 还有三个重要后果。第一是延迟：大模型不必在每个控制周期都完整运行，而是每隔一段时间重新规划并执行 chunk。第二是误差累积：重新规划次数变少后，策略纠正漂移的机会也变少，接触丰富的任务不能使用过长 chunk。第三是动作平滑：相邻 chunk 需要通过 temporal ensembling 或重叠预测上的指数平滑来衔接。'
    when 'f1000000-0000-4000-8000-000000000006' then 'Diffusion Policy 的表示能力来自对多模态行为的建模。确定性的 MSE action head 往往会把多个有效策略平均成一个无效动作，而 diffusion head 可以表达多个 mode，再采样一条具体轨迹。它也能自然支持 score-based conditioning 和固定起点或目标等 inpainting 约束。主要成本是每次决策要做 K 次去噪，以及对 noise schedule 的敏感性；DDIM sampler、蒸馏和 one-step policy 可以缓解延迟。'
    when 'f1000000-0000-4000-8000-000000000007' then 'VLA 的迁移能力来自大规模图像文本预训练，例如 backbone 可以先学会红色杯子在左边这类语义，再用较少的机器人数据学习动作。面试中可以继续讨论连续动作与离散动作、单相机与多相机、本体感知、action chunking，以及不同机器人共享 backbone 并使用本体专属 action head 的 cross-embodiment training。还应主动说明闭环延迟、RGB 缺少深度和力觉，以及语义理解与精细操作之间的差距。'
    when 'f1000000-0000-4000-8000-000000000008' then '世界模型的价值在于把昂贵的真实机器人交互摊销到大量被动视频和少量带动作数据上。像 Dreamer 风格的 RSSM 一样，latent-space rollout 更紧凑，但必须防止 latent collapse。另一个已知失败模式是 model exploitation：优化器找到模型认为很好、但其实落在模型错误高置信区域的动作序列。因此 rollout 通常不会太长，并且需要和真实交互结合。'
    when 'f1000000-0000-4000-8000-000000000009' then '旋转的表示方式很关键。SO(3) 是弯曲流形，直接使用三个 Euler angle 会产生奇异点和非欧氏插值问题，常见替代方案包括 quaternion、rotation matrix 和 Lie algebra se(3) 中的 6D twist。另一个关键点是 equivariance：以 SE(3) 为对称群设计的模型可以跨物体位姿和相机视角泛化，而不是记住每个姿态。'
    when 'f1000000-0000-4000-8000-000000000010' then '数据流水线的风险点往往比流程名称更值得讨论。硬件漂移和重新标定会悄悄让旧数据失效，因此每次采集都应绑定校准版本。遥操作通常是吞吐瓶颈，可以用跨本体数据集、仿真增强和人类视频预训练缓解。示范质量通常比数量重要：少量一致、平滑、成功的轨迹可能优于大量噪声数据。最后还要固定每种机器人本体的 action space 和 observation space，否则本月采集的数据可能无法训练下季度的 policy。'
  end
where id in (
  'f1000000-0000-4000-8000-000000000001',
  'f1000000-0000-4000-8000-000000000002',
  'f1000000-0000-4000-8000-000000000003',
  'f1000000-0000-4000-8000-000000000004',
  'f1000000-0000-4000-8000-000000000005',
  'f1000000-0000-4000-8000-000000000006',
  'f1000000-0000-4000-8000-000000000007',
  'f1000000-0000-4000-8000-000000000008',
  'f1000000-0000-4000-8000-000000000009',
  'f1000000-0000-4000-8000-000000000010'
);

update public.interviews
set
  title = case id
    when 'ea000000-0000-4000-8000-000000000001' then '具身智能研究科学家面经 — 2025 春季'
    when 'ea000000-0000-4000-8000-000000000002' then 'NVIDIA 机器人系统工程师面经 — 2025 夏季'
    when 'ea000000-0000-4000-8000-000000000003' then 'ByteDance 具身智能算法工程师面经 — 2024 秋季'
    when 'ea000000-0000-4000-8000-000000000004' then 'VLA 研究实习生面经 — 2027 春季'
    when 'ea000000-0000-4000-8000-000000000005' then '机器人学习实习生面经 — 2026 秋季'
    when 'ea000000-0000-4000-8000-000000000006' then 'VLA 研究实习生面经 — 2027 冬季'
    when 'ea000000-0000-4000-8000-000000000007' then '人形机器人学习工程师面经 — 2027 春季'
    when 'ea000000-0000-4000-8000-000000000008' then '机器人学习实习生面经 — 2026 夏季'
    when 'ea000000-0000-4000-8000-000000000009' then '机器人学习应届生面经 — 2027 春季'
    when 'ea000000-0000-4000-8000-000000000010' then '感知算法工程师面经 — 2026 秋季'
    when 'ea000000-0000-4000-8000-000000000011' then '具身智能算法工程师面经 — 2026 夏季'
    when 'ea000000-0000-4000-8000-000000000012' then '机器人系统工程师面经 — 2027 春季'
    when 'ea000000-0000-4000-8000-000000000013' then '具身智能研究科学家面经 — 2026 秋季'
    when 'ea000000-0000-4000-8000-000000000014' then '人形机器人学习工程师面经 — 2026 冬季'
    when 'ea000000-0000-4000-8000-000000000015' then '机器人学习实习生面经 — 2027 秋季'
    when 'ea000000-0000-4000-8000-000000000016' then '机器人学习应届生面经 — 2026 夏季'
    when 'ea000000-0000-4000-8000-000000000017' then '感知算法工程师面经 — 2027 春季'
    when 'ea000000-0000-4000-8000-000000000018' then 'VLA 研究实习生面经 — 2026 冬季'
    when 'ea000000-0000-4000-8000-000000000019' then '机器人学习实习生面经 — 2025 秋季'
    when 'ea000000-0000-4000-8000-000000000020' then 'VLA 研究实习生面经 — 2025 冬季'
  end,
  location = case id
    when 'ea000000-0000-4000-8000-000000000001' then '旧金山, CA'
    when 'ea000000-0000-4000-8000-000000000002' then '圣克拉拉, CA'
    when 'ea000000-0000-4000-8000-000000000003' then '北京'
    when 'ea000000-0000-4000-8000-000000000004' then '北京'
    when 'ea000000-0000-4000-8000-000000000005' then '圣克拉拉, CA'
    when 'ea000000-0000-4000-8000-000000000006' then '旧金山, CA'
    when 'ea000000-0000-4000-8000-000000000007' then '桑尼维尔, CA'
    when 'ea000000-0000-4000-8000-000000000008' then '杭州'
    when 'ea000000-0000-4000-8000-000000000009' then '上海'
    when 'ea000000-0000-4000-8000-000000000010' then '深圳'
    when 'ea000000-0000-4000-8000-000000000011' then '北京'
    when 'ea000000-0000-4000-8000-000000000012' then '圣克拉拉, CA'
    when 'ea000000-0000-4000-8000-000000000013' then '旧金山, CA'
    when 'ea000000-0000-4000-8000-000000000014' then '桑尼维尔, CA'
    when 'ea000000-0000-4000-8000-000000000015' then '杭州'
    when 'ea000000-0000-4000-8000-000000000016' then '上海'
    when 'ea000000-0000-4000-8000-000000000017' then '上海'
    when 'ea000000-0000-4000-8000-000000000018' then '北京'
    when 'ea000000-0000-4000-8000-000000000019' then '圣克拉拉, CA'
    when 'ea000000-0000-4000-8000-000000000020' then '旧金山, CA'
  end,
  summary = case id
    when 'ea000000-0000-4000-8000-000000000001' then '开发示例：涵盖 Action Chunking、Diffusion Policy、VLA 设计和世界模型。'
    when 'ea000000-0000-4000-8000-000000000002' then '开发示例：重点考察 Attention 系统、推理延迟、SE(3) 和机器人数据流水线。'
    when 'ea000000-0000-4000-8000-000000000003' then '开发示例：讨论 PPO 与 GRPO、VLA 语义、Action Chunking 和控制环预算。'
    when 'ea000000-0000-4000-8000-000000000004' then '开发示例：讨论 VLA 与强化学习，并包含一道 Coding 题。'
    when 'ea000000-0000-4000-8000-000000000005' then '开发示例：涵盖 Attention、机器人数据和一个小型控制工具的实现。'
    when 'ea000000-0000-4000-8000-000000000006' then '开发示例：涵盖 Diffusion Policy、Action Chunking、世界模型和数据质量。'
    when 'ea000000-0000-4000-8000-000000000007' then '开发示例：讨论 VLA 架构、机器人数据和刚体表示。'
    when 'ea000000-0000-4000-8000-000000000008' then '开发示例：重点考察 Action Chunking、SE(3) 和高质量示范采集。'
    when 'ea000000-0000-4000-8000-000000000009' then '开发示例：讨论无 critic 的策略优化、VLA grounding 和数据整理。'
    when 'ea000000-0000-4000-8000-000000000010' then '开发示例：结合 Attention、SE(3) 和感知系统中的工程取舍。'
    when 'ea000000-0000-4000-8000-000000000011' then '开发示例：讨论策略优化和在控制环中部署大模型策略。'
    when 'ea000000-0000-4000-8000-000000000012' then '开发示例：考察 KV Cache 直觉、坐标系和数据流水线设计。'
    when 'ea000000-0000-4000-8000-000000000013' then '开发示例：重点讨论 Diffusion Policy 推理和动作序列建模。'
    when 'ea000000-0000-4000-8000-000000000014' then '开发示例：包含招聘初筛、技术面、研究深入讨论和 Coding 面。'
    when 'ea000000-0000-4000-8000-000000000015' then '开发示例：用较短的初筛考察控制表示和机器人示范。'
    when 'ea000000-0000-4000-8000-000000000016' then '开发示例：讨论示范回放、VLA 条件建模和 RL 基线。'
    when 'ea000000-0000-4000-8000-000000000017' then '开发示例：讨论 Attention、视觉特征、刚体变换和控制延迟。'
    when 'ea000000-0000-4000-8000-000000000018' then '开发示例：讨论 VLA grounding 以及如何评估动作预测。'
    when 'ea000000-0000-4000-8000-000000000019' then '开发示例：讨论 Transformer 推理、机器人数据和 SE(3) 约定。'
    when 'ea000000-0000-4000-8000-000000000020' then '开发示例：讨论 Action Chunking、Diffusion Policy 和长时域数据。'
  end,
  language = 'zh-CN'
where id in (
  'ea000000-0000-4000-8000-000000000001', 'ea000000-0000-4000-8000-000000000002',
  'ea000000-0000-4000-8000-000000000003', 'ea000000-0000-4000-8000-000000000004',
  'ea000000-0000-4000-8000-000000000005', 'ea000000-0000-4000-8000-000000000006',
  'ea000000-0000-4000-8000-000000000007', 'ea000000-0000-4000-8000-000000000008',
  'ea000000-0000-4000-8000-000000000009', 'ea000000-0000-4000-8000-000000000010',
  'ea000000-0000-4000-8000-000000000011', 'ea000000-0000-4000-8000-000000000012',
  'ea000000-0000-4000-8000-000000000013', 'ea000000-0000-4000-8000-000000000014',
  'ea000000-0000-4000-8000-000000000015', 'ea000000-0000-4000-8000-000000000016',
  'ea000000-0000-4000-8000-000000000017', 'ea000000-0000-4000-8000-000000000018',
  'ea000000-0000-4000-8000-000000000019', 'ea000000-0000-4000-8000-000000000020'
);

update public.interview_rounds
set
  title = case round_type
    when 'technical' then '技术面讨论'
    when 'coding' then 'Coding 实战'
    when 'research' then '研究深入讨论'
    when 'manager' then 'Hiring manager 面'
    else '面试轮次'
  end,
  interviewer_role = case round_type
    when 'manager' then 'Hiring manager'
    when 'technical' then '研究或招聘团队'
    else '技术面试官'
  end,
  summary = case round_type
    when 'technical' then '考察基础概念、推理能力和表达。'
    when 'coding' then '考察实际推理、实现能力和工程取舍。'
    when 'research' then '深入讨论研究方向、实验设计和技术取舍。'
    when 'manager' then '讨论项目经验、协作方式和岗位匹配度。'
    else '考察面试相关能力。'
  end;

update public.interview_questions
set original_wording = case question_id
  when 'f1000000-0000-4000-8000-000000000001' then '请解释 Attention 中的 Q、K、V，并说明你会如何测试实现。'
  when 'f1000000-0000-4000-8000-000000000002' then '当机器人策略有严格的延迟预算时，KV Cache 能提供什么帮助？'
  when 'f1000000-0000-4000-8000-000000000003' then '比较 PPO 和 GRPO，具体说明训练时各自需要什么。'
  when 'f1000000-0000-4000-8000-000000000004' then '如果 GRPO 没有 critic，谁来承担 baseline 的作用？'
  when 'f1000000-0000-4000-8000-000000000005' then '请说明为什么策略要预测一段动作，而不是一次只预测一个动作。'
  when 'f1000000-0000-4000-8000-000000000006' then '如何向只做过监督学习的工程师解释 Diffusion Policy？'
  when 'f1000000-0000-4000-8000-000000000007' then 'VLA 与普通视觉策略有什么区别？'
  when 'f1000000-0000-4000-8000-000000000008' then '什么时候学习到的世界模型适合用于机器人规划？'
  when 'f1000000-0000-4000-8000-000000000009' then '如何在 SE(3) 中表示位姿？它相对于哪个坐标系？'
  when 'f1000000-0000-4000-8000-000000000010' then '机器人数据采集流水线中有哪些重要阶段？'
  else case when question_id is null then '请描述你在机器人学习系统中做过的一项实现决策。' else original_wording end
end;

update public.coding_problems
set
  title = case slug
    when 'implement-stable-softmax' then '实现数值稳定的 Softmax'
    when 'implement-layer-normalization' then '实现 Layer Normalization'
    when 'scaled-dot-product-attention' then '实现缩放点积 Attention'
    when 'average-multi-head-attention' then '实现多头 Attention 平均'
    when 'build-causal-attention-mask' then '构建因果 Attention Mask'
    when 'compute-discounted-returns' then '计算折扣回报'
    when 'generalized-advantage-estimation' then '实现广义优势估计（GAE）'
    when 'ppo-clipped-objective' then '实现 PPO Clipped Objective'
    when 'group-relative-advantage' then '计算组相对优势'
    when 'euler-angles-to-quaternion' then '欧拉角转 Quaternion'
    when 'multiply-unit-quaternions' then '相乘两个单位 Quaternion'
    when 'spherical-quaternion-interpolation' then '球面 Quaternion 插值'
    when 'transform-point-with-se3' then '使用 SE(3) 变换点'
    when 'ddpm-forward-noise-step' then '执行 DDPM 前向加噪'
    when 'linear-noise-schedule' then '生成线性噪声调度'
    when 'flow-matching-vector-field' then '计算 Flow Matching 向量场'
    when 'replay-buffer-retention' then '模拟 Replay Buffer 保留'
    when 'blend-overlapping-action-chunks' then '混合重叠的 Action Chunks'
    when 'create-sliding-windows' then '创建滑动窗口'
    when 'top-k-token-frequencies' then '统计 Top-K Token 频率'
  end,
  description = case slug
    when 'implement-stable-softmax' then '为一组 logits 计算数值稳定的 softmax。先减去最大 logit，再进行指数运算，最后返回四舍五入到六位小数的概率。'
    when 'implement-layer-normalization' then '使用总体方差对一个特征向量进行归一化。在平方根中使用给定的 epsilon，并将每个归一化值四舍五入到六位小数。'
    when 'scaled-dot-product-attention' then '实现一个 query 的缩放点积 Attention。对 query-key 分数应用 softmax，并返回四舍五入到四位小数的加权 value 向量。'
    when 'average-multi-head-attention' then '每个 Attention head 都独立地为同一个 query 汇聚 value 向量。计算每个 head 的缩放 Attention，再对所有 head 的输出求平均。'
    when 'build-causal-attention-mask' then '将每一行 Attention 分数转换为因果 softmax：位置 i 只能关注不大于 i 的位置，未来位置的概率必须为零。'
    when 'compute-discounted-returns' then '给定奖励序列和折扣因子，通过从后向前累积奖励，计算每个时间步的回报。'
    when 'generalized-advantage-estimation' then '根据奖励和一个额外的 bootstrap value 计算 GAE advantage。从后向前使用 gamma 和 lambda，并将结果四舍五入到六位小数。'
    when 'ppo-clipped-objective' then '为每个动作计算 PPO clipped surrogate 项并返回平均值。将 ratio 截断到 1 加减 epsilon 后再与 advantage 相乘。'
    when 'group-relative-advantage' then '对同一 prompt 采样的奖励进行标准化。减去组均值并除以总体标准差，退化组返回零。'
    when 'euler-angles-to-quaternion' then '将弧度制的 roll、pitch、yaw 转换为 xyzw 顺序的单位 Quaternion，并将分量四舍五入到六位小数。'
    when 'multiply-unit-quaternions' then '使用 Hamilton product 组合两个 xyzw 顺序的单位 Quaternion，并按 xyzw 顺序返回结果。'
    when 'spherical-quaternion-interpolation' then '沿最短球面路径在两个单位 Quaternion 之间插值。接近平行时才使用线性插值，并返回归一化结果。'
    when 'transform-point-with-se3' then '对一个三维点应用刚体变换。先乘旋转矩阵，再加上平移向量。'
    when 'ddpm-forward-noise-step' then '对每个坐标应用一次前向扩散步骤 x_t = sqrt(alpha_bar) x_0 + sqrt(1 - alpha_bar) epsilon。'
    when 'linear-noise-schedule' then '根据请求的扩散步数，在 beta_start 和 beta_end 之间生成包含两端点的线性 beta 调度。'
    when 'flow-matching-vector-field' then '对于从 x0 到 x1 的直线插值路径，计算恒定的 Flow Matching 目标向量 x1 - x0。'
    when 'replay-buffer-retention' then '插入所有项目后模拟 FIFO Replay Buffer，再从保留下来的 buffer 中读取有效样本索引。'
    when 'blend-overlapping-action-chunks' then '使用标量置信度权重混合 Action Chunks。所有 chunk 形状相同，为每个时间步和动作维度计算加权平均。'
    when 'create-sliding-windows' then '使用窗口大小和步长，将序列切分为完整的滑动窗口，丢弃末尾不完整的窗口。'
    when 'top-k-token-frequencies' then '统计 token 次数，并以 [token, count] 对的形式返回频率最高的 k 个 token。出现并列时按字典序确定顺序。'
  end,
  constraints = case slug
    when 'implement-stable-softmax' then '1 <= len(logits) <= 128' || chr(10) || '输入和输出均为 JSON。'
    when 'implement-layer-normalization' then '1 <= len(values) <= 256' || chr(10) || '输入 JSON 中包含 values 和 eps。'
    when 'scaled-dot-product-attention' then 'Keys 与 query 维度相同。' || chr(10) || '输入和输出均为 JSON。'
    when 'average-multi-head-attention' then '每个 head 的 value 维度相同。' || chr(10) || '将平均后的向量四舍五入到四位小数。'
    when 'build-causal-attention-mask' then '分数矩阵为方阵，最多 64 行。' || chr(10) || '将概率四舍五入到六位小数。'
    when 'compute-discounted-returns' then '0 <= gamma <= 1' || chr(10) || '每个 reward 返回一个值，并四舍五入到六位小数。'
    when 'generalized-advantage-estimation' then 'len(values) = len(rewards) + 1' || chr(10) || '0 <= gamma, lambda <= 1。'
    when 'ppo-clipped-objective' then 'Ratios 和 advantages 长度相同且不为空。' || chr(10) || '将标量结果四舍五入到六位小数。'
    when 'group-relative-advantage' then '1 <= len(rewards) <= 128' || chr(10) || '将每个 advantage 四舍五入到六位小数。'
    when 'euler-angles-to-quaternion' then '角度单位为弧度。' || chr(10) || '使用 roll-pitch-yaw 约定，并返回 [x, y, z, w]。'
    when 'multiply-unit-quaternions' then '输入是 [x, y, z, w] 顺序的单位 Quaternion。' || chr(10) || '将分量四舍五入到六位小数。'
    when 'spherical-quaternion-interpolation' then 'Quaternion 为单位长度，并使用 xyzw 顺序。' || chr(10) || '0 <= t <= 1。'
    when 'transform-point-with-se3' then '旋转矩阵为 3x3，平移和点都是长度为三的向量。' || chr(10) || '将坐标四舍五入到六位小数。'
    when 'ddpm-forward-noise-step' then '0 <= alpha_bar <= 1' || chr(10) || 'x0 和 noise 长度相同。' || chr(10) || '将坐标四舍五入到六位小数。'
    when 'linear-noise-schedule' then 'steps 为正数。' || chr(10) || 'steps 为 1 时返回 beta_start，否则包含两个端点。'
    when 'flow-matching-vector-field' then 'x0 和 x1 长度相同。' || chr(10) || '将每个分量四舍五入到六位小数。'
    when 'replay-buffer-retention' then 'capacity 为正数。' || chr(10) || '忽略保留 buffer 之外的样本索引。'
    when 'blend-overlapping-action-chunks' then '所有 chunk 形状相同，且权重为正数。' || chr(10) || '将每个动作四舍五入到六位小数。'
    when 'create-sliding-windows' then 'window 和 stride 为正数。' || chr(10) || '只返回恰好包含 window 个元素的窗口。'
    when 'top-k-token-frequencies' then '1 <= k <= 不同 token 的数量。' || chr(10) || 'Token 均为字符串。'
  end;

update public.coding_test_cases
set name = '示例 ' || (order_index + 1)
where is_hidden = false;

update public.coding_problems
set starter_code = replace(starter_code, '# TODO: implement the solution', '# TODO：实现该解法');

commit;
