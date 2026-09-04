import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Brain,
  Ear,
  Loader2,
  Mic,
  MicOff,
  Send,
  Settings2,
  Square,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  DEFAULT_SETTINGS,
  addMemory,
  clearMessages,
  deleteMemory,
  fetchMemories,
  fetchMessages,
  fetchSettings,
  getDeviceId,
  saveMessage,
  saveSettings,
  updateMemory,
  wipeMemories,
  type JarvisMemory,
  type JarvisSettings,
  type MemoryScope,
} from "@/lib/jarvis/cloud";
import {
  getRecognitionCtor,
  listVoices,
  matchesWakeWord,
  speak,
  speechSupported,
  startDictation,
  stopSpeaking,
} from "@/lib/jarvis/speech";
import { cn } from "@/lib/utils";

type Turn = { role: "user" | "assistant"; content: string };

const PERSONALITIES = [
  "cinematic",
  "professional",
  "friendly",
  "technical",
  "concise",
  "humorous",
  "formal",
];
const VERBOSITIES = ["short", "balanced", "detailed"];
const LANGUAGES = [
  ["auto", "Auto-detect"],
  ["English", "English"],
  ["Hindi", "हिन्दी"],
  ["Kannada", "ಕನ್ನಡ"],
  ["Spanish", "Español"],
  ["French", "Français"],
  ["German", "Deutsch"],
  ["Japanese", "日本語"],
] as const;

const MEMORY_RE = /<<MEMORY:(temporary|session|project|long_term)\|([^>]*)>>/i;

