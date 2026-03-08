-- Check if the old avatar_url exists and is a custom one (contains 'avatars/')
-- Also check if the new avatar_url is different and doesn't contain 'avatars/'
CREATE OR REPLACE FUNCTION public.protect_custom_avatar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (OLD.raw_user_meta_data->>'avatar_url') LIKE '%avatars/%' AND
     ((NEW.raw_user_meta_data->>'avatar_url') IS NULL OR (NEW.raw_user_meta_data->>'avatar_url') NOT LIKE '%avatars/%') THEN

    -- Preserve the custom avatar_url
    NEW.raw_user_meta_data = jsonb_set(
      NEW.raw_user_meta_data,
      '{avatar_url}',
      OLD.raw_user_meta_data->'avatar_url'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_custom_avatar ON auth.users;

CREATE TRIGGER tr_protect_custom_avatar
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_custom_avatar();
