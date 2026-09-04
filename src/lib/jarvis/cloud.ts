import { supabase } from "@/integrations/supabase/client";

export type MemoryScope = "temporary" | "session" | "project" | "long_term";

export type JarvisMemory = {
  id: string;
  scope: MemoryScope;
  content: string;
  created_at: string;
};

export type JarvisMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type JarvisSettings = {
  personality: string;
  verbosity: string;
  language: string;
  voice_name: string | null;
  rate: number;
  pitch: number;
  wake_word: string;
  sensitivity: number;
  memory_enabled: boolean;
  tts_enabled: boolean;
};

export const DEFAULT_SETTINGS: JarvisSettings = {
  personality: "cinematic",
  verbosity: "balanced",
  language: "auto",
  voice_name: null,
  rate: 1,
  pitch: 0.9,
  wake_word: "hey jarvis",
  sensitivity: 0.6,
  memory_enabled: true,
  tts_enabled: true,
};

const DEVICE_KEY = "jarvis.device.id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export async function fetchMessages(deviceId: string): Promise<JarvisMessage[]> {
  const { data, error } = await supabase
    .from("jarvis_messages")
    .select("id, role, content, created_at")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as JarvisMessage[];
}

export async function saveMessage(
  deviceId: string,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  const { error } = await supabase
    .from("jarvis_messages")
    .insert({ device_id: deviceId, role, content });
  if (error) throw error;
}

export async function clearMessages(deviceId: string): Promise<void> {
  await supabase.from("jarvis_messages").delete().eq("device_id", deviceId);
}

export async function fetchMemories(deviceId: string): Promise<JarvisMemory[]> {
  const { data, error } = await supabase
    .from("jarvis_memories")
    .select("id, scope, content, created_at")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as JarvisMemory[];
}

export async function addMemory(
  deviceId: string,
  scope: MemoryScope,
  content: string,
): Promise<void> {
  const { error } = await supabase
    .from("jarvis_memories")
    .insert({ device_id: deviceId, scope, content });
  if (error) throw error;
}

export async function updateMemory(id: string, content: string): Promise<void> {
  await supabase.from("jarvis_memories").update({ content }).eq("id", id);
}

export async function deleteMemory(id: string): Promise<void> {
  await supabase.from("jarvis_memories").delete().eq("id", id);
}

export async function wipeMemories(deviceId: string): Promise<void> {
  await supabase.from("jarvis_memories").delete().eq("device_id", deviceId);
}

export async function fetchSettings(deviceId: string): Promise<JarvisSettings> {
  const { data } = await supabase
    .from("jarvis_settings")
    .select(
      "personality, verbosity, language, voice_name, rate, pitch, wake_word, sensitivity, memory_enabled, tts_enabled",
    )
    .eq("device_id", deviceId)
    .maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...data,
    rate: Number(data.rate ?? 1),
    pitch: Number(data.pitch ?? 0.9),
    sensitivity: Number(data.sensitivity ?? 0.6),
  } as JarvisSettings;
}

export async function saveSettings(
  deviceId: string,
  settings: JarvisSettings,
): Promise<void> {
  await supabase
    .from("jarvis_settings")
    .upsert({ device_id: deviceId, ...settings }, { onConflict: "device_id" });
}
