-- Enforce image upload limits in Supabase Storage itself, not only in the browser.
-- The media bucket is created by the existing application setup.
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
where id = 'media';
