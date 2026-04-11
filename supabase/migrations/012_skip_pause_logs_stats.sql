-- Skip / pause, habit_logs, habit_stats; streak + stats refresh; logging.

-- 1) HabitCompletion: skip (mutually exclusive with completed)
ALTER TABLE public."HabitCompletion"
	ADD COLUMN IF NOT EXISTS skipped boolean NOT NULL DEFAULT false;

ALTER TABLE public."HabitCompletion"
	DROP CONSTRAINT IF EXISTS habit_completion_completed_skipped_exclusive;

ALTER TABLE public."HabitCompletion"
	ADD CONSTRAINT habit_completion_completed_skipped_exclusive CHECK (NOT (completed AND skipped));

COMMENT ON COLUMN public."HabitCompletion".skipped IS 'Explicit skip for this day — does not break streak (treated like a gap filler)';

-- 2) Habit: pause range (inclusive). Both NULL = not paused.
ALTER TABLE public."Habit"
	ADD COLUMN IF NOT EXISTS pause_start date,
	ADD COLUMN IF NOT EXISTS pause_end date;

ALTER TABLE public."Habit"
	DROP CONSTRAINT IF EXISTS habit_pause_range_consistent;

ALTER TABLE public."Habit"
	ADD CONSTRAINT habit_pause_range_consistent CHECK (
		(pause_start IS NULL AND pause_end IS NULL)
		OR (pause_start IS NOT NULL AND pause_end IS NOT NULL AND pause_end >= pause_start)
	);

COMMENT ON COLUMN public."Habit".pause_start IS 'First day habit is paused (inclusive)';
COMMENT ON COLUMN public."Habit".pause_end IS 'Last day habit is paused (inclusive)';

-- 3) User: preferred local hour for evening nudges (0–23)
ALTER TABLE public."User"
	ADD COLUMN IF NOT EXISTS reminder_hour_local smallint DEFAULT 20;

ALTER TABLE public."User"
	DROP CONSTRAINT IF EXISTS user_reminder_hour_range;

ALTER TABLE public."User"
	ADD CONSTRAINT user_reminder_hour_range CHECK (
		reminder_hour_local IS NULL OR (reminder_hour_local >= 0 AND reminder_hour_local <= 23)
	);

COMMENT ON COLUMN public."User".reminder_hour_local IS 'Local hour (0–23) for smart reminder window; default 20';

