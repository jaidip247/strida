-- Seed script for Strida tables.
-- Safe to run repeatedly: uses upserts and existence checks.

BEGIN;

DO $$
DECLARE
  seeded_at timestamptz := NOW();

  u1 uuid := '11111111-1111-1111-1111-111111111111';
  u2 uuid := '22222222-2222-2222-2222-222222222222';

  s1 uuid := '33333333-3333-3333-3333-333333333331';
  s2 uuid := '33333333-3333-3333-3333-333333333332';

  h1 uuid := '44444444-4444-4444-4444-444444444441';
  h2 uuid := '44444444-4444-4444-4444-444444444442';
  h3 uuid := '44444444-4444-4444-4444-444444444443';

  has_habit_user_id boolean := false;
  has_habit_schedule_id boolean := false;
BEGIN
  -- Seed auth users first so profile FK can resolve.
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    )
    VALUES
      (
        u1,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'seed+jay@example.com',
        '$2a$10$7EqJtq98hPqEX7fNZaFWoOaQ2fW8Q6nccQ5QwDFi1Cdm42Hcps225',
        seeded_at,
        seeded_at,
        seeded_at,
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"name":"Jay Seed","full_name":"Jay Seed"}'::jsonb
      ),
      (
        u2,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'seed+maya@example.com',
        '$2a$10$7EqJtq98hPqEX7fNZaFWoOaQ2fW8Q6nccQ5QwDFi1Cdm42Hcps225',
        seeded_at,
        seeded_at,
        seeded_at,
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"name":"Maya Seed","full_name":"Maya Seed"}'::jsonb
      )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      updated_at = EXCLUDED.updated_at,
      raw_user_meta_data = EXCLUDED.raw_user_meta_data;
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      display_name,
      bio,
      avatar_url,
      created_at,
      updated_at
    )
    VALUES
      (
        u1,
        'seed+jay@example.com',
        'Jay Seed',
        'jay',
        'Seed user for local development.',
        NULL,
        seeded_at,
        seeded_at
      ),
      (
        u2,
        'seed+maya@example.com',
        'Maya Seed',
        'maya',
        'Second seed user for local development.',
        NULL,
        seeded_at,
        seeded_at
      )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      display_name = EXCLUDED.display_name,
      bio = EXCLUDED.bio,
      updated_at = EXCLUDED.updated_at;
  END IF;

  IF to_regclass('public."User"') IS NOT NULL THEN
    INSERT INTO public."User" (id, email, name, status, created_at, updated_at)
    VALUES
      (u1, 'seed+jay@example.com', 'Jay Seed', 'ACTIVE', seeded_at, seeded_at),
      (u2, 'seed+maya@example.com', 'Maya Seed', 'ACTIVE', seeded_at, seeded_at)
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      status = EXCLUDED.status,
      updated_at = EXCLUDED.updated_at;
  END IF;

  IF to_regclass('public."Schedule"') IS NOT NULL THEN
    INSERT INTO public."Schedule" (id, user_id, duration, progress, created_at, updated_at)
    VALUES
      (
        s1,
        u1,
        21,
        '{"start_date":"2026-04-01","end_date":"2026-04-21"}'::jsonb,
        seeded_at,
        seeded_at
      ),
      (
        s2,
        u2,
        30,
        '{"start_date":"2026-04-03","end_date":"2026-05-02"}'::jsonb,
        seeded_at,
        seeded_at
      )
    ON CONFLICT (id) DO UPDATE
    SET
      duration = EXCLUDED.duration,
      progress = EXCLUDED.progress,
      updated_at = EXCLUDED.updated_at;
  END IF;

  IF to_regclass('public."Habit"') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Habit' AND column_name = 'user_id'
    )
    INTO has_habit_user_id;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Habit' AND column_name = 'schedule_id'
    )
    INTO has_habit_schedule_id;

    IF has_habit_user_id THEN
      INSERT INTO public."Habit" (
        id,
        user_id,
        title,
        description,
        start_date,
        duration_days,
        end_date,
        checked,
        created_at,
        updated_at
      )
      VALUES
        (
          h1,
          u1,
          'Morning walk',
          '20 minutes before breakfast',
          DATE '2026-04-01',
          21,
          DATE '2026-04-21',
          false,
          seeded_at,
          seeded_at
        ),
        (
          h2,
          u1,
          'Read 10 pages',
          'Read before bed',
          DATE '2026-04-02',
          30,
          DATE '2026-05-01',
          false,
          seeded_at,
          seeded_at
        ),
        (
          h3,
          u2,
          'Hydrate',
          'Drink 8 glasses of water',
          DATE '2026-04-03',
          14,
          DATE '2026-04-16',
          false,
          seeded_at,
          seeded_at
        )
      ON CONFLICT (id) DO UPDATE
      SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        start_date = EXCLUDED.start_date,
        duration_days = EXCLUDED.duration_days,
        end_date = EXCLUDED.end_date,
        checked = EXCLUDED.checked,
        updated_at = EXCLUDED.updated_at;
    ELSIF has_habit_schedule_id THEN
      INSERT INTO public."Habit" (
        id,
        schedule_id,
        title,
        description,
        checked,
        created_at,
        updated_at
      )
      VALUES
        (
          h1,
          s1,
          'Morning walk',
          '20 minutes before breakfast',
          false,
          seeded_at,
          seeded_at
        ),
        (
          h2,
          s1,
          'Read 10 pages',
          'Read before bed',
          false,
          seeded_at,
          seeded_at
        ),
        (
          h3,
          s2,
          'Hydrate',
          'Drink 8 glasses of water',
          false,
          seeded_at,
          seeded_at
        )
      ON CONFLICT (id) DO UPDATE
      SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        checked = EXCLUDED.checked,
        updated_at = EXCLUDED.updated_at;
    END IF;
  END IF;

  IF to_regclass('public."HabitCompletion"') IS NOT NULL THEN
    INSERT INTO public."HabitCompletion" (
      habit_id,
      completion_date,
      completed,
      created_at,
      updated_at
    )
    VALUES
      (h1, DATE '2026-04-04', true, seeded_at, seeded_at),
      (h2, DATE '2026-04-04', false, seeded_at, seeded_at),
      (h3, DATE '2026-04-04', true, seeded_at, seeded_at),
      (h1, DATE '2026-04-05', false, seeded_at, seeded_at),
      (h2, DATE '2026-04-05', true, seeded_at, seeded_at)
    ON CONFLICT (habit_id, completion_date) DO UPDATE
    SET
      completed = EXCLUDED.completed,
      updated_at = EXCLUDED.updated_at;
  END IF;

  IF to_regclass('public."PushSubscription"') IS NOT NULL THEN
    INSERT INTO public."PushSubscription" (
      user_id,
      endpoint,
      keys_p256dh,
      keys_auth,
      platform,
      created_at
    )
    VALUES
      (
        u1,
        'https://fcm.googleapis.com/fcm/send/seed-jay-device',
        'seed-p256dh-jay',
        'seed-auth-jay',
        'android',
        seeded_at
      ),
      (
        u2,
        'https://example.push.service/subscriptions/seed-maya-web',
        'seed-p256dh-maya',
        'seed-auth-maya',
        'web',
        seeded_at
      )
    ON CONFLICT (user_id, endpoint) DO UPDATE
    SET
      keys_p256dh = EXCLUDED.keys_p256dh,
      keys_auth = EXCLUDED.keys_auth,
      platform = EXCLUDED.platform;
  END IF;
END $$;

COMMIT;
