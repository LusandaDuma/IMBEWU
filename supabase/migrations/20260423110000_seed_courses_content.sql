-- Supabase Migration: seed starter LMS content (courses-first)
-- Safe to re-run: uses fixed UUIDs + ON CONFLICT upserts.

do $$
declare
  v_author_id uuid;
begin
  -- Prefer an admin profile as course author; fallback to any auth user.
  select p.id
  into v_author_id
  from public.profiles p
  where p.role = 'admin'
  order by p.updated_at desc nulls last
  limit 1;

  if v_author_id is null then
    select u.id
    into v_author_id
    from auth.users u
    order by u.created_at asc
    limit 1;
  end if;

  if v_author_id is null then
    raise notice 'Skipping seed migration: no auth.users row exists yet for created_by FK.';
    return;
  end if;

  -- -------------------------------
  -- Courses
  -- -------------------------------
  insert into public.courses (id, created_by, title, description, offline_url, is_published)
  values
    (
      '11111111-1111-4111-8111-111111111111',
      v_author_id,
      'Sustainable Soil Management',
      'Build practical soil health skills: structure, organic matter, nutrient cycles, and low-cost field diagnostics.',
      null,
      true
    ),
    (
      '22222222-2222-4222-8222-222222222222',
      v_author_id,
      'Water-Smart Irrigation Basics',
      'Learn efficient irrigation planning, scheduling, and moisture monitoring for smallholder and mixed farms.',
      null,
      true
    ),
    (
      '33333333-3333-4333-8333-333333333333',
      v_author_id,
      'Integrated Pest Management Foundations',
      'Apply prevention-first pest control using scouting, thresholds, biological controls, and safe intervention.',
      null,
      true
    ),
    (
      '44444444-4444-4444-8444-444444444444',
      v_author_id,
      'Farm Business and Market Readiness',
      'Strengthen farm decision-making with cost tracking, market timing, and post-harvest value protection.',
      null,
      true
    )
  on conflict (id) do update
  set
    created_by = excluded.created_by,
    title = excluded.title,
    description = excluded.description,
    offline_url = excluded.offline_url,
    is_published = excluded.is_published,
    updated_at = now();

  -- -------------------------------
  -- Lessons
  -- -------------------------------
  insert into public.lessons (id, course_id, order_index, title, description, content, duration_mins)
  values
    (
      '11111111-aaaa-4111-8111-111111111111',
      '11111111-1111-4111-8111-111111111111',
      1,
      'Understanding Soil Texture and Structure',
      'Distinguish sand, silt, clay, and aggregate quality.',
      'Soil texture affects water retention and root growth. Start by testing hand-feel texture in-field. Good structure supports aeration and infiltration. Compaction limits root depth and nutrient uptake.',
      20
    ),
    (
      '11111111-bbbb-4111-8111-111111111111',
      '11111111-1111-4111-8111-111111111111',
      2,
      'Organic Matter and Compost Use',
      'Improve fertility and resilience using local biomass.',
      'Organic matter increases microbial activity and water holding capacity. Use mature compost and apply before planting. Combine crop residue management with cover crops for longer-term gains.',
      18
    ),
    (
      '11111111-cccc-4111-8111-111111111111',
      '11111111-1111-4111-8111-111111111111',
      3,
      'Basic Soil Testing and Interpretation',
      'Read pH and nutrient reports and choose actions.',
      'A practical soil test helps prioritize inputs. Correct severe pH imbalance first, then address nutrient gaps. Keep records by field block for season-over-season comparison.',
      22
    ),

    (
      '22222222-aaaa-4222-8222-222222222222',
      '22222222-2222-4222-8222-222222222222',
      1,
      'Irrigation Methods and Fit-for-Context Selection',
      'Compare drip, sprinkler, and furrow approaches.',
      'No single irrigation method fits every farm. Drip saves water but needs maintenance. Furrow can be low-cost but less efficient. Match method to crop value, slope, and available infrastructure.',
      19
    ),
    (
      '22222222-bbbb-4222-8222-222222222222',
      '22222222-2222-4222-8222-222222222222',
      2,
      'Scheduling by Crop Stage and Weather',
      'Water at the right time and quantity.',
      'Critical crop stages require stable moisture. Avoid overwatering by combining weather forecast checks with crop stress signs. Track application logs to refine your schedule weekly.',
      21
    ),
    (
      '22222222-cccc-4222-8222-222222222222',
      '22222222-2222-4222-8222-222222222222',
      3,
      'Monitoring Moisture and Preventing Losses',
      'Use practical field checks and low-cost sensors.',
      'Use simple soil probes, visual inspection, and meter readings where possible. Fix leaks quickly, irrigate in cooler hours, and maintain lines to reduce evaporation and pressure losses.',
      17
    ),

    (
      '33333333-aaaa-4333-8333-333333333333',
      '33333333-3333-4333-8333-333333333333',
      1,
      'Pest Identification and Field Scouting',
      'Separate pests from beneficial organisms.',
      'Regular scouting prevents surprise outbreaks. Identify life stage and affected crop parts. Record hotspot locations and evaluate trend over time, not just single observations.',
      20
    ),
    (
      '33333333-bbbb-4333-8333-333333333333',
      '33333333-3333-4333-8333-333333333333',
      2,
      'Threshold-Based Decision Making',
      'Act only when economic damage risk is real.',
      'Use action thresholds to avoid unnecessary spraying. Compare pest counts with local advisory thresholds and crop growth stage. Intervene when likely losses exceed treatment costs.',
      18
    ),
    (
      '33333333-cccc-4333-8333-333333333333',
      '33333333-3333-4333-8333-333333333333',
      3,
      'Safer Control Options and Resistance Management',
      'Rotate strategies to stay effective over seasons.',
      'Prioritize cultural and biological controls first. If chemicals are needed, rotate active ingredients and follow label intervals. Resistance management protects both yields and long-term efficacy.',
      23
    ),

    (
      '44444444-aaaa-4444-8444-444444444444',
      '44444444-4444-4444-8444-444444444444',
      1,
      'Farm Cost Tracking Fundamentals',
      'Capture variable and fixed costs consistently.',
      'Track seeds, fertilizer, labor, fuel, and transport separately. Cost visibility helps identify the true break-even point per crop and supports better pricing decisions.',
      16
    ),
    (
      '44444444-bbbb-4444-8444-444444444444',
      '44444444-4444-4444-8444-444444444444',
      2,
      'Market Planning and Buyer Requirements',
      'Align production with demand and quality standards.',
      'Know your buyer specifications before planting. Plan harvest windows around market demand and logistics. Better planning reduces rejection risk and post-harvest losses.',
      20
    ),
    (
      '44444444-cccc-4444-8444-444444444444',
      '44444444-4444-4444-8444-444444444444',
      3,
      'Post-Harvest Handling and Value Preservation',
      'Protect quality from field to point-of-sale.',
      'Cool produce quickly, handle gently, and grade consistently. Good post-harvest handling improves shelf life and allows higher-value sales channels.',
      18
    )
  on conflict (id) do update
  set
    course_id = excluded.course_id,
    order_index = excluded.order_index,
    title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    duration_mins = excluded.duration_mins,
    updated_at = now();

  -- -------------------------------
  -- Quizzes (one per lesson)
  -- -------------------------------
  insert into public.quizzes (id, lesson_id, title, pass_score, max_attempts)
  values
    ('aaaa0001-0000-4000-8000-000000000001', '11111111-aaaa-4111-8111-111111111111', 'Soil Texture Check', 70, 3),
    ('aaaa0001-0000-4000-8000-000000000002', '11111111-bbbb-4111-8111-111111111111', 'Organic Matter Check', 70, 3),
    ('aaaa0001-0000-4000-8000-000000000003', '11111111-cccc-4111-8111-111111111111', 'Soil Testing Check', 70, 3),
    ('aaaa0002-0000-4000-8000-000000000001', '22222222-aaaa-4222-8222-222222222222', 'Irrigation Method Check', 70, 3),
    ('aaaa0002-0000-4000-8000-000000000002', '22222222-bbbb-4222-8222-222222222222', 'Irrigation Scheduling Check', 70, 3),
    ('aaaa0002-0000-4000-8000-000000000003', '22222222-cccc-4222-8222-222222222222', 'Moisture Monitoring Check', 70, 3),
    ('aaaa0003-0000-4000-8000-000000000001', '33333333-aaaa-4333-8333-333333333333', 'Scouting Check', 70, 3),
    ('aaaa0003-0000-4000-8000-000000000002', '33333333-bbbb-4333-8333-333333333333', 'Threshold Check', 70, 3),
    ('aaaa0003-0000-4000-8000-000000000003', '33333333-cccc-4333-8333-333333333333', 'Resistance Management Check', 70, 3),
    ('aaaa0004-0000-4000-8000-000000000001', '44444444-aaaa-4444-8444-444444444444', 'Cost Tracking Check', 70, 3),
    ('aaaa0004-0000-4000-8000-000000000002', '44444444-bbbb-4444-8444-444444444444', 'Market Planning Check', 70, 3),
    ('aaaa0004-0000-4000-8000-000000000003', '44444444-cccc-4444-8444-444444444444', 'Post-Harvest Check', 70, 3)
  on conflict (id) do update
  set
    lesson_id = excluded.lesson_id,
    title = excluded.title,
    pass_score = excluded.pass_score,
    max_attempts = excluded.max_attempts;

  -- -------------------------------
  -- Questions (1 true/false per quiz)
  -- -------------------------------
  insert into public.questions (id, quiz_id, text, type, order_index)
  values
    ('cccc0001-0000-4000-8000-000000000001', 'aaaa0001-0000-4000-8000-000000000001', 'Soil with balanced aggregates generally supports better root growth.', 'true_false', 1),
    ('cccc0001-0000-4000-8000-000000000002', 'aaaa0001-0000-4000-8000-000000000002', 'Adding mature compost can improve soil water holding capacity.', 'true_false', 1),
    ('cccc0001-0000-4000-8000-000000000003', 'aaaa0001-0000-4000-8000-000000000003', 'Soil test results should be compared over time by field block.', 'true_false', 1),
    ('cccc0002-0000-4000-8000-000000000001', 'aaaa0002-0000-4000-8000-000000000001', 'Drip irrigation is always the cheapest option for every farm.', 'true_false', 1),
    ('cccc0002-0000-4000-8000-000000000002', 'aaaa0002-0000-4000-8000-000000000002', 'Irrigation scheduling should account for crop stage and weather.', 'true_false', 1),
    ('cccc0002-0000-4000-8000-000000000003', 'aaaa0002-0000-4000-8000-000000000003', 'Fixing leaks can reduce avoidable irrigation losses.', 'true_false', 1),
    ('cccc0003-0000-4000-8000-000000000001', 'aaaa0003-0000-4000-8000-000000000001', 'Scouting is only useful after visible crop damage appears.', 'true_false', 1),
    ('cccc0003-0000-4000-8000-000000000002', 'aaaa0003-0000-4000-8000-000000000002', 'Economic thresholds help avoid unnecessary pesticide use.', 'true_false', 1),
    ('cccc0003-0000-4000-8000-000000000003', 'aaaa0003-0000-4000-8000-000000000003', 'Rotating active ingredients helps reduce resistance pressure.', 'true_false', 1),
    ('cccc0004-0000-4000-8000-000000000001', 'aaaa0004-0000-4000-8000-000000000001', 'Tracking costs by category helps estimate break-even price.', 'true_false', 1),
    ('cccc0004-0000-4000-8000-000000000002', 'aaaa0004-0000-4000-8000-000000000002', 'Buyer quality requirements should be checked after harvest only.', 'true_false', 1),
    ('cccc0004-0000-4000-8000-000000000003', 'aaaa0004-0000-4000-8000-000000000003', 'Good post-harvest handling can increase shelf life and value.', 'true_false', 1)
  on conflict (id) do update
  set
    quiz_id = excluded.quiz_id,
    text = excluded.text,
    type = excluded.type,
    order_index = excluded.order_index;

  -- -------------------------------
  -- Question options (do not expose is_correct client-side)
  -- -------------------------------
  insert into public.question_options (id, question_id, text, is_correct, order_index)
  values
    ('dddd0001-0000-4000-8000-000000000001', 'cccc0001-0000-4000-8000-000000000001', 'True', true, 1),
    ('dddd0001-0000-4000-8000-000000000002', 'cccc0001-0000-4000-8000-000000000001', 'False', false, 2),
    ('dddd0001-0000-4000-8000-000000000003', 'cccc0001-0000-4000-8000-000000000002', 'True', true, 1),
    ('dddd0001-0000-4000-8000-000000000004', 'cccc0001-0000-4000-8000-000000000002', 'False', false, 2),
    ('dddd0001-0000-4000-8000-000000000005', 'cccc0001-0000-4000-8000-000000000003', 'True', true, 1),
    ('dddd0001-0000-4000-8000-000000000006', 'cccc0001-0000-4000-8000-000000000003', 'False', false, 2),

    ('dddd0002-0000-4000-8000-000000000001', 'cccc0002-0000-4000-8000-000000000001', 'True', false, 1),
    ('dddd0002-0000-4000-8000-000000000002', 'cccc0002-0000-4000-8000-000000000001', 'False', true, 2),
    ('dddd0002-0000-4000-8000-000000000003', 'cccc0002-0000-4000-8000-000000000002', 'True', true, 1),
    ('dddd0002-0000-4000-8000-000000000004', 'cccc0002-0000-4000-8000-000000000002', 'False', false, 2),
    ('dddd0002-0000-4000-8000-000000000005', 'cccc0002-0000-4000-8000-000000000003', 'True', true, 1),
    ('dddd0002-0000-4000-8000-000000000006', 'cccc0002-0000-4000-8000-000000000003', 'False', false, 2),

    ('dddd0003-0000-4000-8000-000000000001', 'cccc0003-0000-4000-8000-000000000001', 'True', false, 1),
    ('dddd0003-0000-4000-8000-000000000002', 'cccc0003-0000-4000-8000-000000000001', 'False', true, 2),
    ('dddd0003-0000-4000-8000-000000000003', 'cccc0003-0000-4000-8000-000000000002', 'True', true, 1),
    ('dddd0003-0000-4000-8000-000000000004', 'cccc0003-0000-4000-8000-000000000002', 'False', false, 2),
    ('dddd0003-0000-4000-8000-000000000005', 'cccc0003-0000-4000-8000-000000000003', 'True', true, 1),
    ('dddd0003-0000-4000-8000-000000000006', 'cccc0003-0000-4000-8000-000000000003', 'False', false, 2),

    ('dddd0004-0000-4000-8000-000000000001', 'cccc0004-0000-4000-8000-000000000001', 'True', true, 1),
    ('dddd0004-0000-4000-8000-000000000002', 'cccc0004-0000-4000-8000-000000000001', 'False', false, 2),
    ('dddd0004-0000-4000-8000-000000000003', 'cccc0004-0000-4000-8000-000000000002', 'True', false, 1),
    ('dddd0004-0000-4000-8000-000000000004', 'cccc0004-0000-4000-8000-000000000002', 'False', true, 2),
    ('dddd0004-0000-4000-8000-000000000005', 'cccc0004-0000-4000-8000-000000000003', 'True', true, 1),
    ('dddd0004-0000-4000-8000-000000000006', 'cccc0004-0000-4000-8000-000000000003', 'False', false, 2)
  on conflict (id) do update
  set
    question_id = excluded.question_id,
    text = excluded.text,
    is_correct = excluded.is_correct,
    order_index = excluded.order_index;

  -- -------------------------------
  -- Badges (one per course)
  -- -------------------------------
  insert into public.badges (id, course_id, name, icon_url, criteria)
  values
    ('bbbb0001-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Soil Steward', null, 'Complete all soil lessons and pass all quizzes.'),
    ('bbbb0002-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Water Wise', null, 'Complete all irrigation lessons and pass all quizzes.'),
    ('bbbb0003-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'IPM Guardian', null, 'Complete all pest management lessons and pass all quizzes.'),
    ('bbbb0004-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444', 'Market Ready Farmer', null, 'Complete all business lessons and pass all quizzes.')
  on conflict (id) do update
  set
    course_id = excluded.course_id,
    name = excluded.name,
    icon_url = excluded.icon_url,
    criteria = excluded.criteria;
end $$;