-- 4) habit_logs
CREATE TABLE IF NOT EXISTS public.habit_logs (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	habit_id uuid NOT NULL REFERENCES public."Habit"(id) ON DELETE CASCADE,
	user_id uuid NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
	event_type text NOT NULL CHECK (
		event_type IN (
			'completed',
			'skipped',
			'cleared',
			'deleted',
			'pause_started',
			'pause_ended'
		)
	),
	payload jsonb NOT NULL DEFAULT '{}',
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_created ON public.habit_logs(habit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_created ON public.habit_logs(user_id, created_at DESC);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own habit logs" ON public.habit_logs;
CREATE POLICY "Users can view own habit logs"
ON public.habit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- 5) habit_stats (one row per habit)
CREATE TABLE IF NOT EXISTS public.habit_stats (
	habit_id uuid PRIMARY KEY REFERENCES public."Habit"(id) ON DELETE CASCADE,
	user_id uuid NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
	week_completion_count integer NOT NULL DEFAULT 0,
	week_scheduled_days integer NOT NULL DEFAULT 0,
	typical_completion_hour integer,
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT habit_stats_typical_hour CHECK (
		typical_completion_hour IS NULL OR (typical_completion_hour >= 0 AND typical_completion_hour <= 23)
	)
);

CREATE INDEX IF NOT EXISTS idx_habit_stats_user ON public.habit_stats(user_id);

ALTER TABLE public.habit_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own habit stats" ON public.habit_stats;
CREATE POLICY "Users can view own habit stats"
ON public.habit_stats
FOR SELECT
USING (auth.uid() = user_id);

-- --- Streak helpers (not exposed to PostgREST) ---------------------------------

CREATE OR REPLACE FUNCTION public.habit_day_streak_status(
	p_habit_id uuid,
	p_day date,
	p_today date,
	p_start date,
	p_end date,
	p_pause_start date,
	p_pause_end date
)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
	v_comp boolean;
	v_skip boolean;
BEGIN
	IF p_day < p_start OR p_day > p_end THEN
		RETURN 'out';
	END IF;

	IF p_pause_start IS NOT NULL
		AND p_pause_end IS NOT NULL
		AND p_day >= p_pause_start
		AND p_day <= p_pause_end THEN
		RETURN 'paused';
	END IF;

	SELECT hc.completed, hc.skipped
	INTO v_comp, v_skip
	FROM public."HabitCompletion" hc
	WHERE hc.habit_id = p_habit_id
		AND hc.completion_date = p_day;

	IF FOUND THEN
		IF v_comp THEN
			RETURN 'completed';
		END IF;
		IF v_skip THEN
			RETURN 'skipped';
		END IF;
		RETURN 'miss';
	END IF;

	IF p_day < p_today THEN
		RETURN 'miss';
	END IF;
	IF p_day = p_today THEN
		RETURN 'pending';
	END IF;
	RETURN 'out';
END;
$$;

CREATE OR REPLACE FUNCTION public.streak_walk_backward_length(
	p_habit_id uuid,
	p_anchor date,
	p_today date,
	p_start date,
	p_end date,
	p_pause_start date,
	p_pause_end date
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
	v_c date;
	v_run int := 0;
	st text;
BEGIN
	v_c := p_anchor;
	WHILE v_c >= p_start LOOP
		st := public.habit_day_streak_status(
			p_habit_id,
			v_c,
			p_today,
			p_start,
			p_end,
			p_pause_start,
			p_pause_end
		);
		IF st = 'completed' THEN
			v_run := v_run + 1;
			v_c := v_c - 1;
		ELSIF st IN ('skipped', 'paused') THEN
			v_c := v_c - 1;
		ELSE
			EXIT;
		END IF;
	END LOOP;
	RETURN v_run;
END;
$$;

CREATE OR REPLACE FUNCTION public.streak_alive(
	p_habit_id uuid,
	p_last date,
	p_today date,
	p_start date,
	p_end date,
	p_pause_start date,
	p_pause_end date
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
	d date;
	st text;
BEGIN
	IF p_last IS NULL OR p_last > p_today THEN
		RETURN false;
	END IF;

	d := p_last + 1;
	WHILE d <= p_today - 1 LOOP
		st := public.habit_day_streak_status(
			p_habit_id,
			d,
			p_today,
			p_start,
			p_end,
			p_pause_start,
			p_pause_end
		);
		IF st NOT IN ('completed', 'skipped', 'paused') THEN
			RETURN false;
		END IF;
		d := d + 1;
	END LOOP;
	RETURN true;
END;
$$;

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
	v_pause_start date;
	v_pause_end date;
	v_last date;
	completed_dates date[];
	v_len int;
	v_best int := 0;
	v_run int;
	v_current int := 0;
	i int;
BEGIN
	SELECT
		h.start_date::date,
		h.end_date::date,
		COALESCE(NULLIF(trim(u.timezone), ''), 'UTC'),
		h.pause_start,
		h.pause_end
	INTO v_start, v_end, v_user_tz, v_pause_start, v_pause_end
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
	INTO completed_dates
	FROM (
		SELECT DISTINCT hc.completion_date::date AS d
		FROM public."HabitCompletion" hc
		WHERE hc.habit_id = p_habit_id
			AND hc.completed = true
			AND hc.completion_date >= v_start
			AND hc.completion_date <= v_end
	) s;

	IF completed_dates IS NULL OR cardinality(completed_dates) = 0 THEN
		UPDATE public."Habit"
		SET last_completed_date = NULL,
			current_streak = 0,
			best_streak = 0,
			updated_at = now()
		WHERE id = p_habit_id;
		RETURN;
	END IF;

	v_len := array_length(completed_dates, 1);
	v_last := completed_dates[v_len];

	FOR i IN 1..v_len LOOP
		v_run := public.streak_walk_backward_length(
			p_habit_id,
			completed_dates[i],
			v_today,
			v_start,
			v_end,
			v_pause_start,
			v_pause_end
		);
		IF v_run > v_best THEN
			v_best := v_run;
		END IF;
	END LOOP;

	v_run := public.streak_walk_backward_length(
		p_habit_id,
		v_last,
		v_today,
		v_start,
		v_end,
		v_pause_start,
		v_pause_end
	);

	IF public.streak_alive(
		p_habit_id,
		v_last,
		v_today,
		v_start,
		v_end,
		v_pause_start,
		v_pause_end
	) THEN
		v_current := v_run;
	ELSE
		v_current := 0;
	END IF;

	UPDATE public."Habit"
	SET last_completed_date = v_last,
		current_streak = v_current,
		best_streak = v_best,
		updated_at = now()
	WHERE id = p_habit_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_habit_stats(p_habit_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_user_id uuid;
	v_start date;
	v_end date;
	v_today date;
	v_user_tz text;
	v_week_start date;
	v_week_end date;
	v_sched int;
	v_count int;
	v_typ int;
BEGIN
	SELECT h.user_id, h.start_date::date, h.end_date::date, COALESCE(NULLIF(trim(u.timezone), ''), 'UTC')
	INTO v_user_id, v_start, v_end, v_user_tz
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

	v_week_start := v_today - 6;
	v_week_end := v_today;

	v_week_start := GREATEST(v_week_start, v_start);
	v_week_end := LEAST(v_week_end, v_end);
	IF v_week_end < v_week_start THEN
		v_sched := 0;
	ELSE
		v_sched := (v_week_end - v_week_start + 1);
	END IF;

	SELECT COUNT(*)::int
	INTO v_count
	FROM public."HabitCompletion" hc
	WHERE hc.habit_id = p_habit_id
		AND hc.completed = true
		AND hc.completion_date >= v_week_start
		AND hc.completion_date <= v_week_end;

	SELECT round(avg(EXTRACT(HOUR FROM hl.created_at)))::int
	INTO v_typ
	FROM public.habit_logs hl
	WHERE hl.habit_id = p_habit_id
		AND hl.event_type = 'completed'
		AND hl.created_at >= now() - interval '90 days';

	INSERT INTO public.habit_stats (habit_id, user_id)
	VALUES (p_habit_id, v_user_id)
	ON CONFLICT (habit_id) DO NOTHING;

	UPDATE public.habit_stats
	SET week_completion_count = COALESCE(v_count, 0),
		week_scheduled_days = GREATEST(v_sched, 0),
		typical_completion_hour = v_typ,
		updated_at = now()
	WHERE habit_id = p_habit_id;
END;
$$;

-- Log first (so typical_completion_hour sees new rows), then streak, then stats.
CREATE OR REPLACE FUNCTION public.trg_habit_completion_after()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_user_id uuid;
	v_type text;
	v_habit_id uuid;
	v_payload jsonb;
BEGIN
	v_habit_id := COALESCE(NEW.habit_id, OLD.habit_id);
	SELECT user_id INTO v_user_id FROM public."Habit" WHERE id = v_habit_id;
	IF NOT FOUND THEN
		RETURN COALESCE(NEW, OLD);
	END IF;

	IF TG_OP = 'DELETE' THEN
		v_type := 'deleted';
		v_payload := jsonb_build_object(
			'completion_date', OLD.completion_date::text,
			'completed', OLD.completed,
			'skipped', OLD.skipped
		);
	ELSIF TG_OP = 'INSERT' THEN
		IF NEW.completed THEN
			v_type := 'completed';
		ELSIF NEW.skipped THEN
			v_type := 'skipped';
		ELSE
			v_type := 'cleared';
		END IF;
		v_payload := jsonb_build_object(
			'completion_date', NEW.completion_date::text,
			'completed', NEW.completed,
			'skipped', NEW.skipped
		);
	ELSE
		IF NEW.completed AND NOT OLD.completed THEN
			v_type := 'completed';
		ELSIF NEW.skipped AND NOT OLD.skipped THEN
			v_type := 'skipped';
		ELSIF NOT NEW.completed AND NOT NEW.skipped AND (OLD.completed OR OLD.skipped) THEN
			v_type := 'cleared';
		ELSE
			v_type := 'cleared';
		END IF;
		v_payload := jsonb_build_object(
			'completion_date', NEW.completion_date::text,
			'completed', NEW.completed,
			'skipped', NEW.skipped
		);
	END IF;

	INSERT INTO public.habit_logs (habit_id, user_id, event_type, payload)
	VALUES (v_habit_id, v_user_id, v_type, v_payload);

	PERFORM public.refresh_habit_streak(v_habit_id);
	PERFORM public.refresh_habit_stats(v_habit_id);

	RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_habit_pause_after()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	IF TG_OP <> 'UPDATE' THEN
		RETURN NEW;
	END IF;

	IF OLD.pause_start IS NULL AND NEW.pause_start IS NOT NULL AND NEW.pause_end IS NOT NULL THEN
		INSERT INTO public.habit_logs (habit_id, user_id, event_type, payload)
		VALUES (
			NEW.id,
			NEW.user_id,
			'pause_started',
			jsonb_build_object(
				'pause_start', NEW.pause_start::text,
				'pause_end', NEW.pause_end::text
			)
		);
	END IF;

	IF OLD.pause_start IS NOT NULL AND NEW.pause_start IS NULL AND NEW.pause_end IS NULL THEN
		INSERT INTO public.habit_logs (habit_id, user_id, event_type, payload)
		VALUES (NEW.id, NEW.user_id, 'pause_ended', '{}'::jsonb);
	END IF;

	PERFORM public.refresh_habit_streak(NEW.id);
	PERFORM public.refresh_habit_stats(NEW.id);

	RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_habit_completion_refresh_streak ON public."HabitCompletion";
DROP TRIGGER IF EXISTS trg_habit_completion_chain ON public."HabitCompletion";
DROP TRIGGER IF EXISTS trg_habit_completion_log ON public."HabitCompletion";

CREATE TRIGGER trg_habit_completion_after
	AFTER INSERT OR UPDATE OF completed, skipped, completion_date, habit_id OR DELETE
	ON public."HabitCompletion"
	FOR EACH ROW
	EXECUTE PROCEDURE public.trg_habit_completion_after();

DROP TRIGGER IF EXISTS trg_habit_pause_log ON public."Habit";
DROP TRIGGER IF EXISTS trg_habit_pause_refresh ON public."Habit";

CREATE TRIGGER trg_habit_pause_after
	AFTER UPDATE OF pause_start, pause_end
	ON public."Habit"
	FOR EACH ROW
	EXECUTE PROCEDURE public.trg_habit_pause_after();

-- Window change (from migration 011): streak + stats, no log
CREATE OR REPLACE FUNCTION public.trg_habit_window_after()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	PERFORM public.refresh_habit_streak(NEW.id);
	PERFORM public.refresh_habit_stats(NEW.id);
	RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_habit_update_refresh_streak ON public."Habit";
CREATE TRIGGER trg_habit_window_after
	AFTER UPDATE OF start_date, end_date, duration_days
	ON public."Habit"
	FOR EACH ROW
	EXECUTE PROCEDURE public.trg_habit_window_after();

REVOKE ALL ON FUNCTION public.refresh_habit_stats(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_habit_stats(uuid) FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.habit_day_streak_status(uuid, date, date, date, date, date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.streak_walk_backward_length(uuid, date, date, date, date, date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.streak_alive(uuid, date, date, date, date, date, date) FROM PUBLIC;

-- Backfill habit_stats + refresh
INSERT INTO public.habit_stats (habit_id, user_id)
SELECT h.id, h.user_id
FROM public."Habit" h
ON CONFLICT (habit_id) DO NOTHING;

DO $$
DECLARE
	r record;
BEGIN
	FOR r IN SELECT id FROM public."Habit" LOOP
		PERFORM public.refresh_habit_streak(r.id);
		PERFORM public.refresh_habit_stats(r.id);
	END LOOP;
END $$;
