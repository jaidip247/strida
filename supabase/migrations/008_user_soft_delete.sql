-- Soft-delete marker: blocked in app when set; auth user remains until manual purge.

ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_deleted_at ON public."User" (deleted_at)
	WHERE deleted_at IS NOT NULL;
