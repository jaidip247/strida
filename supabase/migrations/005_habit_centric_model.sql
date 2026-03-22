-- Restructure data model to be habit-centric (remove Schedule).
-- Target shape:
-- Habit(user_id, start_date, end_date, duration_days, ...)

BEGIN;

-- 1) Add habit-centric columns.
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS duration_days INTEGER;

-- 2) Backfill from Schedule if it still exists.
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.tables
		WHERE table_schema = 'public' AND table_name = 'Schedule'
	)
	AND EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'Habit' AND column_name = 'schedule_id'
	) THEN
		UPDATE "Habit" h
		SET
			user_id = COALESCE(h.user_id, s.user_id),
			start_date = COALESCE(h.start_date, (s.progress->>'start_date')::date),
			duration_days = COALESCE(h.duration_days, GREATEST(COALESCE(s.duration, 1), 1)),
			end_date = COALESCE(
				h.end_date,
				((s.progress->>'start_date')::date + ((GREATEST(COALESCE(s.duration, 1), 1) - 1)::integer))
			)
		FROM "Schedule" s
		WHERE h.schedule_id = s.id;
	END IF;
END $$;

-- 3) Fill any remaining nulls to make constraints safe.
UPDATE "Habit"
SET start_date = CURRENT_DATE
WHERE start_date IS NULL;

UPDATE "Habit"
SET duration_days = 21
WHERE duration_days IS NULL OR duration_days < 1;

UPDATE "Habit"
SET end_date = (start_date + ((duration_days - 1)::integer))
WHERE end_date IS NULL;

-- 4) Replace old foreign key to Schedule with Habit -> User.
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'Habit_user_id_fkey'
	) THEN
		ALTER TABLE "Habit"
		ADD CONSTRAINT "Habit_user_id_fkey"
		FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE;
	END IF;
END $$;

-- 5) Enforce core habit-centric constraints.
ALTER TABLE "Habit" ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE "Habit" ALTER COLUMN start_date SET NOT NULL;
ALTER TABLE "Habit" ALTER COLUMN end_date SET NOT NULL;
ALTER TABLE "Habit" ALTER COLUMN duration_days SET NOT NULL;

ALTER TABLE "Habit"
	DROP CONSTRAINT IF EXISTS "Habit_duration_days_check";
ALTER TABLE "Habit"
	ADD CONSTRAINT "Habit_duration_days_check" CHECK (duration_days >= 1);

ALTER TABLE "Habit"
	DROP CONSTRAINT IF EXISTS "Habit_date_window_check";
ALTER TABLE "Habit"
	ADD CONSTRAINT "Habit_date_window_check" CHECK (end_date >= start_date);

-- Drop policies that still reference Habit.schedule_id before dropping the column.
DROP POLICY IF EXISTS "Users can view habits from own schedules" ON "Habit";
DROP POLICY IF EXISTS "Users can insert habits to own schedules" ON "Habit";
DROP POLICY IF EXISTS "Users can update habits from own schedules" ON "Habit";
DROP POLICY IF EXISTS "Users can delete habits from own schedules" ON "Habit";

DROP POLICY IF EXISTS "Users can view own habit completions" ON "HabitCompletion";
DROP POLICY IF EXISTS "Users can insert own habit completions" ON "HabitCompletion";
DROP POLICY IF EXISTS "Users can update own habit completions" ON "HabitCompletion";
DROP POLICY IF EXISTS "Users can delete own habit completions" ON "HabitCompletion";

-- Remove old Schedule relation column from Habit.
ALTER TABLE "Habit" DROP CONSTRAINT IF EXISTS "Habit_schedule_id_fkey";
ALTER TABLE "Habit" DROP COLUMN IF EXISTS schedule_id;

-- 6) Recreate Habit RLS policies based on owner column.
ALTER TABLE "Habit" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view habits from own schedules" ON "Habit";
DROP POLICY IF EXISTS "Users can insert habits to own schedules" ON "Habit";
DROP POLICY IF EXISTS "Users can update habits from own schedules" ON "Habit";
DROP POLICY IF EXISTS "Users can delete habits from own schedules" ON "Habit";
DROP POLICY IF EXISTS "Users can view own habits" ON "Habit";
DROP POLICY IF EXISTS "Users can insert own habits" ON "Habit";
DROP POLICY IF EXISTS "Users can update own habits" ON "Habit";
DROP POLICY IF EXISTS "Users can delete own habits" ON "Habit";

CREATE POLICY "Users can view own habits"
ON "Habit"
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
ON "Habit"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
ON "Habit"
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
ON "Habit"
FOR DELETE
USING (auth.uid() = user_id);

-- 7) Recreate HabitCompletion policies to join directly via Habit.user_id.
ALTER TABLE "HabitCompletion" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own habit completions" ON "HabitCompletion";
DROP POLICY IF EXISTS "Users can insert own habit completions" ON "HabitCompletion";
DROP POLICY IF EXISTS "Users can update own habit completions" ON "HabitCompletion";
DROP POLICY IF EXISTS "Users can delete own habit completions" ON "HabitCompletion";

CREATE POLICY "Users can view own habit completions"
ON "HabitCompletion"
FOR SELECT
USING (
	EXISTS (
		SELECT 1
		FROM "Habit"
		WHERE "Habit".id = "HabitCompletion".habit_id
		  AND "Habit".user_id = auth.uid()
	)
);

CREATE POLICY "Users can insert own habit completions"
ON "HabitCompletion"
FOR INSERT
WITH CHECK (
	EXISTS (
		SELECT 1
		FROM "Habit"
		WHERE "Habit".id = "HabitCompletion".habit_id
		  AND "Habit".user_id = auth.uid()
	)
);

CREATE POLICY "Users can update own habit completions"
ON "HabitCompletion"
FOR UPDATE
USING (
	EXISTS (
		SELECT 1
		FROM "Habit"
		WHERE "Habit".id = "HabitCompletion".habit_id
		  AND "Habit".user_id = auth.uid()
	)
);

CREATE POLICY "Users can delete own habit completions"
ON "HabitCompletion"
FOR DELETE
USING (
	EXISTS (
		SELECT 1
		FROM "Habit"
		WHERE "Habit".id = "HabitCompletion".habit_id
		  AND "Habit".user_id = auth.uid()
	)
);

-- 8) Drop Schedule table now that data is migrated.
DROP TABLE IF EXISTS "Schedule" CASCADE;

COMMIT;
