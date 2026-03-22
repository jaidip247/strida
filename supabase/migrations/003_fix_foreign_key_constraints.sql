-- Fix incorrect foreign key constraints
-- The problematic constraints from the original schema:
-- CONSTRAINT Schedule_id_fkey FOREIGN KEY (id) REFERENCES public.Habit(id)  -- WRONG!
-- CONSTRAINT Schedule_id_fkey1 FOREIGN KEY (id) REFERENCES public.User(id)  -- WRONG!

-- Drop the incorrect constraints on Schedule.id
-- Note: These constraints are invalid because a primary key (id) should not reference other tables
ALTER TABLE "Schedule" DROP CONSTRAINT IF EXISTS "Schedule_id_fkey";
ALTER TABLE "Schedule" DROP CONSTRAINT IF EXISTS "Schedule_id_fkey1";

-- Verify the correct constraints exist:
-- 1. Habit.schedule_id → Schedule.id (should already exist)
-- 2. Schedule.user_id → User.id (should already exist)
-- 3. Habit.user_id → User.id (if it exists in your schema)

-- If Habit.user_id doesn't exist but you want it, you can add it:
-- ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS user_id uuid;
-- ALTER TABLE "Habit" ADD CONSTRAINT "Habit_user_id_fkey" 
--   FOREIGN KEY (user_id) REFERENCES "User"(id);

-- Note: Based on your hierarchy (User → Schedule → Habit), 
-- Habit doesn't need user_id directly since it can be accessed through Schedule.
-- But if your schema has it, that's fine too.

