-- Persisted streak stats on Habit; recomputed when HabitCompletion changes.

ALTER TABLE public."Habit"
	ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS best_streak integer NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS last_completed_date date;

COMMENT ON COLUMN public."Habit".current_streak IS 'Consecutive completed days ending at last completion, if streak is still alive (last within 1 day of user local today); else 0';
COMMENT ON COLUMN public."Habit".best_streak IS 'Longest run of consecutive completed days within habit window';
COMMENT ON COLUMN public."Habit".last_completed_date IS 'Latest completion_date where completed = true';

-- Recompute streak columns for one habit (SECURITY DEFINER so RLS does not block updates).
CREATE OR REPLACE FUNCTION public.refresh_habit_streak(p_habit_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_start date;
	v_end date;
	v_user_tz text;
	v_today date;
	v_last date;
	v_len int;
	v_best int := 0;
	v_run int := 0;
	v_current int := 0;
	v_c date;
	arr date[];
	i int;
BEGIN
	SELECT h.start_date::date, h.end_date::date, COALESCE(NULLIF(trim(u.timezone), ''), 'UTC')
	INTO v_start, v_end, v_user_tz
	FROM public."Habit" h
	INNER JOIN public."User" u ON u.id = h.user_id
	WHERE h.id = p_habit_id;

	IF NOT FOUND THEN
		RETURN;
	END IF;

	BEGIN
		v_today := (timezone(v_user_tz, now()))::date;
	EXCEPTION
		WHEN OTHERS THEN
			v_today := (timezone('UTC', now()))::date;
	END;

	SELECT array_agg(d ORDER BY d)
	INTO arr
	FROM (
		SELECT DISTINCT hc.completion_date::date AS d
		FROM public."HabitCompletion" hc
		WHERE hc.habit_id = p_habit_id
			AND hc.completed = true
			AND hc.completion_date >= v_start
			AND hc.completion_date <= v_end
	) s;

	IF arr IS NULL OR cardinality(arr) = 0 THEN
		UPDATE public."Habit"
		SET last_completed_date = NULL,
			current_streak = 0,
			best_streak = 0,
			updated_at = now()
		WHERE id = p_habit_id;
		RETURN;
	END IF;

	v_len := array_length(arr, 1);
	v_last := arr[v_len];

	-- Longest consecutive run in window
	v_best := 1;
	v_run := 1;
	FOR i IN 2..v_len LOOP
		IF arr[i] = arr[i - 1] + 1 THEN
			v_run := v_run + 1;
			IF v_run > v_best THEN
				v_best := v_run;
			END IF;
		ELSE
			v_run := 1;
		END IF;
	END LOOP;

	-- Run length ending at last completion (walk backward day by day)
	v_c := v_last;
	v_run := 0;
	WHILE v_c >= v_start AND v_c <= v_end LOOP
		IF NOT (v_c = ANY (arr)) THEN
			EXIT;
		END IF;
		v_run := v_run + 1;
		v_c := v_c - 1;
	END LOOP;

	-- Alive if last completion was today or yesterday (local to user timezone)
	IF v_last > v_today OR (v_today - v_last) >= 2 THEN
		v_current := 0;
	ELSE
		v_current := v_run;
	END IF;

	UPDATE public."Habit"
	SET last_completed_date = v_last,
		current_streak = v_current,
		best_streak = v_best,
		updated_at = now()
	WHERE id = p_habit_id;
END;
$$;

-- Trigger: refresh when completions change
CREATE OR REPLACE FUNCTION public.trg_habit_completion_refresh_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	IF TG_OP = 'INSERT' THEN
		PERFORM public.refresh_habit_streak(NEW.habit_id);
	ELSIF TG_OP = 'DELETE' THEN
		PERFORM public.refresh_habit_streak(OLD.habit_id);
	ELSE
		IF OLD.habit_id IS DISTINCT FROM NEW.habit_id THEN
			PERFORM public.refresh_habit_streak(OLD.habit_id);
		END IF;
		PERFORM public.refresh_habit_streak(NEW.habit_id);
	END IF;
	RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_habit_completion_refresh_streak ON public."HabitCompletion";
CREATE TRIGGER trg_habit_completion_refresh_streak
	AFTER INSERT OR UPDATE OF completed, completion_date, habit_id OR DELETE
	ON public."HabitCompletion"
	FOR EACH ROW
	EXECUTE PROCEDURE public.trg_habit_completion_refresh_streak();

REVOKE ALL ON FUNCTION public.refresh_habit_streak(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_habit_streak(uuid) FROM anon, authenticated;

-- Recompute when habit window changes (completion rows unchanged but eligibility may change)
CREATE OR REPLACE FUNCTION public.trg_habit_update_refresh_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	PERFORM public.refresh_habit_streak(NEW.id);
	RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_habit_update_refresh_streak ON public."Habit";
CREATE TRIGGER trg_habit_update_refresh_streak
	AFTER UPDATE OF start_date, end_date, duration_days
	ON public."Habit"
	FOR EACH ROW
	EXECUTE PROCEDURE public.trg_habit_update_refresh_streak();

-- Backfill existing habits
DO $$
DECLARE
	r record;
BEGIN
	FOR r IN SELECT id FROM public."Habit" LOOP
		PERFORM public.refresh_habit_streak(r.id);
	END LOOP;
END $$;
