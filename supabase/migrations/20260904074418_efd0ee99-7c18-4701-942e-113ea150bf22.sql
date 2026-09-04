CREATE TABLE public.jarvis_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX jarvis_messages_device_idx ON public.jarvis_messages (device_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jarvis_messages TO anon, authenticated;
GRANT ALL ON public.jarvis_messages TO service_role;
ALTER TABLE public.jarvis_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jarvis_messages_open" ON public.jarvis_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.jarvis_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'long_term' CHECK (scope IN ('temporary','session','project','long_term')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX jarvis_memories_device_idx ON public.jarvis_memories (device_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jarvis_memories TO anon, authenticated;
GRANT ALL ON public.jarvis_memories TO service_role;
ALTER TABLE public.jarvis_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jarvis_memories_open" ON public.jarvis_memories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.jarvis_settings (
  device_id TEXT NOT NULL PRIMARY KEY,
  personality TEXT NOT NULL DEFAULT 'cinematic',
  verbosity TEXT NOT NULL DEFAULT 'balanced',
  language TEXT NOT NULL DEFAULT 'auto',
  voice_name TEXT,
  rate NUMERIC NOT NULL DEFAULT 1.0,
  pitch NUMERIC NOT NULL DEFAULT 0.9,
  wake_word TEXT NOT NULL DEFAULT 'hey jarvis',
  sensitivity NUMERIC NOT NULL DEFAULT 0.6,
  memory_enabled BOOLEAN NOT NULL DEFAULT true,
  tts_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jarvis_settings TO anon, authenticated;
GRANT ALL ON public.jarvis_settings TO service_role;
ALTER TABLE public.jarvis_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jarvis_settings_open" ON public.jarvis_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.jarvis_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER jarvis_memories_touch BEFORE UPDATE ON public.jarvis_memories FOR EACH ROW EXECUTE FUNCTION public.jarvis_touch_updated_at();
CREATE TRIGGER jarvis_settings_touch BEFORE UPDATE ON public.jarvis_settings FOR EACH ROW EXECUTE FUNCTION public.jarvis_touch_updated_at();