export function JarvisConsole({
  open,
  onClose,
  wakeEnabled,
  onWakeEnabledChange,
  onStateChange,
}: {
  open: boolean;
  onClose: () => void;
  wakeEnabled: boolean;
  onWakeEnabledChange: (value: boolean) => void;
  onStateChange?: (state: string) => void;
}) {
  const deviceId = useMemo(() => getDeviceId(), []);
  const [tab, setTab] = useState<"chat" | "memory" | "profile">("chat");
  const [messages, setMessages] = useState<Turn[]>([]);
  const [memories, setMemories] = useState<JarvisMemory[]>([]);
  const [settings, setSettings] = useState<JarvisSettings>(DEFAULT_SETTINGS);
  const [input, setInput] = useState("");
  const [partial, setPartial] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<string[]>([]);
  const [newMemory, setNewMemory] = useState("");
  const [context, setContext] = useState<Record<string, string>>({});

  const abortRef = useRef<AbortController | null>(null);
  const stopDictationRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const setState = useCallback(
    (state: string) => onStateChange?.(state),
    [onStateChange],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [msg, mem, cfg] = await Promise.all([
          fetchMessages(deviceId),
          fetchMemories(deviceId),
          fetchSettings(deviceId),
        ]);
        if (!alive) return;
        setMessages(msg.map((m) => ({ role: m.role, content: m.content })));
        setMemories(mem);
        setSettings(cfg);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load memory core");
      }
    })();
    return () => {
      alive = false;
    };
  }, [deviceId]);

  useEffect(() => {
    const load = () => setVoices(listVoices().map((v) => v.name));
    load();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }, []);

  useEffect(() => {
    setContext({
      surface: "JARVIS holographic dashboard",
      active_panel: tab === "chat" ? "Conversation console" : tab === "memory" ? "Memory core" : "Personality & voice",
      wake_word_listening: wakeEnabled ? "on" : "off",
      voice_output: settings.tts_enabled ? "on" : "off",
      memory_writes: settings.memory_enabled ? "enabled" : "disabled",
      local_time: new Date().toLocaleString(),
      network: typeof navigator !== "undefined" && navigator.onLine ? "online mode" : "offline mode",
    });
  }, [tab, wakeEnabled, settings.tts_enabled, settings.memory_enabled, open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, partial, streaming]);

  const persist = useCallback(
    async (next: JarvisSettings) => {
      setSettings(next);
      try {
        await saveSettings(deviceId, next);
      } catch {
        /* non-fatal */
      }
    },
    [deviceId],
  );

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || streaming) return;
      setError(null);
      stopSpeaking();
      setPartial("");
      const history = [...messages, { role: "user" as const, content: clean }];
      setMessages(history);
      setInput("");
      setStreaming(true);
      setState("Thinking");
      void saveMessage(deviceId, "user", clean).catch(() => {});

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            memories: settingsRef.current.memory_enabled
              ? memories.map((m) => `[${m.scope}] ${m.content}`)
              : [],
            context,
            personality: settingsRef.current.personality,
            verbosity: settingsRef.current.verbosity,
            language: settingsRef.current.language,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const detail = await response.text().catch(() => "");
          throw new Error(
            response.status === 402
              ? "AI credits exhausted for this workspace. Add credits to continue."
              : response.status === 429
                ? "Rate limited — wait a moment and try again."
                : detail || "JARVIS could not reach the neural core.",
          );
        }

        setState("Speaking");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setPartial(acc.replace(MEMORY_RE, "").trim());
        }

        const directive = MEMORY_RE.exec(acc);
        const reply = acc.replace(MEMORY_RE, "").trim();
        setPartial("");
        if (reply) {
          setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
          void saveMessage(deviceId, "assistant", reply).catch(() => {});
          if (settingsRef.current.tts_enabled) {
            speak(reply, {
              voiceName: settingsRef.current.voice_name,
              rate: settingsRef.current.rate,
              pitch: settingsRef.current.pitch,
            });
          }
        }
        if (directive && settingsRef.current.memory_enabled) {
          const scope = (directive[1] ?? "long_term").toLowerCase() as MemoryScope;
          const content = (directive[2] ?? "").trim();
          if (content) {
            await addMemory(deviceId, scope, content).catch(() => {});
            setMemories(await fetchMemories(deviceId).catch(() => memories));
          }
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError(e instanceof Error ? e.message : "Unknown neural core failure");
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
        setState("Idle");
      }
    },
    [context, deviceId, memories, messages, setState, streaming],
  );

  const interrupt = useCallback(() => {
    abortRef.current?.abort();
    stopSpeaking();
    if (partial.trim()) {
      setMessages((prev) => [...prev, { role: "assistant", content: `${partial.trim()} …[interrupted]` }]);
    }
    setPartial("");
    setStreaming(false);
    setState("Idle");
  }, [partial, setState]);

  const toggleDictation = useCallback(() => {
    if (listening) {
      stopDictationRef.current?.();
      stopDictationRef.current = null;
      setListening(false);
      setState("Idle");
      return;
    }
    if (!speechSupported()) {
      setError("This browser has no speech recognition. Use Chrome or Edge, or type instead.");
      return;
    }
    stopSpeaking();
    setState("Listening");
    const stop = startDictation({
      lang: settings.language === "auto" ? "en-US" : undefined,
      onPartial: (text) => setInput(text),
      onFinal: (text) => {
        setListening(false);
        void send(text);
      },
      onError: (err) => {
        setListening(false);
        if (err !== "aborted" && err !== "no-speech") setError(`Microphone: ${err}`);
      },
      onEnd: () => setListening(false),
    });
    if (!stop) {
      setError("Microphone could not start. Check browser permissions.");
      return;
    }
    stopDictationRef.current = stop;
    setListening(true);
  }, [listening, send, setState, settings.language]);

  /* Always-on local wake-word loop. Audio never leaves the wake-word pipeline
     until the phrase is matched in-browser. */
  useEffect(() => {
    if (!wakeEnabled) return;
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Wake word needs a browser with speech recognition (Chrome/Edge).");
      onWakeEnabledChange(false);
      return;
    }
    let stopped = false;
    let rec = new Ctor();

    const configure = () => {
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-US";
      rec.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const alt = event.results[i]?.[0];
          if (!alt) continue;
          const { hit, remainder } = matchesWakeWord(
            alt.transcript,
            settingsRef.current.wake_word,
            settingsRef.current.sensitivity,
          );
          if (!hit) continue;
          setState("Listening");
          if (remainder.length > 2) {
            void send(remainder);
          } else {
            setInput("");
            setTimeout(() => toggleDictation(), 120);
          }
          return;
        }
      };
      rec.onerror = () => {};
      rec.onend = () => {
        if (stopped) return;
        setTimeout(() => {
          if (stopped) return;
          try {
            rec.start();
          } catch {
            /* restart race */
          }
        }, 400);
      };
    };

    configure();
    try {
      rec.start();
    } catch {
      /* ignore */
    }

    return () => {
      stopped = true;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakeEnabled]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm">
      <div className="hud-panel flex h-full w-full max-w-[72rem] flex-col p-3">
        <header className="mb-2 flex items-center gap-3 border-b border-border pb-2">
          <Brain className="h-5 w-5 text-cyan text-glow" />
          <div className="min-w-0">
            <h2 className="font-display text-base tracking-[0.2em] text-foreground text-glow">
              CONVERSATION CORE
            </h2>
            <p className="hud-label">
              Natural language · context memory · voice · wake word
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {(
              [
                ["chat", "Conversation"],
                ["memory", "Memory"],
                ["profile", "Personality"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "rounded-sm border px-2 py-1 text-[0.6rem] uppercase tracking-widest transition-colors",
                  tab === key
                    ? "border-cyan/60 bg-cyan/20 text-cyan text-glow"
                    : "border-transparent text-muted-foreground hover:border-cyan/40 hover:bg-cyan/10",
                )}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => onWakeEnabledChange(!wakeEnabled)}
              className={cn(
                "hud-tile flex items-center gap-1 px-2 py-1 text-[0.6rem] uppercase tracking-widest",
                wakeEnabled ? "text-online" : "text-muted-foreground",
              )}
              title={`Wake word: "${settings.wake_word}"`}
            >
              <Ear className="h-3.5 w-3.5" />
              {wakeEnabled ? "Wake on" : "Wake off"}
            </button>
            <button
              onClick={() => persist({ ...settings, tts_enabled: !settings.tts_enabled })}
              className="hud-tile flex h-7 w-7 items-center justify-center"
              aria-label="Toggle voice output"
            >
              {settings.tts_enabled ? (
                <Volume2 className="h-3.5 w-3.5 text-cyan" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={onClose}
              className="hud-tile flex h-7 w-7 items-center justify-center"
              aria-label="Close console"
            >
              <X className="h-3.5 w-3.5 text-cyan" />
            </button>
          </div>
        </header>

        {error ? (
          <div className="mb-2 rounded-sm border border-destructive/60 bg-destructive/15 px-2 py-1 font-mono text-[0.65rem] text-destructive-foreground">
            {error}
          </div>
        ) : null}

        {tab === "chat" ? (
          <div className="flex min-h-0 flex-1 gap-3">
            <div className="flex min-h-0 flex-1 flex-col">
              <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {messages.length === 0 && !partial ? (
                  <p className="hud-label">
                    Say “{settings.wake_word}” or type below. I keep the thread, so “run it”,
                    “show me the error” and “fix the previous problem” all work.
                  </p>
                ) : null}
                {messages.map((m, i) => (
                  <div
                    key={`${i}-${m.content.slice(0, 12)}`}
                    className={cn(
                      "rounded-sm border px-2.5 py-1.5 text-[0.78rem] leading-relaxed",
                      m.role === "user"
                        ? "ml-auto max-w-[80%] border-cyan/40 bg-cyan/10 text-foreground"
                        : "mr-auto max-w-[85%] border-border bg-card/60 text-foreground/90",
                    )}
                  >
                    <div className="hud-label mb-0.5">
                      {m.role === "user" ? "You" : "J.A.R.V.I.S."}
                    </div>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))}
                {partial ? (
                  <div className="mr-auto max-w-[85%] rounded-sm border border-cyan/40 bg-card/60 px-2.5 py-1.5 text-[0.78rem] leading-relaxed">
                    <div className="hud-label mb-0.5">J.A.R.V.I.S. · streaming</div>
                    <p className="whitespace-pre-wrap">{partial}</p>
                  </div>
                ) : null}
                {streaming && !partial ? (
                  <div className="flex items-center gap-2 font-mono text-[0.65rem] text-cyan">
                    <Loader2 className="h-3 w-3 animate-spin" /> processing intent…
                  </div>
                ) : null}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(input);
                }}
                className="mt-2 flex items-center gap-2 border-t border-border pt-2"
              >
                <button
                  type="button"
                  onClick={toggleDictation}
                  className={cn(
                    "hud-tile flex h-9 w-9 items-center justify-center",
                    listening && "border-online/70 bg-online/15",
                  )}
                  aria-label="Dictate"
                >
                  {listening ? (
                    <Mic className="h-4 w-4 animate-hud-pulse text-online" />
                  ) : (
                    <MicOff className="h-4 w-4 text-cyan" />
                  )}
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={listening ? "Listening…" : "Speak naturally, or type an instruction"}
                  className="min-w-0 flex-1 rounded-sm border border-border bg-input/40 px-2 py-1.5 font-mono text-[0.72rem] text-foreground outline-none placeholder:text-muted-foreground focus:border-cyan/60"
                />
                {streaming ? (
                  <button
                    type="button"
                    onClick={interrupt}
                    className="hud-tile flex items-center gap-1 px-2 py-1.5 text-[0.6rem] uppercase tracking-widest text-warn"
                  >
                    <Square className="h-3 w-3" /> Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="hud-tile flex items-center gap-1 px-2.5 py-1.5 text-[0.6rem] uppercase tracking-widest text-cyan"
                  >
                    <Send className="h-3 w-3" /> Send
                  </button>
                )}
              </form>
            </div>

            <aside className="hidden w-[15rem] shrink-0 flex-col gap-2 border-l border-border pl-3 lg:flex">
              <div>
                <div className="hud-title mb-1">Short-term context</div>
                <ul className="space-y-1">
                  {Object.entries(context).map(([k, v]) => (
                    <li key={k} className="font-mono text-[0.6rem] text-cyan/80">
                      {k.replace(/_/g, " ")}: <span className="text-foreground/80">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="min-h-0 flex-1">
                <div className="hud-title mb-1">Active memories · {memories.length}</div>
                <ul className="max-h-full space-y-1 overflow-y-auto pr-1">
                  {memories.slice(0, 12).map((m) => (
                    <li key={m.id} className="text-[0.62rem] text-foreground/80">
                      <span className="text-cyan">[{m.scope}]</span> {m.content}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={async () => {
                  await clearMessages(deviceId);
                  setMessages([]);
                }}
                className="hud-tile flex items-center justify-center gap-1 px-2 py-1 text-[0.6rem] uppercase tracking-widest text-warn"
              >
                <Trash2 className="h-3 w-3" /> Clear thread
              </button>
            </aside>
          </div>
        ) : null}

        {tab === "memory" ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                placeholder="Add something JARVIS should remember permanently"
                className="min-w-0 flex-1 rounded-sm border border-border bg-input/40 px-2 py-1.5 font-mono text-[0.72rem] text-foreground outline-none focus:border-cyan/60"
              />
              <button
                onClick={async () => {
                  if (!newMemory.trim()) return;
                  await addMemory(deviceId, "long_term", newMemory.trim());
                  setNewMemory("");
                  setMemories(await fetchMemories(deviceId));
                }}
                className="hud-tile px-2.5 py-1.5 text-[0.6rem] uppercase tracking-widest text-cyan"
              >
                Store
              </button>
              <button
                onClick={() => persist({ ...settings, memory_enabled: !settings.memory_enabled })}
                className={cn(
                  "hud-tile px-2.5 py-1.5 text-[0.6rem] uppercase tracking-widest",
                  settings.memory_enabled ? "text-online" : "text-muted-foreground",
                )}
              >
                {settings.memory_enabled ? "Memory on" : "Memory paused"}
              </button>
              <button
                onClick={async () => {
                  await wipeMemories(deviceId);
                  setMemories([]);
                }}
                className="hud-tile px-2.5 py-1.5 text-[0.6rem] uppercase tracking-widest text-destructive-foreground"
              >
                Erase all
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(memories, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "jarvis-memory.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="hud-tile px-2.5 py-1.5 text-[0.6rem] uppercase tracking-widest text-cyan"
              >
                Export
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
              {memories.length === 0 ? (
                <p className="hud-label">No memories stored yet.</p>
              ) : null}
              {memories.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-sm border border-border bg-card/50 px-2 py-1.5"
                >
                  <span className="hud-label w-[5.5rem] shrink-0 text-cyan">{m.scope}</span>
                  <input
                    defaultValue={m.content}
                    onBlur={(e) => void updateMemory(m.id, e.target.value)}
                    className="min-w-0 flex-1 bg-transparent font-mono text-[0.7rem] text-foreground outline-none"
                  />
                  <button
                    onClick={async () => {
                      await deleteMemory(m.id);
                      setMemories((prev) => prev.filter((x) => x.id !== m.id));
                    }}
                    className="hud-tile flex h-6 w-6 items-center justify-center"
                    aria-label="Delete memory"
                  >
                    <Trash2 className="h-3 w-3 text-warn" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "profile" ? (
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto pr-1">
            <div className="space-y-2">
              <div className="hud-title flex items-center gap-1">
                <Settings2 className="h-3.5 w-3.5" /> Personality
              </div>
              <Field label="Style">
                <select
                  value={settings.personality}
                  onChange={(e) => void persist({ ...settings, personality: e.target.value })}
                  className="hud-select"
                >
                  {PERSONALITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Answer length">
                <select
                  value={settings.verbosity}
                  onChange={(e) => void persist({ ...settings, verbosity: e.target.value })}
                  className="hud-select"
                >
                  {VERBOSITIES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Language">
                <select
                  value={settings.language}
                  onChange={(e) => void persist({ ...settings, language: e.target.value })}
                  className="hud-select"
                >
                  {LANGUAGES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="space-y-2">
              <div className="hud-title flex items-center gap-1">
                <Volume2 className="h-3.5 w-3.5" /> Voice
              </div>
              <Field label="Voice">
                <select
                  value={settings.voice_name ?? ""}
                  onChange={(e) =>
                    void persist({ ...settings, voice_name: e.target.value || null })
                  }
                  className="hud-select"
                >
                  <option value="">System default</option>
                  {voices.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`Speaking rate · ${settings.rate.toFixed(2)}`}>
                <input
                  type="range"
                  min={0.5}
                  max={1.6}
                  step={0.05}
                  value={settings.rate}
                  onChange={(e) => void persist({ ...settings, rate: Number(e.target.value) })}
                  className="w-full accent-[hsl(var(--cyan))]"
                />
              </Field>
              <Field label={`Pitch · ${settings.pitch.toFixed(2)}`}>
                <input
                  type="range"
                  min={0.4}
                  max={1.6}
                  step={0.05}
                  value={settings.pitch}
                  onChange={(e) => void persist({ ...settings, pitch: Number(e.target.value) })}
                  className="w-full accent-[hsl(var(--cyan))]"
                />
              </Field>
              <button
                onClick={() =>
                  speak("All systems nominal. I am at your service.", {
                    voiceName: settings.voice_name,
                    rate: settings.rate,
                    pitch: settings.pitch,
                  })
                }
                className="hud-tile px-2.5 py-1.5 text-[0.6rem] uppercase tracking-widest text-cyan"
              >
                Test voice
              </button>
            </div>

            <div className="space-y-2">
              <div className="hud-title flex items-center gap-1">
                <Ear className="h-3.5 w-3.5" /> Wake word
              </div>
              <Field label="Activation phrase">
                <input
                  value={settings.wake_word}
                  onChange={(e) => void persist({ ...settings, wake_word: e.target.value })}
                  className="hud-select"
                />
              </Field>
              <Field label={`Sensitivity · ${settings.sensitivity.toFixed(2)}`}>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.sensitivity}
                  onChange={(e) =>
                    void persist({ ...settings, sensitivity: Number(e.target.value) })
                  }
                  className="w-full accent-[hsl(var(--cyan))]"
                />
              </Field>
              <p className="text-[0.6rem] text-muted-foreground">
                Detection runs locally in the browser; nothing is sent anywhere until the phrase
                matches. Higher sensitivity catches more mispronunciations but risks false triggers.
              </p>
            </div>

            <div className="space-y-2">
              <div className="hud-title">Operating mode</div>
              <p className="font-mono text-[0.65rem] text-cyan/85">
                {typeof navigator !== "undefined" && navigator.onLine
                  ? "ONLINE · cloud reasoning + cloud memory"
                  : "OFFLINE · wake word, dictation and voice only"}
              </p>
              <p className="text-[0.6rem] text-muted-foreground">
                Wake word, dictation and speech synthesis run on-device. Reasoning and stored memory
                use the cloud core. Face recognition, speaker ID and device control remain
                simulated HUD panels.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="hud-label">{label}</span>
      {children}
    </label>
  );
}
