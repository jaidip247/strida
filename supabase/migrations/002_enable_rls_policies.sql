-- Enable Row Level Security on all tables (safe on reruns)
ALTER TABLE IF EXISTS "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Schedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Habit" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Users can insert own profile" ON "User";

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON "User"
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON "User"
FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile (when they sign up)
CREATE POLICY "Users can insert own profile"
ON "User"
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- SCHEDULE TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own schedules" ON "Schedule";
DROP POLICY IF EXISTS "Users can insert own schedules" ON "Schedule";
DROP POLICY IF EXISTS "Users can update own schedules" ON "Schedule";
DROP POLICY IF EXISTS "Users can delete own schedules" ON "Schedule";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Schedule'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own schedules"
      ON "Schedule"
      FOR SELECT
      USING (auth.uid() = user_id)';

    EXECUTE 'CREATE POLICY "Users can insert own schedules"
      ON "Schedule"
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)';

    EXECUTE 'CREATE POLICY "Users can update own schedules"
      ON "Schedule"
      FOR UPDATE
      USING (auth.uid() = user_id)';

    EXECUTE 'CREATE POLICY "Users can delete own schedules"
      ON "Schedule"
      FOR DELETE
      USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ============================================
-- HABIT TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view habits from own schedules" ON "Habit";
DROP POLICY IF EXISTS "Users can insert habits to own schedules" ON "Habit";
DROP POLICY IF EXISTS "Users can update habits from own schedules" ON "Habit";
DROP POLICY IF EXISTS "Users can delete habits from own schedules" ON "Habit";
DROP POLICY IF EXISTS "Users can view own habits" ON "Habit";
DROP POLICY IF EXISTS "Users can insert own habits" ON "Habit";
DROP POLICY IF EXISTS "Users can update own habits" ON "Habit";
DROP POLICY IF EXISTS "Users can delete own habits" ON "Habit";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Habit' AND column_name = 'schedule_id'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view habits from own schedules"
      ON "Habit"
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM "Schedule"
          WHERE "Schedule".id = "Habit".schedule_id
          AND "Schedule".user_id = auth.uid()
        )
      )';

    EXECUTE 'CREATE POLICY "Users can insert habits to own schedules"
      ON "Habit"
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM "Schedule"
          WHERE "Schedule".id = "Habit".schedule_id
          AND "Schedule".user_id = auth.uid()
        )
      )';

    EXECUTE 'CREATE POLICY "Users can update habits from own schedules"
      ON "Habit"
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM "Schedule"
          WHERE "Schedule".id = "Habit".schedule_id
          AND "Schedule".user_id = auth.uid()
        )
      )';

    EXECUTE 'CREATE POLICY "Users can delete habits from own schedules"
      ON "Habit"
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM "Schedule"
          WHERE "Schedule".id = "Habit".schedule_id
          AND "Schedule".user_id = auth.uid()
        )
      )';
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Habit' AND column_name = 'user_id'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own habits"
      ON "Habit"
      FOR SELECT
      USING (auth.uid() = user_id)';

    EXECUTE 'CREATE POLICY "Users can insert own habits"
      ON "Habit"
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)';

    EXECUTE 'CREATE POLICY "Users can update own habits"
      ON "Habit"
      FOR UPDATE
      USING (auth.uid() = user_id)';

    EXECUTE 'CREATE POLICY "Users can delete own habits"
      ON "Habit"
      FOR DELETE
      USING (auth.uid() = user_id)';
  END IF;
END $$;

