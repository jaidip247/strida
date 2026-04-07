-- Optional profile fields for public."User" (habit app context)

ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS timezone text;
ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS country text;
