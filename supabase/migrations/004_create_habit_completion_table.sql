-- Create HabitCompletion table to track daily habit completions
CREATE TABLE IF NOT EXISTS "HabitCompletion" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES "Habit"(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(habit_id, completion_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_habit_completion_habit_date ON "HabitCompletion"(habit_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_habit_completion_date ON "HabitCompletion"(completion_date);

-- Enable RLS
ALTER TABLE IF EXISTS "HabitCompletion" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for HabitCompletion
-- Users can view completions for their own habits
DROP POLICY IF EXISTS "Users can view own habit completions" ON "HabitCompletion";
CREATE POLICY "Users can view own habit completions"
ON "HabitCompletion"
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM "Habit"
        INNER JOIN "Schedule" ON "Schedule".id = "Habit".schedule_id
        WHERE "Habit".id = "HabitCompletion".habit_id
        AND "Schedule".user_id = auth.uid()
    )
);

-- Users can insert completions for their own habits
DROP POLICY IF EXISTS "Users can insert own habit completions" ON "HabitCompletion";
CREATE POLICY "Users can insert own habit completions"
ON "HabitCompletion"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "Habit"
        INNER JOIN "Schedule" ON "Schedule".id = "Habit".schedule_id
        WHERE "Habit".id = "HabitCompletion".habit_id
        AND "Schedule".user_id = auth.uid()
    )
);

-- Users can update completions for their own habits
DROP POLICY IF EXISTS "Users can update own habit completions" ON "HabitCompletion";
CREATE POLICY "Users can update own habit completions"
ON "HabitCompletion"
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM "Habit"
        INNER JOIN "Schedule" ON "Schedule".id = "Habit".schedule_id
        WHERE "Habit".id = "HabitCompletion".habit_id
        AND "Schedule".user_id = auth.uid()
    )
);

-- Users can delete completions for their own habits
DROP POLICY IF EXISTS "Users can delete own habit completions" ON "HabitCompletion";
CREATE POLICY "Users can delete own habit completions"
ON "HabitCompletion"
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM "Habit"
        INNER JOIN "Schedule" ON "Schedule".id = "Habit".schedule_id
        WHERE "Habit".id = "HabitCompletion".habit_id
        AND "Schedule".user_id = auth.uid()
    )
);


