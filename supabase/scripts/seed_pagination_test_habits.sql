-- One-off seed: extra habits to exercise Today / Progress / Insights pagination (page size 10).
-- Run in Supabase Dashboard → SQL Editor (service role / postgres bypasses RLS).
--
-- 1) Set your login email (must exist in auth.users and typically in public."User"):
--    jd-admin@yopmail.com
-- 2) Re-run safely: deletes only rows whose titles match 'Pagination seed —%' for that user.

BEGIN;

DO $$
DECLARE
	target_user uuid;
BEGIN
	SELECT id INTO target_user
	FROM auth.users
	WHERE lower(email) = lower('jd-admin@yopmail.com');

	IF target_user IS NULL THEN
		RAISE EXCEPTION 'No auth.users row for jd-admin@yopmail.com — create the account first or change the email in this script.';
	END IF;

	DELETE FROM public."Habit"
	WHERE user_id = target_user
	  AND title LIKE 'Pagination seed —%';

	-- Active today: start_date <= today <= end_date (6 rows → 13 total with your existing 7)
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
	SELECT
		gen_random_uuid(),
		target_user,
		'Pagination seed — active ' || n,
		'Ongoing window including today (pagination smoke test).',
		(CURRENT_DATE AT TIME ZONE 'UTC')::date,
		30,
		((CURRENT_DATE AT TIME ZONE 'UTC')::date + 29),
		false,
		now(),
		now()
	FROM generate_series(1, 6) AS n;

	-- Upcoming: start_date > today (11 rows → second page on Progress › Upcoming)
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
	SELECT
		gen_random_uuid(),
		target_user,
		'Pagination seed — upcoming ' || n,
		'Starts tomorrow; appears under Upcoming.',
		((CURRENT_DATE AT TIME ZONE 'UTC')::date + 1),
		30,
		((CURRENT_DATE AT TIME ZONE 'UTC')::date + 30),
		false,
		now(),
		now()
	FROM generate_series(1, 11) AS n;

	-- Completed: end_date < today (11 rows → second page on Progress › Completed)
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
	SELECT
		gen_random_uuid(),
		target_user,
		'Pagination seed — completed ' || n,
		'Window ended before today; appears under Completed.',
		((CURRENT_DATE AT TIME ZONE 'UTC')::date - 40),
		30,
		((CURRENT_DATE AT TIME ZONE 'UTC')::date - 11),
		false,
		now(),
		now()
	FROM generate_series(1, 11) AS n;
END $$;

COMMIT;
