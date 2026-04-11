-- Freemium: subscription plan on User + habit RLS for free tier (max 2 habits, 21-day duration)

-- 1) Plan column (default free for all existing rows)
ALTER TABLE public."User"
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

ALTER TABLE public."User"
DROP CONSTRAINT IF EXISTS user_plan_check;

ALTER TABLE public."User"
ADD CONSTRAINT user_plan_check CHECK (plan IN ('free', 'paid'));

COMMENT ON COLUMN public."User".plan IS 'free = freemium (2 habits, 21-day duration); paid = unlimited + insights';

-- Optional: Stripe customer id for Customer Portal / support (webhook may set)
ALTER TABLE public."User"
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- 2) Prevent clients from self-upgrading plan via PostgREST (only service_role JWT may change plan)
CREATE OR REPLACE FUNCTION public.prevent_user_plan_client_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	jwt_role text;
BEGIN
	IF new.plan IS DISTINCT FROM old.plan THEN
		BEGIN
			jwt_role := current_setting('request.jwt.claim.role', true);
		EXCEPTION
			WHEN undefined_object THEN
				jwt_role := NULL;
		END;
		IF jwt_role IS DISTINCT FROM 'service_role' THEN
			RAISE EXCEPTION 'Plan cannot be changed directly' USING ERRCODE = '42501';
		END IF;
	END IF;
	RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_plan_service_only ON public."User";
CREATE TRIGGER trg_user_plan_service_only
	BEFORE UPDATE ON public."User"
	FOR EACH ROW
	EXECUTE PROCEDURE public.prevent_user_plan_client_update();

-- 3) Replace Habit INSERT/UPDATE policies with freemium rules
DROP POLICY IF EXISTS "Users can insert own habits" ON public."Habit";
DROP POLICY IF EXISTS "Users can update own habits" ON public."Habit";

-- Paid: any valid row; Free: max 2 habits total, duration_days = 21, dates consistent
CREATE POLICY "Users can insert own habits"
ON public."Habit"
FOR INSERT
WITH CHECK (
	auth.uid() = user_id
	AND (
		EXISTS (
			SELECT 1 FROM public."User" u
			WHERE u.id = auth.uid()
			AND u.plan = 'paid'
			AND u.deleted_at IS NULL
		)
		OR (
			EXISTS (
				SELECT 1 FROM public."User" u
				WHERE u.id = auth.uid()
				AND u.plan = 'free'
				AND u.deleted_at IS NULL
			)
			AND (SELECT count(*)::int FROM public."Habit" h WHERE h.user_id = auth.uid()) < 2
			AND duration_days = 21
			AND end_date = start_date + (duration_days - 1)
		)
	)
);

CREATE POLICY "Users can update own habits"
ON public."Habit"
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
	auth.uid() = user_id
	AND (
		EXISTS (
			SELECT 1 FROM public."User" u
			WHERE u.id = auth.uid()
			AND u.plan = 'paid'
			AND u.deleted_at IS NULL
		)
		OR (
			duration_days = 21
			AND end_date = start_date + (duration_days - 1)
		)
	)
);
