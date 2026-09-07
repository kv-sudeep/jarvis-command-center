/* Local (device-scoped) voice feature preferences: nicknames, wake words,
   shortcuts, macros, reminders, voice passphrase, speaking mode. Stored in
   localStorage so they work offline and never leave the device. */

export type SpeakingMode = "normal" | "whisper" | "loud";

export type VoiceShortcut = { id: string; phrase: string; prompt: string };
export type VoiceMacro = { id: string; phrase: string; steps: string[] };
export type Reminder = { id: string; text: string; dueAt: number; done: boolean };

export type VoicePrefs = {
  nickname: string;
  mode: SpeakingMode;
  wakeWords: string[];
  shortcuts: VoiceShortcut[];
  macros: VoiceMacro[];
  reminders: Reminder[];
  passphrase: string | null;
  authRequired: boolean;
  backgroundAllowed: boolean;
  translateTo: string;
};

export const DEFAULT_VOICE_PREFS: VoicePrefs = {
  nickname: "",
  mode: "normal",
  wakeWords: ["hey jarvis", "jarvis"],
  shortcuts: [
    { id: "s1", phrase: "system report", prompt: "Give me a short status report of the systems." },
    { id: "s2", phrase: "daily brief", prompt: "Give me a concise brief for today." },
  ],
  macros: [
    {
      id: "m1",
      phrase: "morning routine",
      steps: ["Give me today's brief in two lines.", "List my top three priorities."],
    },
  ],
  reminders: [],
  passphrase: null,
  authRequired: false,
  backgroundAllowed: false,
  translateTo: "Hindi",
};

const KEY = "jarvis.voice.prefs.v1";

export function loadVoicePrefs(): VoicePrefs {
  if (typeof window === "undefined") return DEFAULT_VOICE_PREFS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_VOICE_PREFS;
    return { ...DEFAULT_VOICE_PREFS, ...(JSON.parse(raw) as Partial<VoicePrefs>) };
  } catch {
    return DEFAULT_VOICE_PREFS;
  }
}

export function saveVoicePrefs(prefs: VoicePrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* storage full or blocked */
  }
}

export function modeToVoice(
  mode: SpeakingMode,
  rate: number,
  pitch: number,
): { rate: number; pitch: number; volume: number } {
  if (mode === "whisper") return { rate: Math.max(0.5, rate - 0.15), pitch, volume: 0.25 };
  if (mode === "loud") return { rate, pitch, volume: 1 };
  return { rate, pitch, volume: 0.75 };
}

export function normalizePhrase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/* ---------- Voice authentication (passphrase, not biometric) ---------- */

export function passphraseMatches(spoken: string, stored: string | null): boolean {
  if (!stored) return false;
  return normalizePhrase(spoken).includes(normalizePhrase(stored));
}

/* ---------- Smart reminders ---------- */

const UNITS: Record<string, number> = {
  second: 1000,
  seconds: 1000,
  minute: 60_000,
  minutes: 60_000,
  min: 60_000,
  mins: 60_000,
  hour: 3_600_000,
  hours: 3_600_000,
  day: 86_400_000,
  days: 86_400_000,
};

/** Parses "remind me in 10 minutes to call mom" / "remind me at 18:30 to stretch". */
export function parseReminder(text: string): Reminder | null {
  const t = text.trim();
  if (!/remind/i.test(t)) return null;

  const rel = /in\s+(\d+)\s*(second|seconds|minute|minutes|min|mins|hour|hours|day|days)\b/i.exec(t);
  if (rel) {
    const amount = Number(rel[1] ?? "0");
    const unit = UNITS[(rel[2] ?? "minutes").toLowerCase()] ?? 60_000;
    const body = t.slice((rel.index ?? 0) + rel[0].length).replace(/^\s*(to|that|about)\s+/i, "");
    return {
      id: newId(),
      text: body.trim() || "your reminder",
      dueAt: Date.now() + amount * unit,
      done: false,
    };
  }

  const abs = /at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(t);
  if (abs) {
    let hours = Number(abs[1] ?? "0");
    const minutes = Number(abs[2] ?? "0");
    const meridiem = (abs[3] ?? "").toLowerCase();
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    const due = new Date();
    due.setHours(hours, minutes, 0, 0);
    if (due.getTime() <= Date.now()) due.setDate(due.getDate() + 1);
    const body = t.slice((abs.index ?? 0) + abs[0].length).replace(/^\s*(to|that|about)\s+/i, "");
    return {
      id: newId(),
      text: body.trim() || "your reminder",
      dueAt: due.getTime(),
      done: false,
    };
  }
  return null;
}

/* ---------- Command routing ---------- */

export type VoiceCommand =
  | { kind: "prompt"; prompt: string; label: string }
  | { kind: "macro"; steps: string[]; label: string }
  | { kind: "reminder"; reminder: Reminder }
  | { kind: "mode"; mode: SpeakingMode }
  | { kind: "search"; query: string }
  | { kind: "stop" }
  | { kind: "clear" }
  | null;

export function routeVoiceInput(raw: string, prefs: VoicePrefs): VoiceCommand {
  const text = normalizePhrase(raw);
  if (!text) return null;

  if (/^(stop|quiet|silence|be quiet)$/.test(text)) return { kind: "stop" };
  if (/^(clear|clear thread|new conversation)$/.test(text)) return { kind: "clear" };
  if (/(whisper mode|whisper)/.test(text)) return { kind: "mode", mode: "whisper" };
  if (/(loud mode|speak up|louder)/.test(text)) return { kind: "mode", mode: "loud" };
  if (/(normal mode|normal voice)/.test(text)) return { kind: "mode", mode: "normal" };

  const reminder = parseReminder(raw);
  if (reminder) return { kind: "reminder", reminder };

  const macro = prefs.macros.find((m) => m.phrase && text.includes(normalizePhrase(m.phrase)));
  if (macro) return { kind: "macro", steps: macro.steps, label: macro.phrase };

  const shortcut = prefs.shortcuts.find(
    (s) => s.phrase && text.includes(normalizePhrase(s.phrase)),
  );
  if (shortcut) return { kind: "prompt", prompt: shortcut.prompt, label: shortcut.phrase };

  const search = /^(search|look up|google|find)\s+(?:for\s+)?(.+)$/.exec(text);
  if (search?.[2]) return { kind: "search", query: search[2] };

  return null;
}
