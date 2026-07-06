DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='enrichment_dlq' AND column_name='error_message_json') THEN
        ALTER TABLE public.enrichment_dlq ADD COLUMN error_message_json JSONB;
    END IF;
END $$;
